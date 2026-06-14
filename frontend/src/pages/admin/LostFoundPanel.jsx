import { useState, useEffect } from 'react'
import { Search, Loader2, Image, X, Filter, Trash2, Eye, FileText } from 'lucide-react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

const categories = ['Electronics', 'Bag', 'ID Card', 'Keys', 'Clothing', 'Books', 'Jewellery', 'Other']
const statusColors = { Active: 'bg-blue-100 text-blue-700', Claimed: 'bg-green-100 text-green-700', Expired: 'bg-gray-100 text-gray-500' }

export default function AdminLostFoundPanel() {
  const [tab, setTab] = useState('items')
  const [items, setItems] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [proofModal, setProofModal] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const fetchItems = () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    if (categoryFilter) params.category = categoryFilter
    if (typeFilter) params.type = typeFilter
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    api.get('/lost-found/admin/all', { params })
      .then(res => setItems(res.data))
      .catch(() => toast.error('Failed to load items'))
      .finally(() => setLoading(false))
  }

  const fetchClaims = () => {
    setLoading(true)
    const params = {}
    if (statusFilter) params.status = statusFilter
    api.get('/lost-found/admin/claims', { params })
      .then(res => setClaims(res.data))
      .catch(() => toast.error('Failed to load claims'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tab === 'items') fetchItems()
    else fetchClaims()
  }, [tab])

  const handleFilter = () => {
    if (tab === 'items') fetchItems()
    else fetchClaims()
  }

  const handleRemove = async () => {
    if (!confirmDeleteId) return
    try {
      await api.delete(`/lost-found/admin/${confirmDeleteId}`)
      toast.success('Item deactivated')
      setConfirmDeleteId(null)
      fetchItems()
    } catch { toast.error('Failed to deactivate') }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Lost & Found Admin Panel</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-100">
          {[
            { id: 'items', label: 'All Items' },
            { id: 'claims', label: 'All Claims' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                tab === t.id ? 'text-primary-700 border-b-2 border-primary-700 bg-primary-50' : 'text-gray-500 hover:text-gray-700'
              }`}>{t.label}</button>
          ))}
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder={tab === 'items' ? 'Search items...' : 'Search...'}
                value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Claimed">Claimed</option>
              <option value="Expired">Expired</option>
            </select>
            {tab === 'items' && (
              <>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">All Types</option>
                  <option value="Lost">Lost</option>
                  <option value="Found">Found</option>
                </select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            <button onClick={handleFilter}
              className="px-4 py-2 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-700" /></div>
        ) : tab === 'items' ? (
          items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3" />
              <p className="text-sm">No items found</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Posted By</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.item_name}</td>
                    <td className="px-4 py-3 text-sm"><span className={`px-2 py-0.5 rounded text-xs font-medium ${item.type === 'Lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.type}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.posted_by_name}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[item.status]}`}>{item.status}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {item.image_path && (
                        <button onClick={() => setProofModal(item.image_path)}
                          className="text-sm text-primary-600 hover:text-primary-800 mr-3"><Eye className="w-4 h-4 inline" /> View</button>
                      )}
                      {item.status !== 'Expired' && (
                        <button onClick={() => setConfirmDeleteId(item.id)} className="text-sm text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4 inline" /> Deactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        ) : (
          claims.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3" />
              <p className="text-sm">No claims found</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Claimant</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Proof</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {claims.map(claim => (
                  <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{claim.claimant_name}<br /><span className="text-xs text-gray-400">{claim.claimant_email}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{claim.item_name}</td>
                    <td className="px-4 py-3 text-sm"><span className={`px-2 py-0.5 rounded text-xs font-medium ${claim.item_type === 'Lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{claim.item_type}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{claim.claim_description}</td>
                    <td className="px-4 py-3">
                      {claim.proof_image_path ? (
                        <button onClick={() => setProofModal(claim.proof_image_path)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                          <Image className="w-3 h-3" /> View Proof
                        </button>
                      ) : <span className="text-xs text-gray-400">None</span>}
                    </td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      claim.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      claim.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{claim.status}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(claim.submitted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Deactivate Item"
        message="Mark this item as expired? This action cannot be undone."
        onConfirm={handleRemove}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Proof Image Modal */}
      {proofModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setProofModal(null)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setProofModal(null)} className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow"><X className="w-4 h-4" /></button>
            <img src={proofModal} alt="Proof" className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}
