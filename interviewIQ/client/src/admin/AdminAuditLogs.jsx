import React, { useEffect, useState } from 'react'
import { adminApi } from './AdminContext'
import {
  BsShieldCheck,
  BsSearch,
  BsFilter,
  BsChevronLeft,
  BsChevronRight,
  BsArrowRepeat,
  BsFileText,
} from 'react-icons/bs'

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('all')
  const [selectedDetails, setSelectedDetails] = useState(null)

  const fetchLogs = async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminApi.get('/audit-logs', {
        params: {
          page,
          limit: pagination.limit,
          search,
          action,
        },
      })
      if (res.data.success) {
        setLogs(res.data.logs)
        setPagination(res.data.pagination)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1)
  }, [action])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchLogs(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Administrator Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of administrative operations performed on customers and accounts ({pagination.total} records)
          </p>
        </div>
        <button
          onClick={() => fetchLogs(pagination.page)}
          className="self-start sm:self-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition"
        >
          <BsArrowRepeat size={14} /> Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <BsSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit action or administrator email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <BsFilter size={14} className="text-slate-400" />
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900">All Audit Actions</option>
              <option value="ADMIN_LOGIN" className="bg-slate-900">Admin Login</option>
              <option value="USER_STATUS_CHANGE" className="bg-slate-900">Status Change</option>
              <option value="CREDITS_ADJUSTED" className="bg-slate-900">Credits Adjusted</option>
              <option value="ADMIN_SEED_SETUP" className="bg-slate-900">Seed Setup</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Audit Logs */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5 font-semibold">Action</th>
                <th className="py-3.5 px-4 font-semibold">Administrator</th>
                <th className="py-3.5 px-4 font-semibold">Target ID</th>
                <th className="py-3.5 px-4 font-semibold">IP Address</th>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-5 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="font-mono text-xs">Loading audit trail...</p>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{log.adminId?.name || 'Administrator'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{log.adminEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {log.targetId ? log.targetId.slice(0, 14) + '...' : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {log.ipAddress || 'Internal'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <button
                          onClick={() => setSelectedDetails(log)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] transition"
                        >
                          View Payload
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                    No audit records found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <span className="font-semibold text-white">{pagination.page}</span> of{' '}
            <span className="font-semibold text-white">{pagination.totalPages}</span> ({pagination.total} total)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
            >
              <BsChevronLeft size={13} />
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
            >
              <BsChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Audit Event Payload: <span className="text-indigo-400">{selectedDetails.action}</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Recorded at {new Date(selectedDetails.createdAt).toLocaleString()} by {selectedDetails.adminEmail}
            </p>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto max-h-80">
              <pre className="text-xs font-mono text-emerald-400">
                {JSON.stringify(selectedDetails.details, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setSelectedDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAuditLogs
