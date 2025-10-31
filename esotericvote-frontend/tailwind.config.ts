import { designTokens } from './design-tokens';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: designTokens.colors,
      fontFamily: designTokens.typography.fontFamily,
      fontSize: designTokens.typography.sizes,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.shadows,
      transitionDuration: {
        DEFAULT: `${designTokens.transitions.duration}ms`,
      },
      spacing: {
        unit: `${designTokens.spacing.unit}px`,
      },
    },
  },
  plugins: [],
};

export default config;
