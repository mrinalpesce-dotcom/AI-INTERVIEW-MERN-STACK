import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from './AdminContext'
import {
  BsArrowLeft,
  BsShieldCheck,
  BsShieldSlash,
  BsCoin,
  BsCalendar3,
  BsClockHistory,
  BsFilter,
  BsSearch,
  BsChevronLeft,
  BsChevronRight,
  BsCardChecklist,
  BsCheckCircleFill,
  BsXCircleFill,
  BsActivity,
} from 'react-icons/bs'

const AdminCustomerDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState(null)
  const [latestInterviews, setLatestInterviews] = useState([])
  const [activities, setActivities] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(false)

  // Timeline Filters
  const [search, setSearch] = useState('')
  const [activityType, setActivityType] = useState('all')

  const fetchCustomer = async () => {
    setLoading(true)
    try {
      const res = await adminApi.get(`/customers/${id}`)
      if (res.data.success) {
        setCustomer(res.data.customer)
        setLatestInterviews(res.data.latestInterviews || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async (page = 1) => {
    setActivitiesLoading(true)
    try {
      const res = await adminApi.get(`/customers/${id}/activities`, {
        params: {
          page,
          limit: pagination.limit,
          type: activityType,
          search,
        },
      })
      if (res.data.success) {
        setActivities(res.data.activities)
        setPagination(res.data.pagination)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActivitiesLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomer()
  }, [id])

  useEffect(() => {
    fetchActivities(1)
  }, [id, activityType])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchActivities(1)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-400 text-xs font-mono">Loading customer profile & timeline...</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
        <p className="text-sm text-slate-400 mb-4">Customer record not found.</p>
        <button
          onClick={() => navigate('/admin/customers')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Customer List
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/customers')}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
        >
          <BsArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customer Profile & Timeline</h2>
          <p className="text-xs text-slate-400 font-mono">ID: {customer._id}</p>
        </div>
      </div>

      {/* Customer Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-xl shadow-lg shadow-indigo-600/30">
              {customer.name?.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{customer.name}</h3>
              <p className="text-xs text-slate-400 font-mono">{customer.email}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    customer.status === 'suspended'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {customer.status || 'active'}
                </span>
                <span className="text-xs font-mono text-indigo-400 font-semibold">
                  Role: {customer.role}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Credits Balance:</span>
              <span className="font-mono font-bold text-emerald-400">{customer.credits ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Logins:</span>
              <span className="font-mono text-slate-200">{customer.loginCount ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Activities:</span>
              <span className="font-mono text-indigo-400 font-bold">{customer.activityCount ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Registered:</span>
              <span className="font-mono text-slate-300">
                {new Date(customer.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Login:</span>
              <span className="font-mono text-slate-300">
                {customer.lastLogin ? new Date(customer.lastLogin).toLocaleString() : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Active:</span>
              <span className="font-mono text-slate-300">
                {customer.lastActivity ? new Date(customer.lastActivity).toLocaleString() : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Mock Interview Stats */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <BsCardChecklist className="text-indigo-400" /> Interview Statistics
          </h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total</p>
              <p className="text-xl font-bold text-white font-mono mt-1">
                {customer.stats?.totalInterviews ?? 0}
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Completed</p>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
                {customer.stats?.completedInterviews ?? 0}
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Avg Score</p>
              <p className="text-xl font-bold text-indigo-400 font-mono mt-1">
                {customer.stats?.averageScore ?? 0}/10
              </p>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-400 mb-2">Recent Interviews:</p>
            <div className="space-y-2">
              {latestInterviews.length > 0 ? (
                latestInterviews.map((iv) => (
                  <div
                    key={iv._id}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{iv.role}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {iv.mode} Mode • {iv.experience}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-emerald-400 font-bold">
                        {iv.finalScore ? `${iv.finalScore}/10` : '—'}
                      </span>
                      <p className="text-[10px] text-slate-500">
                        {new Date(iv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 font-mono py-2">No mock interviews taken yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Security & Quick Admin Actions */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-1">Account Governance</h3>
            <p className="text-xs text-slate-400 mb-4">Enforce access controls or modify customer balance</p>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-slate-200">Security Details:</p>
              <p className="text-slate-400 text-[11px]">
                Role: <span className="font-mono text-white">{customer.role}</span>
              </p>
              <p className="text-slate-400 text-[11px]">
                Suspension Status: <span className="font-mono text-white">{customer.status}</span>
              </p>
              <p className="text-slate-400 text-[11px]">
                Audit Trail: Every change made to this customer is logged permanently with administrator identity.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => navigate('/admin/customers')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              ← Back to All Customers
            </button>
          </div>
        </div>
      </div>

      {/* Customer Activity Timeline */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BsClockHistory className="text-indigo-400" /> Chronological Activity Timeline
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Every real business event recorded by the system for {customer.name} ({pagination.total} events)
            </p>
          </div>

          {/* Timeline Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <BsSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search event description..."
                className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </form>

            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <BsFilter size={14} className="text-slate-400" />
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
              >
                <option value="all" className="bg-slate-900">All Event Types</option>
                <option value="USER_REGISTER" className="bg-slate-900">Registration</option>
                <option value="USER_LOGIN" className="bg-slate-900">Login</option>
                <option value="USER_LOGOUT" className="bg-slate-900">Logout</option>
                <option value="INTERVIEW_CREATED" className="bg-slate-900">Interview Started</option>
                <option value="INTERVIEW_COMPLETED" className="bg-slate-900">Interview Completed</option>
                <option value="PAYMENT_COMPLETED" className="bg-slate-900">Payment Completed</option>
                <option value="CREDITS_ADJUSTED" className="bg-slate-900">Credits Adjusted</option>
                <option value="ACCOUNT_STATUS_CHANGED" className="bg-slate-900">Status Changed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline Event List */}
        <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
          {activitiesLoading ? (
            <div className="py-8 text-center text-slate-400 text-xs font-mono">
              Loading timeline events...
            </div>
          ) : activities.length > 0 ? (
            activities.map((act) => {
              const eventDate = new Date(act.createdAt)
              return (
                <div key={act._id} className="relative group">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-indigo-500 group-hover:scale-125 transition-transform" />

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold uppercase">
                          {act.activityType}
                        </span>
                        {act.resourceId && (
                          <span className="text-[11px] font-mono text-slate-500">
                            Ref: {act.resourceId.slice(0, 10)}...
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {eventDate.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-slate-200 font-medium leading-relaxed">
                      {act.description}
                    </p>

                    {act.metadata && Object.keys(act.metadata).length > 0 && (
                      <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                        {Object.entries(act.metadata).map(([k, v]) => (
                          <span key={k} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            <strong className="text-slate-300">{k}:</strong> {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <p className="py-8 text-slate-500 font-mono text-xs">
              No activity records match the selected filter.
            </p>
          )}
        </div>

        {/* Timeline Pagination */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <span className="font-semibold text-white">{pagination.page}</span> of{' '}
            <span className="font-semibold text-white">{pagination.totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
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

export default AdminCustomerDetail
