import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAdmin } from './AdminContext'
import {
  BsGrid1X2Fill,
  BsPeopleFill,
  BsClockHistory,
  BsBarChartFill,
  BsShieldCheck,
  BsBoxArrowRight,
  BsArrowLeft,
  BsList,
  BsX,
  BsRobot,
  BsCircleFill,
} from 'react-icons/bs'

const NAV_LINKS = [
  { name: 'Overview', path: '/admin', exact: true, icon: BsGrid1X2Fill },
  { name: 'Customers', path: '/admin/customers', icon: BsPeopleFill },
  { name: 'Activity Timeline', path: '/admin/activities', icon: BsClockHistory },
  { name: 'Analytics', path: '/admin/analytics', icon: BsBarChartFill },
  { name: 'Audit Logs', path: '/admin/audit-logs', icon: BsShieldCheck },
]

const AdminLayout = () => {
  const { admin, logout } = useAdmin()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const getPageTitle = () => {
    if (location.pathname === '/admin' || location.pathname === '/admin/overview') return 'Dashboard Overview'
    if (location.pathname.startsWith('/admin/customers/')) return 'Customer Profile & Activity'
    if (location.pathname === '/admin/customers') return 'Customer Management'
    if (location.pathname === '/admin/activities') return 'Customer Activity Timeline'
    if (location.pathname === '/admin/analytics') return 'Activity & Usage Analytics'
    if (location.pathname === '/admin/audit-logs') return 'Administrator Audit Trail'
    return 'Admin Console'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30">
                <BsRobot size={22} />
              </div>
              <div>
                <h1 className="font-bold text-white tracking-tight text-base leading-none">
                  InterviewIQ
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
                    Admin Console
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white md:hidden"
            >
              <BsX size={24} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Management
            </p>
            {NAV_LINKS.map((item) => {
              const Icon = item.icon
              const active = item.exact
                ? location.pathname === '/admin' || location.pathname === '/admin/overview'
                : location.pathname.startsWith(item.path)

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Footer: Admin user details + Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow">
              {admin?.name?.slice(0, 1).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{admin?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{admin?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate('/home')}
              className="py-2 px-2.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg flex items-center justify-center gap-1.5 transition font-medium border border-slate-800"
              title="Return to Public Website"
            >
              <BsArrowLeft size={13} />
              <span>Website</span>
            </button>
            <button
              onClick={handleLogout}
              className="py-2 px-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg flex items-center justify-center gap-1.5 transition font-medium border border-red-900/30"
              title="Logout from Admin"
            >
              <BsBoxArrowRight size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-400 hover:text-white md:hidden rounded-lg hover:bg-slate-800"
            >
              <BsList size={22} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Server & DB Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
              <BsCircleFill size={8} className="text-emerald-400 animate-pulse" />
              <span>MongoDB Connected</span>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Role: <span className="text-indigo-400 font-semibold uppercase">Administrator</span>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
