import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";

const EditableImage = ({ imageUri, setImageUri, editable, text, style }) => {
  const [dialogVisible, setDialogVisible] = useState(false);

  const handlePress = () => {
    if (!editable) return;
    setDialogVisible(true);
  };

  const pickCamera = async () => {
    setDialogVisible(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  };

  const pickGallery = async () => {
    setDialogVisible(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  };

  const deleteLocal = () => {
    setDialogVisible(false);
    setImageUri(null);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} style={styles.pressable}>
        {imageUri ? (
          <View style={[styles.imageContainer, style]}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            {editable && (
              <View style={styles.overlay}>
                <Ionicons name="pencil" size={28} color="#fff" />
                <Text style={styles.overlayText}>Tap to edit</Text>
              </View>
            )}
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

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title style={styles.title}>Profile Picture</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <View style={styles.buttonRow}>
              <Button onPress={pickCamera}>Camera</Button>
              <Button onPress={pickGallery}>Gallery</Button>
              {imageUri && <Button onPress={deleteLocal}>Delete</Button>}
            </View>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%" },
  pressable: { width: "100%", height: "100%" },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "lightgrey",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayText: { color: "#fff", marginTop: 4, fontSize: 13 },
  placeholderText: { color: "#000", fontSize: 14 },
  title: { textAlign: "center", fontWeight: "bold", fontSize: 20 },
  dialogContent: { alignItems: "center", paddingTop: 8 },
  buttonRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
});

export default EditableImage;
