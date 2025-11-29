import { useStripe } from "@stripe/stripe-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { View } from "react-native";
import { Button, Snackbar, Text } from "react-native-paper";
import { auth, db, functions } from "../firebaseConfig";

export default function Checkout() {
  const { postId, price, sellerId, chatId } = useLocalSearchParams();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const router = useRouter();

  const showSnackbar = (msg) => {
    setSnackbarMsg(msg);
    setSnackbarVisible(true);
  };

  const redirectToChat = () => {
    if (chatId) {
      router.replace(`/chats/${chatId}`);
    } else {
      router.replace("/chats");
    }
  };

  const payNow = async () => {
    try {
      const createPI = httpsCallable(functions, "createPaymentIntent");
      const res = await createPI({ amount: Math.round(price * 100) });

      if (res.data.error) {
        showSnackbar(res.data.error);
        setTimeout(redirectToChat, 1800);
        return;
      }

      const clientSecret = res.data.clientSecret;

      const init = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "UniThrift",
      });

      if (init.error) {
        showSnackbar(init.error.message);
        setTimeout(redirectToChat, 1800);
        return;
      }

      const result = await presentPaymentSheet();

      if (result.error) {
        showSnackbar("Payment failed: " + result.error.message);
        await setDoc(
          doc(db, "posts", postId),
          { status: "unpaid" },
          { merge: true }
        );
        setTimeout(() => redirectToChat(), 1800);
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

      await setDoc(
        doc(db, "posts", postId),
        { status: "completed" },
        { merge: true }
      );

      showSnackbar("Payment successful!");
      setTimeout(() => redirectToChat(), 1800); 
    } catch (err) {
      console.log("Error calling createPaymentIntent:", err);
      showSnackbar("Error calling backend: " + err.message);
      setTimeout(() => redirectToChat(), 1800); 
    }
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
