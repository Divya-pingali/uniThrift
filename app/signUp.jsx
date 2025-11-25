import { useLocalSearchParams, useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Snackbar, Text, TextInput } from "react-native-paper";
import { auth, db } from "../firebaseConfig";

export default function SignUp() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const imagePathRef = useRef(`users/${Date.now()}.jpg`);
  const [userData, setUserData] = useState({
    email: params.email || "",
    password: params.password || "",
    name: "",
    bio: "",
    phone: "",
  });
  const [emailError, setEmailError] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const showDialog = (title, message) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogVisible(true);
  };
  const hideDialog = () => setDialogVisible(false);

  const validateEmail = (email) => {
    const atIndex = email.indexOf("@");
    if (atIndex !== -1) {
      const domain = email.slice(atIndex + 1);
      const requiredDomain = "connect.hku.hk";
      // Show error if domain is present and doesn't match the required domain start
      if (
        domain.length > 0 &&
        !requiredDomain.startsWith(domain)
      ) {
        setEmailError("Email must end with @connect.hku.hk");
        return false;
      }
      // Show error if full domain is present and doesn't match exactly
      if (
        domain.length >= requiredDomain.length &&
        domain !== requiredDomain
      ) {
        setEmailError("Email must end with @connect.hku.hk");
        return false;
      }
    }
    setEmailError("");
    return true;
  };

  const signUp = async () => {
    const missingFields = [];
    if (!userData.email) missingFields.push('Email');
    if (!userData.password) missingFields.push('Password');
    if (!userData.name) missingFields.push('Name');

    // Final email validation before submit
    const atIndex = userData.email.indexOf("@");
    const validEmail =
      atIndex !== -1 &&
      userData.email.endsWith("@connect.hku.hk");

    if (!validEmail) {
      showDialog('Invalid Email', 'Email must end with @connect.hku.hk');
      return;
    }

    if (missingFields.length > 0) {
      showDialog('Missing Information', `Please fill out the following fields: ${missingFields.join(', ')}`);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        name: userData.name,
        email: userData.email,
        bio: userData.bio,
        phone: userData.phone,
        image: null,
      });
      setSuccessMessage('Account created successfully!');
      setSuccessVisible(true);
      setUserData({
        email: "",
        password: "",
        name: "",
        bio: "",
        phone: "",
        image: null
      });
    } catch (error) {
      console.log(error);
      showDialog('Error', 'There was an error creating your account.');
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Text variant="headlineMedium" style={styles.header}>
              Create Account
            </Text>
            <Text variant="bodyMedium" style={styles.componentDescription}>
              Please fill out your details to sign up.
            </Text>
          </View>
          <View style={styles.form}>
            <Text variant="titleMedium" style={styles.label}>Email</Text>
            <TextInput
              mode="outlined"
              label="Email"
              value={userData.email}
              onChangeText={text => {
                setUserData(prev => ({ ...prev, email: text }));
                validateEmail(text);
              }}
              style={styles.input}
              error={!!emailError}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
            <Text variant="titleMedium" style={styles.label}>Password</Text>
            <TextInput
              mode="outlined"
              label="Password"
              value={userData.password}
              onChangeText={text => setUserData(prev => ({ ...prev, password: text }))}
              secureTextEntry
              style={styles.input}
            />
            <Text variant="titleMedium" style={styles.label}>Name</Text>
            <TextInput
              mode="outlined"
              label="Name"
              value={userData.name}
              onChangeText={text => setUserData(prev => ({ ...prev, name: text }))}
              style={styles.input}
            />
            <Text variant="titleMedium" style={styles.label}>Bio</Text>
            <TextInput
              mode="outlined"
              label="Bio"
              value={userData.bio}
              onChangeText={text => setUserData(prev => ({ ...prev, bio: text }))}
              style={[styles.input, { minHeight: 100 }]}
              multiline
            />
            <Text variant="titleMedium" style={styles.label}>Phone Number</Text>
            <TextInput
              mode="outlined"
              label="Phone Number"
              value={userData.phone}
              onChangeText={text => {
                // Only allow numbers
                if (/^\d*$/.test(text)) {
                  setUserData(prev => ({ ...prev, phone: text }));
                }
              }}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={15}
            />
          </View>
        </ScrollView>
        <Button 
            mode="contained" 
            onPress={signUp} 
            style={styles.button}
            disabled={!!emailError}
          >
            Create Account
          </Button>
        <Portal>
          <Dialog visible={dialogVisible} onDismiss={hideDialog}>
            <Dialog.Title variant="bodyLarge" style={styles.header}>{dialogTitle}</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={styles.componentDescription}>{dialogMessage}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideDialog} style={{ margin: 16, fontSize: 20 }}>OK</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <Snackbar
          visible={successVisible}
          onDismiss={() => setSuccessVisible(false)}
          duration={2500}
          style={{ backgroundColor: '#2e7d32' }}
        >
          {successMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 0,
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  header: {
    marginBottom: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  componentDescription: {
    marginBottom: 20,
    color: '#49454F',
    textAlign: 'center',
  },
  form: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    marginBottom: 24,
  },
  button: {
    margin: 8,
    width: "45%",
    alignSelf: 'flex-end',
    borderRadius: 4,
    height: 45,
    justifyContent: 'center',
  },
  label: {
    marginBottom: 4,
    fontWeight: '500',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    height: 180,
  },
  errorText: {
    color: '#B00020',
    marginBottom: 12,
    marginLeft: 4,
    fontSize: 14,
  },
});
