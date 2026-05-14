import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GraduationCap, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome, ${user.name}!`)
      const dashboards = { admin: '/admin', faculty: '/faculty', student: '/student' }
      navigate(dashboards[user.role])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const quickFill = (e, pw) => {
    setEmail(e)
    setPassword(pw)
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
              <button type="button" onClick={() => quickFill('admin@campus.com', 'admin123')}
                className="w-full text-left px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-xs text-purple-700 font-medium transition-colors">
                Admin: admin@campus.com / admin123
              </button>
              <button type="button" onClick={() => quickFill('admn@project.com', 'password123')}
                className="w-full text-left px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-xs text-purple-700 font-medium transition-colors">
                Admin: admn@project.com / password123
              </button>
              <button type="button" onClick={() => quickFill('faculty1@campus.com', 'faculty123')}
                className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-xs text-blue-700 font-medium transition-colors">
                Faculty: faculty1@campus.com / faculty123
              </button>
              <button type="button" onClick={() => quickFill('student1@campus.com', 'student123')}
                className="w-full text-left px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-xs text-green-700 font-medium transition-colors">
                Student: student1@campus.com / student123
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
