import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { format } from 'date-fns'
import { Send, ArrowLeft, User, MessageSquare } from 'lucide-react'

const Messages = () => {
  const { userId } = useParams()
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
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

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations')
      setConversations(response.data.conversations)

      // If we have a userId param, find and set that user
      if (userId) {
        const conv = response.data.conversations.find(c => c.partner_id === userId)
        if (conv) {
          setSelectedUser({
            id: conv.partner_id,
            name: conv.partner_name
          })
        } else {
          // Fetch user info if not in conversations
          try {
            const userRes = await api.get(`/auth/me`)
            setSelectedUser({ id: userId, name: 'User' })
          } catch {
            // Ignore
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
      await api.post('/messages', {
        receiver_id: selectedUser.id,
        content: newMessage
      })
      setNewMessage('')
      fetchMessages(selectedUser.id)
      fetchConversations()
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const selectConversation = (conv) => {
    setSelectedUser({
      id: conv.partner_id,
      name: conv.partner_name
    })
    fetchMessages(conv.partner_id)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nyu-violet"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-200px)] min-h-[500px]">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Messages</h1>

      <div className="bg-white rounded-xl shadow-md h-full flex overflow-hidden">
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
                      <p className="text-sm text-gray-500 truncate">
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
                <div className="bg-nyu-violet text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold">
                  {selectedUser.name.charAt(0)}
                </div>
                <span className="ml-3 font-semibold text-gray-800">
                  {selectedUser.name}
                </span>
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
    </div>
  )
}

export default Messages
