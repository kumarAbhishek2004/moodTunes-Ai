const Hero = () => {
  return (
    <div className="text-center mb-16 animate-fadeIn">
      <h2 className="text-6xl font-black text-white mb-6 leading-tight">
        Let Your <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Emotions</span><br/>
        Guide Your <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Playlist</span>
      </h2>
      <p className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto">
        AI-powered music recommendations that perfectly match your mood in three simple steps
      </p>
      
      {/* Music Wave Indicator */}
      <div className="flex justify-center items-end space-x-2 mb-12">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-wave"
            style={{
              animationDelay: `${i * 0.1}s`
            }}
          ></div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes wave {
          0%, 100% { height: 15px; }
          50% { height: 35px; }
        }
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Hero
