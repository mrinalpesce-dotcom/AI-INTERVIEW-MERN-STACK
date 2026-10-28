import React, { useEffect, useState } from 'react'
import { adminApi } from './AdminContext'
import {
  BsBarChartFill,
  BsCalendar3,
  BsPeopleFill,
  BsActivity,
  BsBriefcaseFill,
  BsCheckCircleFill,
  BsArrowRepeat,
} from 'react-icons/bs'

const AdminAnalytics = () => {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await adminApi.get('/analytics', { params: { days } })
      if (res.data.success) {
        setData(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [days])

  // Responsive SVG Bar Chart for Daily Active Users (DAU) or Registrations
  const renderBarChart = (items = [], labelKey = 'dau', color = '#6366f1') => {
    if (!items || items.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-slate-500 font-mono text-xs">
          No data recorded for this timeframe
        </div>
      )
    }

    const maxVal = Math.max(...items.map((it) => it[labelKey] || 1), 5)
    const height = 160

    return (
      <div className="space-y-2">
        <div className="h-44 flex items-end gap-1.5 pt-4 px-2 overflow-x-auto">
          {items.map((it, idx) => {
            const val = it[labelKey] || 0
            const heightPct = Math.max((val / maxVal) * 100, 4)
            return (
              <div
                key={it._id || idx}
                className="flex-1 min-w-[20px] flex flex-col items-center group relative cursor-pointer"
              >
                {/* Tooltip */}
                <div className="absolute -top-8 hidden group-hover:flex px-2 py-1 bg-slate-950 border border-slate-700 text-white rounded text-[10px] font-mono whitespace-nowrap z-20 shadow-lg">
                  {it._id}: {val}
                </div>
                <div
                  className="w-full rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono px-2 pt-1 border-t border-slate-800">
          <span>{items[0]?._id}</span>
          <span>{items[Math.floor(items.length / 2)]?._id}</span>
          <span>{items[items.length - 1]?._id}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System & Activity Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated customer engagement metrics powered by MongoDB pipeline aggregations.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Timeframe:</span>
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  days === d
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Refresh Analytics"
          >
            <BsArrowRepeat size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-mono text-xs">Computing MongoDB analytics aggregation...</p>
        </div>
      ) : (
        <>
          {/* Charts Row 1: Daily Active Users & Registrations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Active Users (DAU) */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BsPeopleFill className="text-emerald-400" /> Daily Active Users (DAU)
                  </h3>
                  <p className="text-xs text-slate-400">Unique customers performing events each day</p>
                </div>
              </div>
              {renderBarChart(data?.dailyActiveUsers, 'dau', '#10b981')}
            </div>

            {/* Registrations Over Time */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BsCalendar3 className="text-indigo-400" /> Customer Registrations Trend
                  </h3>
                  <p className="text-xs text-slate-400">New customer signups over the selected period</p>
                </div>
              </div>
              {renderBarChart(data?.registrationsOverTime, 'registrations', '#6366f1')}
            </div>
          </div>

          {/* Charts Row 2: Most Popular Roles & Activity Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Practiced Roles */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <BsBriefcaseFill className="text-amber-400" /> Top Interview Roles Practiced
              </h3>
              <p className="text-xs text-slate-400 mb-5">Most frequently selected job positions</p>

              <div className="space-y-3">
                {data?.interviewsByRole && data.interviewsByRole.length > 0 ? (
                  data.interviewsByRole.map((role) => {
                    const maxCount = Math.max(...data.interviewsByRole.map((r) => r.count), 1)
                    const pct = Math.round((role.count / maxCount) * 100)
                    return (
                      <div key={role._id} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-200">{role._id || 'General'}</span>
                          <span className="font-mono text-slate-400">{role.count} sessions</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="py-8 text-center text-slate-500 font-mono text-xs">
                    No mock interview records in this timeframe.
                  </p>
                )}
              </div>
            </div>

            {/* Event Distribution breakdown */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <BsActivity className="text-purple-400" /> Activity Distribution Breakdown
              </h3>
              <p className="text-xs text-slate-400 mb-5">Categorized breakdown of customer interactions</p>

              <div className="space-y-3">
                {data?.activitiesByType && data.activitiesByType.length > 0 ? (
                  data.activitiesByType.map((act) => {
                    const totalActs = data.activitiesByType.reduce((sum, curr) => sum + curr.count, 0)
                    const pct = totalActs > 0 ? Math.round((act.count / totalActs) * 100) : 0
                    return (
                      <div key={act._id} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="font-mono text-slate-300">{act._id}</span>
                          <span className="font-mono text-slate-400">
                            {act.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="py-8 text-center text-slate-500 font-mono text-xs">
                    No activity records found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminAnalytics
