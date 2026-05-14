import { Loader2, User, Mail, Building2, Phone, BadgeCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  faculty: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
}

export default function StudentProfile() {
  const { user } = useAuth()

  if (!user) {
    return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary-700" /></div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-white">{user.name?.charAt(0)}</span>
          </div>
          <h2 className="text-2xl font-bold text-white">{user.name}</h2>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium capitalize ${roleColors[user.role]}`}>
            {user.role}
          </span>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 py-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
              <p className="text-sm font-medium text-gray-900">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Department</p>
              <p className="text-sm font-medium text-gray-900">{user.department || 'Not assigned'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Role</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
