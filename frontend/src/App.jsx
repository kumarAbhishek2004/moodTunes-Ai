import { useState } from 'react'
import Particles from './components/Particles'
import Header from './components/Header'
import Hero from './components/Hero'
import StepCards from './components/StepCards'
import MoodDetection from './components/MoodDetection'
import PreferenceSelection from './components/PreferenceSelection'
import Recommendations from './components/Recommendations'
import MusicPlayer from './components/MusicPlayer'
import Chatbot from './components/Chatbot'

function App() {
  const [currentSection, setCurrentSection] = useState(1)
  const [detectedMood, setDetectedMood] = useState(null)
  const [userPreferences, setUserPreferences] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [currentSong, setCurrentSong] = useState(null)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  const handleMoodDetected = (mood) => {
    setDetectedMood(mood)
    setCurrentSection(2)
  }

  const handlePreferencesSet = (preferences) => {
    setUserPreferences(preferences)
    setCurrentSection(3)
  }

  const handleRecommendations = (songs) => {
    setRecommendations(songs)
    setCurrentSection(4)
    if (songs.length > 0) {
      setCurrentSong(songs[0])
    }
  }

  const handlePlaySong = (song) => {
    setCurrentSong(song)
    
    if (currentSection !== 4 && song) {
      setCurrentSection(4)
      
      if (!recommendations.find(s => s.id === song.id)) {
        setRecommendations(prev => [song, ...prev])
      }
    }
  }

  return (
    <div className="min-h-screen">
      <Particles />
      
      <div className="relative z-10">
        <Header onPlaySong={handlePlaySong} />
        
        <div className="container mx-auto px-6 py-12">
          <Hero />
          
          <StepCards 
            currentSection={currentSection}
            onSectionChange={setCurrentSection}
          />

          {currentSection === 1 && (
            <MoodDetection onMoodDetected={handleMoodDetected} />
          )}

          {currentSection === 2 && (
            <PreferenceSelection
              mood={detectedMood}
              onPreferencesSet={handlePreferencesSet}
            />
          )}

          {currentSection === 3 && (
            <Recommendations
              mood={detectedMood}
              preferences={userPreferences}
              onRecommendations={handleRecommendations}
            />
          )}

          {currentSection === 4 && (
            <MusicPlayer
              currentSong={currentSong}
              queue={recommendations}
              onPlaySong={handlePlaySong}
            />
          )}
        </div>
      </div>

      <Chatbot
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
        currentMood={detectedMood}
        onPlaySong={handlePlaySong}
      />
    </div>
  )
}

export default App
