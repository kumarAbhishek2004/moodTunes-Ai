const StepCards = ({ currentSection, onSectionChange }) => {
  const steps = [
    {
      number: 1,
      title: "Detect Mood",
      description: "Analyze your emotions through facial recognition or manual selection",
      icon: "😊",
      gradient: "from-yellow-400 to-orange-500",
      shadow: "shadow-orange-500/50"
    },
    {
      number: 2,
      title: "Set Preferences",
      description: "Choose language, genre, and add your favorite songs & artists",
      icon: "⚙️",
      gradient: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/50"
    },
    {
      number: 3,
      title: "Get Recommendations", 
      description: "AI curates perfect playlists based on your mood and preferences",
      icon: "🎵",
      gradient: "from-purple-500 to-pink-500",
      shadow: "shadow-purple-500/50"
    },
    {
      number: 4,
      title: "Enjoy Music",
      description: "Stream songs seamlessly with our integrated player",
      icon: "▶️",
      gradient: "from-green-400 to-emerald-500",
      shadow: "shadow-green-500/50"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
      {steps.map((step, index) => (
        <div
          key={step.number}
          onClick={() => onSectionChange(step.number)}
          className={`
            relative overflow-hidden rounded-3xl p-6 cursor-pointer
            bg-white/5 backdrop-blur-lg border border-white/10
            transition-all duration-500 hover:scale-105 hover:-translate-y-3
            ${currentSection === step.number ? 'bg-purple-500/20 border-purple-500 shadow-2xl ' + step.shadow : ''}
          `}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} rounded-2xl blur-xl opacity-50`}></div>
              <div className={`relative w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center shadow-2xl text-2xl`}>
                {step.icon}
              </div>
            </div>
            <span className="text-5xl font-black text-white opacity-5">0{step.number}</span>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">{step.description}</p>
          
          <div className="flex items-center text-purple-400 text-sm font-semibold group">
            <span>{currentSection === step.number ? 'Current Step' : 'Go to Step'}</span>
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StepCards
