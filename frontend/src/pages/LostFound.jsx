import { useState, useEffect } from 'react'
import { Search, Plus, X, Loader2, Image, Filter, ChevronDown, CheckCircle2, Clock, AlertCircle, ThumbsUp, ThumbsDown, FileText } from 'lucide-react'
import api from '../utils/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const categories = ['Electronics', 'Bag', 'ID Card', 'Keys', 'Clothing', 'Books', 'Jewellery', 'Other']
const statusColors = { Active: 'bg-blue-100 text-blue-700', Claimed: 'bg-green-100 text-green-700', Expired: 'bg-gray-100 text-gray-500' }

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function LostFound() {
  const { user } = useAuth()
  const [tab, setTab] = useState('Lost')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showPostForm, setShowPostForm] = useState(false)
  const [postType, setPostType] = useState('Lost')
  const [form, setForm] = useState({ item_name: '', description: '', category: 'Other', date_occurred: '', location: '', contact_info: '', where_item_now: '' })
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimItemId, setClaimItemId] = useState(null)
  const [claimDesc, setClaimDesc] = useState('')
  const [claimProof, setClaimProof] = useState(null)
  const [myPosts, setMyPosts] = useState([])
  const [showMyPosts, setShowMyPosts] = useState(false)
  const [claimsData, setClaimsData] = useState({})
  const [showClaimsModal, setShowClaimsModal] = useState(false)
  const [claimsForItem, setClaimsForItem] = useState([])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = { type: tab }
      if (search) params.search = search
      if (categoryFilter) params.category = categoryFilter
      const res = await api.get('/lost-found', { params })
      setItems(res.data)
    } catch { toast.error('Failed to load items') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchItems() }, [tab, categoryFilter])

  const handleSearch = () => { fetchItems() }

  const handlePost = async () => {
    if (!form.item_name) { toast.error('Item name is required'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('type', postType)
      if (imageFile) fd.append('image', imageFile)
      await api.post('/lost-found', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success(`${postType} item posted`)
      setShowPostForm(false)
      setForm({ item_name: '', description: '', category: 'Other', date_occurred: '', location: '', contact_info: '', where_item_now: '' })
      setImageFile(null)
      fetchItems()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to post') }
    finally { setSaving(false) }
  }

  const openClaim = (itemId) => {
    setClaimItemId(itemId)
    setClaimDesc('')
    setClaimProof(null)
    setShowClaimModal(true)
  }

  const submitClaim = async () => {
    if (!claimDesc.trim()) { toast.error('Please describe your proof of ownership'); return }
    try {
      const fd = new FormData()
      fd.append('claim_description', claimDesc)
      if (claimProof) fd.append('proof_image', claimProof)
      await api.post(`/lost-found/${claimItemId}/claim`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Claim submitted! The item poster will review it.')
      setShowClaimModal(false)
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to submit claim') }
  }

  const loadMyPosts = async () => {
    try {
      const res = await api.get('/lost-found', { params: { posted_by: user.id } })
      setMyPosts(res.data)
      setShowMyPosts(true)
    } catch { toast.error('Failed to load your posts') }
  }

  const viewClaims = async (itemId) => {
    try {
      const res = await api.get(`/lost-found/${itemId}/claims`)
      setClaimsForItem(res.data)
      setShowClaimsModal(true)
    } catch { toast.error('Failed to load claims') }
  }

  const handleApprove = async (claimId) => {
    try {
      await api.patch(`/lost-found/claims/${claimId}/approve`)
      toast.success('Claim approved! Item marked as claimed.')
      setShowClaimsModal(false)
      fetchItems()
    } catch { toast.error('Failed to approve') }
  }

  const handleReject = async (claimId) => {
    try {
      await api.patch(`/lost-found/claims/${claimId}/reject`)
      toast.success('Claim rejected')
      setShowClaimsModal(false)
      fetchItems()
    } catch { toast.error('Failed to reject') }
  }

  const openPostForm = (type) => {
    setPostType(type)
    setForm({ item_name: '', description: '', category: 'Other', date_occurred: new Date().toISOString().split('T')[0], location: '', contact_info: '', where_item_now: '' })
    setImageFile(null)
    setShowPostForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lost & Found</h1>
        <div className="flex gap-2">
          <button onClick={loadMyPosts} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">My Posts</button>
          <button onClick={() => openPostForm('Lost')} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800"><Plus className="w-4 h-4" /> Report Lost</button>
          <button onClick={() => openPostForm('Found')} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"><Plus className="w-4 h-4" /> Report Found</button>
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-100">
          {['Lost', 'Found'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                tab === t ? 'text-primary-700 border-b-2 border-primary-700 bg-primary-50' : 'text-gray-500 hover:text-gray-700'
              }`}>{t} Items</button>
          ))}
        </div>
        <div className="p-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search items..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-700" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3" />
          <p className="text-sm">No {tab.toLowerCase()} items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-36 bg-gray-100 flex items-center justify-center">
                {item.image_path ? (
                  <img src={item.image_path} alt={item.item_name} className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-10 h-10 text-gray-300" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{item.item_name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[item.status] || 'bg-blue-100 text-blue-700'}`}>{item.status}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{item.category}</span>
                  <span>{timeAgo(item.created_at)}</span>
                </div>
                {item.description && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>}
                {item.location && <p className="text-xs text-gray-500 mb-3"><span className="font-medium">Location:</span> {item.location}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Posted by {item.posted_by_name}</span>
                  <div className="flex gap-1">
                    {tab === 'Found' && item.status === 'Active' && (
                      <button onClick={() => openClaim(item.id)}
                        className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 font-medium">This is Mine</button>
                    )}
                    {item.posted_by === user?.id && item.status !== 'Expired' && (
                      <button onClick={() => viewClaims(item.id)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 font-medium">Claims</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Form Modal */}
      {showPostForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Report {postType} Item</h2>
              <button onClick={() => setShowPostForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date {postType === 'Lost' ? 'Lost' : 'Found'}</label>
                  <input type="date" value={form.date_occurred} onChange={(e) => setForm({ ...form, date_occurred: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info (optional)</label>
                <input value={form.contact_info} onChange={(e) => setForm({ ...form, contact_info: e.target.value })} placeholder="Phone or email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              {postType === 'Found' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Where is the item now?</label>
                  <input value={form.where_item_now} onChange={(e) => setForm({ ...form, where_item_now: e.target.value })} placeholder="e.g. Submitted to Admin Office, I have it with me"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPostForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handlePost} disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Claim This Item</h2>
              <button onClick={() => setShowClaimModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Provide proof that this item belongs to you. Describe any identifying details.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Ownership *</label>
                <textarea value={claimDesc} onChange={(e) => setClaimDesc(e.target.value)} rows={4} placeholder="e.g. My name is written inside the bag, serial number is XYZ, I can describe its contents..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Proof Image (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setClaimProof(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowClaimModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={submitClaim} className="px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800">Submit Claim</button>
            </div>
          </div>
        </div>
      )}

      {/* My Posts Modal */}
      {showMyPosts && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">My Posts</h2>
              <button onClick={() => setShowMyPosts(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            {myPosts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">You haven't posted any items yet.</p>
            ) : (
              <div className="space-y-3">
                {myPosts.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{item.item_name}</p>
                      <p className="text-xs text-gray-500">{item.type} · {item.category} · {item.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => viewClaims(item.id)}
                        className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 font-medium">View Claims</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowMyPosts(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Claims Management Modal */}
      {showClaimsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Claims for this Item</h2>
              <button onClick={() => setShowClaimsModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            {claimsForItem.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No claims yet.</p>
            ) : (
              <div className="space-y-3">
                {claimsForItem.map(claim => (
                  <div key={claim.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{claim.claimant_name}</p>
                        <p className="text-xs text-gray-500">{claim.claimant_email} · {claim.claimant_phone || 'No phone'}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        claim.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        claim.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{claim.status}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{claim.claim_description}</p>
                    {claim.proof_image_path && (
                      <div className="mb-2">
                        <img src={claim.proof_image_path} alt="Proof" className="h-24 w-auto rounded border" />
                      </div>
                    )}
                    {claim.status === 'Pending' && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleApprove(claim.id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">
                          <ThumbsUp className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => handleReject(claim.id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium">
                          <ThumbsDown className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
