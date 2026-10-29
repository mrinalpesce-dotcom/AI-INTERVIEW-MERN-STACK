import React, { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './assets/pages/Home.jsx'
import Auth from './assets/pages/Auth.jsx'
import InterviewPage from './assets/pages/InterviewPage.jsx'
import HistoryPage from './assets/pages/HistoryPage.jsx'
import ReportPage from './assets/pages/ReportPage.jsx'
import TimerPage from './assets/components/TimerPage.jsx'
import Pricing from './assets/pages/Pricing.jsx'
import { useDispatch } from 'react-redux'
import { setUserData } from './redux/user.Slice.js'
import axios from 'axios'

// Admin Dashboard Components
import { AdminProvider } from './admin/AdminContext.jsx'
import AdminProtectedRoute from './admin/AdminProtectedRoute.jsx'
import AdminLogin from './admin/AdminLogin.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import AdminOverview from './admin/AdminOverview.jsx'
import AdminCustomers from './admin/AdminCustomers.jsx'
import AdminCustomerDetail from './admin/AdminCustomerDetail.jsx'
import AdminActivities from './admin/AdminActivities.jsx'
import AdminAnalytics from './admin/AdminAnalytics.jsx'
import AdminAuditLogs from './admin/AdminAuditLogs.jsx'

export const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://ai-interview-mern-stack-2.onrender.com'

// Automatically attach credentials and Authorization header to every request
axios.interceptors.request.use((config) => {
  config.withCredentials = true
  const token = localStorage.getItem('token')
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/user/current-user`)
        dispatch(setUserData(result.data))
      } catch (error) {
        dispatch(setUserData(null))
      }
    }
    getUser()
  }, [dispatch])

  return (
    <AdminProvider>
      <Routes>
        {/* Public / Customer Routes */}
        <Route path='/' element={<Auth />} />
        <Route path='/home' element={<Home />} />
        <Route path='/interview' element={<InterviewPage />} />
        <Route path='/history' element={<HistoryPage />} />
        <Route path='/report' element={<ReportPage />} />
        <Route path='/report/:id' element={<ReportPage />} />
        <Route path='/timer' element={<TimerPage />} />
        <Route path='/pricing' element={<Pricing />} />

        {/* Dedicated Admin Login */}
        <Route path='/admin/login' element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route path='/admin' element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path='overview' element={<AdminOverview />} />
            <Route path='customers' element={<AdminCustomers />} />
            <Route path='customers/:id' element={<AdminCustomerDetail />} />
            <Route path='activities' element={<AdminActivities />} />
            <Route path='analytics' element={<AdminAnalytics />} />
            <Route path='audit-logs' element={<AdminAuditLogs />} />
          </Route>
        </Route>
      </Routes>
    </AdminProvider>
  )
}

export default App
