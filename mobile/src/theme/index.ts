import { MD3LightTheme as DefaultTheme, configureFonts } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#D4AF37', // Gold
    secondary: '#1A1A1A', // Black
    background: '#FFFDF5', // Cream
    surface: '#FFFFFF',
    error: '#B00020',
    text: '#1A1A1A',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    outline: '#E0E0E0',
  },
  // We can customize fonts here later if needed
};
