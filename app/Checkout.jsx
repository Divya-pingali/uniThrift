import { useStripe } from "@stripe/stripe-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { View } from "react-native";
import { Button, Card, Dialog, Portal, Text } from "react-native-paper";
import { auth, db, functions } from "../firebaseConfig";

export default function Checkout() {
  const {
    postId,
    price,
    sellerId,
    chatId,
    otherUserId,
    otherUserName,
    productTitle,
  } = useLocalSearchParams();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [showPaymentFailedDialog, setShowPaymentFailedDialog] = useState(false);
  const [paymentFailedMsg, setPaymentFailedMsg] = useState("");
  const router = useRouter();

  const showSnackbar = (msg) => {
    setSnackbarMsg(msg);
    setSnackbarVisible(true);
  };

  const redirectToChat = () => {
    if (chatId) {
      router.replace({
        pathname: `/chats/${chatId}`,
        params: {
          chatId,
          otherUserId,
          otherUserName,
          postId,
          productTitle,
        },
      });
    } else {
      router.back();
    }
  };

  const payNow = async () => {
    try {
      const createPI = httpsCallable(functions, "createPaymentIntent");
      const res = await createPI({ amount: Math.round(price * 100) });

      if (res.data.error) {
        setPaymentFailedMsg(res.data.error);
        setShowPaymentFailedDialog(true);
        await setDoc(
          doc(db, "posts", postId),
          { status: "unpaid" },
          { merge: true }
        );
        return;
      }

      const clientSecret = res.data.clientSecret;

      const init = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "UniThrift",
      });

      if (init.error) {
        setPaymentFailedMsg(init.error.message);
        setShowPaymentFailedDialog(true);
        await setDoc(
          doc(db, "posts", postId),
          { status: "unpaid" },
          { merge: true }
        );
        return;
      }

      const result = await presentPaymentSheet();

      if (result.error) {
        setPaymentFailedMsg("Payment failed: " + result.error.message);
        setShowPaymentFailedDialog(true);
        await setDoc(
          doc(db, "posts", postId),
          { status: "unpaid" },
          { merge: true }
        );
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
      setPaymentFailedMsg("Error calling backend: " + err.message);
      setShowPaymentFailedDialog(true);
      await setDoc(
        doc(db, "posts", postId),
        { status: "unpaid" },
        { merge: true }
      );
    }
  };

  const handlePaymentFailedDialogOk = () => {
    setShowPaymentFailedDialog(false);
    redirectToChat();
  };

  return (
    <View style={{ padding: 20 }}>
      <Card
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 20,
          borderRadius: 12,
          elevation: 4,
        }}
      >
        <Text
          variant="titleLarge"
          style={{
            fontWeight: "bold",
            alignSelf: "center",
            marginVertical: 20,
          }}
        >
          Checkout
        </Text>
        <Card.Content>
          <Text variant="bodyMedium" style={{ textAlign: "center" }}>
            You are about to pay{" "}
            <Text style={{ fontWeight: "bold" }}>${price}</Text> for{" "}
            <Text style={{ fontWeight: "bold" }}>{productTitle}</Text> to{" "}
            <Text style={{ fontWeight: "bold" }}>{otherUserName}</Text>.
          </Text>
          <View
            style={{
              flexDirection: "row",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 30,
            }}
          >
            <Button
              mode="outlined"
              onPress={async () => {
                await setDoc(
                  doc(db, "posts", postId),
                  { status: "unpaid" },
                  { merge: true }
                );
                redirectToChat();
              }}
              style={{ width: "48%", marginTop: 10, borderRadius: 8 }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={payNow}
              style={{ width: "48%", marginTop: 10, borderRadius: 8 }}
            >
              Pay Now
            </Button>
          </View>
        </Card.Content>
      </Card>
      <Portal>
        <Dialog visible={showPaymentFailedDialog} onDismiss={handlePaymentFailedDialogOk}>
          <Dialog.Title>Payment Failed</Dialog.Title>
          <Dialog.Content>
            <Text>{paymentFailedMsg || "Payment could not be completed."}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handlePaymentFailedDialogOk} mode="contained" style={{ borderRadius: 8, paddingHorizontal: 10 }}>
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
