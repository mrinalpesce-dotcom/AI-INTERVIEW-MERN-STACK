import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FaTrophy,
  FaRedo,
  FaHome,
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaCheckCircle,
  FaLightbulb,
  FaChevronDown,
  FaChevronUp,
  FaPrint
} from 'react-icons/fa'
import {
  BsBarChartFill,
  BsGraphUpArrow,
  BsShieldCheck,
  BsStars,
  BsArrowRepeat,
  BsClockHistory
} from 'react-icons/bs'

// Helper for Radar Chart SVG coordinates
function getRadarCoordinates(index, total, radius, center, value) {
  const angle = (Math.PI * 2 / total) * index - Math.PI / 2
  const distance = (value / 10) * radius
  const x = center + distance * Math.cos(angle)
  const y = center + distance * Math.sin(angle)
  return { x, y }
}

function Step3Report({ report }) {
  const navigate = useNavigate()
  const [activeChartTab, setActiveChartTab] = useState('bar') // 'bar' | 'line' | 'multi'
  const [expandedQuestion, setExpandedQuestion] = useState(null)
  const [hoveredQ, setHoveredQ] = useState(null)

  const finalScore = Number(report?.finalScore ?? 0)
  const confidence = Number(report?.confidence ?? 0)
  const communication = Number(report?.communication ?? 0)
  const correctness = Number(report?.correctness ?? 0)
  const questions = report?.questionwiseScore || []

  // Derived metrics
  const avgRelevance =
    questions.length > 0
      ? Number((questions.reduce((acc, q) => acc + (q.relevance || q.score || 0), 0) / questions.length).toFixed(1))
      : finalScore

  const radarMetrics = [
    { label: 'Correctness', value: correctness || finalScore, color: '#3b82f6' },
    { label: 'Confidence', value: confidence || finalScore, color: '#10b981' },
    { label: 'Communication', value: communication || finalScore, color: '#8b5cf6' },
    { label: 'Relevance', value: avgRelevance, color: '#f59e0b' },
    { label: 'Overall Score', value: finalScore, color: '#06b6d4' }
  ]

  const getScoreColor = (score) => {
    const s = Number(score) || 0
    if (s >= 8) return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', fill: '#10b981' }
    if (s >= 6) return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', fill: '#3b82f6' }
    if (s >= 4) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', fill: '#f59e0b' }
    return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', fill: '#ef4444' }
  }

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

  // SVG Line Graph calculation for progression
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

  // Build smooth bezier curve
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

  // Area under curve
  const areaPath =
    linePoints.length > 1
      ? `${curvePath} L ${linePoints[linePoints.length - 1].x} ${lineGraphHeight - paddingY} L ${linePoints[0].x} ${lineGraphHeight - paddingY} Z`
      : ''

  return (
    <div className="min-h-screen bg-[#f7f8fa] py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-200 text-center relative overflow-hidden"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-100">
            <FaTrophy />
            <span>AI Mock Evaluation Report</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
            Performance Breakdown & Analytics
          </h1>
          <p className="text-xs md:text-sm text-gray-500 max-w-lg mx-auto mb-8">
            Visual analysis of your interview performance across communication, confidence, technical correctness, and pacing.
          </p>

          {/* Score Circular Gauge & Highlights */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
            {/* Circular Gauge */}
            <div className="relative flex items-center justify-center">
              <svg width="150" height="150" className="transform -rotate-90">
                <circle cx="75" cy="75" r="62" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                <circle
                  cx="75"
                  cy="75"
                  r="62"
                  stroke="url(#scoreGradient)"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 - (Math.min(10, finalScore) / 10) * (2 * Math.PI * 62)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-gray-900 leading-none">{finalScore}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">out of 10</span>
              </div>
            </div>

            {/* Verdict summary */}
            <div className="text-left space-y-2 max-w-xs">
              <span
                className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${
                  finalScore >= 8
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : finalScore >= 6
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {finalScore >= 8
                  ? 'Strong Candidate • Hire'
                  : finalScore >= 6
                  ? 'Good Competency • Potential'
                  : 'Needs Practice'}
              </span>
              <h3 className="text-base font-bold text-gray-900">
                {finalScore >= 8
                  ? 'Exceptional interview delivery!'
                  : finalScore >= 6
                  ? 'Solid foundation with room to refine answers.'
                  : 'Keep drilling your technical structure.'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Evaluated based on {questions.length} real-time questions, answer accuracy, structure, and pacing.
              </p>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Confidence</span>
              <h4 className="text-xl font-bold text-gray-900 mt-1">{confidence} / 10</h4>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (confidence / 10) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Communication</span>
              <h4 className="text-xl font-bold text-gray-900 mt-1">{communication} / 10</h4>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (communication / 10) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Correctness</span>
              <h4 className="text-xl font-bold text-gray-900 mt-1">{correctness} / 10</h4>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (correctness / 10) * 100)}%` }}
                />
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
                Interactive graphs displaying question-wise scores, competency radar, and interview progression.
              </p>
            </div>

            {/* Chart Mode Selector */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setActiveChartTab('bar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeChartTab === 'bar' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                }`}
              >
                <BsBarChartFill size={12} />
                <span>Bar Chart</span>
              </button>
              <button
                onClick={() => setActiveChartTab('line')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeChartTab === 'line' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                }`}
              >
                <BsGraphUpArrow size={12} />
                <span>Progression</span>
              </button>
              <button
                onClick={() => setActiveChartTab('multi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeChartTab === 'multi' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                }`}
              >
                <FaChartPie size={12} />
                <span>Competency Radar</span>
              </button>
            </div>
          </div>

          {/* CHART CONTENT 1: QUESTION-WISE BAR GRAPH */}
          {activeChartTab === 'bar' && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-4 px-2">
                <span className="font-semibold uppercase tracking-wider">Score per question (0 - 10)</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Target Benchmark: 7.0
                </span>
              </div>

              {/* Bar Columns Container */}
              <div className="relative pt-6 pb-2">
                {/* Benchmark dashed line */}
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

                        {/* Top Score Label */}
                        <span className="text-xs font-bold text-gray-700 mb-1 group-hover:scale-110 transition">
                          {score}
                        </span>

                        {/* Bar */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.08 }}
                          className="w-full max-w-[48px] rounded-t-xl transition-all duration-300 relative overflow-hidden group-hover:brightness-95"
                          style={{
                            backgroundColor: color.fill,
                            boxShadow: `0 4px 14px ${color.fill}33`
                          }}
                        >
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition" />
                        </motion.div>
                      </div>
                    )
                  })}
                </div>

                {/* X-axis question labels */}
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

          {/* CHART CONTENT 2: PROGRESSION LINE CHART */}
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
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide Lines */}
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

                  {/* Area fill */}
                  {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

                  {/* Curve Path */}
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

                  {/* Data Nodes */}
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

          {/* CHART CONTENT 3: COMPETENCY RADAR CHART */}
          {activeChartTab === 'multi' && (
            <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
              {/* Radar Graphic */}
              <div className="relative">
                <svg width="280" height="280" className="overflow-visible">
                  {/* Circular Grid Rings for 2, 4, 6, 8, 10 */}
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

                  {/* Axis lines */}
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

                  {/* Target 7.0 Benchmark Polygon */}
                  <polygon
                    points={targetPassingPoints}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.8"
                  />

                  {/* Candidate Score Polygon */}
                  <polygon
                    points={radarPoints}
                    fill="#10b981"
                    fillOpacity="0.35"
                    stroke="#059669"
                    strokeWidth="2.5"
                  />

                  {/* Metric Node dots and labels */}
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

              {/* Competency Score Cards */}
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

        {/* Detailed Question-wise Feedback Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FaLightbulb className="text-amber-500" size={18} />
              <h3 className="text-xl font-bold text-gray-900">Question-wise AI Feedback</h3>
            </div>
            <span className="text-xs text-gray-400 font-medium">Click each card to expand</span>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isExpanded = expandedQuestion === idx || expandedQuestion === null
              const badge = getScoreColor(q.score)

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 transition overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedQuestion(expandedQuestion === idx ? -1 : idx)}
                    className="p-4 cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">{q.question}</h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                        Score: {q.score} / 10
                      </span>
                      <span className="text-gray-400">
                        {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 pt-2 border-t border-gray-200/60 text-xs space-y-3 bg-white">
                      <div>
                        <strong className="text-gray-700 block mb-1">Full Question:</strong>
                        <p className="text-gray-900 font-medium">{q.question}</p>
                      </div>

                      {q.answer && (
                        <div>
                          <strong className="text-gray-500 block mb-1">Your Submitted Answer:</strong>
                          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 font-mono leading-relaxed">
                            {q.answer}
                          </div>
                        </div>
                      )}

                      <div>
                        <strong className="text-emerald-700 block mb-1">AI Evaluator Feedback:</strong>
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-950 leading-relaxed">
                          {q.feedback || 'Candidate response evaluated and marked.'}
                        </div>
                      </div>

                      {/* Criteria scores */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
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
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 py-3.5 px-8 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition shadow-lg shadow-green-600/20 cursor-pointer"
          >
            <FaRedo />
            <span>Take Another Interview</span>
          </button>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center justify-center gap-2 py-3.5 px-8 rounded-full bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-semibold text-sm transition cursor-pointer"
          >
            <BsClockHistory />
            <span>Interview History</span>
          </button>
          <button
            onClick={() => navigate('/home')}
            className="flex items-center justify-center gap-2 py-3.5 px-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm transition cursor-pointer"
          >
            <FaHome />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Step3Report