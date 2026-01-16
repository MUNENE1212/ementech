import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedLogoProps {
  size?: number;
  autoPlay?: boolean;
  loop?: boolean;
  onAnimationComplete?: () => void;
}

export default function AnimatedLogo({
  size = 400,
  autoPlay = true,
  loop = false,
  onAnimationComplete
}: AnimatedLogoProps) {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (loop && autoPlay) {
      const interval = setInterval(() => {
        setAnimationKey(prev => prev + 1);
      }, 8000); // Restart animation every 8 seconds
      return () => clearInterval(interval);
    }
  }, [loop, autoPlay]);

  // Darker, less bright copper/bronze color
  const copperColor = "#8B6F47"; // Muted copper
  const copperDark = "#6B5437"; // Darker copper
  const circuitBlue = "#0ea5e9"; // Primary cyan
  const circuitBlueBright = "#38bdf8"; // Brighter cyan

  // Animation variants for letters
  const letterVariants = {
    hidden: {
      opacity: 0,
      scale: 0.3,
      rotate: -180
    },
    visible: (custom: number) => ({
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        delay: custom * 0.15,
        duration: 0.8
      }
    })
  };

  // Circuit path animation
  const circuitVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 2 },
        opacity: { duration: 0.3 }
      }
    }
  };

  // Circuit node pulse animation
  const nodeVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: [0, 1.2, 1],
      opacity: [0, 1, 1],
      transition: {
        duration: 0.5
      }
    },
    pulse: {
      scale: [1, 1.3, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity
      }
    }
  };

  // Background gradient
  const bgVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 1 }
    }
  };

  return (
    <div className="flex items-center justify-center">
      <svg
        key={animationKey}
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Gradient for copper E */}
          <linearGradient id="copperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={copperColor} />
            <stop offset="100%" stopColor={copperDark} />
          </linearGradient>

          {/* Gradient for blue T */}
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={circuitBlueBright} />
            <stop offset="100%" stopColor={circuitBlue} />
          </linearGradient>

          {/* Glow filter for circuits */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <motion.rect
          width="512"
          height="512"
          fill="#0f172a"
          initial="hidden"
          animate={autoPlay ? "visible" : "hidden"}
          variants={bgVariants}
        />

        {/* Circuit paths on E (left side) */}
        <g filter="url(#glow)">
          {/* Top horizontal circuit */}
          <motion.path
            d="M 320 370 L 300 370 L 285 355 L 270 355"
            stroke={circuitBlue}
            strokeWidth="2"
            fill="none"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={circuitVariants}
            style={{ pathLength: 0 }}
          />

          {/* Diagonal circuit through E */}
          <motion.path
            d="M 270 355 L 260 345 L 260 330 L 275 315 L 275 300"
            stroke={circuitBlue}
            strokeWidth="2"
            fill="none"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={circuitVariants}
            style={{ pathLength: 0 }}
          />

          {/* Vertical circuit on E left edge */}
          <motion.path
            d="M 275 300 L 275 485 L 285 495"
            stroke={circuitBlue}
            strokeWidth="2"
            fill="none"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={circuitVariants}
            style={{ pathLength: 0 }}
          />

          {/* Bottom horizontal circuit */}
          <motion.path
            d="M 285 495 L 320 495 L 335 510"
            stroke={circuitBlue}
            strokeWidth="2"
            fill="none"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={circuitVariants}
            style={{ pathLength: 0 }}
          />

          {/* Middle connection */}
          <motion.path
            d="M 320 425 L 340 425 L 355 410"
            stroke={circuitBlue}
            strokeWidth="2"
            fill="none"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={circuitVariants}
            style={{ pathLength: 0 }}
          />
        </g>

        {/* Circuit paths on T (right side) */}
        <g filter="url(#glow)">
          {/* Top horizontal circuit across T */}
          <motion.path
            d="M 520 300 L 655 300 L 670 315"
            stroke={circuitBlueBright}
            strokeWidth="2"
            fill="none"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={circuitVariants}
            style={{ pathLength: 0 }}
          />

          {/* Vertical circuit down T stem */}
          <motion.path
            d="M 590 325 L 590 500 L 600 510"
            stroke={circuitBlueBright}
            strokeWidth="2"
            fill="none"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={circuitVariants}
            style={{ pathLength: 0 }}
          />

          {/* Side branch circuit */}
          <motion.path
            d="M 655 370 L 670 370 L 680 380 L 680 395"
            stroke={circuitBlueBright}
            strokeWidth="2"
            fill="none"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={circuitVariants}
            style={{ pathLength: 0 }}
          />

          {/* Connection circuit */}
          <motion.path
            d="M 520 365 L 535 365 L 545 375"
            stroke={circuitBlueBright}
            strokeWidth="2"
            fill="none"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={circuitVariants}
            style={{ pathLength: 0 }}
          />
        </g>

        {/* Circuit nodes/connection points */}
        <g>
          {[
            { x: 270, y: 355 }, { x: 275, y: 300 }, { x: 285, y: 495 },
            { x: 320, y: 425 }, { x: 355, y: 410 }, { x: 670, y: 315 },
            { x: 590, y: 325 }, { x: 680, y: 395 }, { x: 545, y: 375 }
          ].map((node, i) => (
            <motion.circle
              key={i}
              cx={node.x}
              cy={node.y}
              r="4"
              fill={i < 5 ? circuitBlue : circuitBlueBright}
              initial="hidden"
              animate={autoPlay ? ["visible", "pulse"] : "hidden"}
              variants={nodeVariants}
              custom={i}
            />
          ))}
        </g>

        {/* The "E" shape - formed by "EMEN" */}
        <g>
          {/* Top horizontal bar */}
          <motion.rect
            x="290"
            y="325"
            width="215"
            height="50"
            fill="url(#copperGradient)"
            rx="8"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={letterVariants}
            custom={0}
          />

          {/* Middle horizontal bar */}
          <motion.rect
            x="290"
            y="425"
            width="170"
            height="45"
            fill="url(#copperGradient)"
            rx="8"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={letterVariants}
            custom={1}
          />

          {/* Bottom horizontal bar */}
          <motion.rect
            x="290"
            y="520"
            width="195"
            height="48"
            fill="url(#copperGradient)"
            rx="8"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={letterVariants}
            custom={2}
          />

          {/* Vertical bar */}
          <motion.rect
            x="290"
            y="325"
            width="50"
            height="243"
            fill="url(#copperGradient)"
            rx="8"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={letterVariants}
            custom={3}
          />
        </g>

        {/* The "T" shape - formed by "TECHNOLOGIES" */}
        <g>
          {/* Top horizontal bar */}
          <motion.rect
            x="520"
            y="290"
            width="160"
            height="40"
            fill="url(#blueGradient)"
            rx="8"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={letterVariants}
            custom={4}
          />

          {/* Vertical stem */}
          <motion.rect
            x="570"
            y="290"
            width="60"
            height="278"
            fill="url(#blueGradient)"
            rx="8"
            initial="hidden"
            animate={autoPlay ? "visible" : "hidden"}
            variants={letterVariants}
            custom={5}
          />
        </g>

        {/* Text labels that fade in after logo forms */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={autoPlay ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 3, duration: 1 }}
        >
          <text
            x="370"
            y="305"
            fill={copperColor}
            fontSize="24"
            fontWeight="bold"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            EMEN
          </text>
          <text
            x="600"
            y="260"
            fill={circuitBlueBright}
            fontSize="20"
            fontWeight="bold"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            TECH
          </text>
        </motion.g>

        {/* Completion glow effect */}
        <motion.circle
          cx="256"
          cy="256"
          r="350"
          fill="none"
          stroke={circuitBlue}
          strokeWidth="2"
          opacity="0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={autoPlay ? {
            opacity: [0, 0.3, 0],
            scale: [0.8, 1.1, 1.2]
          } : { opacity: 0 }}
          transition={{
            delay: 2.5,
            duration: 1.5
          }}
          onAnimationComplete={onAnimationComplete}
        />
      </svg>
    </div>
  );
}
