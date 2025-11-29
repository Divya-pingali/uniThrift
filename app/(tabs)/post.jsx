import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View
} from "react-native";
import {
  Button,
  Chip,
  Dialog,
  Portal,
  SegmentedButtons,
  Text,
  TextInput
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import EditableImage from "../../components/EditableImage";
import LocationSearch from "../../components/LocationSearch";
import AppSnackbar from "../../components/Snackbar";
import { auth, db, firebaseStorage } from "../../firebaseConfig";

export default function Post() {
  const { type, id } = useLocalSearchParams();
  const router = useRouter();
  const imagePathRef = useRef(`posts/${Date.now()}.jpg`);

  const TAG_OPTIONS = [
    "Electronics",
    "Furniture",
    "Kitchenware",
    "Study Supplies",
    "Clothing & Accessories",
    "Appliances",
    "Personal Care"
  ];

  const AVAILABILITY_OPTIONS = [
    { label: "1 month", value: "1 month" },
    { label: "3 months", value: "3 months" },
    { label: "6 months", value: "6 months" },
    { label: "1 year", value: "1 year" },
    { label: "3 years", value: "3 years" },
    { label: "3+ years", value: "3+ years" },
    { label: "Not decided / Negotiable", value: "Not decided / Negotiable" }
  ];

  const RECURRENCE_OPTIONS = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" }
  ];

  const [loading, setLoading] = useState(false);

  const [postData, setPostData] = useState({
    title: "",
    description: "",
    image: null,
    location: null,
    tags: [],
    sellingPrice: type === "sell" ? "" : null,
    rentalPrice: type === "rent" ? "" : null,
    rentalPriceUnit: type === "rent" ? "month" : null,
    rentalPriceDuration: type === "rent" ? "Not decided / Negotiable" : null,
    rentalPriceDeposit: type === "rent" ? "" : null
  });

  const [showTagLimit, setShowTagLimit] = useState(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleNumericInput = (text, field) => {
    if (/^\d*\.?\d*$/.test(text)) {
      setPostData((prev) => ({ ...prev, [field]: text }));
    }
  };

  useEffect(() => {
    async function fetchPost() {
      if (!id) return;

      setLoading(true);
      const ref = doc(db, "posts", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setPostData({
          title: data.title || "",
          description: data.description || "",
          image: data.image || null,
          location: data.location || null,
          tags: Array.isArray(data.tags) ? data.tags : [],
          sellingPrice: data.sellingPrice || "",
          rentalPrice: data.rentalPrice || "",
          rentalPriceUnit: data.rentalPriceUnit || "month",
          rentalPriceDuration:
            data.rentalPriceDuration || "Not decided / Negotiable",
          rentalPriceDeposit: data.rentalPriceDeposit || ""
        });
      }
      setLoading(false);
    }

    fetchPost();
  }, [id]);

  const toggleTag = (tag) => {
    setPostData((prev) => {
      const selected = prev.tags.includes(tag);
      if (!selected && prev.tags.length >= 3) {
        setShowTagLimit(true);
        return prev;
      }
      return {
        ...prev,
        tags: selected
          ? prev.tags.filter((t) => t !== tag)
          : [...prev.tags, tag]
      };
    });
  };

  const showDialog = (title, message) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogVisible(true);
  };
  const hideDialog = () => setDialogVisible(false);

  const handleSubmit = async () => {
    const {
      title,
      image,
      location,
      sellingPrice,
      rentalPrice,
      rentalPriceUnit
    } = postData;

    const missing = [];
    if (!title) missing.push("Title");
    if (!image) missing.push("Image");
    if (!location) missing.push("Location");
    if (type === "sell" && !sellingPrice) missing.push("Price");
    if (type === "rent") {
      if (!rentalPrice) missing.push("Price");
      if (!rentalPriceUnit) missing.push("Recurring Unit");
    }

    if (missing.length > 0)
      return showDialog("Missing Information", missing.join(", "));

    try {
      const user = auth.currentUser;
      if (!user) return showDialog("Error", "You must be logged in.");

      let imageUrl = postData.image;
      if (
        imageUrl &&
        (imageUrl.startsWith("file://") || imageUrl.startsWith("data:"))
      ) {
        const blob = await (await fetch(imageUrl)).blob();
        const storageRef = ref(firebaseStorage, imagePathRef.current);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      if (id) {
        await updateDoc(doc(db, "posts", id), {
          ...postData,
          image: imageUrl,
          postType: type
        });
        setSuccessMessage("Post updated successfully!");
      } else {
        await addDoc(collection(db, "posts"), {
          ...postData,
          image: imageUrl,
          userId: user.uid,
          createdAt: serverTimestamp(),
          postType: type,
          status: "available"
        });
        setSuccessMessage("Post submitted successfully!");
      }

      setSuccessVisible(true);
      setTimeout(() => router.replace("/(tabs)/home"), 500);
    } catch (e) {
      console.error("Post error:", e);
      showDialog("Error", "There was an error saving your post.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        data={[]}
        ListHeaderComponent={
          <View style={styles.content}>
            <Text variant="headlineMedium" style={styles.header}>
              {id ? "Edit Listing" : "Create a New Listing"}
            </Text>

            <Text variant="bodyMedium" style={styles.componentDescription}>
              You have selected to {type} an item. Please provide the details.
            </Text>

            <SegmentedButtons
              value={type}
              onValueChange={(value) =>
                router.replace(
                  id ? `/post?type=${value}&id=${id}` : `/post?type=${value}`
                )
              }
              buttons={[
                { value: "sell", label: "Sell" },
                { value: "donate", label: "Donate" },
                { value: "rent", label: "Rent" }
              ]}
              style={{ marginVertical: 12 }}
            />

            <Text variant="titleMedium" style={styles.label}>
              Upload Image
            </Text>
            <EditableImage
              imageUri={postData.image}
              setImageUri={(uri) =>
                setPostData((prev) => ({ ...prev, image: uri }))
              }
              imagePath={imagePathRef.current}
              editable
            />

            <Text variant="titleMedium" style={styles.label}>
              Product Name
            </Text>
            <TextInput
              mode="outlined"
              value={postData.title}
              onChangeText={(text) =>
                setPostData((prev) => ({ ...prev, title: text }))
              }
              style={styles.input}
            />

            <Text variant="titleMedium" style={styles.label}>
              Product Description
            </Text>
            <TextInput
              mode="outlined"
              multiline
              value={postData.description}
              onChangeText={(text) =>
                setPostData((prev) => ({ ...prev, description: text }))
              }
              style={styles.descriptionInput}
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
                  keyboardType="numeric"
                  onChangeText={(t) => handleNumericInput(t, "sellingPrice")}
                  left={<TextInput.Icon icon="currency-usd" />}
                />
              </>
            )}

            {type === "donate" && (
              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={25}
                  color="#49454F"
                />
                <Text>This item will be listed as Free</Text>
              </View>
            )}

            {type === "rent" && (
              <>
                <View style={styles.rentalPriceContainer}>
                  <View style={{ width: "48%" }}>
                    <Text variant="titleMedium" style={styles.label}>
                      Price
                    </Text>
                    <TextInput
                      mode="outlined"
                      label="HKD"
                      value={postData.rentalPrice}
                      keyboardType="numeric"
                      onChangeText={(t) => handleNumericInput(t, "rentalPrice")}
                      left={<TextInput.Icon icon="currency-usd" />}
                    />
                  </View>

                  <View style={{ width: "48%" }}>
                    <Text variant="titleMedium" style={styles.label}>
                      Recurring
                    </Text>
                    <Dropdown
                      options={RECURRENCE_OPTIONS}
                      value={postData.rentalPriceUnit}
                      onSelect={(value) =>
                        setPostData((p) => ({ ...p, rentalPriceUnit: value }))
                      }
                    />
                  </View>
                </View>

                <Text variant="titleMedium" style={styles.label}>
                  Deposit
                </Text>
                <TextInput
                  mode="outlined"
                  label="HKD"
                  value={postData.rentalPriceDeposit}
                  keyboardType="numeric"
                  onChangeText={(t) =>
                    handleNumericInput(t, "rentalPriceDeposit")
                  }
                  left={<TextInput.Icon icon="currency-usd" />}
                />

                <Text variant="titleMedium" style={styles.label}>
                  Duration
                </Text>
                <Dropdown
                  options={AVAILABILITY_OPTIONS}
                  value={postData.rentalPriceDuration}
                  onSelect={(value) =>
                    setPostData((p) => ({
                      ...p,
                      rentalPriceDuration: value
                    }))
                  }
                />
              </>
            )}

            <Text variant="titleMedium" style={[styles.label, { marginTop: 30 }]}>
              Meetup Location
            </Text>
            <LocationSearch
              onSelect={(loc) =>
                setPostData((p) => ({ ...p, location: loc }))
              }
            />

            <Text variant="titleMedium" style={[styles.label, { marginTop: 30 }]}>
              Categories
            </Text>
            <Text variant="bodyMedium">Choose up to 3 tags.</Text>

            <View style={styles.chipContainer}>
              {TAG_OPTIONS.map((tag) => {
                const selected = postData.tags.includes(tag);
                return (
                  <Chip
                    key={tag}
                    mode="outlined"
                    selected={selected}
                    onPress={() => toggleTag(tag)}
                    disabled={!selected && postData.tags.length >= 3}
                    style={[styles.chip, selected && styles.chipSelected]}
                    textStyle={selected && styles.chipSelectedText}
                  >
                    {tag}
                  </Chip>
                );
              })}
            </View>

            <Button
              mode="contained"
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              Submit
            </Button>

            <Portal>
              <Dialog visible={dialogVisible} onDismiss={hideDialog}>
                <Dialog.Title>{dialogTitle}</Dialog.Title>
                <Dialog.Content>
                  <Text>{dialogMessage}</Text>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={hideDialog}>OK</Button>
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

            <AppSnackbar
              visible={showTagLimit}
              onDismiss={() => setShowTagLimit(false)}
              message="Maximum 3 categories allowed"
              type="neutral"
            />
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  content: {
    padding: 16
  },
  header: {
    marginBottom: 10
  },
  label: {
    marginTop: 16,
    marginBottom: 4
  },
  input: {
    marginBottom: 16
  },
  descriptionInput: {
    height: 110,
    marginBottom: 16
  },
  rentalPriceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 12
  },
  chip: {
    margin: 4,
    borderColor: "#6750A4"
  },
  chipSelected: {
    backgroundColor: "rgba(103,80,164,0.16)",
    borderColor: "#6750A4"
  },
  chipSelectedText: {
    color: "#000"
  },
  submitButton: {
    marginVertical: 20,
    borderRadius: 12,
    height: 48,
    justifyContent: "center"
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
