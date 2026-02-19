import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { format } from 'date-fns'
import { Send, ArrowLeft, User, MessageSquare, Star, CheckCircle, Heart, XCircle } from 'lucide-react'

const Messages = () => {
  const { userId } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [transaction, setTransaction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectConfirm, setRejectConfirm] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchMessages(userId)
    }
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchTransaction = async (listingId, buyerId) => {
    try {
      const response = await api.get(`/transactions/listing/${listingId}`)
      const tx = response.data.transactions.find(t => t.buyer_id === buyerId && t.status !== 'cancelled' && t.status !== 'completed')
      setTransaction(tx || null)
    } catch (err) {
      console.error('Failed to fetch transaction:', err)
      setTransaction(null)
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations')
      setConversations(response.data.conversations)

      // If we have a userId param, find and set that user
      if (userId) {
        const conv = response.data.conversations.find(c => c.partner_id === userId)
        if (conv) {
          // Existing conversation - use conversation data
          const isPartnerSeller = conv.listing_seller_id === conv.partner_id
          setSelectedUser({
            id: conv.partner_id,
            name: conv.partner_name,
            listing_id: conv.listing_id,
            listing_title: conv.listing_title,
            listing_dining_hall: conv.listing_dining_hall,
            listing_price: conv.listing_price,
            listing_seller_id: conv.listing_seller_id,
            seller_rating: isPartnerSeller ? conv.partner_seller_rating : null,
            seller_reviews: isPartnerSeller ? conv.partner_seller_reviews : null,
            buyer_rating: !isPartnerSeller ? conv.partner_seller_rating : null,
            buyer_reviews: !isPartnerSeller ? conv.partner_seller_reviews : null,
            isPartnerSeller
          })

          // If I'm seller, fetch transaction
          if (!isPartnerSeller && conv.listing_id) {
            fetchTransaction(conv.listing_id, conv.partner_id)
          }
        } else {
          // No existing conversation - fetch user info directly
          try {
            const userRes = await api.get(`/auth/user/${userId}`)
            const partnerUser = userRes.data.user
            // Get listing info from URL params if available
            const listingDiningHall = searchParams.get('dining_hall')
            const listingPrice = searchParams.get('price')
            const role = searchParams.get('role') // 'buyer' or 'seller' - current user's role
            const listingId = searchParams.get('listing_id')

            const isPartnerSeller = role === 'buyer'
            setSelectedUser({
              id: userId,
              name: partnerUser.name,
              listing_id: listingId,
              listing_dining_hall: listingDiningHall,
              listing_price: listingPrice ? parseFloat(listingPrice) : null,
              seller_rating: partnerUser.seller_rating,
              seller_reviews: partnerUser.seller_reviews,
              buyer_rating: partnerUser.buyer_rating,
              buyer_reviews: partnerUser.buyer_reviews,
              isPartnerSeller
            })

            // If I'm seller and there's a listing, fetch transaction
            if (role === 'seller' && listingId) {
              fetchTransaction(listingId, userId)
            }
          } catch {
            setSelectedUser({ id: userId, name: 'User' })
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (partnerId) => {
    try {
      const response = await api.get(`/messages/with/${partnerId}`)
      setMessages(response.data.messages)
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return

    setSending(true)
    try {
      // Preserve current selectedUser info before re-fetching
      const currentUserInfo = { ...selectedUser }

      await api.post('/messages', {
        receiver_id: selectedUser.id,
        content: newMessage,
        listing_id: selectedUser.listing_id
      })
      setNewMessage('')
      fetchMessages(selectedUser.id)

      // Re-fetch conversations but restore the listing info
      const response = await api.get('/messages/conversations')
      setConversations(response.data.conversations)

      // Restore the selectedUser with preserved listing info
      setSelectedUser(currentUserInfo)
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const selectConversation = (conv) => {
    // Check if current user is buyer (partner is the seller of the listing)
    const isPartnerSeller = conv.listing_seller_id === conv.partner_id
    const selectedUserData = {
      id: conv.partner_id,
      name: conv.partner_name,
      listing_id: conv.listing_id,
      listing_title: conv.listing_title,
      listing_dining_hall: conv.listing_dining_hall,
      listing_price: conv.listing_price,
      listing_seller_id: conv.listing_seller_id,
      seller_rating: conv.partner_seller_rating,
      seller_reviews: conv.partner_seller_reviews,
      buyer_rating: conv.partner_buyer_rating,
      buyer_reviews: conv.partner_buyer_reviews,
      isPartnerSeller
    }
    setSelectedUser(selectedUserData)
    setTransaction(null)
    fetchMessages(conv.partner_id)

    // If I'm the seller (partner is buyer), fetch transaction info
    if (!isPartnerSeller && conv.listing_id) {
      fetchTransaction(conv.listing_id, conv.partner_id)
    }
  }

  const handleFavorite = async () => {
    if (!transaction) return
    setActionLoading(true)
    try {
      await api.put(`/transactions/${transaction.id}/status`, { status: 'confirmed' })
      setTransaction({ ...transaction, status: 'confirmed' })
    } catch (err) {
      console.error('Failed to favorite:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteTrade = async () => {
    if (!transaction) return
    setActionLoading(true)
    try {
      await api.put(`/transactions/${transaction.id}/status`, { status: 'completed' })
      setTransaction(null)
    } catch (err) {
      console.error('Failed to complete trade:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnfavorite = async () => {
    if (!transaction) return
    setActionLoading(true)
    try {
      await api.put(`/transactions/${transaction.id}/status`, { status: 'pending' })
      setTransaction({ ...transaction, status: 'pending' })
    } catch (err) {
      console.error('Failed to unfavorite:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectRequest = async () => {
    if (!transaction) return
    setActionLoading(true)
    try {
      await api.put(`/transactions/${transaction.id}/status`, { status: 'cancelled' })
      setTransaction(null)
      setRejectConfirm(false)
    } catch (err) {
      console.error('Failed to reject request:', err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nyu-violet"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Messages</h1>

      <div className="bg-white rounded-xl shadow-md flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className={`w-full md:w-80 border-r flex-shrink-0 ${selectedUser ? 'hidden md:block' : ''}`}>
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">Conversations</h2>
          </div>

          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Start a conversation from a listing page
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {conversations.map((conv) => (
                <button
                  key={conv.partner_id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-4 text-left hover:bg-gray-50 border-b transition-colors ${
                    selectedUser?.id === conv.partner_id ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="bg-nyu-violet text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                      {conv.partner_name.charAt(0)}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-gray-800 truncate">
                          {conv.partner_name}
                        </span>
                        {conv.unread_count > 0 && (
                          <span className="bg-nyu-violet text-white text-xs rounded-full px-2 py-0.5 ml-2">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      {conv.listing_dining_hall && (
                        <p className="text-xs text-nyu-violet bg-purple-50 rounded px-2 py-0.5 mt-1 inline-block">
                          {conv.listing_dining_hall} - ${conv.listing_price?.toFixed(2)}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conv.last_message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(conv.last_message_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex' : ''}`}>
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden mr-3 p-1 hover:bg-gray-100 rounded"
                >
                  <ArrowLeft size={20} />
                </button>
                <Link
                  to={`/user/${selectedUser.id}`}
                  className="bg-nyu-violet text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold hover:bg-nyu-violet-dark transition-colors cursor-pointer"
                  title="View profile"
                >
                  {selectedUser.name.charAt(0)}
                </Link>
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/user/${selectedUser.id}`}
                      className="font-semibold text-gray-800 hover:text-nyu-violet transition-colors"
                    >
                      {selectedUser.name}
                    </Link>
                    {/* Show seller rating when partner is a seller (yellow) */}
                    {selectedUser.isPartnerSeller && (
                      <div className="flex items-center bg-yellow-50 px-2 py-0.5 rounded text-xs">
                        <Star size={12} className="text-yellow-500" fill="currentColor" />
                        <span className="ml-1 text-gray-700">
                          {selectedUser.seller_rating > 0 ? selectedUser.seller_rating.toFixed(1) : 'N/A'}
                        </span>
                        <span className="text-gray-500 ml-0.5">
                          ({selectedUser.seller_reviews || 0} as seller)
                        </span>
                      </div>
                    )}
                    {/* Show buyer rating when partner is a buyer (blue) */}
                    {!selectedUser.isPartnerSeller && selectedUser.buyer_rating !== undefined && (
                      <div className="flex items-center bg-blue-50 px-2 py-0.5 rounded text-xs">
                        <Star size={12} className="text-blue-500" fill="currentColor" />
                        <span className="ml-1 text-gray-700">
                          {selectedUser.buyer_rating > 0 ? selectedUser.buyer_rating.toFixed(1) : 'N/A'}
                        </span>
                        <span className="text-gray-500 ml-0.5">
                          ({selectedUser.buyer_reviews || 0} as buyer)
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedUser.listing_dining_hall && (
                    <span className="text-xs text-nyu-violet bg-purple-50 rounded px-2 py-0.5 inline-block mt-1">
                      {selectedUser.listing_dining_hall} - ${selectedUser.listing_price?.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Transaction actions for sellers */}
                {transaction && (
                  <div className="ml-auto flex gap-2">
                    {transaction.status === 'pending' && (
                      <button
                        onClick={handleFavorite}
                        disabled={actionLoading}
                        className="btn-primary text-sm py-1.5 px-3 flex items-center"
                      >
                        <Heart size={14} className="mr-1" />
                        {actionLoading ? '...' : 'Favorite'}
                      </button>
                    )}
                    {transaction.status === 'confirmed' && (
                      <button
                        onClick={handleUnfavorite}
                        disabled={actionLoading}
                        className="btn-secondary text-sm py-1.5 px-3 flex items-center text-gray-600"
                      >
                        <Heart size={14} className="mr-1" />
                        {actionLoading ? '...' : 'Unfavorite'}
                      </button>
                    )}
                    <button
                      onClick={handleCompleteTrade}
                      disabled={actionLoading}
                      className="text-sm py-1.5 px-3 font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center"
                    >
                      <CheckCircle size={14} className="mr-1" />
                      {actionLoading ? '...' : 'Complete Trade'}
                    </button>
                    <button
                      onClick={() => setRejectConfirm(true)}
                      disabled={actionLoading}
                      className="btn-secondary text-sm py-1.5 px-2 text-red-600 hover:bg-red-50"
                      title="Reject request"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>No messages yet</p>
                    <p className="text-sm">Send a message to start the conversation</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === user.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-nyu-violet text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-800 rounded-bl-none'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-purple-200' : 'text-gray-400'}`}>
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="input-field flex-1"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="btn-primary px-4 disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Request Confirmation Modal */}
      {rejectConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Reject Request?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reject <span className="font-semibold">{selectedUser?.name}</span>'s request? They will be notified that their request was declined.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectRequest}
                disabled={actionLoading}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg flex-1"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages
