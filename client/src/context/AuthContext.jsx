import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (err) {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await api.post('/auth/login', { email, password })

      // Check if verification is required
      if (response.data.requiresVerification) {
        return { requiresVerification: true, email: response.data.email }
      }

      localStorage.setItem('token', response.data.token)
      setUser(response.data.user)
      return response.data
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed'
      const requiresVerification = err.response?.data?.requiresVerification
      const errorEmail = err.response?.data?.email

      if (requiresVerification) {
        return { requiresVerification: true, email: errorEmail, error: message }
      }

      setError(message)
      throw new Error(message)
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const response = await api.post('/auth/register', userData)

      // Registration now requires verification
      if (response.data.requiresVerification) {
        return { requiresVerification: true, email: response.data.email }
      }

      // If somehow already verified (shouldn't happen with new flow)
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        setUser(response.data.user)
      }

      return response.data
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed'
      setError(message)
      throw new Error(message)
    }
  }

  const verifyEmail = async (email, code) => {
    try {
      setError(null)
      const response = await api.post('/auth/verify-email', { email, code })
      localStorage.setItem('token', response.data.token)
      setUser(response.data.user)
      return response.data
    } catch (err) {
      const message = err.response?.data?.error || 'Verification failed'
      setError(message)
      throw new Error(message)
    }
  }

  const resendVerification = async (email) => {
    try {
      const response = await api.post('/auth/resend-verification', { email })
      return response.data
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to resend code'
      throw new Error(message)
    }
  }

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email })
      return response.data
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to process request'
      throw new Error(message)
    }
  }

  const verifyResetCode = async (email, code) => {
    try {
      const response = await api.post('/auth/verify-reset-code', { email, code })
      return response.data
    } catch (err) {
      const message = err.response?.data?.error || 'Invalid code'
      throw new Error(message)
    }
  }

  const resetPassword = async (email, code, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { email, code, newPassword })
      return response.data
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to reset password'
      throw new Error(message)
    }
  }

  const deleteAccount = async (password) => {
    try {
      const response = await api.delete('/auth/account', { data: { password } })
      localStorage.removeItem('token')
      setUser(null)
      return response.data
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to delete account'
      throw new Error(message)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const updateProfile = async (data) => {
    try {
      const response = await api.put('/auth/profile', data)
      setUser(response.data.user)
      return response.data
    } catch (err) {
      const message = err.response?.data?.error || 'Update failed'
      throw new Error(message)
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    deleteAccount,
    logout,
    updateProfile,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
