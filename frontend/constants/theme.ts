// Theme constants for the job swipe app

export const Colors = {
  light: {
    // Primary colors
    primary: '#0A66C2', // LinkedIn blue
    primaryLight: '#E8F4FD',
    secondary: '#00A0DC',

    // Background colors
    background: '#F3F2EE',
    cardBackground: '#FFFFFF',
    surface: '#FFFFFF',

    // Text colors
    text: '#191919',
    textSecondary: '#666666',
    textMuted: '#999999',
    textInverse: '#FFFFFF',

    // Action colors
    success: '#057642',
    successLight: '#E5F3ED',
    error: '#CC1016',
    errorLight: '#FCEAEA',
    warning: '#F5A623',
    warningLight: '#FEF6E5',

    // Swipe indicators
    swipeLeft: '#FF6B6B',
    swipeRight: '#4ECDC4',
    swipeUp: '#A855F7', // Save for later

    // Border and dividers
    border: '#E0E0E0',
    divider: '#EBEBEB',

    // Shadows
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowStrong: 'rgba(0, 0, 0, 0.2)',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    // Primary colors
    primary: '#70B5F9',
    primaryLight: '#1D3A5C',
    secondary: '#00A0DC',

    // Background colors
    background: '#1B1F23',
    cardBackground: '#2D333B',
    surface: '#22272E',

    // Text colors
    text: '#FFFFFF',
    textSecondary: '#ADBAC7',
    textMuted: '#768390',
    textInverse: '#1B1F23',

    // Action colors
    success: '#3FB950',
    successLight: '#1D3A29',
    error: '#F85149',
    errorLight: '#3D1A1A',
    warning: '#D29922',
    warningLight: '#3D2E12',

    // Swipe indicators
    swipeLeft: '#FF6B6B',
    swipeRight: '#4ECDC4',
    swipeUp: '#A855F7',

    // Border and dividers
    border: '#444C56',
    divider: '#373E47',

    // Shadows
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowStrong: 'rgba(0, 0, 0, 0.5)',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  title: 28,
  hero: 32,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const CardDimensions = {
  width: '92%' as const,
  maxWidth: 380,
  height: 520,
  expandedHeight: '90%' as const,
};

export const SwipeConfig = {
  velocityThreshold: 500,
  directionalOffsetThreshold: 80,
  swipeThreshold: 120,
  rotationMultiplier: 0.03,
};

export default {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  CardDimensions,
  SwipeConfig,
};