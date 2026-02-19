import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { User, Star, Calendar, ArrowLeft, MessageSquare } from 'lucide-react'

const UserProfile = () => {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/auth/user/${userId}`)
      setProfile(response.data.user)
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nyu-violet"></div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">User Not Found</h2>
        <p className="text-gray-600 mb-4">{error || 'This user does not exist.'}</p>
        <Link to="/listings" className="btn-primary">
          Browse Listings
        </Link>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === userId

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => window.history.back()}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft size={20} className="mr-1" />
        Back
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center mb-6">
          <div className="bg-nyu-violet text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold">
            {profile.name?.charAt(0) || 'U'}
          </div>
          <div className="ml-4 flex-1">
            <h2 className="text-xl font-semibold text-gray-800">{profile.name}</h2>
            <p className="text-gray-500 text-sm">
              Member since {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Ratings */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-800 mb-4">Ratings</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Seller Rating */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Star size={20} className="text-yellow-500" fill="currentColor" />
                <span className="ml-2 text-2xl font-bold text-gray-800">
                  {profile.seller_rating > 0 ? profile.seller_rating.toFixed(1) : 'N/A'}
                </span>
              </div>
              <p className="text-sm text-gray-600">As Seller</p>
              <p className="text-xs text-gray-500">
                {profile.seller_reviews || 0} review{profile.seller_reviews !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Buyer Rating */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Star size={20} className="text-yellow-500" fill="currentColor" />
                <span className="ml-2 text-2xl font-bold text-gray-800">
                  {profile.buyer_rating > 0 ? profile.buyer_rating.toFixed(1) : 'N/A'}
                </span>
              </div>
              <p className="text-sm text-gray-600">As Buyer</p>
              <p className="text-xs text-gray-500">
                {profile.buyer_reviews || 0} review{profile.buyer_reviews !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {!isOwnProfile && (
          <div className="border-t mt-6 pt-6">
            <Link
              to={`/messages/${userId}`}
              className="btn-primary w-full flex items-center justify-center"
            >
              <MessageSquare size={18} className="mr-2" />
              Send Message
            </Link>
          </div>
        )}

        {isOwnProfile && (
          <div className="border-t mt-6 pt-6">
            <Link
              to="/profile"
              className="btn-outline w-full block text-center"
            >
              Edit Your Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile
