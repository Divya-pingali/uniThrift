import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { PaperProvider, useTheme } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";
import { darkTheme, lightTheme } from "../theme";

function AppContent() {
  const theme = useTheme();
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
        <StatusBar style={theme.dark ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaView>
    </StripeProvider>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);

      if (user) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/");
      }
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AppContent />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
