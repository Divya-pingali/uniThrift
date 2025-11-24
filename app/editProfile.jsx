import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Snackbar, Text, TextInput } from "react-native-paper";
import EditableImage from "../components/EditableImage";
import { auth, db, firebaseStorage } from "../firebaseConfig";

export default function EditProfile() {
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
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "position"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text variant="headlineMedium" style={styles.header}>
            Edit Profile
          </Text>
          <Text variant="bodyMedium" style={styles.componentDescription}>
            Update your details below.
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
          <TextInput
            mode="outlined"
            label="Email"
            value={userData.email}
            style={styles.input}
            editable={false}
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
              if (/^\d*$/.test(text)) {
                setUserData(prev => ({ ...prev, phone: text }));
              }
            }}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={15}
          />
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
        <Snackbar
          visible={successVisible}
          onDismiss={() => setSuccessVisible(false)}
          duration={2500}
          style={{ backgroundColor: '#2e7d32' }}
        >
          {successMessage}
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
    <Button 
          mode="contained" 
          onPress={handleSave} 
          style={styles.button}
          disabled={loading}
        >
          Save Changes
    </Button>
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
  errorText: {
    color: '#B00020',
    marginBottom: 12,
    marginLeft: 4,
    fontSize: 14,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    height: 180,
  },
});
