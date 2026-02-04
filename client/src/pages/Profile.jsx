import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  User,
  Mail,
  Phone,
  DollarSign,
  MapPin,
  Star,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const DINING_HALLS = [
  'Lipton Dining Hall',
  'Weinstein Passport Dining',
  'Palladium Dining Hall',
  'Third North Dining',
  'Kimmel Marketplace',
  'Jasper Kane (Brooklyn)',
  'Other'
]

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    venmo_handle: user?.venmo_handle || '',
    dining_hall_preference: user?.dining_hall_preference || ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await updateProfile(formData)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Profile</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center mb-6">
          <div className="bg-nyu-violet text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-semibold text-gray-800">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex items-center mt-1">
              {user?.rating > 0 ? (
                <>
                  <Star size={16} className="text-yellow-500" fill="currentColor" />
                  <span className="ml-1 text-gray-600">
                    {user.rating.toFixed(1)} ({user.total_reviews} review{user.total_reviews !== 1 ? 's' : ''})
                  </span>
                </>
              ) : (
                <span className="text-gray-400 text-sm">No reviews yet</span>
              )}
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6 flex items-center">
            <CheckCircle size={20} className="mr-2" />
            Profile updated successfully!
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={user?.email || ''}
                className="input-field pl-10 bg-gray-50"
                disabled
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
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
              Venmo Handle
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
            <p className="text-xs text-gray-500 mt-1">Displayed to buyers for easy payments</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Dining Hall
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                name="dining_hall_preference"
                value={formData.dining_hall_preference}
                onChange={handleChange}
                className="input-field pl-10"
              >
                <option value="">Select your preferred dining hall</option>
                {DINING_HALLS.map((hall) => (
                  <option key={hall} value={hall}>{hall}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              'Saving...'
            ) : (
              <>
                <Save size={20} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Member since</span>
            <span className="text-gray-800">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })
                : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total reviews</span>
            <span className="text-gray-800">{user?.total_reviews || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Account status</span>
            <span className="text-green-600 font-medium">Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
