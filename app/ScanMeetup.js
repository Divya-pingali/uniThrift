import { Camera } from "expo-camera";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../firebaseConfig";

export default function ScanMeetup() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);

  const firebaseUser = auth.currentUser;

  useEffect(() => {
    const request = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
    request();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);

    try {
      const qr = JSON.parse(data);

      if (qr.type !== "meetupConfirmation") {
        alert("Invalid QR type.");
        return;
      }

      const { postId, buyerId, sellerId } = qr;

      if (!firebaseUser) {
        alert("You must be signed in to confirm a meetup.");
        return;
      }

      if (firebaseUser.uid !== buyerId) {
        alert("This QR code is not assigned to you.");
        return;
      }

      const ref = doc(db, "posts", postId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert("Post not found.");
        return;
      }

      const post = snap.data();

      if (post.reservedFor !== firebaseUser.uid) {
        alert("This item is not reserved for you.");
        return;
      }

      await setDoc(
        ref,
        {
          status: "completed",
          completedAt: serverTimestamp(),
        },
        { merge: true }
      );

      alert("Meetup confirmed. Item marked as completed.");
    } catch (e) {
      alert("Invalid QR code.");
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: ["qr"],
        }}
      />
      {scanned && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  button: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "#4b7bec",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
});
