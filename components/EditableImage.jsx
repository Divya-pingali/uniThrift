import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";
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

    if (!permissionResult.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    setDialogVisible(false);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const deleteImage = async () => {
    setDialogVisible(false);
    try {
      const storageRef = ref(firebaseStorage, `${imageUri}`);
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
    <View>
      {editable ? (
        <Pressable onPress={handleImagePicker}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={style} />
          ) : (
            <View style={style}>
              {text ? <Text>Tap to edit</Text> : <MaterialCommunityIcons name="camera-plus-outline" size={24} />}
            </View>
          )}
        </Pressable>
      ) : (
        <>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={style} />
          ) : (
            <View style={style}>
              {text ? <Text>No image.</Text> : <MaterialCommunityIcons name="camera-outline" size={24} />}
            </View>
          )}
        </>
      )}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Upload Image</Dialog.Title>
          <Dialog.Content>
            <View>
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

export default EditableImage;