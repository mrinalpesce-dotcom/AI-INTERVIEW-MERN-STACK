import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axios from 'axios'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { serverUrl } from '../../App.jsx'
import {
  BsTrophy,
  BsAward,
  BsCheckCircleFill,
  BsArrowLeft,
  BsArrowRepeat,
  BsPrinter,
  BsClockHistory,
  BsPersonBadge,
  BsCodeSlash,
  BsBarChartLine,
  BsBarChartFill,
  BsGraphUpArrow,
  BsShare,
  BsCheck2,
  BsLightbulbFill
} from 'react-icons/bs'
import { FaChevronDown, FaChevronUp, FaChartPie, FaChartBar } from 'react-icons/fa'

// Helper for Radar Chart SVG coordinates
function getRadarCoordinates(index, total, radius, center, value) {
  const angle = (Math.PI * 2 / total) * index - Math.PI / 2
  const distance = (value / 10) * radius
  const x = center + distance * Math.cos(angle)
  const y = center + distance * Math.sin(angle)
  return { x, y }
}

function ReportPage({ report: propReport }) {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { userData } = useSelector((state) => state.user)

  const [reportData, setReportData] = useState(
    propReport || location.state?.report || null
  )
  const [loading, setLoading] = useState(!reportData && !!id)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [expandedQuestions, setExpandedQuestions] = useState({})
  const [activeChartTab, setActiveChartTab] = useState('bar') // 'bar' | 'line' | 'multi'
  const [hoveredQ, setHoveredQ] = useState(null)

  useEffect(() => {
    if (propReport) {
      setReportData(propReport)
      return
    }
    if (location.state?.report) {
      setReportData(location.state.report)
      return
    }
    if (id) {
      fetchInterviewById(id)
    } else {
      fetchLatestInterview()
    }
  }, [id, propReport, location.state])

  const fetchInterviewById = async (interviewId) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${serverUrl}/api/interview/${interviewId}`, {
        withCredentials: true
      })
      if (res.data?.success && res.data.interview) {
        transformAndSetInterview(res.data.interview)
      } else {
        setError('Interview report not found.')
      }
    } catch (err) {
      console.error('Error fetching report:', err)
      setError(err.response?.data?.message || 'Failed to fetch interview report.')
    } finally {
      setLoading(false)
    }
  }

  const fetchLatestInterview = async () => {
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
      if (res.data?.success && res.data.interviews?.length > 0) {
        transformAndSetInterview(res.data.interviews[0])
      } else {
        setReportData(null)
      }
    } catch (err) {
      console.error(err)
      setError('No interview found.')
    } finally {
      setLoading(false)
    }
  }

  const transformAndSetInterview = (interview) => {
    const qs = interview.questions || []
    const totalScore = qs.reduce((acc, q) => acc + (q.score || 0), 0)
    const len = qs.length || 1

    const avgConfidence = (qs.reduce((a, q) => a + (q.confidence || 0), 0) / len).toFixed(1)
    const avgCommunication = (qs.reduce((a, q) => a + (q.communication || 0), 0) / len).toFixed(1)
    const avgCorrectness = (qs.reduce((a, q) => a + (q.correctness || 0), 0) / len).toFixed(1)

    setReportData({
      _id: interview._id,
      role: interview.role,
      mode: interview.mode,
      experience: interview.experience,
      status: interview.status,
      createdAt: interview.createdAt,
      finalScore: interview.finalScore ?? Number((totalScore / len).toFixed(1)),
      confidence: Number(avgConfidence),
      communication: Number(avgCommunication),
      correctness: Number(avgCorrectness),
      questionwiseScore: qs.map((q) => ({
        question: q.question,
        answer: q.answer,
        score: q.score || 0,
        feedback: q.feedback || '',
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0,
        relevance: q.relevance || 0,
        difficulty: q.difficulty || 'Medium'
      }))
    })
  }

  const finalScore = Number(reportData?.finalScore ?? 0)
  const confidence = Number(reportData?.confidence ?? 0)
  const communication = Number(reportData?.communication ?? 0)
  const correctness = Number(reportData?.correctness ?? 0)
  const questions = reportData?.questionwiseScore || []

  const toggleQuestionExpand = (idx) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  const getScoreColor = (score) => {
    const s = Number(score) || 0
    if (s >= 8) return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', fill: '#10b981', tag: 'Excellent' }
    if (s >= 6) return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', fill: '#3b82f6', tag: 'Good' }
    if (s >= 4) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', fill: '#f59e0b', tag: 'Average' }
    return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', fill: '#ef4444', tag: 'Needs Work' }
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scoreTheme = getScoreColor(finalScore)

  // Derived metrics for Radar
  const avgRelevance =
    questions.length > 0
      ? Number((questions.reduce((acc, q) => acc + (q.relevance || q.score || 0), 0) / questions.length).toFixed(1))
      : finalScore

  const radarMetrics = [
    { label: 'Correctness', value: correctness || finalScore, color: '#3b82f6' },
    { label: 'Confidence', value: confidence || finalScore, color: '#10b981' },
    { label: 'Communication', value: communication || finalScore, color: '#8b5cf6' },
    { label: 'Relevance', value: avgRelevance, color: '#f59e0b' },
    { label: 'Overall', value: finalScore, color: '#06b6d4' }
  ]

  // Radar polygon points
  const radarRadius = 100
  const radarCenter = 140
  const radarPoints = radarMetrics
    .map((m, idx) => {
      const { x, y } = getRadarCoordinates(idx, radarMetrics.length, radarRadius, radarCenter, m.value)
      return `${x},${y}`
    })
    .join(' ')

  const targetPassingPoints = radarMetrics
    .map((_, idx) => {
      const { x, y } = getRadarCoordinates(idx, radarMetrics.length, radarRadius, radarCenter, 7)
      return `${x},${y}`
    })
    .join(' ')

  // SVG Line Graph calculation
  const lineGraphWidth = 560
  const lineGraphHeight = 160
  const paddingX = 40
  const paddingY = 25
  const usableWidth = lineGraphWidth - paddingX * 2
  const usableHeight = lineGraphHeight - paddingY * 2

  const linePoints = questions.map((q, idx) => {
    const x = paddingX + (questions.length > 1 ? (idx / (questions.length - 1)) * usableWidth : usableWidth / 2)
    const y = lineGraphHeight - paddingY - (Math.min(10, Math.max(0, q.score || 0)) / 10) * usableHeight
    return { x, y, score: q.score, idx }
  })

  let curvePath = ''
  if (linePoints.length === 1) {
    curvePath = `M ${linePoints[0].x} ${linePoints[0].y}`
  } else if (linePoints.length > 1) {
    curvePath = `M ${linePoints[0].x} ${linePoints[0].y}`
    for (let i = 0; i < linePoints.length - 1; i++) {
      const p0 = linePoints[i]
      const p1 = linePoints[i + 1]
      const mx = (p0.x + p1.x) / 2
      curvePath += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`
    }
  }

  const areaPath =
    linePoints.length > 1
      ? `${curvePath} L ${linePoints[linePoints.length - 1].x} ${lineGraphHeight - paddingY} L ${linePoints[0].x} ${lineGraphHeight - paddingY} Z`
      : ''

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Top Navigation & Breadcrumbs */}
          <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
            <button
              onClick={() => navigate('/history')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition cursor-pointer"
            >
              <BsArrowLeft size={14} />
              <span>Back to History</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs transition cursor-pointer"
                title="Copy report link"
              >
                {copied ? <BsCheck2 className="text-green-600" size={14} /> : <BsShare size={12} />}
                <span>{copied ? 'Link Copied!' : 'Share'}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs transition cursor-pointer"
                title="Print report"
              >
                <BsPrinter size={13} />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="bg-white rounded-3xl p-12 border border-gray-200 shadow-sm text-center">
              <div className="w-10 h-10 border-3 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm font-semibold text-gray-700">Loading evaluation report & graphs...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-white rounded-3xl p-12 border border-rose-200 shadow-sm text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BsTrophy size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Report</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">{error}</p>
              <button
                onClick={() => navigate('/history')}
                className="bg-black text-white px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-gray-800 transition cursor-pointer"
              >
                Go to Interview History
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && !reportData && (
            <div className="bg-white rounded-3xl p-12 border border-gray-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                <BsClockHistory />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Report Found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                You haven't completed any interview sessions yet or this report doesn't exist.
              </p>
              <button
                onClick={() => navigate('/interview')}
                className="bg-black text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition shadow-md cursor-pointer"
              >
                Start an Interview
              </button>
            </div>
          )}

          {/* Main Report View */}
          {!loading && !error && reportData && (
            <div className="space-y-6">
              {/* Header Hero Card */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-200 text-center relative overflow-hidden"
              >
                {/* Mode & Category tags */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                    <BsTrophy size={12} />
                    <span>Interview Evaluation Report</span>
                  </span>

                  {reportData.mode && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        reportData.mode === 'Technical'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}
                    >
                      {reportData.mode === 'Technical' ? <BsCodeSlash size={12} /> : <BsPersonBadge size={12} />}
                      <span>{reportData.mode}</span>
                    </span>
                  )}

                  {reportData.experience && (
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                      Exp: {reportData.experience}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                  {reportData.role || 'Mock Interview Performance'}
                </h1>
                <p className="text-xs md:text-sm text-gray-500 max-w-lg mx-auto mb-8">
                  Comprehensive AI evaluation analyzing correctness, communication clarity, confidence level, and delivery.
                </p>

                {/* Big Score Radial Badge */}
                <div className="flex justify-center mb-8">
                  <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-green-600 via-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-xl shadow-green-500/20">
                    <div className="w-full h-full bg-white rounded-full flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-gray-900 leading-none">{finalScore}</span>
                      <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                        Out of 10
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance verdict tag */}
                <div className="inline-flex items-center gap-2 mb-8">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${scoreTheme.bg} ${scoreTheme.text} ${scoreTheme.border}`}>
                    Overall: {scoreTheme.tag}
                  </span>
                </div>

                {/* Core Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                      Confidence
                    </span>
                    <h4 className="text-xl font-bold text-gray-900 mt-1">{confidence} / 10</h4>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (confidence / 10) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                      Communication
                    </span>
                    <h4 className="text-xl font-bold text-gray-900 mt-1">{communication} / 10</h4>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (communication / 10) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                      Correctness
                    </span>
                    <h4 className="text-xl font-bold text-gray-900 mt-1">{correctness} / 10</h4>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (correctness / 10) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* VISUAL GRAPHS & CHARTS SECTION */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <FaChartBar className="text-green-600" size={18} />
                      <h3 className="text-xl font-bold text-gray-900">Performance Visualizations</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Visual insights of question scores, competence radar, and performance trend.
                    </p>
                  </div>

                  {/* Chart Tabs */}
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setActiveChartTab('bar')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                        activeChartTab === 'bar' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                      }`}
                    >
                      <BsBarChartFill size={12} />
                      <span>Bar Chart</span>
                    </button>
                    <button
                      onClick={() => setActiveChartTab('line')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                        activeChartTab === 'line' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                      }`}
                    >
                      <BsGraphUpArrow size={12} />
                      <span>Progression</span>
                    </button>
                    <button
                      onClick={() => setActiveChartTab('multi')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                        activeChartTab === 'multi' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                      }`}
                    >
                      <FaChartPie size={12} />
                      <span>Radar</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: BAR CHART */}
                {activeChartTab === 'bar' && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4 px-2">
                      <span className="font-semibold uppercase tracking-wider">Scores per Question (0 - 10)</span>
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        Target Benchmark: 7.0
                      </span>
                    </div>

                    <div className="relative pt-6 pb-2">
                      {/* Benchmark line */}
                      <div
                        className="absolute left-0 right-0 border-b-2 border-dashed border-emerald-400 z-10 pointer-events-none"
                        style={{ bottom: `${(7 / 10) * 180 + 36}px` }}
                      >
                        <span className="absolute -top-3.5 right-2 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 rounded">
                          Passing Target (7.0)
                        </span>
                      </div>

                      <div className="flex items-end justify-between gap-3 sm:gap-6 h-52 px-2 border-b border-gray-200">
                        {questions.map((q, idx) => {
                          const score = Number(q.score) || 0
                          const heightPercent = Math.max(8, (score / 10) * 100)
                          const color = getScoreColor(score)

                          return (
                            <div
                              key={idx}
                              onMouseEnter={() => setHoveredQ(idx)}
                              onMouseLeave={() => setHoveredQ(null)}
                              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                            >
                              {/* Hover Tooltip */}
                              {hoveredQ === idx && (
                                <div className="absolute -top-16 bg-black text-white text-[11px] p-2.5 rounded-xl shadow-xl z-20 pointer-events-none whitespace-nowrap min-w-32 text-center">
                                  <span className="font-bold block">Question {idx + 1}</span>
                                  <span>Score: {score} / 10</span>
                                  <div className="text-[9px] text-gray-400 truncate max-w-44 mt-0.5">
                                    {q.question}
                                  </div>
                                </div>
                              )}

                              <span className="text-xs font-bold text-gray-700 mb-1 group-hover:scale-110 transition">
                                {score}
                              </span>

                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${heightPercent}%` }}
                                transition={{ duration: 0.6, delay: idx * 0.08 }}
                                className="w-full max-w-[48px] rounded-t-xl transition-all duration-300 relative overflow-hidden group-hover:brightness-95"
                                style={{
                                  backgroundColor: color.fill,
                                  boxShadow: `0 4px 14px ${color.fill}33`
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>

                      <div className="flex justify-between items-center px-2 pt-3">
                        {questions.map((q, idx) => (
                          <div key={idx} className="flex-1 text-center">
                            <span className="text-xs font-bold text-gray-500 block">Q{idx + 1}</span>
                            <span className="text-[10px] text-gray-400 hidden sm:block truncate max-w-20 mx-auto">
                              {q.difficulty || 'Med'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PROGRESSION LINE CHART */}
                {activeChartTab === 'line' && (
                  <div className="flex flex-col items-center">
                    <div className="w-full flex items-center justify-between text-xs text-gray-400 mb-2 px-2">
                      <span className="font-semibold uppercase tracking-wider">Candidate Score Momentum</span>
                      <span className="text-gray-500">Smoothed Performance Curve</span>
                    </div>

                    <div className="w-full overflow-x-auto py-2">
                      <svg
                        viewBox={`0 0 ${lineGraphWidth} ${lineGraphHeight}`}
                        className="w-full max-w-2xl mx-auto overflow-visible"
                      >
                        <defs>
                          <linearGradient id="areaGradient2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {[2, 4, 6, 8, 10].map((val) => {
                          const y = lineGraphHeight - paddingY - (val / 10) * usableHeight
                          return (
                            <g key={val}>
                              <line
                                x1={paddingX}
                                y1={y}
                                x2={lineGraphWidth - paddingX}
                                y2={y}
                                stroke="#f1f5f9"
                                strokeDasharray="4 4"
                              />
                              <text
                                x={paddingX - 10}
                                y={y + 3}
                                fontSize="9"
                                fill="#94a3b8"
                                textAnchor="end"
                                fontWeight="bold"
                              >
                                {val}
                              </text>
                            </g>
                          )
                        })}

                        {areaPath && <path d={areaPath} fill="url(#areaGradient2)" />}

                        {curvePath && (
                          <motion.path
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            d={curvePath}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                        )}

                        {linePoints.map((pt) => (
                          <g key={pt.idx} className="cursor-pointer group">
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="6"
                              fill="#ffffff"
                              stroke="#10b981"
                              strokeWidth="3"
                              className="group-hover:scale-125 transition-transform origin-center"
                            />
                            <text
                              x={pt.x}
                              y={pt.y - 12}
                              fontSize="11"
                              fontWeight="bold"
                              fill="#0f172a"
                              textAnchor="middle"
                            >
                              {pt.score}
                            </text>
                            <text
                              x={pt.x}
                              y={lineGraphHeight - 6}
                              fontSize="10"
                              fontWeight="bold"
                              fill="#64748b"
                              textAnchor="middle"
                            >
                              Q{pt.idx + 1}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>
                )}

                {/* TAB 3: RADAR CHART */}
                {activeChartTab === 'multi' && (
                  <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
                    <div className="relative">
                      <svg width="280" height="280" className="overflow-visible">
                        {[2, 4, 6, 8, 10].map((level) => {
                          const r = (level / 10) * radarRadius
                          return (
                            <circle
                              key={level}
                              cx={radarCenter}
                              cy={radarCenter}
                              r={r}
                              fill="transparent"
                              stroke="#e2e8f0"
                              strokeWidth="1"
                              strokeDasharray={level === 7 ? '3 3' : 'none'}
                            />
                          )
                        })}

                        {radarMetrics.map((_, idx) => {
                          const { x, y } = getRadarCoordinates(idx, radarMetrics.length, radarRadius, radarCenter, 10)
                          return (
                            <line
                              key={idx}
                              x1={radarCenter}
                              y1={radarCenter}
                              x2={x}
                              y2={y}
                              stroke="#e2e8f0"
                              strokeWidth="1"
                            />
                          )
                        })}

                        <polygon
                          points={targetPassingPoints}
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          opacity="0.8"
                        />

                        <polygon
                          points={radarPoints}
                          fill="#10b981"
                          fillOpacity="0.35"
                          stroke="#059669"
                          strokeWidth="2.5"
                        />

                        {radarMetrics.map((m, idx) => {
                          const dot = getRadarCoordinates(idx, radarMetrics.length, radarRadius, radarCenter, m.value)
                          const labelPos = getRadarCoordinates(idx, radarMetrics.length, radarRadius + 22, radarCenter, 10)

                          return (
                            <g key={idx}>
                              <circle cx={dot.x} cy={dot.y} r="4.5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                              <text
                                x={labelPos.x}
                                y={labelPos.y}
                                fontSize="10"
                                fontWeight="bold"
                                fill="#334155"
                                textAnchor="middle"
                                dominantBaseline="central"
                              >
                                {m.label} ({m.value})
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                    </div>

                    <div className="w-full md:w-64 space-y-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                        Competency Breakdown
                      </span>
                      {radarMetrics.map((m, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                            <span className="text-xs font-semibold text-gray-700">{m.label}</span>
                          </div>
                          <span className="text-xs font-bold text-gray-900">{m.value} / 10</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Question-wise Breakdown Section */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <BsLightbulbFill className="text-amber-500" size={18} />
                    <h3 className="text-lg font-bold text-gray-900">Question-wise Breakdown</h3>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {questions.length} Questions Evaluated
                  </span>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const isExpanded = expandedQuestions[idx] ?? true
                    const qScoreBadge = getScoreColor(q.score)

                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200/80 hover:border-gray-300 transition"
                      >
                        <div
                          onClick={() => toggleQuestionExpand(idx)}
                          className="flex items-start justify-between gap-4 cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                                {q.question}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${qScoreBadge.bg} ${qScoreBadge.text} ${qScoreBadge.border}`}
                            >
                              {q.score} / 10
                            </span>
                            <span className="text-gray-400">
                              {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-200/60 space-y-3">
                            {q.answer && (
                              <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                                  Your Answer:
                                </span>
                                <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">
                                  {q.answer}
                                </div>
                              </div>
                            )}

                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                                AI Evaluation & Feedback:
                              </span>
                              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-950 leading-relaxed">
                                {q.feedback || 'Answer recorded and analyzed.'}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                              <div className="bg-white p-2 rounded-lg text-center border border-gray-200">
                                <span className="text-[10px] text-gray-500 block">Confidence</span>
                                <span className="text-xs font-bold text-gray-800">{q.confidence || 0}/10</span>
                              </div>
                              <div className="bg-white p-2 rounded-lg text-center border border-gray-200">
                                <span className="text-[10px] text-gray-500 block">Correctness</span>
                                <span className="text-xs font-bold text-gray-800">{q.correctness || 0}/10</span>
                              </div>
                              <div className="bg-white p-2 rounded-lg text-center border border-gray-200">
                                <span className="text-[10px] text-gray-500 block">Communication</span>
                                <span className="text-xs font-bold text-gray-800">{q.communication || 0}/10</span>
                              </div>
                              <div className="bg-white p-2 rounded-lg text-center border border-gray-200">
                                <span className="text-[10px] text-gray-500 block">Relevance</span>
                                <span className="text-xs font-bold text-gray-800">{q.relevance || 0}/10</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 print:hidden">
                <button
                  onClick={() => navigate('/interview')}
                  className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold text-xs sm:text-sm transition shadow-lg shadow-green-600/20 cursor-pointer"
                >
                  <BsArrowRepeat size={15} />
                  <span>Take Another Mock Interview</span>
                </button>
                <button
                  onClick={() => navigate('/history')}
                  className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-full bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-semibold text-xs sm:text-sm transition cursor-pointer"
                >
                  <BsClockHistory size={14} />
                  <span>View All History</span>
                </button>
                <button
                  onClick={() => navigate('/home')}
                  className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs sm:text-sm transition cursor-pointer"
                >
                  <span>Home</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}

export default ReportPage
