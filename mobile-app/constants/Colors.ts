const hero = '#FF004F';
const black = '#1d1e21';
const white = '#FFFFFF';

export const DarkTheme = {
  primary: hero,
  primaryDark: hero,
  primaryLight: hero,
  secondary: hero,
  accent: hero,
  background: black,
  surface: '#27282c',
  surfaceAlt: '#2f3035',
  text: white,
  textSecondary: 'rgba(255,255,255,0.6)',
  textLight: 'rgba(255,255,255,0.35)',
  border: 'rgba(255,255,255,0.1)',
  error: hero,
  success: hero,
  warning: hero,
  white: white,
  black: black,
  overlay: 'rgba(0,0,0,0.7)',
  cardShadow: 'rgba(0,0,0,0.4)',
  nowPlaying: hero,
  upcoming: hero,
  free: hero,
  paid: hero,
};

export type ThemeColors = typeof DarkTheme;

export const LightTheme: ThemeColors = {
  primary: hero,
  primaryDark: hero,
  primaryLight: hero,
  secondary: hero,
  accent: hero,
  background: white,
  surface: '#F4F4F5',
  surfaceAlt: '#EAEAEB',
  text: black,
  textSecondary: 'rgba(29,30,33,0.6)',
  textLight: 'rgba(29,30,33,0.35)',
  border: 'rgba(29,30,33,0.1)',
  error: hero,
  success: hero,
  warning: hero,
  white: white,
  black: black,
  overlay: 'rgba(0,0,0,0.5)',
  cardShadow: 'rgba(0,0,0,0.08)',
  nowPlaying: hero,
  upcoming: hero,
  free: hero,
  paid: hero,
};

const Colors = DarkTheme;
export default Colors;
