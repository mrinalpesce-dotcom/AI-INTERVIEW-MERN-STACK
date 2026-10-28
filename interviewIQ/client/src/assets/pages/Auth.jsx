import React, { useState, useEffect } from 'react'
import { BsRobot, BsShieldLockFill, BsEye, BsEyeSlash, BsKeyFill } from 'react-icons/bs'
import { IoSparkles } from 'react-icons/io5'
import { motion, AnimatePresence } from 'framer-motion'
import { FcGoogle } from 'react-icons/fc'
import { FaUser, FaEnvelope } from 'react-icons/fa'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../../utils/firebase'
import axios from 'axios'
import { serverUrl } from '../../App'
import { useDispatch, useSelector } from 'react-redux'
import { setUserData } from '../../redux/user.Slice'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../../admin/AdminContext'

function Auth({ isModel = false, onClose }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { userData } = useSelector((state) => state.user)
  const { login: adminLogin } = useAdmin()

  // Role toggle: 'user' or 'admin'
  const [activeTab, setActiveTab] = useState('user')

  // Admin credentials state
  const [adminEmail, setAdminEmail] = useState('mrinal7850@gmail.com')
  const [adminPassword, setAdminPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState(null)

  useEffect(() => {
    if (userData && !isModel) {
      navigate('/home')
    }
  }, [userData, isModel, navigate])

  const handleGoogleSignIn = async () => {
    try {
      const response = await signInWithPopup(auth, provider)
      const { displayName: name, email } = response.user

      const result = await axios.post(
        `${serverUrl}/api/auth/google`,
        { name, email },
        { withCredentials: true }
      )

      if (result.data?.token) {
        localStorage.setItem('token', result.data.token)
      }
      dispatch(setUserData(result.data))

      if (onClose) onClose()
      if (!isModel) {
        navigate('/home')
      }
    } catch (err) {
      console.error(err)
      dispatch(setUserData(null))
    }
  }

  const handleAdminSubmit = async (e) => {
    e.preventDefault()
    if (!adminEmail.trim() || !adminPassword) {
      setAdminError('Please enter both admin email and password.')
      return
    }

    setAdminLoading(true)
    setAdminError(null)

    try {
      const res = await adminLogin(adminEmail, adminPassword)
      setAdminLoading(false)

      if (res.success) {
        if (onClose) onClose()
        navigate('/admin')
      } else {
        setAdminError(res.message || 'Access denied. Invalid admin credentials.')
      }
    } catch (err) {
      setAdminLoading(false)
      setAdminError('Admin authentication failed. Only authorized administrators have access.')
    }
  }

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`w-full ${
        isModel ? 'max-w-md p-6 sm:p-8 rounded-3xl' : 'max-w-md p-8 sm:p-10 rounded-[32px]'
      } bg-white shadow-2xl border-4 border-gray-200 relative`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <div className="bg-black text-white p-2.5 rounded-xl shadow-sm">
          <BsRobot size={28} />
        </div>
        <h2 className="font-bold text-xl text-gray-900 tracking-tight">
          InterviewIQ<span className="text-green-600">.AI</span>
        </h2>
      </div>

      {/* Role Switcher: User vs Admin */}
      <div className="flex p-1 bg-gray-100 rounded-2xl mb-6 border border-gray-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('user')
            setAdminError(null)
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'user'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60 font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <FaUser size={12} className={activeTab === 'user' ? 'text-green-600' : ''} />
          <span>Login as User</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('admin')
            setAdminError(null)
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'admin'
              ? 'bg-black text-white shadow-sm font-bold'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          <BsShieldLockFill
            size={13}
            className={activeTab === 'admin' ? 'text-indigo-400' : ''}
          />
          <span>Login as Admin</span>
        </button>
      </div>

      {/* Tab 1: Customer / User Login */}
      {activeTab === 'user' && (
        <motion.div
          key="user-tab"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-900 leading-snug mb-3">
            Welcome to{' '}
            <span className="bg-green-100 text-green-700 px-3 py-0.5 rounded-full inline-flex items-center gap-1.5 text-base">
              <IoSparkles size={15} />
              InterviewIQ
            </span>
          </h1>

          <p className="text-gray-500 text-center text-xs sm:text-sm leading-relaxed mb-6">
            Sign in to practice mock interviews, receive instant AI voice analytics, and accelerate your job search.
          </p>

          <motion.button
            onClick={handleGoogleSignIn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 bg-black text-white rounded-2xl shadow-md hover:bg-gray-800 transition font-semibold text-sm cursor-pointer"
          >
            <FcGoogle size={20} />
            <span>Continue with Google</span>
          </motion.button>
        </motion.div>
      )}

      {/* Tab 2: Admin Login */}
      {activeTab === 'admin' && (
        <motion.div
          key="admin-tab"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-center mb-4">
            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 rounded-full mb-1">
              Authorized Personnel Only
            </span>
            <h3 className="text-lg font-bold text-gray-900">Admin Console Login</h3>
            <p className="text-xs text-gray-500">
              Access customer activity, usage analytics, and governance
            </p>
          </div>

          {adminError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              {adminError}
            </div>
          )}

          <form onSubmit={handleAdminSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaEnvelope size={13} />
                </div>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => {
                    setAdminEmail(e.target.value)
                    if (adminError) setAdminError(null)
                  }}
                  placeholder="mrinal7850@gmail.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <BsKeyFill size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value)
                    if (adminError) setAdminError(null)
                  }}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black"
                  tabIndex={-1}
                >
                  {showPassword ? <BsEyeSlash size={15} /> : <BsEye size={15} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={adminLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white rounded-xl shadow-md hover:opacity-90 transition font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {adminLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <BsShieldLockFill size={14} className="text-indigo-400" />
                  <span>Login to Admin Dashboard</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      )}
    </motion.div>
  )

  // If used as standalone page (route /), wrap in full-screen centering container
  if (!isModel) {
    return (
      <div className="min-h-screen w-full bg-[#f3f3f3] flex flex-col items-center justify-center p-4">
        {content}
      </div>
    )
  }

  return content
}

export default Auth
