import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text, TextInput, useTheme } from "react-native-paper";
import BackButton from "../components/BackButton"; // Make sure this import exists
import EditableImage from "../components/EditableImage";
import AppSnackbar from "../components/Snackbar";
import { auth, db, firebaseStorage } from "../firebaseConfig";

export default function EditProfile() {
  const theme = useTheme();
  const styles = getStyles(theme);

  const [userData, setUserData] = useState({
    email: "",
    name: "",
    bio: "",
    phone: "",
    image: null,
  });
  const router = useRouter();
  const imagePathRef = useRef(`users/${Date.now()}.jpg`);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData({
            email: userDoc.data().email || "",
            name: userDoc.data().name || "",
            bio: userDoc.data().bio || "",
            phone: userDoc.data().phone || "",
            image: userDoc.data().image || null,
          });
        }
      } catch (error) {
        setDialogTitle("Error");
        setDialogMessage("Failed to fetch user data.");
        setDialogVisible(true);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const showDialog = (title, message) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogVisible(true);
  };
  const hideDialog = () => setDialogVisible(false);

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      let imageUrl = userData.image;
      if (userData.image && (userData.image.startsWith('file://') || userData.image.startsWith('data:'))) {
        const response = await fetch(userData.image);
        const blob = await response.blob();
        const storageRef = ref(firebaseStorage, imagePathRef.current);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }
      await updateDoc(doc(db, "users", user.uid), {
        name: userData.name,
        bio: userData.bio,
        phone: userData.phone,
        image: imageUrl || null,
      });
      setSuccessMessage("Profile updated successfully!");
      setSuccessVisible(true);
      setUserData(prev => ({ ...prev, image: imageUrl }));
      setTimeout(() => {
        router.replace('/profile');
      }, 250);
    } catch (error) {
      showDialog("Error", "Failed to update profile.");
    }
  };

  return (
    <>
      <View style={{ backgroundColor: theme.colors.background }}>
        <BackButton fallback="/profile" />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text variant="headlineMedium" style={styles.header}>
              Edit Profile
            </Text>
            <Text variant="titleMedium" style={styles.subHeader}>
              Update your details below
            </Text>
          </View>
          <View style={styles.form}>
            <Text variant="titleMedium" style={styles.label}>Profile Picture</Text>
            <View style={styles.imageContainer}>
              <EditableImage
                imageUri={userData.image}
                setImageUri={(uri) => setUserData(prev => ({ ...prev, image: uri }))}
                imagePath={imagePathRef.current}
                editable={true}
                style={styles.imageContainer}
              />
            </View>
            <Text variant="titleMedium" style={styles.label}>Email</Text>
            <View style={styles.emailContainer}>
              <Text style={styles.emailText}>{userData.email}</Text>
            </View>
            <Text variant="titleMedium" style={styles.label}>Name</Text>
            <TextInput
              mode="outlined"
              placeholder="Name"
              value={userData.name}
              onChangeText={text => setUserData(prev => ({ ...prev, name: text }))}
              style={styles.input}
            />
            <Text variant="titleMedium" style={styles.label}>Bio</Text>
            <TextInput
              mode="outlined"
              placeholder="Bio"
              value={userData.bio}
              onChangeText={text => setUserData(prev => ({ ...prev, bio: text }))}
              style={[styles.input, { minHeight: 80 }]}
              multiline
            />
            <Text variant="titleMedium" style={styles.label}>Phone Number</Text>
            <TextInput
              mode="outlined"
              placeholder="Phone Number"
              value={userData.phone}
              onChangeText={text => {
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
      </KeyboardAvoidingView>
      <View style={styles.bottomContainer}>
        <AppSnackbar
          visible={successVisible}
          onDismiss={() => setSuccessVisible(false)}
          message={successMessage}
          type="success"
          duration={2500}
        />
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.button}
        >
          Save Changes
        </Button>
      </View>
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
    </>
  );
}

const getStyles = (theme) => StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  headerContainer: {
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    fontWeight: "bold",
  },
  subHeader: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  form: {
    width: "100%",
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  emailText: {
    color: theme.colors.onSurfaceVariant,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    width: "90%",
    alignSelf: "center",
    borderRadius: 16,
    height: 45,
    justifyContent: "center",
  },
  label: {
    marginBottom: 2,
    fontWeight: 'bold',
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: 12,
    marginLeft: 4,
    fontSize: 14,
  },
  imageContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    width: '100%',
    height: 150,
    width: 150,
    borderRadius: 120,
  },
  bottomContainer: {
    padding: 8,
    backgroundColor: theme.colors.background,
  }
});
