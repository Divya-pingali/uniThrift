import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  View
} from "react-native";
import {
  Bubble,
  Composer,
  GiftedChat,
  InputToolbar,
  Send,
} from "react-native-gifted-chat";
import {
  ActivityIndicator,
  Button,
  Dialog,
  IconButton,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";
import { auth, db } from "../../firebaseConfig";

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { chatId, otherUserId, otherUserName, postId, productTitle } = params;
  const theme = useTheme();
  const styles = makeStyles(theme);

  const firebaseUser = auth.currentUser;

  const [messages, setMessages] = useState(null);
  const [userName, setUserName] = useState("");
  const [post, setPost] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;
    const ref = doc(db, "users", firebaseUser.uid);
    getDoc(ref).then((snap) => {
      if (snap.exists()) setUserName(snap.data().name);
    });
  }, []);

  useEffect(() => {
    if (!postId) return;

    const ref = doc(db, "posts", postId);
    const unsub = onSnapshot(ref, (snap) => {
      snap.exists() && setPost({ id: snap.id, ...snap.data() });
    });

    return unsub;
  }, [postId]);

  useEffect(() => {
    if (!chatId) return;

    const ref = collection(db, "chats", chatId, "messages");
    const q = query(ref, orderBy("createdAt", "desc"));

    const mapMessage = (d) => {
      const data = d.data();
      return {
        _id: d.id,
        text: data.text,
        createdAt: data.createdAt?.toDate() || new Date(),
        user: {
          _id: data.senderId,
          name: data.senderName || "User",
        },
      };
    };

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(mapMessage));
    });

    return unsub;
  }, [chatId]);

  const handleSend = useCallback(
    async (msgs = []) => {
      const msg = msgs[0];
      if (!msg?.text.trim()) return;

      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: msg.text.trim(),
        senderId: firebaseUser.uid,
        senderName: userName,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "chats", chatId),
        {
          lastMessage: msg.text.trim(),
          lastMessageAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [firebaseUser, userName]
  );

  const isSeller = post?.userId === firebaseUser?.uid;
  const isBuyer = post?.reservedFor === firebaseUser?.uid;
  const isReserved = post?.status === "reserved";

  const getInfoMessage = () => {
    if (!post) return null;
    if (post.status === "reserved") {
      if (isSeller) return `You have reserved this item for ${otherUserName}.`;
      if (isBuyer) return "This item has been reserved for you.";
      return "This item has been reserved for another person.";
    }
    if (post.status === "exchanged") return "The product has been delivered.";
    if (post.status === "completed")
      return "The product has been delivered and the payment has been completed.";
    if (post.status === "unpaid")
      return "The product has been delivered but the payment is pending.";
    return null;
  };

  const reserveItem = async () => {
    try {
      await setDoc(
        doc(db, "posts", postId),
        {
          status: "reserved",
          reservedFor: otherUserId,
          reservedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      alert("Error reserving item.");
    }
  };

  const cancelReservation = async () => {
    setShowCancelDialog(false);
    try {
      await setDoc(
        doc(db, "posts", postId),
        {
          status: "available",
          reservedFor: null,
          reservedAt: null,
        },
        { merge: true }
      );
    } catch {
      alert("Error canceling reservation.");
    }
  };

  const goToSellerQR = () => {
    router.replace({
      pathname: "/MeetupQRCode",
      params: { postId, buyerId: otherUserId },
    });
  };

  const goToScanQR = () => {
    router.replace({
      pathname: "/ScanMeetup",
      params: { chatId, otherUserId, otherUserName, postId, productTitle },
    });
  };

  const retryPayment = () => {
    router.replace({
      pathname: "/Checkout",
      params: {
        chatId,
        otherUserId,
        otherUserName,
        productTitle,
        postId,
        price: post.sellingPrice || post.rentalPriceDeposit || 0,
        sellerId: post.userId,
      },
    });
  };

  if (!messages || !post) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  const infoMessage = getInfoMessage();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <Ionicons
          name="person-circle-outline"
          size={42}
          color={theme.colors.onSurfaceVariant}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            flex: 1,
          }}
        >
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.username}>{otherUserName}</Text>
            <Text style={styles.product}>{productTitle}</Text>
          </View>

          {isSeller && post.status === "available" && (
            <Button
              mode="contained"
              onPress={reserveItem}
              style={styles.smallBtn}
            >
              Reserve
            </Button>
          )}

          {isSeller && isReserved && (
            <View style={styles.rightActions}>
              <Ionicons
                name="qr-code-outline"
                size={32}
                color={theme.colors.primary}
                style={styles.qrIcon}
                onPress={goToSellerQR}
              />
              <IconButton
                icon="close"
                onPress={() => setShowCancelDialog(true)}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </View>
          )}

          {isReserved && isBuyer && (
            <Ionicons
              name="scan-outline"
              size={32}
              color={theme.colors.primary}
              style={styles.qrIcon}
              onPress={goToScanQR}
            />
          )}

          {post.status === "unpaid" && isBuyer && (
            <Button mode="contained" onPress={retryPayment}>
              Retry Payment
            </Button>
          )}
        </View>
      </View>

      {infoMessage && (
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={styles.infoText}>{infoMessage}</Text>
        </View>
      )}
      <GiftedChat
        messages={messages}
        onSend={(msgs) => handleSend(msgs)}
        user={{
          _id: firebaseUser.uid,
          name: userName || "You",
        }}
        renderAvatar={() => (
          <Ionicons
            name="person-circle-outline"
            size={32}
            color={theme.colors.onSurfaceVariant}
          />
        )}
        renderUsernameOnMessage
        placeholder="Type a message…"
        alwaysShowSend
        keyboardAvoidingViewProps={{
          behavior: "height",
          keyboardVerticalOffset: 180,
        }}
        renderBubble={(props) => (
          <Bubble
            {...props}
            wrapperStyle={{
              left: {
                backgroundColor: theme.colors.surfaceContainer,
              },
              right: {
                backgroundColor: theme.colors.primary,
              },
            }}
            textStyle={{
              left: {
                color: theme.colors.onSurface,
              },
              right: {
                color: theme.colors.onPrimary,
              },
            }}
          />
        )}
        renderInputToolbar={(props) => (
          <InputToolbar
            {...props}
            containerStyle={{
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.outlineVariant,
            }}
          />
        )}
        renderComposer={(props) => (
          <Composer
            {...props}
            textInputStyle={{
              color: theme.colors.onSurface,
              ...styles.composer,
            }}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        )}
        renderSend={(props) => (
          <Send {...props} containerStyle={styles.sendContainer}>
            <Ionicons name="send" size={24} color={theme.colors.primary} />
          </Send>
        )}
      />
      <Portal>
        <Dialog
          visible={showCancelDialog}
          onDismiss={() => setShowCancelDialog(false)}
          style={{ backgroundColor: theme.colors.surfaceContainerHighest }}
        >
          <Dialog.Title>Cancel Reservation</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to cancel this reservation?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCancelDialog(false)}>No</Button>
            <Button mode="contained" onPress={cancelReservation}>
              Yes
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
const makeStyles = (theme) =>
  StyleSheet.create({
    header: {
      paddingTop: 40,
      paddingBottom: 10,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      flexDirection: "row",
      alignItems: "center",
    },
    username: {
      fontWeight: "bold",
      fontSize: 18,
      color: theme.colors.onSurface,
    },
    product: { fontSize: 14, color: theme.colors.onSurfaceVariant },
    infoBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surfaceContainerLow,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomColor: theme.colors.outlineVariant,
      borderBottomWidth: 1,
    },
    infoText: {
      marginLeft: 10,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      flexShrink: 1,
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    smallBtn: { paddingHorizontal: 10, borderRadius: 8 },
    rightActions: { flexDirection: "row", alignItems: "center" },
    qrIcon: { marginHorizontal: 12 },
    composer: {
      paddingTop: 8,
    },
    sendContainer: {
      margin: 8
    },
  });
