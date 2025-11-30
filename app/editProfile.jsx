import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
    Button,
    Dialog,
    Portal,
    Text,
    TextInput,
    useTheme,
} from "react-native-paper";
import BackButton from "../components/BackButton";
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
  const [loading, setLoading] = useState(true);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const imagePath = useRef(null);
  const oldImageUrl = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        imagePath.current = `users/${user.uid}.jpg`;

        const snapshot = await getDoc(doc(db, "users", user.uid));
        if (snapshot.exists()) {
          const data = snapshot.data();
          oldImageUrl.current = data.image || null;

          setUserData({
            email: data.email || "",
            name: data.name || "",
            bio: data.bio || "",
            phone: data.phone || "",
            image: data.image || null,
          });
        }
      } catch (e) {
        setDialogTitle("Error");
        setDialogMessage("Failed to load user data.");
        setDialogVisible(true);
      } finally {
        setLoading(false);
      }
    };

    load();
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

      let finalImage = userData.image;

      const storageRef = ref(firebaseStorage, imagePath.current);

      const oldExists = oldImageUrl.current !== null;
      const newIsNull = finalImage === null;

      if (newIsNull && oldExists) {
        await deleteObject(storageRef).catch(() => {});
        finalImage = null;
      }

      const isLocal =
        finalImage &&
        (finalImage.startsWith("file://") || finalImage.startsWith("data:"));

      if (isLocal) {
        const response = await fetch(finalImage);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        finalImage = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, "users", user.uid), {
        name: userData.name,
        bio: userData.bio,
        phone: userData.phone,
        image: finalImage || null,
      });

      oldImageUrl.current = finalImage;

      setSuccessMessage("Profile updated successfully!");
      setSuccessVisible(true);
      setUserData((p) => ({ ...p, image: finalImage }));

      setTimeout(() => router.replace("/profile"), 250);
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
            <Text variant="titleMedium" style={styles.label}>
              Profile Picture
            </Text>

            <View style={styles.imageContainer}>
              <EditableImage
                imageUri={userData.image}
                setImageUri={(uri) => setUserData((p) => ({ ...p, image: uri }))}
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
              onChangeText={(t) => setUserData((p) => ({ ...p, name: t }))}
              style={styles.input}
            />

            <Text variant="titleMedium" style={styles.label}>Bio</Text>
            <TextInput
              mode="outlined"
              placeholder="Bio"
              value={userData.bio}
              onChangeText={(t) => setUserData((p) => ({ ...p, bio: t }))}
              style={[styles.input, { minHeight: 80 }]}
              multiline
            />

            <Text variant="titleMedium" style={styles.label}>Phone Number</Text>
            <TextInput
              mode="outlined"
              placeholder="Phone Number"
              value={userData.phone}
              onChangeText={(t) => {
                if (/^\d*$/.test(t)) {
                  setUserData((p) => ({ ...p, phone: t }));
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
        <Button mode="contained" onPress={handleSave} style={styles.button}>
          Save Changes
        </Button>
      </View>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title variant="bodyLarge" style={styles.header}>
            {dialogTitle}
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.componentDescription}>
              {dialogMessage}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog} style={{ margin: 16, fontSize: 20 }}>
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    keyboardView: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: 16, flexGrow: 1 },
    headerContainer: { alignItems: "flex-start", marginTop: 8, marginBottom: 16 },
    header: { fontWeight: "bold" },
    subHeader: { color: theme.colors.onSurfaceVariant, marginBottom: 16 },
    form: { width: "100%", marginBottom: 8 },
    input: { marginBottom: 8 },
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
    label: { marginBottom: 2, fontWeight: "bold" },
    imageContainer: {
      alignItems: "center",
      alignSelf: "center",
      marginBottom: 16,
      width: 150,
      height: 150,
      borderRadius: 150,
      overflow: "hidden",
    },
    bottomContainer: {
      padding: 8,
      backgroundColor: theme.colors.background,
    },
    emailContainer: {},
    componentDescription: { marginBottom: 20 },
  });
