import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from './AdminContext'
import {
  BsClockHistory,
  BsSearch,
  BsFilter,
  BsCalendar3,
  BsChevronLeft,
  BsChevronRight,
  BsArrowRepeat,
  BsPersonFill,
} from 'react-icons/bs'

const AdminActivities = () => {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [activityType, setActivityType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchActivities = async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminApi.get('/activities', {
        params: {
          page,
          limit: pagination.limit,
          search,
          type: activityType,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      })
      if (res.data.success) {
        setActivities(res.data.activities)
        setPagination(res.data.pagination)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities(1)
  }, [activityType, startDate, endDate])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchActivities(1)
  }

  const handleResetFilters = () => {
    setSearch('')
    setActivityType('all')
    setStartDate('')
    setEndDate('')
    fetchActivities(1)
  }

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'USER_REGISTER':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'USER_LOGIN':
      case 'USER_LOGOUT':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
      case 'INTERVIEW_CREATED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'INTERVIEW_COMPLETED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'PAYMENT_COMPLETED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'CREDITS_ADJUSTED':
      case 'ACCOUNT_STATUS_CHANGED':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30'
      default:
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Global Customer Activity Feed</h2>
          <p className="text-xs text-slate-400 mt-1">
            Centralized chronological log of customer events stored in MongoDB ({pagination.total} events)
          </p>
        </div>
        <button
          onClick={() => fetchActivities(pagination.page)}
          className="self-start sm:self-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition"
        >
          <BsArrowRepeat size={14} /> Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <BsSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity description or customer..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </form>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Type */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <BsFilter size={14} className="text-slate-400" />
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900">All Activity Types</option>
              <option value="USER_REGISTER" className="bg-slate-900">Registrations</option>
              <option value="USER_LOGIN" className="bg-slate-900">Logins</option>
              <option value="USER_LOGOUT" className="bg-slate-900">Logouts</option>
              <option value="INTERVIEW_CREATED" className="bg-slate-900">Interviews Started</option>
              <option value="INTERVIEW_COMPLETED" className="bg-slate-900">Interviews Completed</option>
              <option value="PAYMENT_COMPLETED" className="bg-slate-900">Payments Completed</option>
              <option value="PAYMENT_ORDER_CREATED" className="bg-slate-900">Checkout Orders</option>
              <option value="CREDITS_ADJUSTED" className="bg-slate-900">Credits Adjusted</option>
              <option value="ACCOUNT_STATUS_CHANGED" className="bg-slate-900">Status Changed</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-xs">
            <BsCalendar3 size={12} className="text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none text-[11px]"
              title="Start Date"
            />
            <span className="text-slate-600">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none text-[11px]"
              title="End Date"
            />
          </div>

          {(search || activityType !== 'all' || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Activity Timeline Stream */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-sm">
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="font-mono text-xs">Retrieving activities from MongoDB...</p>
            </div>
          ) : activities.length > 0 ? (
            activities.map((act) => {
              const eventDate = new Date(act.createdAt)
              const badgeClass = getBadgeStyle(act.activityType)
              const targetUserId = act.userId?._id || act.userId

              return (
                <div
                  key={act._id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-mono text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase ${badgeClass}`}>
                        {act.activityType}
                      </span>

                      {targetUserId && (
                        <button
                          onClick={() => navigate(`/admin/customers/${targetUserId}`)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition truncate"
                        >
                          <BsPersonFill size={13} />
                          <span>{act.userName || act.userEmail || 'Customer Profile'}</span>
                        </button>
                      )}

                      {act.userEmail && act.userName && (
                        <span className="text-[11px] text-slate-500 font-mono">({act.userEmail})</span>
                      )}
                    </div>

                    <p className="text-sm text-slate-200 font-medium leading-relaxed">
                      {act.description}
                    </p>

                    {act.metadata && Object.keys(act.metadata).length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                        {Object.entries(act.metadata).map(([k, v]) => (
                          <span key={k} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            <strong className="text-slate-300">{k}:</strong> {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-left sm:text-right shrink-0 font-mono text-slate-400 text-xs">
                    <div>{eventDate.toLocaleDateString()}</div>
                    <div className="text-[11px] text-slate-500">
                      {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    {act.ipAddress && (
                      <div className="text-[10px] text-slate-600 mt-1">IP: {act.ipAddress}</div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <p className="py-16 text-center text-slate-500 font-mono text-xs">
              No activity records match the current filters.
            </p>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <span className="font-semibold text-white">{pagination.page}</span> of{' '}
            <span className="font-semibold text-white">{pagination.totalPages}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchActivities(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
            >
              <BsChevronLeft size={13} />
            </button>
            <button
              onClick={() => fetchActivities(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
            >
              <BsChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminActivities
