import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Chip,
  Dialog,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import BackButton from "../../components/BackButton";
import EditableImage from "../../components/EditableImage";
import LocationSearch from "../../components/LocationSearch";
import AppSnackbar from "../../components/Snackbar";
import CATEGORY_COLORS from "../../constants/categoryColors";
import { auth, db, firebaseStorage } from "../../firebaseConfig";

export default function Post() {
  const { type, id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();

  const [localImageUri, setLocalImageUri] = useState(null);

  const TAG_OPTIONS = Object.keys(CATEGORY_COLORS);
  const AVAILABILITY_OPTIONS = [
    { label: "1 month", value: "1 month" },
    { label: "3 months", value: "3 months" },
    { label: "6 months", value: "6 months" },
    { label: "1 year", value: "1 year" },
    { label: "3 years", value: "3 years" },
    { label: "3+ years", value: "3+ years" },
    { label: "Not decided / Negotiable", value: "Not decided / Negotiable" },
  ];

  const RECURRENCE_OPTIONS = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
  ];

  const [postData, setPostData] = useState({
    title: "",
    description: "",
    image: null,
    imagePath: null,
    location: null,
    tags: [],
    sellingPrice: type === "sell" ? "" : null,
    rentalPrice: type === "rent" ? "" : null,
    rentalPriceUnit: type === "rent" ? "month" : null,
    rentalPriceDuration: type === "rent" ? "Not decided / Negotiable" : null,
    rentalPriceDeposit: type === "rent" ? "" : null,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      if (id) {
        setLoading(true);
        const refDoc = doc(db, "posts", id);
        const snap = await getDoc(refDoc);
        if (snap.exists()) {
          const data = snap.data();
          setPostData({
            ...data,
            title: data.title || "",
            description: data.description || "",
            image: data.image || null,
            imagePath: data.imagePath || null,
            location: data.location || null,
            tags: Array.isArray(data.tags) ? data.tags : [],
            sellingPrice: data.sellingPrice || "",
            rentalPrice: data.rentalPrice || "",
            rentalPriceUnit: data.rentalPriceUnit || "month",
            rentalPriceDuration: data.rentalPriceDuration || "Not decided / Negotiable",
            rentalPriceDeposit: data.rentalPriceDeposit || "",
          });
          setLocalImageUri(data.image || null);
        }
        setLoading(false);
      } else {
        setPostData({
          title: "",
          description: "",
          image: null,
          imagePath: null,
          location: null,
          tags: [],
          sellingPrice: type === "sell" ? "" : null,
          rentalPrice: type === "rent" ? "" : null,
          rentalPriceUnit: type === "rent" ? "month" : null,
          rentalPriceDuration: type === "rent" ? "Not decided / Negotiable" : null,
          rentalPriceDeposit: type === "rent" ? "" : null,
        });
        setLocalImageUri(null);
      }
    }
    fetchPost();
  }, [id, type]);

  const [showTagLimit, setShowTagLimit] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const showDialog = (t, m) => {
    setDialogTitle(t);
    setDialogMessage(m);
    setDialogVisible(true);
  };
  const hideDialog = () => setDialogVisible(false);

  const toggleTag = (tag) => {
    setPostData((p) => {
      const sel = p.tags.includes(tag);
      if (!sel && p.tags.length >= 3) {
        setShowTagLimit(true);
        return p;
      }
      return {
        ...p,
        tags: sel ? p.tags.filter((t) => t !== tag) : [tag, ...p.tags.filter((t) => t !== tag)],
      };
    });
  };

  const handleSubmit = async () => {
    const { title, location, sellingPrice, rentalPrice, rentalPriceUnit } = postData;
    const missing = [];
    if (!title) missing.push("Title");
    if (!localImageUri) missing.push("Image");
    if (!location) missing.push("Location");
    if (type === "sell" && !sellingPrice) missing.push("Price");
    if (type === "rent") {
      if (!rentalPrice) missing.push("Price");
      if (!rentalPriceUnit) missing.push("Price Unit");
    }
    if (missing.length > 0) {
      showDialog("Missing Information", `Please fill out: ${missing.join(", ")}`);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        showDialog("Error", "You must be logged in.");
        return;
      }

      let finalPostId = id;
      let finalImageUrl = postData.image;
      let finalImagePath = postData.imagePath;

      if (!id) {
        const docRef = await addDoc(collection(db, "posts"), {
          ...postData,
          userId: user.uid,
          createdAt: serverTimestamp(),
          postType: type,
          image: null,
          imagePath: null,
          status: "available",
        });
        finalPostId = docRef.id;
      }

      if (localImageUri && (localImageUri.startsWith("file://") || localImageUri.startsWith("data:"))) {
        const uploadPath = `posts/${finalPostId}.jpg`;
        const response = await fetch(localImageUri);
        const blob = await response.blob();
        const storageRef = ref(firebaseStorage, uploadPath);
        await uploadBytes(storageRef, blob);
        finalImageUrl = await getDownloadURL(storageRef);
        finalImagePath = uploadPath;
      }

      const refDoc = doc(db, "posts", finalPostId);
      await updateDoc(refDoc, {
        ...postData,
        image: finalImageUrl,
        imagePath: finalImagePath,
        postType: type,
      });

      setSuccessMessage(id ? "Post updated successfully!" : "Post submitted successfully!");
      setSuccessVisible(true);
      setTimeout(() => {
        router.replace(id ? "/profile" : "/(tabs)/home");
      }, 500);
    } catch (e) {
      showDialog("Error", "Error saving post.");
    }
  };

  const handleDelete = () => setDeleteDialogVisible(true);

  const confirmDelete = async () => {
    setDeleteDialogVisible(false);
    if (!id) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "posts", id));
      if (postData.imagePath) {
        const storageRef = ref(firebaseStorage, postData.imagePath);
        await deleteObject(storageRef).catch(() => {});
      }
      setSuccessMessage("Post deleted successfully!");
      setSuccessVisible(true);
      setTimeout(() => router.replace("/profile"), 500);
    } catch (e) {
      showDialog("Error", "Error deleting post.");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.keyboardView} behavior={"height"}>
      <View style={{ backgroundColor: theme.colors.background, paddingTop: 8 }}>
        <BackButton fallback="/(tabs)/home" />
      </View>

      <FlatList
        style={[styles.scroll, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}
        keyboardShouldPersistTaps="handled"
        data={[]}
        scrollEnabled
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
            <Text variant="headlineMedium" style={styles.header}>
              {id ? "Edit Listing" : "New Listing"}
            </Text>

            <Text variant="bodyMedium" style={[styles.componentDescription, { color: theme.colors.onSurfaceVariant }]}>
              You have selected to {type} an item. Provide details below.
            </Text>

            <SegmentedButtons
              value={type}
              style={styles.segmentedButtons}
              onValueChange={(v) =>
                router.replace(id ? `/post?type=${v}&id=${id}` : `/post?type=${v}`)
              }
              buttons={[
                {
                  value: "sell",
                  label: "Sell",
                  checkedColor: theme.colors.onPrimary,
                  style: type === "sell" ? { backgroundColor: theme.colors.primary } : {},
                },
                {
                  value: "donate",
                  label: "Donate",
                  checkedColor: theme.colors.onPrimary,
                  style: type === "donate" ? { backgroundColor: theme.colors.primary } : {},
                },
                {
                  value: "rent",
                  label: "Rent",
                  checkedColor: theme.colors.onPrimary,
                  style: type === "rent" ? { backgroundColor: theme.colors.primary } : {},
                },
              ]}
            />

            <Text variant="titleMedium" style={styles.label}>
              Upload Image
            </Text>

            <View style={styles.imageContainer}>
              <EditableImage
                imageUri={localImageUri}
                setImageUri={(uri) => setLocalImageUri(uri)}
                editable={true}
                style={styles.image}
              />
            </View>

            <Text variant="titleMedium" style={styles.label}>
              Product Name
            </Text>
            <TextInput
              mode="outlined"
              value={postData.title}
              onChangeText={(t) => setPostData((p) => ({ ...p, title: t }))}
              style={styles.input}
            />

            <Text variant="titleMedium" style={styles.label}>
              Product Description
            </Text>
            <TextInput
              mode="outlined"
              value={postData.description}
              onChangeText={(t) => setPostData((p) => ({ ...p, description: t }))}
              style={styles.descriptionInput}
              multiline
            />

            {type === "sell" && (
              <>
                <Text variant="titleMedium" style={styles.label}>
                  Price
                </Text>
                <TextInput
                  mode="outlined"
                  label="HKD"
                  value={postData.sellingPrice}
                  onChangeText={(t) => setPostData((p) => ({ ...p, sellingPrice: t }))}
                  style={styles.input}
                  keyboardType="numeric"
                  left={<TextInput.Icon icon="currency-usd" />}
                />
              </>
            )}

            {type === "donate" && (
              <View style={[styles.infoBox, { backgroundColor: theme.colors.tertiaryContainer }]}>
                <Ionicons name="information-circle-outline" size={25} color={theme.colors.onTertiaryContainer} style={{ margin: 3 }} />
                <Text variant="titleMedium" style={{ fontWeight: 600, color: theme.colors.onTertiaryContainer }}>
                  This item will be listed as Free
                </Text>
              </View>
            )}

            {type === "rent" && (
              <>
                <View style={styles.rentalPriceContainer}>
                  <View style={{ flex: 1, marginHorizontal: 4 }}>
                    <Text variant="titleMedium" style={styles.label}>
                      Price
                    </Text>
                    <TextInput
                      mode="outlined"
                      label="HKD"
                      value={postData.rentalPrice}
                      onChangeText={(t) => setPostData((p) => ({ ...p, rentalPrice: t }))}
                      keyboardType="numeric"
                      left={<TextInput.Icon icon="currency-usd" />}
                      style={{ width: "100%", height: 56 }}
                    />
                  </View>

                  <View style={{ flex: 1, marginHorizontal: 4 }}>
                    <Text variant="titleMedium" style={{ marginBottom: 10 }}>
                      Recurring
                    </Text>
                    <Dropdown
                      mode="outlined"
                      hideMenuHeader
                      options={RECURRENCE_OPTIONS}
                      value={postData.rentalPriceUnit}
                      onSelect={(v) => setPostData((p) => ({ ...p, rentalPriceUnit: v }))}
                      style={styles.rentalPriceItem}
                      dropDownStyle={{ backgroundColor: theme.colors.surface }}
                      selectedItemLabelStyle={{ color: theme.colors.primary }}
                      dropDownItemSelectedTextStyle={{ color: theme.colors.onPrimaryContainer }}
                    />
                  </View>
                </View>

                <View style={{ width: "100%", marginTop: 16 }}>
                  <Text variant="titleMedium" style={styles.label}>
                    Deposit
                  </Text>
                  <TextInput
                    mode="outlined"
                    label="HKD"
                    value={postData.rentalPriceDeposit}
                    onChangeText={(t) => setPostData((p) => ({ ...p, rentalPriceDeposit: t }))}
                    keyboardType="numeric"
                    left={<TextInput.Icon icon="currency-usd" />}
                    style={{ marginBottom: 24 }}
                  />

                  <Text variant="titleMedium" style={styles.label}>
                    Duration
                  </Text>

                  <Dropdown
                    mode="outlined"
                    hideMenuHeader
                    options={AVAILABILITY_OPTIONS}
                    value={postData.rentalPriceDuration}
                    onSelect={(v) => setPostData((p) => ({ ...p, rentalPriceDuration: v }))}
                  />
                </View>
              </>
            )}

            <View style={{ width: "100%", marginTop: 32 }}>
              <Text variant="titleMedium" style={styles.label}>
                Meetup Location
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.componentDescription, { color: theme.colors.onSurfaceVariant }]}
              >
                Choose a location where you would like to meet the buyer/donee/renter.
              </Text>

              <LocationSearch
                onSelect={(loc) => setPostData((p) => ({ ...p, location: loc }))}
                style={styles.input}
              />
            </View>

            <Text variant="titleMedium" style={[styles.label, { marginTop: 32 }]}>
              Categories
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.componentDescription, { color: theme.colors.onSurfaceVariant }]}
            >
              Choose up to 3 tags that best describe your item.
            </Text>

            <View style={styles.chipContainer}>
              {TAG_OPTIONS.map((tag) => {
                const selected = postData.tags.includes(tag);
                const limit = postData.tags.length >= 3;
                return (
                  <Chip
                    key={tag}
                    mode="outlined"
                    selected={selected}
                    onPress={() => toggleTag(tag)}
                    disabled={limit && !selected}
                    selectedColor={theme.colors.primary}
                    icon={() => (
                      <Ionicons
                        name={selected ? "checkmark" : null}
                        size={16}
                        color={selected ? theme.colors.onPrimaryContainer : theme.colors.primary}
                      />
                    )}
                    style={[
                      styles.chip,
                      { borderColor: theme.colors.primary },
                      selected && { backgroundColor: theme.colors.primaryContainer },
                    ]}
                    textStyle={selected && { color: theme.colors.onPrimaryContainer }}
                  >
                    {tag}
                  </Chip>
                );
              })}
            </View>

            {showTagLimit && (
              <Text variant="bodyMedium" style={{ color: theme.colors.error, marginBottom: 16 }}>
                You can select up to 3 tags only.
              </Text>
            )}
          </View>
        }
      />

      {id ? (
        <View style={{ flexDirection: "row", justifyContent: "center", paddingHorizontal: 24, backgroundColor: theme.colors.background }}>
          <Button
            mode="outlined"
            style={{ margin: 8, width: "48%", borderRadius: 16, height: 45, justifyContent: "center" }}
            onPress={handleDelete}
            icon="trash-can-outline"
          >
            Delete
          </Button>
          <Button
            mode="contained"
            style={{ margin: 8, width: "48%", borderRadius: 16, height: 45, justifyContent: "center" }}
            onPress={handleSubmit}
          >
            Submit
          </Button>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 24, alignItems: "center", backgroundColor: theme.colors.background }}>
          <Button
            mode="contained"
            style={{ margin: 8, width: "100%", borderRadius: 16, height: 45, justifyContent: "center" }}
            onPress={handleSubmit}
          >
            Submit
          </Button>
        </View>
      )}

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

        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title style={styles.header}>Are you sure?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.componentDescription}>
              This action will permanently delete your post and its image. Are you sure you want to continue?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)} style={{ margin: 8 }}>
              Cancel
            </Button>
            <Button onPress={confirmDelete} style={{ margin: 8 }} mode="contained">
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <AppSnackbar
        visible={successVisible}
        onDismiss={() => setSuccessVisible(false)}
        message={successMessage}
        type="success"
        duration={2500}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  keyboardView: { flex: 1 },
  header: { marginBottom: 8, fontWeight: "800" },
  segmentedButtons: { marginBottom: 24 },
  input: { marginBottom: 16 },
  content: { paddingHorizontal: 8 },
  descriptionInput: { marginBottom: 16, minHeight: 140 },
  label: { marginBottom: 4 },
  componentDescription: { marginBottom: 20 },
  imageContainer: {
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
    height: 180,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  rentalPriceContainer: {
    marginBottom: 8,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  rentalPriceItem: { width: "100%" },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 32 },
  chip: { margin: 4 },
});
