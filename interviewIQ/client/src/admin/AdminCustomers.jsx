import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from './AdminContext'
import {
  BsSearch,
  BsFilter,
  BsEye,
  BsShieldSlash,
  BsShieldCheck,
  BsCoin,
  BsChevronLeft,
  BsChevronRight,
  BsArrowRepeat,
  BsX,
  BsCheckCircle,
} from 'react-icons/bs'

const AdminCustomers = () => {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // Modals state
  const [statusModal, setStatusModal] = useState({ open: false, customer: null, reason: '' })
  const [creditsModal, setCreditsModal] = useState({ open: false, customer: null, amount: 50, reason: '' })
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const fetchCustomers = async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminApi.get('/customers', {
        params: {
          page,
          limit: pagination.limit,
          search,
          status,
          sortBy,
          sortOrder,
        },
      })
      if (res.data.success) {
        setCustomers(res.data.customers)
        setPagination(res.data.pagination)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers(1)
  }, [status, sortBy, sortOrder])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchCustomers(1)
  }

  const handleStatusToggle = async () => {
    if (!statusModal.customer) return
    setActionLoading(true)
    const newStatus = statusModal.customer.status === 'suspended' ? 'active' : 'suspended'
    try {
      const res = await adminApi.patch(`/customers/${statusModal.customer._id}/status`, {
        status: newStatus,
        reason: statusModal.reason || 'Admin status change',
      })
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message })
        setStatusModal({ open: false, customer: null, reason: '' })
        fetchCustomers(pagination.page)
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update status' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreditsAdjust = async () => {
    if (!creditsModal.customer) return
    setActionLoading(true)
    try {
      const res = await adminApi.patch(`/customers/${creditsModal.customer._id}/credits`, {
        amount: parseInt(creditsModal.amount, 10),
        reason: creditsModal.reason || 'Manual credit adjustment',
      })
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message })
        setCreditsModal({ open: false, customer: null, amount: 50, reason: '' })
        fetchCustomers(pagination.page)
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update credits' })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customer Directory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Search, inspect activity profiles, and manage customer accounts. Total: {pagination.total}
          </p>
        </div>
        <button
          onClick={() => fetchCustomers(pagination.page)}
          className="self-start sm:self-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition"
        >
          <BsArrowRepeat size={14} /> Refresh
        </button>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            message.type === 'error'
              ? 'bg-red-950/60 border border-red-500/30 text-red-300'
              : 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            <BsX size={18} />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <BsSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <BsFilter size={14} className="text-slate-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="active" className="bg-slate-900">Active Only</option>
              <option value="suspended" className="bg-slate-900">Suspended Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-medium cursor-pointer"
            >
              <option value="createdAt" className="bg-slate-900">Registration Date</option>
              <option value="lastLogin" className="bg-slate-900">Last Login</option>
              <option value="lastActivity" className="bg-slate-900">Last Activity</option>
              <option value="activityCount" className="bg-slate-900">Activity Count</option>
              <option value="credits" className="bg-slate-900">Credits Balance</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="ml-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 font-bold uppercase"
            >
              {sortOrder}
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Credits</th>
                <th className="py-3.5 px-4 font-semibold">Activities</th>
                <th className="py-3.5 px-4 font-semibold">Last Login</th>
                <th className="py-3.5 px-4 font-semibold">Last Activity</th>
                <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="font-mono text-xs">Loading customers from MongoDB...</p>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white font-bold flex items-center justify-center text-xs border border-slate-700">
                          {c.name?.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white hover:text-indigo-300 cursor-pointer" onClick={() => navigate(`/admin/customers/${c._id}`)}>
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === 'suspended'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {c.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                      {c.credits ?? 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-indigo-400 font-semibold">
                      {c.activityCount ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {c.lastLogin ? new Date(c.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/customers/${c._id}`)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="View Profile & Timeline"
                        >
                          <BsEye size={14} />
                        </button>
                        <button
                          onClick={() => setCreditsModal({ open: true, customer: c, amount: 50, reason: '' })}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition"
                          title="Adjust Credits"
                        >
                          <BsCoin size={14} />
                        </button>
                        <button
                          onClick={() => setStatusModal({ open: true, customer: c, reason: '' })}
                          className={`p-1.5 rounded-lg transition ${
                            c.status === 'suspended'
                              ? 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60'
                              : 'bg-red-950/60 text-red-400 hover:bg-red-900/60'
                          }`}
                          title={c.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                        >
                          {c.status === 'suspended' ? <BsShieldCheck size={14} /> : <BsShieldSlash size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing Page <span className="font-semibold text-white">{pagination.page}</span> of{' '}
            <span className="font-semibold text-white">{pagination.totalPages}</span> ({pagination.total} total)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchCustomers(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BsChevronLeft size={13} />
            </button>
            <button
              onClick={() => fetchCustomers(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BsChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Status Confirmation Modal */}
      {statusModal.open && statusModal.customer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              {statusModal.customer.status === 'suspended' ? 'Reactivate Customer Account' : 'Suspend Customer Account'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Are you sure you want to {statusModal.customer.status === 'suspended' ? 'reactivate' : 'suspend'} the account of{' '}
              <strong className="text-white">{statusModal.customer.name}</strong> ({statusModal.customer.email})?
            </p>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Audit Reason (Recorded to MongoDB Audit Trail)
              </label>
              <input
                type="text"
                value={statusModal.reason}
                onChange={(e) => setStatusModal({ ...statusModal, reason: e.target.value })}
                placeholder="e.g. Terms violation or user request"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setStatusModal({ open: false, customer: null, reason: '' })}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusToggle}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold ${
                  statusModal.customer.status === 'suspended'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {actionLoading ? 'Processing...' : 'Confirm Status Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credits Adjustment Modal */}
      {creditsModal.open && creditsModal.customer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Adjust Customer Credits</h3>
            <p className="text-xs text-slate-400 mb-4">
              Current balance for <strong className="text-white">{creditsModal.customer.name}</strong>:{' '}
              <span className="font-mono text-emerald-400 font-bold">{creditsModal.customer.credits ?? 0}</span> credits.
            </p>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Credit Delta (+ to add, - to deduct)
                </label>
                <input
                  type="number"
                  value={creditsModal.amount}
                  onChange={(e) => setCreditsModal({ ...creditsModal, amount: e.target.value })}
                  placeholder="e.g. 100 or -50"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  value={creditsModal.reason}
                  onChange={(e) => setCreditsModal({ ...creditsModal, reason: e.target.value })}
                  placeholder="e.g. Customer support bonus / manual top-up"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setCreditsModal({ open: false, customer: null, amount: 50, reason: '' })}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreditsAdjust}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                {actionLoading ? 'Saving...' : 'Apply Credit Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCustomers
