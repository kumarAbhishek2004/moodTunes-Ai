import { useEffect } from 'react'

const Particles = () => {
  useEffect(() => {
    // Initialize particles using tsParticles CDN
    if (window.tsParticles) {
      window.tsParticles.load("tsparticles", {
        preset: "stars",
        background: {
          opacity: 0
        },
        particles: {
          number: {
            value: 100,
            density: {
              enable: true,
              value_area: 800
            }
          },
          color: {
            value: ["#667eea", "#764ba2", "#f093fb"]
          },
          shape: {
            type: "circle"
          },
          opacity: {
            value: 0.6,
            random: true,
            anim: {
              enable: true,
              speed: 1,
              opacity_min: 0.1,
              sync: false
            }
          },
          size: {
            value: 3,
            random: true,
            anim: {
              enable: true,
              speed: 2,
              size_min: 0.1,
              sync: false
            }
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: "#667eea",
            opacity: 0.2,
            width: 1
          },
          move: {
            enable: true,
            speed: 1,
            direction: "none",
            random: true,
            straight: false,
            out_mode: "out",
            bounce: false
          }
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: {
              enable: true,
              mode: "grab"
            },
            onclick: {
              enable: true,
              mode: "push"
            },
            resize: true
          },
          modes: {
            grab: {
              distance: 140,
              line_linked: {
                opacity: 0.5
              }
            },
            push: {
              particles_nb: 4
            }
          }
        }
      })
    }
  }, [])

  return <div id="tsparticles" className="fixed w-full h-full z-0"></div>
}

export default Particles
