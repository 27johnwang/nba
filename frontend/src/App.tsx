import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LinesPage from './pages/LinesPage'
import AnalyzePage from './pages/AnalyzePage'
import TrendsPage from './pages/TrendsPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LinesPage />} />
          <Route path="lines" element={<LinesPage />} />
          <Route path="analyze" element={<AnalyzePage />} />
          <Route path="analyze/:playerId/:gameId/:stat/:line" element={<AnalyzePage />} />
          <Route path="trends" element={<TrendsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
