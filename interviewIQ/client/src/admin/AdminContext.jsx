import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://ai-interview-mern-stack-2.onrender.com'

const AdminContext = createContext(null)

export const adminApi = axios.create({
  baseURL: `${serverUrl}/api/admin`,
  withCredentials: true,
})

// Attach admin token automatically to every request
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      setAdmin(null)
      setLoading(false)
      return
    }

    try {
      const { data } = await adminApi.get('/auth/me')
      if (data.success && data.admin) {
        setAdmin(data.admin)
      } else {
        setAdmin(null)
        localStorage.removeItem('admin_token')
      }
    } catch (err) {
      setAdmin(null)
      localStorage.removeItem('admin_token')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email, password) => {
    setError(null)
    try {
      const { data } = await adminApi.post('/auth/login', { email, password })
      if (data.success && data.token) {
        localStorage.setItem('admin_token', data.token)
        setAdmin(data.admin)
        return { success: true }
      }
      return { success: false, message: data.message || 'Login failed' }
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed. Please check credentials.'
      setError(msg)
      return { success: false, message: msg }
    }
  }

  const logout = async () => {
    try {
      await adminApi.post('/auth/logout')
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('admin_token')
      setAdmin(null)
    }
  }

  return (
    <AdminContext.Provider
      value={{
        admin,
        loading,
        error,
        setError,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
