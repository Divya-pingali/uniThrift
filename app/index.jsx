import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";


export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const theme = useTheme();
  const styles = makeStyles(theme);

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
          Welcome back
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

        <Button mode="contained" onPress={signIn} style={styles.button}>
          Login
        </Button>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don’t have an account?{" "}
          <Text style={styles.link} onPress={signUp}>
            Sign up
          </Text>
        </Text>
      </View>

    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
      backgroundColor: theme.colors.background,
    },

    logoContainer: {
      alignItems: "center",
      marginBottom: 40,
    },

    title: {
      fontWeight: "800",
      textAlign: "center",
      color: theme.colors.onBackground,
    },

    form: {
      width: "100%",
    },

    input: {
      marginBottom: 16,
    },

    button: {
      height: 45,
      justifyContent: "center",
      borderRadius: 16,
    },

    footer: {
      alignItems: "center",
      marginTop: 24,
    },

    footerText: {
      color: theme.colors.onBackground,
    },

    link: {
      textDecorationLine: "underline",
      color: theme.colors.primary,
      fontWeight: "bold",
    },
  });