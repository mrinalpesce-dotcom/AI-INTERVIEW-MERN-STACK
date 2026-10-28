import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAdmin } from './AdminContext'

const AdminProtectedRoute = () => {
  const { admin, loading } = useAdmin()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-mono text-sm tracking-wide">
          Verifying administrator authorization...
        </p>
      </div>
    )
  }

  if (!admin || admin.role !== 'admin') {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}

export default AdminProtectedRoute
