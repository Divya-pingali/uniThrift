import { useLocalSearchParams } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";

export default function SignUp() {
    const params = useLocalSearchParams();
    const [email, setEmail] = useState(params.email || "");
    const [password, setPassword] = useState(params.password || "");
    const [name, setName] = useState("");

    const signUp = async () => {
        try {
        const user = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User created successfully");
        } catch (error) {
        console.log(error);
        alert("Error signing up: " + error.message);
        }
    };

    return (
        <SafeAreaView style = {styles.container}>
            <View style={styles.logoContainer}>
                <Text variant="headlineMedium" style={styles.title}>
                    Sign Up
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
                <TextInput
                    mode="outlined"
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                />
        </View>
        <Button mode="contained" onPress={signUp} style={styles.button}>
            Create Account
        </Button>
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
