import crypto from 'crypto';

// 计算确定性 seed
const projectName = "EsotericVote";
const network = "sepolia";
const yearMonth = "202501";
const contractName = "VotingContract.sol";
const seedString = `${projectName}${network}${yearMonth}${contractName}`;
const seed = crypto.createHash('sha256').update(seedString).digest('hex');

// 根据 seed 选择设计维度（示例）
const seedNum = parseInt(seed.substring(0, 8), 16);
const designSystem = ['Material', 'Fluent', 'Neumorphism', 'Glassmorphism', 'Minimal'][seedNum % 5];
const colorScheme = seedNum % 8; // 0-7 对应 A-H

export const designTokens = {
  system: designSystem,
  seed: seed,

  colors: {
    primary: '#9333EA',    // Purple (E组)
    secondary: '#7C3AED',  // Deep Purple
    accent: '#6366F1',     // Indigo
    background: '#FFFFFF',
    surface: '#F8FAFC',
    foreground: '#0F172A',
    muted: '#64748B',
    'muted-foreground': '#64748B',
    destructive: '#EF4444',
    'destructive-foreground': '#FFFFFF',
    border: '#E2E8F0',
    input: '#E2E8F0',
    ring: '#9333EA',
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Georgia', 'serif'],
    },
    scale: 1.2, // Serif 风格
    sizes: {
      xs: '0.694rem',    // 11px
      sm: '0.833rem',    // 13px
      base: '1rem',      // 16px
      lg: '1.2rem',      // 19px
      xl: '1.44rem',     // 23px
      '2xl': '1.728rem', // 28px
      '3xl': '2.074rem', // 33px
    },
  },

  spacing: {
    unit: 8, // 基础间距单位 8px
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },

  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.15)',
  },

  transitions: {
    duration: 200,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  layout: 'sidebar', // 'sidebar' | 'masonry' | 'tabs' | 'grid' | 'wizard'

  density: {
    compact: {
      padding: { sm: '4px 8px', md: '8px 16px', lg: '12px 24px' },
      gap: '8px',
    },
    comfortable: {
      padding: { sm: '8px 16px', md: '16px 24px', lg: '20px 32px' },
      gap: '16px',
    },
  },
};
