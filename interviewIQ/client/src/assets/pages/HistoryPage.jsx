import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import AuthModel from '../components/AuthModel.jsx'
import { serverUrl } from '../../App.jsx'
import {
  BsSearch,
  BsTrash3,
  BsEye,
  BsArrowRepeat,
  BsCalendar3,
  BsGridFill,
  BsListUl,
  BsCheckCircleFill,
  BsExclamationCircleFill,
  BsCodeSlash,
  BsPersonBadge,
  BsClockHistory,
  BsBarChartLine,
  BsTrophy,
  BsAward,
  BsSliders,
  BsPrinter,
  BsXCircle,
  BsArrowLeft,
  BsStars,
  BsBoxArrowUpRight
} from 'react-icons/bs'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'

function HistoryPage() {
  const { userData } = useSelector((state) => state.user)
  const navigate = useNavigate()

  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAuth, setShowAuth] = useState(false)

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMode, setSelectedMode] = useState('ALL') // ALL, Technical, HR
  const [selectedStatus, setSelectedStatus] = useState('ALL') // ALL, Completed, Incomplete
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, highest, lowest
  const [viewMode, setViewMode] = useState('grid') // grid | list

  // Modal states
  const [selectedInterview, setSelectedInterview] = useState(null)
  const [expandedQuestions, setExpandedQuestions] = useState({})
  const [interviewToDelete, setInterviewToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchInterviews()
  }, [userData])

  const fetchInterviews = async () => {
    if (!userData) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${serverUrl}/api/interview/`, {
        withCredentials: true
      })
      if (res.data?.success) {
        setInterviews(res.data.interviews || [])
      } else {
        setInterviews([])
      }
    } catch (err) {
      console.error('Failed to load interviews:', err)
      setError(err.response?.data?.message || 'Failed to load interview history')
    } finally {
      setLoading(false)
    }
  }

  // Deletion handler
  const handleDeleteInterview = async () => {
    if (!interviewToDelete) return
    setIsDeleting(true)
    try {
      const res = await axios.delete(
        `${serverUrl}/api/interview/${interviewToDelete._id}`,
        { withCredentials: true }
      )
      if (res.data?.success) {
        setInterviews((prev) => prev.filter((i) => i._id !== interviewToDelete._id))
        if (selectedInterview?._id === interviewToDelete._id) {
          setSelectedInterview(null)
        }
        setInterviewToDelete(null)
      }
    } catch (err) {
      console.error('Failed to delete interview:', err)
      alert(err.response?.data?.message || 'Error deleting interview')
    } finally {
      setIsDeleting(false)
    }
  }

  // Analytics computation
  const stats = useMemo(() => {
    const total = interviews.length
    const completed = interviews.filter((i) => i.status === 'Completed')
    const totalScore = completed.reduce((acc, curr) => acc + (curr.finalScore || 0), 0)
    const avgScore = completed.length > 0 ? (totalScore / completed.length).toFixed(1) : 0
    const highestScore =
      completed.length > 0
        ? Math.max(...completed.map((i) => i.finalScore || 0)).toFixed(1)
        : 0
    const techCount = interviews.filter((i) => i.mode === 'Technical').length
    const hrCount = interviews.filter((i) => i.mode === 'HR').length
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0

    return {
      total,
      completedCount: completed.length,
      avgScore,
      highestScore,
      techCount,
      hrCount,
      completionRate
    }
  }, [interviews])

  // Filtered & Sorted list
  const filteredInterviews = useMemo(() => {
    return interviews
      .filter((item) => {
        const matchesSearch =
          item.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.experience?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesMode =
          selectedMode === 'ALL' ? true : item.mode?.toLowerCase() === selectedMode.toLowerCase()

        const matchesStatus =
          selectedStatus === 'ALL' ? true : item.status?.toLowerCase() === selectedStatus.toLowerCase()

        return matchesSearch && matchesMode && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
        if (sortBy === 'highest') return (b.finalScore || 0) - (a.finalScore || 0)
        if (sortBy === 'lowest') return (a.finalScore || 0) - (b.finalScore || 0)
        return 0
      })
  }, [interviews, searchTerm, selectedMode, selectedStatus, sortBy])

  const toggleQuestionExpand = (idx) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  const getScoreBadge = (score) => {
    const num = Number(score) || 0
    if (num >= 8) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ring: 'border-emerald-500',
        text: 'Excellent'
      }
    }
    if (num >= 6) {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        ring: 'border-blue-500',
        text: 'Good'
      }
    }
    if (num >= 4) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        ring: 'border-amber-500',
        text: 'Average'
      }
    }
    return {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      ring: 'border-rose-500',
      text: 'Needs Work'
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Breadcrumb & Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <button
                onClick={() => navigate('/home')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black mb-2 transition"
              >
                <BsArrowLeft size={14} />
                <span>Back to Home</span>
              </button>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                Interview History & Performance
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Review past mock interview sessions, track AI ratings, and review detailed question-by-question feedback.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!userData) {
                    setShowAuth(true)
                  } else {
                    navigate('/interview')
                  }
                }}
                className="inline-flex items-center gap-2 bg-black text-white hover:bg-gray-800 px-5 py-2.5 rounded-full font-medium text-sm transition shadow-sm cursor-pointer"
              >
                <BsStars className="text-green-400" />
                <span>Start New Mock</span>
              </button>
            </div>
          </div>

          {/* Not logged in banner */}
          {!userData && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-3xl p-8 mb-8 text-center shadow-sm"
            >
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                <BsPersonBadge />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in to view your history</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Your past mock sessions, AI evaluations, and performance improvements are saved to your account.
              </p>
              <button
                onClick={() => setShowAuth(true)}
                className="bg-black text-white px-8 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition"
              >
                Sign In / Register
              </button>
            </motion.div>
          )}

          {userData && (
            <>
              {/* Analytics Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Total Interviews */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-gray-400 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Total Sessions
                    </span>
                    <div className="p-2 bg-gray-50 rounded-xl text-gray-700">
                      <BsClockHistory size={16} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900">{stats.total}</span>
                    <span className="text-xs text-gray-500">interviews</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>{stats.techCount} Tech</span>
                    <span className="text-gray-300">•</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>{stats.hrCount} HR</span>
                  </div>
                </motion.div>

                {/* Avg Score */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-gray-400 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Avg Score
                    </span>
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                      <BsBarChartLine size={16} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900">{stats.avgScore}</span>
                    <span className="text-xs font-semibold text-gray-400">/ 10</span>
                  </div>
                  <div className="mt-3 text-xs text-emerald-600 font-medium">
                    {Number(stats.avgScore) >= 7
                      ? 'Solid Performance'
                      : Number(stats.avgScore) > 0
                      ? 'Keep practicing!'
                      : 'No scores yet'}
                  </div>
                </motion.div>

                {/* Best Score */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-gray-400 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Highest Score
                    </span>
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                      <BsTrophy size={16} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900">{stats.highestScore}</span>
                    <span className="text-xs font-semibold text-gray-400">/ 10</span>
                  </div>
                  <div className="mt-3 text-xs text-amber-600 font-medium">
                    {Number(stats.highestScore) >= 8 ? 'Peak Mastery' : 'Personal Record'}
                  </div>
                </motion.div>

                {/* Completion Rate */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-gray-400 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Completion Rate
                    </span>
                    <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                      <BsAward size={16} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900">{stats.completionRate}%</span>
                    <span className="text-xs text-gray-500">finished</span>
                  </div>
                  <div className="mt-3 text-xs text-purple-600 font-medium">
                    {stats.completedCount} of {stats.total} completed
                  </div>
                </motion.div>
              </div>

              {/* Filter and Search Bar */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1">
                  <BsSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search by role or experience (e.g. React, 3 years)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <BsXCircle size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Mode Pill Filters */}
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                    {['ALL', 'Technical', 'HR'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedMode(m)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          selectedMode === m
                            ? 'bg-white text-black shadow-sm'
                            : 'text-gray-500 hover:text-black'
                        }`}
                      >
                        {m === 'ALL' ? 'All Modes' : m}
                      </button>
                    ))}
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-gray-100 text-gray-700 text-xs font-semibold py-1.5 px-3 rounded-xl border-none focus:ring-2 focus:ring-black cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Incomplete">Incomplete</option>
                  </select>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-100 text-gray-700 text-xs font-semibold py-1.5 px-3 rounded-xl border-none focus:ring-2 focus:ring-black cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Score</option>
                    <option value="lowest">Lowest Score</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => setViewMode('grid')}
                      title="Grid View"
                      className={`p-1.5 rounded-lg transition ${
                        viewMode === 'grid' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'
                      }`}
                    >
                      <BsGridFill size={14} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      title="List View"
                      className={`p-1.5 rounded-lg transition ${
                        viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'
                      }`}
                    >
                      <BsListUl size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content: List or Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm animate-pulse flex flex-col justify-between h-64"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-4/5 mb-3"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2 mb-6"></div>
                        <div className="h-10 bg-gray-100 rounded-xl mb-4"></div>
                      </div>
                      <div className="h-9 bg-gray-200 rounded-full w-full"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-white rounded-3xl p-10 border border-red-200 text-center my-6 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                    <BsExclamationCircleFill size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Failed to load interviews</h3>
                  <p className="text-sm text-gray-500 mb-4">{error}</p>
                  <button
                    onClick={fetchInterviews}
                    className="inline-flex items-center gap-2 bg-black text-white px-5 py-2 rounded-full text-xs font-semibold hover:bg-gray-800 transition"
                  >
                    <BsArrowRepeat /> Try Again
                  </button>
                </div>
              ) : filteredInterviews.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center shadow-sm my-6">
                  <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    <BsClockHistory />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {interviews.length === 0 ? 'No mock interviews yet' : 'No matching interviews found'}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                    {interviews.length === 0
                      ? 'You have not taken any interviews yet. Start your first mock interview to get tailored questions and AI feedback!'
                      : 'Try resetting your search query or changing your mode/status filters.'}
                  </p>
                  {interviews.length === 0 ? (
                    <button
                      onClick={() => navigate('/interview')}
                      className="bg-black text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition shadow-md"
                    >
                      Take Your First Interview
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedMode('ALL')
                        setSelectedStatus('ALL')
                      }}
                      className="bg-gray-100 text-gray-800 px-6 py-2 rounded-full text-xs font-semibold hover:bg-gray-200 transition"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <AnimatePresence>
                    {filteredInterviews.map((item, index) => {
                      const badge = getScoreBadge(item.finalScore)
                      const isCompleted = item.status === 'Completed'
                      const questionsCount = item.questions?.length || 0

                      return (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.04 }}
                          className="bg-white rounded-3xl p-6 border border-gray-200/90 hover:border-gray-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative"
                        >
                          <div>
                            {/* Card Top: Mode Badge + Status + Trash */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                                    item.mode === 'Technical'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                      : 'bg-purple-50 text-purple-700 border border-purple-100'
                                  }`}
                                >
                                  {item.mode === 'Technical' ? <BsCodeSlash size={12} /> : <BsPersonBadge size={12} />}
                                  {item.mode || 'General'}
                                </span>

                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                    isCompleted
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <BsCheckCircleFill size={10} />
                                  ) : (
                                    <BsExclamationCircleFill size={10} />
                                  )}
                                  {item.status || 'Incomplete'}
                                </span>
                              </div>

                              <button
                                onClick={() => setInterviewToDelete(item)}
                                title="Delete session"
                                className="text-gray-300 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50"
                              >
                                <BsTrash3 size={15} />
                              </button>
                            </div>

                            {/* Role & Experience */}
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-black transition line-clamp-1">
                              {item.role}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Exp: <span className="font-semibold text-gray-700">{item.experience}</span>
                            </p>

                            {/* Date */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                              <BsCalendar3 size={12} />
                              <span>{formatDate(item.createdAt)}</span>
                            </div>

                            {/* Score Display Card */}
                            <div className="mt-5 p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                              <div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                  Final Score
                                </span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="text-2xl font-black text-gray-900">
                                    {isCompleted ? item.finalScore : '--'}
                                  </span>
                                  <span className="text-xs font-semibold text-gray-400">/ 10</span>
                                </div>
                              </div>

                              {isCompleted ? (
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badge.bg}`}>
                                  {badge.text}
                                </span>
                              ) : (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
                                  Unfinished
                                </span>
                              )}
                            </div>

                            {/* Questions count info */}
                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 px-1">
                              <span>{questionsCount} Questions asked</span>
                              {item.resumeText && (
                                <span className="text-[11px] text-green-700 font-medium bg-green-50 px-2 py-0.5 rounded-md">
                                  Resume Tailored
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedInterview(item)
                                setExpandedQuestions({})
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white py-2.5 px-4 rounded-full text-xs font-semibold transition cursor-pointer"
                            >
                              <BsEye size={14} />
                              <span>View Full Report</span>
                            </button>

                            <button
                              onClick={() => navigate('/interview')}
                              title="Retake mock interview"
                              className="p-2.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition border border-gray-200"
                            >
                              <BsArrowRepeat size={14} />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                /* TABLE / LIST VIEW */
                <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200">
                        <tr>
                          <th className="py-3.5 px-6">Role & Mode</th>
                          <th className="py-3.5 px-6">Experience</th>
                          <th className="py-3.5 px-6">Date</th>
                          <th className="py-3.5 px-6">Status</th>
                          <th className="py-3.5 px-6">Score</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredInterviews.map((item) => {
                          const badge = getScoreBadge(item.finalScore)
                          const isCompleted = item.status === 'Completed'

                          return (
                            <tr key={item._id} className="hover:bg-gray-50/60 transition">
                              <td className="py-4 px-6">
                                <div className="font-bold text-gray-900">{item.role}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                      item.mode === 'Technical'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'bg-purple-50 text-purple-700'
                                    }`}
                                  >
                                    {item.mode}
                                  </span>
                                  {item.resumeText && (
                                    <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                      Resume
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-4 px-6 text-xs font-semibold text-gray-700">
                                {item.experience}
                              </td>

                              <td className="py-4 px-6 text-xs text-gray-500 whitespace-nowrap">
                                {formatDate(item.createdAt)}
                              </td>

                              <td className="py-4 px-6">
                                <span
                                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                                    isCompleted
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <BsCheckCircleFill size={11} />
                                  ) : (
                                    <BsExclamationCircleFill size={11} />
                                  )}
                                  {item.status}
                                </span>
                              </td>

                              <td className="py-4 px-6">
                                {isCompleted ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-extrabold text-gray-900">
                                      {item.finalScore}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}
                                    >
                                      {badge.text}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 font-medium">--</span>
                                )}
                              </td>

                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedInterview(item)
                                      setExpandedQuestions({})
                                    }}
                                    className="p-2 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition"
                                    title="View Details"
                                  >
                                    <BsEye size={16} />
                                  </button>
                                  <button
                                    onClick={() => navigate('/interview')}
                                    className="p-2 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition"
                                    title="Retake"
                                  >
                                    <BsArrowRepeat size={16} />
                                  </button>
                                  <button
                                    onClick={() => setInterviewToDelete(item)}
                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                    title="Delete"
                                  >
                                    <BsTrash3 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* DETAILED INTERVIEW REPORT MODAL */}
      <AnimatePresence>
        {selectedInterview && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        selectedInterview.mode === 'Technical'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {selectedInterview.mode} Interview
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 font-medium">
                      {formatDate(selectedInterview.createdAt)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">{selectedInterview.role}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Experience Level: <span className="font-semibold">{selectedInterview.experience}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/report/${selectedInterview._id}`)}
                    className="p-2 text-gray-600 hover:text-black hover:bg-white rounded-xl transition border border-gray-200 shadow-2xs flex items-center gap-1.5 text-xs font-semibold"
                    title="Open in Dedicated Report Page"
                  >
                    <BsBoxArrowUpRight size={13} />
                    <span className="hidden sm:inline">Open Full Page</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-2 text-gray-500 hover:text-black hover:bg-white rounded-xl transition border border-gray-200 shadow-2xs"
                    title="Print or Save PDF"
                  >
                    <BsPrinter size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedInterview(null)}
                    className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-xl transition border border-gray-200 shadow-2xs"
                  >
                    <BsXCircle size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Performance Summary Banner */}
                <div className="bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center backdrop-blur-sm">
                      <span className="text-2xl font-black text-white">
                        {selectedInterview.finalScore || 0}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-gray-300 font-semibold">
                        / 10
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Performance Score</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Status:{' '}
                        <span className="text-green-400 font-semibold">
                          {selectedInterview.status || 'Completed'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Criteria stats if available */}
                  <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
                    {(() => {
                      const qs = selectedInterview.questions || []
                      const validQs = qs.filter((q) => q.score > 0)
                      const len = validQs.length || qs.length || 1
                      const avgConf = (qs.reduce((a, q) => a + (q.confidence || 0), 0) / len).toFixed(1)
                      const avgComm = (qs.reduce((a, q) => a + (q.communication || 0), 0) / len).toFixed(1)
                      const avgCorr = (qs.reduce((a, q) => a + (q.correctness || 0), 0) / len).toFixed(1)

                      return (
                        <>
                          <div className="bg-white/10 rounded-xl p-2.5 text-center">
                            <span className="text-[10px] text-gray-300 block">Confidence</span>
                            <span className="text-sm font-bold text-white">{avgConf}</span>
                          </div>
                          <div className="bg-white/10 rounded-xl p-2.5 text-center">
                            <span className="text-[10px] text-gray-300 block">Comm.</span>
                            <span className="text-sm font-bold text-white">{avgComm}</span>
                          </div>
                          <div className="bg-white/10 rounded-xl p-2.5 text-center">
                            <span className="text-[10px] text-gray-300 block">Correctness</span>
                            <span className="text-sm font-bold text-white">{avgCorr}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Questions Breakdown */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center justify-between">
                    <span>Question Breakdown</span>
                    <span className="text-xs text-gray-500 font-normal">
                      {selectedInterview.questions?.length || 0} Questions
                    </span>
                  </h3>

                  <div className="space-y-4">
                    {selectedInterview.questions && selectedInterview.questions.length > 0 ? (
                      selectedInterview.questions.map((q, idx) => {
                        const isExpanded = expandedQuestions[idx] ?? true
                        const qBadge = getScoreBadge(q.score)

                        return (
                          <div
                            key={idx}
                            className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs"
                          >
                            {/* Question Header */}
                            <div
                              onClick={() => toggleQuestionExpand(idx)}
                              className="p-4 bg-gray-50/70 hover:bg-gray-50 transition cursor-pointer flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                                  {q.question}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${qBadge.bg}`}
                                >
                                  {q.score || 0} / 10
                                </span>
                                <span className="text-gray-400">
                                  {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </span>
                              </div>
                            </div>

                            {/* Question Content */}
                            {isExpanded && (
                              <div className="p-4 space-y-3 border-t border-gray-100 text-sm">
                                <div>
                                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
                                    Full Question:
                                  </span>
                                  <p className="text-gray-800 font-medium">{q.question}</p>
                                </div>

                                {q.answer ? (
                                  <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
                                      Your Answer:
                                    </span>
                                    <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700 leading-relaxed font-mono whitespace-pre-wrap">
                                      {q.answer}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic">No answer submitted.</p>
                                )}

                                {q.feedback && (
                                  <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                                      AI Evaluation & Feedback:
                                    </span>
                                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-emerald-950 leading-relaxed">
                                      {q.feedback}
                                    </div>
                                  </div>
                                )}

                                {/* Sub-scores for question */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                                  <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                                    <span className="text-[10px] text-gray-500 block">Confidence</span>
                                    <span className="text-xs font-bold text-gray-800">{q.confidence || 0}/10</span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                                    <span className="text-[10px] text-gray-500 block">Correctness</span>
                                    <span className="text-xs font-bold text-gray-800">{q.correctness || 0}/10</span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                                    <span className="text-[10px] text-gray-500 block">Communication</span>
                                    <span className="text-xs font-bold text-gray-800">{q.communication || 0}/10</span>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                                    <span className="text-[10px] text-gray-500 block">Relevance</span>
                                    <span className="text-xs font-bold text-gray-800">{q.relevance || 0}/10</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-xs text-gray-400 italic">No questions recorded for this session.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => setInterviewToDelete(selectedInterview)}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold transition"
                >
                  <BsTrash3 size={13} />
                  <span>Delete Session</span>
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedInterview(null)}
                    className="flex-1 sm:flex-none px-5 py-2 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setSelectedInterview(null)
                      navigate('/interview')
                    }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-full text-xs font-semibold transition shadow-sm"
                  >
                    <BsArrowRepeat size={13} />
                    <span>Retake Mock</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {interviewToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <BsTrash3 size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Interview Session?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to remove the mock interview for{' '}
                <strong className="text-gray-900">{interviewToDelete.role}</strong>? This action cannot be
                undone.
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setInterviewToDelete(null)}
                  className="px-6 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleDeleteInterview}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition shadow-md disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <BsTrash3 size={14} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal if triggered */}
      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}

      <Footer />
    </div>
  )
}

export default HistoryPage
