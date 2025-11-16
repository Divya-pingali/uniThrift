import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";


export default function Index() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = async () => {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in successfully");
      if (user) router.replace('/signOut');
    } catch (error) {
      console.log(error);
      alert("Error signing in: " + error.message);
    }
  };

  const signUp = async () => {
    try {
      const user = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User signed up successfully");
      if (user) router.replace('/signOut');
    } catch (error) {
      console.log(error);
      alert("Error signing up: " + error.message);
    }
  };

  return (
    <SafeAreaView>
      <Text>Login </Text>
      <TextInput placeholder="email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="password" value={password} onChangeText={setPassword} secureTextEntry  />
      <TouchableOpacity onPress={signIn}>
        <Text>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={signUp}>
        <Text>Sign Up</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
