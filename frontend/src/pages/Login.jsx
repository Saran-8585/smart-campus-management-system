import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GraduationCap, Loader2, Eye, EyeOff, User, ShieldCheck, School } from 'lucide-react'
import toast from 'react-hot-toast'

const roles = [
  { id: 'student', label: 'Student', icon: User },
  { id: 'faculty', label: 'Staff / Faculty', icon: School },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
]

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { login } = useAuth()
  const navigate = useNavigate()

  const getLabel = () => {
    if (selectedRole === 'student') return 'Register Number'
    if (selectedRole === 'faculty') return 'Staff ID'
    return 'Email'
  }

  const getPlaceholder = () => {
    if (selectedRole === 'student') return 'e.g. 21CSE001'
    if (selectedRole === 'faculty') return 'e.g. FAC001'
    return 'Enter your email'
  }

  const validate = () => {
    const newErrors = {}
    if (!identifier) {
      newErrors.identifier = `${getLabel()} is required`
    } else if (selectedRole === 'student' && !/^[a-zA-Z0-9]{8,12}$/.test(identifier)) {
      newErrors.identifier = 'Register Number must be alphanumeric, 8-12 characters'
    }
    if (!password) {
      newErrors.password = 'Password is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})
    try {
      const user = await login(identifier, password, selectedRole)
      toast.success(`Welcome, ${user.name}!`)
      const dashboards = { admin: '/admin', faculty: '/faculty', student: '/student' }
      navigate(dashboards[user.role])
    } catch (err) {
      const data = err.response?.data
      if (data?.field) {
        setErrors({ [data.field]: data.message })
      } else {
        toast.error(data?.error || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const quickFill = (role, id, pw) => {
    setSelectedRole(role)
    setIdentifier(id)
    setPassword(pw)
    setErrors({})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-primary-700 p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Smart Campus</h1>
          <p className="text-primary-200 text-sm mt-1">Digital Management System</p>
        </div>

        <div className="flex border-b border-gray-200">
          {roles.map((r) => {
            const Icon = r.icon
            return (
              <button
                key={r.id}
                onClick={() => { setSelectedRole(r.id); setErrors({}) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                  selectedRole === r.id
                    ? 'text-primary-700 border-b-2 border-primary-700 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {r.label}
              </button>
            )
          })}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{getLabel()}</label>
            <input
              type={selectedRole === 'admin' ? 'email' : 'text'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition ${
                errors.identifier ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={getPlaceholder()}
            />
            {errors.identifier && (
              <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition ${
                  errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 text-center mb-3">Test Credentials (click to fill)</p>
            <div className="space-y-2">
              <button type="button" onClick={() => quickFill('admin', 'admin@campus.com', 'admin123')}
                className="w-full text-left px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-xs text-purple-700 font-medium transition-colors">
                Admin: admin@campus.com / admin123
              </button>
              <button type="button" onClick={() => quickFill('admin', 'admn@project.com', 'password123')}
                className="w-full text-left px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-xs text-purple-700 font-medium transition-colors">
                Admin: admn@project.com / password123
              </button>
              <button type="button" onClick={() => quickFill('faculty', 'FAC001', 'faculty123')}
                className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-xs text-blue-700 font-medium transition-colors">
                Faculty: FAC001 / faculty123
              </button>
              <button type="button" onClick={() => quickFill('student', '21CSE001', 'student123')}
                className="w-full text-left px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-xs text-green-700 font-medium transition-colors">
                Student: 21CSE001 / student123
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
