import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import AppShell from './components/AppShell';

// Pages
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import LoginPage from './pages/LoginPage';
import PlaylistsPage from './pages/PlaylistsPage';
import MoodDetectionPage from './pages/MoodDetectionPage';
import PreferencesPage from './pages/PreferencesPage';
import RecommendationsPage from './pages/RecommendationsPage';
import MusicPlayerPage from './pages/MusicPlayerPage';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppShell>
          <Routes>
            {/* Main Flow */}
            <Route path="/" element={<HomePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/mood-detection" element={<MoodDetectionPage />} />
            <Route path="/preferences" element={<PreferencesPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/player" element={<MusicPlayerPage />} />

            {/* Auth & Features */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
          </Routes>
        </AppShell>
      </Router>
    </Provider>
  );
}

export default App;
