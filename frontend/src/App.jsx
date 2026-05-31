import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/store'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PlaylistsPage from './pages/PlaylistsPage'
import MoodDetectionPage from './pages/MoodDetectionPage'
import PreferencesPage from './pages/PreferencesPage'
import RecommendationsPage from './pages/RecommendationsPage'
import MusicPlayerPage from './pages/MusicPlayerPage'

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Main Flow */}
          <Route path="/" element={<HomePage />} />
          <Route path="/mood-detection" element={<MoodDetectionPage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/player" element={<MusicPlayerPage />} />
          
          {/* Auth & Features */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
        </Routes>
      </Router>
    </Provider>
  )
}

export default App
