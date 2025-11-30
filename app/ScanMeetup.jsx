import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import BackButton from "../components/BackButton";
import AppSnackbar from "../components/Snackbar";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export default function ScanMeetup() {
  const theme = useTheme();
  const params = useLocalSearchParams();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "neutral",
  });

  const firebaseUser = auth.currentUser;

  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission]);

  const showSnackbar = (message, type = "neutral") =>
    setSnackbar({ visible: true, message, type });

  const computePrice = (post) => {
    if (post.postType === "rent") {
      return Number(post.rentalPriceDeposit) || 0;
    }
    if (post.postType === "sell") {
      return Number(post.sellingPrice);
    }
    return 0;
  };

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);

    try {
      if (!firebaseUser) return showSnackbar("You must be signed in.", "failure");

      const qr = JSON.parse(data);
      if (qr.type !== "meetupConfirmation")
        return showSnackbar("Invalid QR code.", "failure");

      const { postId, buyerId, sellerId } = qr;

      if (firebaseUser.uid !== buyerId)
        return showSnackbar("This QR code is not assigned to you.", "failure");

      const ref = doc(db, "posts", postId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return showSnackbar("Post not found.", "failure");

      const post = snap.data();

      if (post.reservedFor !== firebaseUser.uid)
        return showSnackbar("This item is not reserved for you.", "failure");

      const price = computePrice(post);
      const isFree =
        post.postType === "donate" ||
        (post.postType === "rent" && price === 0);

      if (isFree) {
        await setDoc(
          ref,
          {
            status: "completed",
            completedAt: serverTimestamp(),
          },
          { merge: true }
        );

        showSnackbar("Meetup confirmed.", "success");

        return setTimeout(() => {
          router.replace({
            pathname: `/chats/${params.chatId}`,
            params,
          });
        }, 1200);
      }

      await setDoc(
        ref,
        {
          status: "exchanged",
          completedAt: serverTimestamp(),
        },
        { merge: true }
      );

      showSnackbar("Meetup confirmed. Proceeding to payment...", "success");

      setTimeout(() => {
        router.replace({
          pathname: "Checkout",
          params: {
            ...params,
            price,
            sellerId,
            postType: post.postType,
          },
        });
      }, 1200);
    } catch {
      showSnackbar("Invalid QR code.", "failure");
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>No access to camera.</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ color: "blue" }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          marginBottom: 32,
          marginTop: 32,
          zIndex: 10,
        }}
      >
        <BackButton fallback="/(tabs)/chat" />
        <Text variant="headlineSmall" style={{ fontWeight: "bold", marginLeft: 8 }}>
          Scan Meetup
        </Text>
      </View>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barCodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {scanned && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      )}

      <AppSnackbar
        visible={snackbar.visible}
        type={snackbar.type}
        message={snackbar.message}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  button: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#333",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: "white", fontSize: 16 },
});
