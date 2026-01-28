import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { JobProvider } from '../context/JobContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AppModeProvider } from '../context/AppModeContext';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Custom theme based on LinkedIn colors
const JobbieLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0A66C2',
    background: '#F3F2EE',
    card: '#FFFFFF',
    text: '#191919',
    border: '#E0E0E0',
    notification: '#CC1016',
  },
};

const JobbieDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#70B5F9',
    background: '#1B1F23',
    card: '#2D333B',
    text: '#FFFFFF',
    border: '#444C56',
    notification: '#F85149',
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, isLoading });
    if (isLoading) return; // Wait until auth state is loaded

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  useEffect(() => {
    // Hide splash screen after the app is ready
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <JobProvider>
      <AppModeProvider>
        <ThemeProvider value={colorScheme === 'dark' ? JobbieDark : JobbieLight}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </AppModeProvider>
    </JobProvider>
  );
}