import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  BsRobot,
  BsCoin,
  BsHouseDoor,
  BsClockHistory,
  BsStopwatch,
  BsShieldLockFill,
} from 'react-icons/bs'
import { FaUserAstronaut } from 'react-icons/fa'
import { HiOutlineLogout, HiMenu, HiX } from 'react-icons/hi'
import axios from 'axios'
import { setUserData } from '../../redux/user.Slice'
import { serverUrl } from '../../App'
import AuthModel from './AuthModel'

const NAV_ITEMS = [
  { name: 'Home', path: '/home', icon: BsHouseDoor },
  { name: 'Pricing', path: '/pricing', icon: BsCoin, badge: 'Plans' },
  { name: 'History', path: '/history', icon: BsClockHistory },
  { name: 'Practice Timer', path: '/timer', icon: BsStopwatch },
]

function Navbar() {
  const { userData } = useSelector((state) => state.user)
  const [showCreditPopup, setShowCreditPopup] = useState(false)
  const [showUserPopup, setShowUserPopup] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  const handleLogout = async () => {
    try {
      await axios.get(serverUrl + '/api/auth/logout', { withCredentials: true })
      localStorage.removeItem('token')
      dispatch(setUserData(null))
      setShowUserPopup(false)
      setShowCreditPopup(false)
      navigate('/')
    } catch (error) {
      console.log(error)
      localStorage.removeItem('token')
      dispatch(setUserData(null))
      navigate('/')
    }
  }

  const handleNavigation = (path) => {
    if ((path === '/history' || path === '/timer') && !userData) {
      setShowAuth(true)
      return
    }
    navigate(path)
    setMobileMenuOpen(false)
  }

  const credits = (userData?.credits ?? userData?.user?.credits) || 0

  return (
    <div className='bg-[#f3f3f3] flex justify-center px-4 pt-6'>
      <motion.div
        className='w-full max-w-6xl'
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='w-full bg-white rounded-[24px] shadow-sm border-4 px-5 py-3.5 border-gray-200'>
          <div className='flex items-center justify-between gap-3'>
            {/* Logo */}
            <div
              onClick={() => navigate('/home')}
              className='flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition shrink-0'
            >
              <div className='bg-black text-white p-2 rounded-xl shadow-sm'>
                <BsRobot size={24} />
              </div>
              <h2 className='font-bold text-lg text-gray-900 tracking-tight hidden sm:block'>
                InterviewIQ<span className='text-green-600'>.AI</span>
              </h2>
            </div>

            {/* Desktop Navigation Links */}
            <nav className='hidden md:flex items-center gap-1 bg-gray-100/90 p-1.5 rounded-full border border-gray-200/80'>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-black text-white shadow-sm font-semibold'
                        : 'text-gray-600 hover:text-black hover:bg-white/80'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full ${
                          active
                            ? 'bg-green-500 text-white'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Right Side: Credits + Avatar + Mobile Toggle */}
            <div className='flex items-center gap-3 relative'>
              {/* Credits Pill */}
              <div className='relative'>
                <button
                  onClick={() => {
                    if (!userData) {
                      setShowAuth(true)
                      return
                    }
                    setShowCreditPopup(!showCreditPopup)
                    setShowUserPopup(false)
                  }}
                  className='px-3.5 py-1.5 rounded-full bg-green-100/80 flex items-center gap-1.5 justify-center text-green-700 hover:bg-green-200/80 transition text-sm font-semibold border border-green-200/60 cursor-pointer'
                >
                  <BsCoin size={18} className='text-green-600' />
                  <span>{credits}</span>
                </button>

                {showCreditPopup && (
                  <div className='absolute right-[-40px] sm:right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-3 z-50 p-4 animate-in fade-in zoom-in-95 duration-150'>
                    <p className='text-xs text-gray-500 pb-2 border-b border-gray-100 mb-3 font-medium'>
                      Need more credits to continue practicing?
                    </p>
                    <div className='flex items-center justify-between mb-3 text-sm'>
                      <span className='text-gray-600'>Available credits:</span>
                      <span className='font-bold text-green-600 flex items-center gap-1'>
                        <BsCoin size={14} /> {credits}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowCreditPopup(false)
                        navigate('/pricing')
                      }}
                      className='w-full bg-black text-white rounded-xl px-4 py-2 flex items-center justify-center gap-2 hover:bg-gray-800 transition text-sm font-semibold shadow-sm cursor-pointer'
                    >
                      <BsCoin size={15} /> Buy more credits
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div className='relative'>
                <button
                  onClick={() => {
                    if (!userData) {
                      setShowAuth(true)
                      return
                    }
                    setShowUserPopup(!showUserPopup)
                    setShowCreditPopup(false)
                  }}
                  className='w-10 h-10 rounded-full bg-black text-white font-semibold cursor-pointer flex items-center justify-center hover:bg-gray-800 transition shadow-sm'
                >
                  {userData ? (
                    (
                      userData?.email ||
                      userData?.user?.email ||
                      userData?.name
                    )?.slice(0, 1).toUpperCase()
                  ) : (
                    <FaUserAstronaut size={18} />
                  )}
                </button>

                {showUserPopup && (
                  <div className='absolute right-0 mt-3 w-56 bg-white shadow-xl border border-gray-200 rounded-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150'>
                    <div className='px-3 py-2 border-b border-gray-100 mb-1'>
                      <p className='text-sm font-bold text-gray-900 truncate'>
                        {userData?.name || userData?.user?.name || 'User'}
                      </p>
                      <p className='text-xs text-gray-400 truncate'>
                        {userData?.email || userData?.user?.email}
                      </p>
                    </div>

                    <div className='flex flex-col gap-0.5 py-1'>
                      <button
                        onClick={() => {
                          setShowUserPopup(false)
                          navigate('/home')
                        }}
                        className='w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center gap-2.5 transition'
                      >
                        <BsHouseDoor size={16} /> Home
                      </button>
                      <button
                        onClick={() => {
                          setShowUserPopup(false)
                          navigate('/pricing')
                        }}
                        className='w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center gap-2.5 transition'
                      >
                        <BsCoin size={16} className='text-green-600' /> Pricing & Plans
                      </button>
                      <button
                        onClick={() => {
                          setShowUserPopup(false)
                          navigate('/history')
                        }}
                        className='w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center gap-2.5 transition'
                      >
                        <BsClockHistory size={16} /> Interview History
                      </button>
                      <button
                        onClick={() => {
                          setShowUserPopup(false)
                          navigate('/timer')
                        }}
                        className='w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center gap-2.5 transition'
                      >
                        <BsStopwatch size={16} /> Practice Timer
                      </button>
                      <button
                        onClick={() => {
                          setShowUserPopup(false)
                          navigate('/admin')
                        }}
                        className='w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-indigo-50 text-indigo-700 flex items-center gap-2.5 transition font-semibold'
                      >
                        <BsShieldLockFill size={16} /> Admin Console
                      </button>
                    </div>

                    <div className='border-t border-gray-100 mt-1 pt-1'>
                      <button
                        onClick={handleLogout}
                        className='w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2.5 transition font-medium'
                      >
                        <HiOutlineLogout size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className='md:hidden p-2 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100 transition'
                aria-label='Toggle navigation menu'
              >
                {mobileMenuOpen ? <HiX size={22} /> : <HiMenu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='md:hidden mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1'
              >
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const active = location.pathname === item.path
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-all duration-150 ${
                        active
                          ? 'bg-black text-white font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <Icon size={18} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            active
                              ? 'bg-green-500 text-white'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  )
}

export default Navbar