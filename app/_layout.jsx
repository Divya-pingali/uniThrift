import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";

export default function RootLayout() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  console.log("Stripe PK >>>", process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY);

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
      <PaperProvider>
        <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </SafeAreaView>
        </StripeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
