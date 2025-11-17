import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";


export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = async () => {
      try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in successfully");
      } catch (error) {
      console.log(error);
      alert("Error signing in: " + error.message);
      }
  };

  const signUp = () => {
    router.push({
      pathname: "/signUp",
      params: {
        email,
        password,
      },
    });
  };


  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.logoContainer}>
        <Text variant="headlineMedium" style={styles.title}>
          Welcome back.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          mode="outlined"
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          mode="outlined"
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Text style={styles.forgot}>Forgot your password?</Text>

        <Button mode="contained" onPress={signIn} style={styles.button}>
          Login
        </Button>
      </View>

      <View style={styles.footer}>
        <Text>
          Don’t have an account?{" "}
          <Text style={styles.link} onPress={signUp}>
            Sign up
          </Text>
        </Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },

  title: {
    fontWeight: "600",
    textAlign: "center",
  },

  form: {
    width: "100%",
  },

  input: {
    marginBottom: 16,
  },

  forgot: {
    textAlign: "right",
    marginBottom: 24,
  },

  button: {
    paddingVertical: 4,
    borderRadius: 6,
  },

  footer: {
    alignItems: "center",
    marginTop: 24,
  },

  link: {
    textDecorationLine: "underline",
  },
});