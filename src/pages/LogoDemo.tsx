import { useState } from 'react';
import AnimatedLogo from '../components/ui/AnimatedLogo';
import { motion } from 'framer-motion';

export default function LogoDemo() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [logoSize, setLogoSize] = useState(400);

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Emen Technologies Animated Logo
          </h1>
          <p className="text-dark-400 text-lg">
            Watch as "EMEN" and "TECHNOLOGIES" come together with circuit animations
          </p>
        </motion.div>

        {/* Logo Display */}
        <div className="flex justify-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-dark-900 rounded-2xl p-8 shadow-2xl"
          >
            <AnimatedLogo
              size={logoSize}
              autoPlay={isPlaying}
              loop={loopEnabled}
              onAnimationComplete={() => console.log('Animation completed!')}
            />
          </motion.div>
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto bg-dark-900 rounded-xl p-6 space-y-6"
        >
          <h2 className="text-2xl font-bold mb-4">Controls</h2>

          {/* Play/Pause */}
          <div className="flex items-center justify-between">
            <span className="text-dark-300">Animation</span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>

          {/* Loop */}
          <div className="flex items-center justify-between">
            <span className="text-dark-300">Loop Animation</span>
            <button
              onClick={() => setLoopEnabled(!loopEnabled)}
              className={`px-6 py-2 rounded-lg transition-colors ${
                loopEnabled
                  ? 'bg-accent-500 hover:bg-accent-600'
                  : 'bg-dark-700 hover:bg-dark-600'
              }`}
            >
              {loopEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Size Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-dark-300">Logo Size</span>
              <span className="text-primary-400">{logoSize}px</span>
            </div>
            <input
              type="range"
              min="200"
              max="600"
              value={logoSize}
              onChange={(e) => setLogoSize(Number(e.target.value))}
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Restart Button */}
          <div className="pt-4">
            <button
              onClick={() => {
                setIsPlaying(false);
                setTimeout(() => setIsPlaying(true), 50);
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 rounded-lg transition-all transform hover:scale-105"
            >
              Restart Animation
            </button>
          </div>
        </motion.div>

        {/* Animation Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="max-w-3xl mx-auto mt-12 bg-dark-900 rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold mb-6">Animation Concept & Meaning</h2>

          <div className="space-y-4 text-dark-300">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">The Formation</h3>
              <p>
                The letters "EMEN" materialize to form the iconic "E" shape, representing
                the foundation and core identity of Emen Technologies. Simultaneously,
                "TECHNOLOGIES" (represented as "TECH") forms the "T" shape, symbolizing
                the technical expertise and innovation.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Circuit Completion</h3>
              <p>
                As the logo forms, circuit paths draw themselves across the design,
                representing the flow of ideas, data, and innovation. The circuits
                connect at various nodes, symbolizing:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Connectivity and integration</li>
                <li>Complete solutions (completed circuits)</li>
                <li>Energy and power flowing through the system</li>
                <li>The bridge between hardware and software</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Color Symbolism</h3>
              <p>
                <strong className="text-amber-700">Muted Copper (E):</strong> Represents
                durability, conductivity, and the physical/hardware aspect of technology.
                The darker, less bright copper conveys professionalism and sophistication.
              </p>
              <p className="mt-2">
                <strong className="text-cyan-400">Cyan Blue (T):</strong> Symbolizes
                innovation, clarity, and the digital realm. The bright cyan represents
                cutting-edge software and modern solutions.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-2">The Final Pulse</h3>
              <p>
                The animation concludes with a gentle pulse effect, signifying the
                activation and "powering on" of the complete system - representing how
                Emen Technologies brings ideas to life.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12"
        >
          <a
            href="/"
            className="inline-block px-8 py-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
          >
            ← Back to Home
          </a>
        </motion.div>
      </div>
    </div>
  );
}
