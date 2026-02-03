import axios from 'axios'
import type {
  LinesResponse,
  AnalysisResponse,
  TrendsResponse,
  ProfileHistoryResponse,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Lines API
export const linesApi = {
  getLines: async (params?: {
    date?: string
    book?: string
    market?: string
    team?: string
  }): Promise<LinesResponse> => {
    const { data } = await api.get('/lines', { params })
    return data
  },

  getGameProps: async (gameId: string) => {
    const { data } = await api.get(`/lines/game/${gameId}/props`)
    return data
  },
}

// Analysis API
export const analyzeApi = {
  analyze: async (request: {
    player_id: number
    game_id: string
    stat: string
    line: number
    side: string
  }): Promise<AnalysisResponse> => {
    const { data } = await api.post('/analyze', request)
    return data
  },
}

// Player API
export const playerApi = {
  getPlayer: async (playerId: number) => {
    const { data } = await api.get(`/player/${playerId}`)
    return data
  },

  getSplits: async (
    playerId: number,
    params: {
      stat: string
      window?: number
      opponent?: string
      home_away?: string
    }
  ) => {
    const { data } = await api.get(`/player/${playerId}/splits`, { params })
    return data
  },
}

// Trends API
export const trendsApi = {
  getTrends: async (params?: {
    type?: string
    stat?: string
    limit?: number
  }): Promise<TrendsResponse> => {
    const { data } = await api.get('/trends', { params })
    return data
  },

  getPlayerTrends: async (playerId: number) => {
    const { data } = await api.get(`/trends/player/${playerId}`)
    return data
  },
}

// Profile API
export const profileApi = {
  getHistory: async (params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<ProfileHistoryResponse> => {
    const { data } = await api.get('/profile/history', { params })
    return data
  },

  trackBet: async (request: {
    game_id: string
    player_id?: number
    market_type: string
    prop_type?: string
    line_value: number
    bet_side: string
    odds: number
  }) => {
    const { data } = await api.post('/profile/tracked-bets', request)
    return data
  },

  deleteBet: async (betId: number) => {
    const { data } = await api.delete(`/profile/tracked-bets/${betId}`)
    return data
  },

  getFavorites: async () => {
    const { data } = await api.get('/profile/favorites')
    return data
  },

  manageFavorite: async (request: {
    action: 'add' | 'remove'
    entity_type: string
    entity_id: string
  }) => {
    const { data } = await api.post('/profile/favorites', request)
    return data
  },

  getSettings: async () => {
    const { data } = await api.get('/profile/settings')
    return data
  },

  updateSettings: async (settings: {
    preferred_books?: string[]
    odds_format?: string
  }) => {
    const { data } = await api.patch('/profile/settings', settings)
    return data
  },
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    return data
  },

  register: async (email: string, password: string) => {
    const { data } = await api.post('/auth/register', { email, password })
    return data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  },
}

export default api
