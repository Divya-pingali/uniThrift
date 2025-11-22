import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { firebaseStorage } from "../firebaseConfig";

const EditableImage = ({ imageUri, setImageUri, imagePath, editable, text, style }) => {
  const [dialogVisible, setDialogVisible] = useState(false);

  const handleImagePicker = async () => {
    if (!editable) return;
    setDialogVisible(true);
  };

  const openCamera = async () => {
    setDialogVisible(false);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // FIX
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) uploadImage(result.assets[0].uri);
  };

  const openGallery = async () => {
    setDialogVisible(false);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // FIX
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) uploadImage(result.assets[0].uri);
  };

  const deleteImage = async () => {
    setDialogVisible(false);
    try {
      if (!imageUri) return;
      const storageRef = ref(firebaseStorage, imagePath); // use path, not URL
      await deleteObject(storageRef);
      setImageUri(null);
    } catch (error) {
      console.error("Error deleting image: ", error);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(firebaseStorage, `${imagePath}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      setImageUri(downloadURL);
    } catch (error) {
      console.error("Error uploading image: ", error);
    }
  };

  return (
    <View style={styles.container}>
      {editable ? (
        <Pressable style={styles.pressable} onPress={handleImagePicker}>
          {imageUri ? (
            <View style={[styles.imageContainer, style]}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <View style={styles.iconOverlay}>
                <Ionicons name="pencil" size={32} color="#fff" />
                <Text style={styles.overlayText}>Tap to edit</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.placeholder, style]}>
              {text ? (
                <Text style={styles.placeholderText}>Tap to add image</Text>
              ) : (
                <Ionicons name="cloud-upload-outline" size={32} color="#333" />
              )}
            </View>
          )}
        </Pressable>
      ) : (
        <>
          {imageUri ? (
            <View style={[styles.imageContainer, style]}>
              <Image source={{ uri: imageUri }} style={styles.image} />
            </View>
          ) : (
            <View style={[styles.placeholder, style]}>
              {text ? (
                <Text style={styles.placeholderText}>No image.</Text>
              ) : (
                <Ionicons name="camera-outline" size={32} color="#333" />
              )}
            </View>
          )}
        </>
      )}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title style={styles.dialogTitle}>Upload Image</Dialog.Title>
            <Dialog.Content style={styles.dialogContent}>
              <View style={styles.buttonContainer}>
                <Button onPress={openCamera}>Camera</Button>
                <Button onPress={openGallery}>Gallery</Button>
                {imageUri && <Button onPress={deleteImage}>Delete</Button>}
              </View>
            </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  pressable: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "lightgrey",
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    overflow: "hidden",
  },
  iconOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  dialogTitle: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
  },
  dialogContent: {
    alignItems: "center",
    paddingTop: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  overlayText: {
    color: "white",
    fontSize: 14,
    marginTop: 4,
  },
  placeholderText: {
    color: "black",
    fontSize: 14,
  },
});

export default EditableImage;