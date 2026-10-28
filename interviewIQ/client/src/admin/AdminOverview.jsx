import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { adminApi } from './AdminContext'
import {
  BsPeopleFill,
  BsPersonPlusFill,
  BsLightningChargeFill,
  BsActivity,
  BsCardChecklist,
  BsArrowRight,
  BsCheckCircleFill,
  BsClockHistory,
  BsArrowRepeat,
  BsShieldLock,
} from 'react-icons/bs'

const AdminOverview = () => {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOverview = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.get('/dashboard')
      if (res.data.success) {
        setData(res.data)
      } else {
        setError('Failed to load dashboard metrics')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error connecting to admin API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-400 text-sm font-mono">Aggregating MongoDB data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-300">
        <p className="font-semibold mb-2">Error loading dashboard</p>
        <p className="text-sm text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    )
  }

  const { metrics, recentCustomers, recentActivities, charts } = data || {}

  // Stat Cards Config
  const STATS = [
    {
      label: 'Total Registered Customers',
      value: metrics?.totalCustomers ?? 0,
      sub: `+${metrics?.newCustomersToday ?? 0} registered today`,
      icon: BsPeopleFill,
      color: 'from-blue-600 to-indigo-600',
      textColor: 'text-blue-400',
    },
    {
      label: 'Active Users Today',
      value: metrics?.activeUsersToday ?? 0,
      sub: 'Engaged within last 24h',
      icon: BsLightningChargeFill,
      color: 'from-emerald-600 to-teal-600',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Total Recorded Activities',
      value: metrics?.totalActivities ?? 0,
      sub: 'Persistent in MongoDB',
      icon: BsActivity,
      color: 'from-purple-600 to-pink-600',
      textColor: 'text-purple-400',
    },
    {
      label: 'Mock Interviews Created',
      value: metrics?.totalInterviews ?? 0,
      sub: `${metrics?.completedInterviews ?? 0} Completed (${metrics?.completionRate ?? 0}%)`,
      icon: BsCardChecklist,
      color: 'from-amber-600 to-orange-600',
      textColor: 'text-amber-400',
    },
  ]

  // Helper to render responsive SVG Area Chart for activity trends
  const renderTrendChart = (trendData = [], strokeColor = '#6366f1', fillColor = 'rgba(99, 102, 241, 0.2)') => {
    if (!trendData || trendData.length === 0) {
      return (
        <div className="h-44 flex items-center justify-center text-slate-500 text-xs font-mono">
          No trend data recorded in this period
        </div>
      )
    }

    const maxVal = Math.max(...trendData.map((d) => d.count || 1), 5)
    const width = 600
    const height = 150
    const padding = 20

    const points = trendData.map((d, index) => {
      const x = padding + (index / (trendData.length - 1 || 1)) * (width - 2 * padding)
      const y = height - padding - ((d.count || 0) / maxVal) * (height - 2 * padding)
      return { x, y, count: d.count, label: d._id }
    })

    const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

    return (
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id={`grad_${strokeColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#grad_${strokeColor})`} />
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4.5" fill="#0f172a" stroke={strokeColor} strokeWidth="2.5" />
            </g>
          ))}
        </svg>
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-2 px-2">
          <span>{trendData[0]?._id}</span>
          <span>{trendData[Math.floor(trendData.length / 2)]?._id}</span>
          <span>{trendData[trendData.length - 1]?._id}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            System Operations & Customer Tracking
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry and user behavior stored permanently in MongoDB.
          </p>
        </div>
        <button
          onClick={fetchOverview}
          className="self-start sm:self-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition"
        >
          <BsArrowRepeat size={14} /> Refresh Metrics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-md`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {card.value.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {card.sub}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Customer Activity Trends</h3>
              <p className="text-xs text-slate-400">Total actions recorded over the past 14 days</p>
            </div>
            <button
              onClick={() => navigate('/admin/activities')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              View Full Timeline <BsArrowRight size={12} />
            </button>
          </div>
          {renderTrendChart(charts?.activityTrend, '#818cf8')}
        </div>

        {/* Activity Distribution */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-1">Activity Breakdown</h3>
            <p className="text-xs text-slate-400 mb-6">Distribution by event category</p>

            <div className="space-y-3.5">
              {charts?.activityDistribution?.length > 0 ? (
                charts.activityDistribution.map((item, idx) => {
                  const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-blue-500']
                  const total = charts.activityDistribution.reduce((acc, curr) => acc + curr.count, 0)
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
                  return (
                    <div key={item._id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono text-slate-300">{item._id}</span>
                        <span className="text-slate-400 font-semibold">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors[idx % colors.length]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-slate-500 font-mono text-center py-8">
                  No activity distribution data yet
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/analytics')}
            className="w-full mt-6 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition text-center"
          >
            Explore Detailed Analytics →
          </button>
        </div>
      </div>

      {/* Two Column Table Layout: Recent Registrations & Live Customer Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customer Registrations */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-white text-base">Recent Customer Registrations</h3>
              <p className="text-xs text-slate-400">Newly registered user profiles</p>
            </div>
            <button
              onClick={() => navigate('/admin/customers')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              All Customers <BsArrowRight size={12} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Credits</th>
                  <th className="pb-3 font-semibold text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentCustomers && recentCustomers.length > 0 ? (
                  recentCustomers.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => navigate(`/admin/customers/${c._id}`)}
                      className="hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      <td className="py-3">
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.email}</div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === 'suspended'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {c.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-300">{c.credits ?? 0}</td>
                      <td className="py-3 text-right text-slate-400 font-mono">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No customer registrations recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-white text-base">Live Activity Feed</h3>
              <p className="text-xs text-slate-400">Chronological stream of events</p>
            </div>
            <button
              onClick={() => navigate('/admin/activities')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Full Stream <BsArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3.5">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div
                  key={act._id}
                  className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold uppercase">
                        {act.activityType}
                      </span>
                      <span className="text-slate-400 text-[11px] truncate">
                        {act.userEmail || act.userName || 'User'}
                      </span>
                    </div>
                    <p className="text-slate-200 font-medium leading-relaxed truncate">
                      {act.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 whitespace-nowrap">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-slate-500 text-xs">
                No recorded customer activities yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminOverview
