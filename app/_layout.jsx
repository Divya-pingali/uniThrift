import { Stack, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { PaperProvider } from "react-native-paper";
import { auth } from "../firebaseConfig";


export default function RootLayout() {
  const router = useRouter();
  const [user, setUser] = useState(null);

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
    <PaperProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
