import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Snackbar } from "react-native-paper";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebaseConfig";

export default function ScanMeetup() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: "" });
  const [scanError, setScanError] = useState(false);
  const router = useRouter();

  const firebaseUser = auth.currentUser;

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const showSnackbar = (message, isError = true) => {
    setSnackbar({ visible: true, message });
    setScanError(isError);
  };

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    setScanError(false);

    try {
      const qr = JSON.parse(data);

      if (qr.type !== "meetupConfirmation") {
        showSnackbar("Invalid QR type.");
        return;
      }

      const { postId, buyerId, sellerId } = qr;

      if (!firebaseUser) {
        showSnackbar("You must be signed in to confirm a meetup.");
        return;
      }

      if (firebaseUser.uid !== buyerId) {
        showSnackbar("This QR code is not assigned to you.");
        return;
      }

      const ref = doc(db, "posts", postId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        showSnackbar("Post not found.");
        return;
      }

      const post = snap.data();

      if (post.reservedFor !== firebaseUser.uid) {
        showSnackbar("This item is not reserved for you.");
        return;
      }

      await setDoc(
        ref,
        {
          status: "exchanged",
          completedAt: serverTimestamp(),
        },
        { merge: true }
      );

      showSnackbar("Meetup confirmed. Item marked as exchanged.", false);

      setTimeout(async () => {
        const chatsRef = collection(db, "chats");
        const q = query(
          chatsRef,
          where("participants", "array-contains", buyerId),
          where("listingId", "==", postId)
        );

        const chatSnap = await getDocs(q);
        let chatId = null;

        chatSnap.forEach((docSnap) => {
          const chat = docSnap.data();
          if (chat.participants.includes(sellerId)) {
            chatId = docSnap.id;
          }
        });

        if (chatId) {
          router.replace({
            pathname: "Checkout",
            params: {
              postId,
              price: post.price,
              sellerId
            },
          });
        } else {
          router.replace("/chats");
        }
      }, 1200);
    } catch (e) {
      showSnackbar("Invalid QR code.");
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
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barCodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {scanned && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setScanned(false);
            setScanError(false);
          }}
        >
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      )}

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#333",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});
