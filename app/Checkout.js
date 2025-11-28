import { useStripe } from "@stripe/stripe-react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { View } from "react-native";
import { Button, Snackbar, Text } from "react-native-paper";
import { auth, db, functions } from "../firebaseConfig";

export default function Checkout() {
  const { postId, price, sellerId } = useLocalSearchParams();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const showSnackbar = (msg) => {
    setSnackbarMsg(msg);
    setSnackbarVisible(true);
  };

  const payNow = async () => {
    const createPI = httpsCallable(functions, "createPaymentIntent");
    const res = await createPI({ amount: Math.round(Number(price) * 100) });

    if (res.data.error) {
      showSnackbar(res.data.error);
      return;
    }

    const clientSecret = res.data.clientSecret;

    const init = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: "UniThrift",
    });

    if (init.error) {
      showSnackbar(init.error.message);
      return;
    }

    const result = await presentPaymentSheet();

    if (result.error) {
      showSnackbar("Payment failed: " + result.error.message);
      return;
    }

    await setDoc(doc(db, "payments", postId), {
      postId,
      sellerId,
      buyerId: auth.currentUser.uid,
      amount: price,
      timestamp: serverTimestamp(),
      status: "success",
    });

    showSnackbar("Payment successful!");
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        Checkout
      </Text>

      <Text style={{ fontSize: 18 }}>Price: ${price}</Text>

      <Button mode="contained" onPress={payNow} style={{ marginTop: 30 }}>
        Pay Now
      </Button>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnackbarVisible(false) }}
      >
        {snackbarMsg}
      </Snackbar>
    </View>
  );
}
