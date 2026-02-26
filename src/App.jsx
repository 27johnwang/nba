import { useState, useEffect } from 'react'
import './App.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const STORAGE_KEY = 'nyu-mealswipe-data'

function getWeekStart(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function getDefaultState() {
  return {
    totalSwipes: 14,
    usedSwipes: [],
    weekStart: getWeekStart(new Date())
  }
}

function InstallBanner({ onDismiss }) {
  return (
    <div className="install-banner">
      <span>Install this app for quick access from your home screen</span>
      <button onClick={onDismiss} className="dismiss-btn">Got it</button>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState(() => {
    const saved = loadData()
    const currentWeek = getWeekStart(new Date())
    if (saved && saved.weekStart === currentWeek) {
      return saved
    }
    return getDefaultState()
  })

  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    saveData(data)
  }, [data])

  // Reset swipes if the week has changed
  useEffect(() => {
    const currentWeek = getWeekStart(new Date())
    if (data.weekStart !== currentWeek) {
      setData(getDefaultState())
    }
  }, [data.weekStart])

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowInstallBanner(false)
  }

  const today = new Date()
  const todayDay = today.getDay()
  const todayStr = today.toISOString().split('T')[0]
  const remaining = data.totalSwipes - data.usedSwipes.length
  const usedToday = data.usedSwipes.filter((s) => s.date === todayStr).length

  const useSwipe = () => {
    if (remaining <= 0) return
    setData((prev) => ({
      ...prev,
      usedSwipes: [...prev.usedSwipes, { date: todayStr, time: Date.now() }]
    }))
  }

  const undoSwipe = () => {
    setData((prev) => {
      const swipes = [...prev.usedSwipes]
      const lastTodayIdx = swipes.findLastIndex((s) => s.date === todayStr)
      if (lastTodayIdx === -1) return prev
      swipes.splice(lastTodayIdx, 1)
      return { ...prev, usedSwipes: swipes }
    })
  }

  const updateTotal = (newTotal) => {
    const clamped = Math.max(1, Math.min(30, newTotal))
    setData((prev) => ({ ...prev, totalSwipes: clamped }))
  }

  // Build daily usage summary
  const dailyUsage = DAYS.map((label, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - todayDay + i)
    const dateStr = d.toISOString().split('T')[0]
    const count = data.usedSwipes.filter((s) => s.date === dateStr).length
    return { label, count, isToday: i === todayDay, isPast: i < todayDay }
  })

  const progressPct = Math.round((data.usedSwipes.length / data.totalSwipes) * 100)

  return (
    <div className="app">
      {showInstallBanner && (
        <InstallBanner onDismiss={() => {
          handleInstall()
        }} />
      )}

      <header className="header">
        <div className="header-content">
          <h1>NYU Mealswipe</h1>
          <p className="subtitle">Weekly Meal Swipe Tracker</p>
        </div>
      </header>

      <main className="main">
        {/* Remaining swipes card */}
        <section className="card remaining-card">
          <div className="remaining-number">{remaining}</div>
          <div className="remaining-label">swipes remaining</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="progress-text">
            {data.usedSwipes.length} of {data.totalSwipes} used this week
          </div>
        </section>

        {/* Use swipe button */}
        <section className="card action-card">
          <div className="today-info">
            Today ({DAYS[todayDay]}): <strong>{usedToday} swipe{usedToday !== 1 ? 's' : ''}</strong> used
          </div>
          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={useSwipe}
              disabled={remaining <= 0}
            >
              Use a Swipe
            </button>
            <button
              className="btn btn-secondary"
              onClick={undoSwipe}
              disabled={usedToday === 0}
            >
              Undo
            </button>
          </div>
        </section>

        {/* Weekly overview */}
        <section className="card weekly-card">
          <h2>This Week</h2>
          <div className="week-grid">
            {dailyUsage.map(({ label, count, isToday, isPast }) => (
              <div
                key={label}
                className={`day-cell ${isToday ? 'today' : ''} ${isPast && !isToday ? 'past' : ''}`}
              >
                <span className="day-label">{label}</span>
                <span className="day-count">{count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Settings */}
        <section className="card settings-card">
          <h2>Plan Settings</h2>
          <div className="setting-row">
            <label htmlFor="total-swipes">Weekly swipes:</label>
            <div className="stepper">
              <button onClick={() => updateTotal(data.totalSwipes - 1)}>-</button>
              <input
                id="total-swipes"
                type="number"
                value={data.totalSwipes}
                onChange={(e) => updateTotal(parseInt(e.target.value) || 1)}
                min="1"
                max="30"
              />
              <button onClick={() => updateTotal(data.totalSwipes + 1)}>+</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>NYU Mealswipe Tracker &middot; Works offline</p>
      </footer>
    </div>
  )
}
