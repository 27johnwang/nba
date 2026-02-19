import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, Phone, DollarSign, AlertCircle, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react'

const Register = () => {
  const [step, setStep] = useState('register') // 'register' or 'verify'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    venmo_handle: ''
  })
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const { register, verifyEmail, resendVerification } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!formData.email.endsWith('@nyu.edu')) {
      setError('Please use your NYU email address (@nyu.edu)')
      return
    }

    setLoading(true)

    try {
      const { confirmPassword, ...registerData } = formData
      const result = await register(registerData)

      if (result.requiresVerification) {
        setStep('verify')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyEmail(formData.email, verificationCode)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setResendSuccess(false)
    setError('')

    try {
      await resendVerification(formData.email)
      setResendSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setResendLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <button
            onClick={() => setStep('register')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft size={20} className="mr-1" />
            Back
          </button>

          <div className="text-center mb-8">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-nyu-violet" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Verify Your Email</h1>
            <p className="text-gray-600 mt-2">
              We sent a 6-digit code to<br />
              <span className="font-medium">{formData.email}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center">
              <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6 flex items-center">
              <CheckCircle size={20} className="mr-2 flex-shrink-0" />
              <span>Verification code resent!</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="input-field text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-nyu-violet hover:underline font-medium inline-flex items-center disabled:opacity-50"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw size={14} className="mr-1 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Code'
                )}
              </button>
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Code expires in 15 minutes
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Join NYU Mealswipe</h1>
          <p className="text-gray-600 mt-2">Create your account to start trading swipes</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NYU Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="netid@nyu.edu"
                className="input-field pl-10"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Must be an @nyu.edu email</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="input-field pl-10"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Your phone number"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venmo Handle <span className="text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="venmo_handle"
                value={formData.venmo_handle}
                onChange={handleChange}
                placeholder="@your-venmo"
                className="input-field pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Makes payments easier for buyers</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-nyu-violet hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-6 bg-purple-50 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle className="text-nyu-violet mt-0.5 mr-3 flex-shrink-0" size={20} />
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-800">Why NYU email only?</p>
            <p className="mt-1">
              We verify all users are NYU students to maintain a safe and trusted community.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
