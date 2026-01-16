import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  animated?: boolean;
  showText?: boolean;
}

export default function Logo({ size = 40, animated = true, showText = true }: LogoProps) {
  // Darker, less bright copper/bronze color
  const copperColor = "#8B6F47";
  const copperDark = "#6B5437";
  const circuitBlue = "#0ea5e9";
  const circuitBlueBright = "#38bdf8";

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const Component = animated ? motion.svg : 'svg';
  const animationProps = animated ? {
    initial: "hidden",
    animate: "visible",
    variants: logoVariants,
    whileHover: { scale: 1.05 }
  } : {};

  return (
    <div className="flex items-center gap-3">
      <Component
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...animationProps}
      >
        <defs>
          <linearGradient id="copperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={copperColor} />
            <stop offset="100%" stopColor={copperDark} />
          </linearGradient>
          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={circuitBlueBright} />
            <stop offset="100%" stopColor={circuitBlue} />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width="100" height="100" fill="#0f172a" rx="12"/>

        {/* Simplified circuit lines */}
        <path
          d="M 25 35 L 30 35 M 25 50 L 28 50 M 25 65 L 32 65"
          stroke={circuitBlue}
          strokeWidth="1"
          opacity="0.6"
        />
        <path
          d="M 70 30 L 75 30 M 70 70 L 75 70"
          stroke={circuitBlueBright}
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Small circuit nodes */}
        <circle cx="30" cy="35" r="1.5" fill={circuitBlue} opacity="0.8"/>
        <circle cx="32" cy="65" r="1.5" fill={circuitBlue} opacity="0.8"/>
        <circle cx="75" cy="30" r="1.5" fill={circuitBlueBright} opacity="0.8"/>

        {/* E shape (simplified) */}
        <g>
          {/* Top bar */}
          <rect x="25" y="30" width="30" height="6" fill="url(#copperGrad)" rx="2"/>
          {/* Middle bar */}
          <rect x="25" y="47" width="24" height="6" fill="url(#copperGrad)" rx="2"/>
          {/* Bottom bar */}
          <rect x="25" y="64" width="28" height="6" fill="url(#copperGrad)" rx="2"/>
          {/* Vertical bar */}
          <rect x="25" y="30" width="6" height="40" fill="url(#copperGrad)" rx="2"/>
        </g>

        {/* T shape (simplified) */}
        <g>
          {/* Top bar */}
          <rect x="60" y="28" width="22" height="5" fill="url(#blueGrad)" rx="2"/>
          {/* Vertical stem */}
          <rect x="66" y="28" width="8" height="42" fill="url(#blueGrad)" rx="2"/>
        </g>
      </Component>

      {showText && (
        <motion.div
          initial={animated ? { opacity: 0, x: -10 } : {}}
          animate={animated ? { opacity: 1, x: 0 } : {}}
          transition={animated ? { delay: 0.2 } : {}}
          className="flex flex-col"
        >
          <span className="text-white font-bold text-lg leading-none">Ementech</span>
          <span className="text-dark-400 text-xs leading-none">Technologies</span>
        </motion.div>
      )}
    </div>
  );
}
