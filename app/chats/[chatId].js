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
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import { ActivityIndicator, Button, Dialog, IconButton, Portal, Text } from "react-native-paper";
import { auth, db } from "../../firebaseConfig";

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const chatId = params.chatId;
  const otherUserId = params.otherUserId;
  const otherUserName = params.otherUserName;
  const postId = params.postId;
  const productTitle = params.productTitle;

  const firebaseUser = auth.currentUser;

  const [messages, setMessages] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [post, setPost] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;

    const load = async () => {
      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setUserProfile(snap.data());
    };

    load();
  }, []);

  useEffect(() => {
    if (!postId) return;

    const ref = doc(db, "posts", postId);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setPost({ id: postId, ...data });
    });

    return unsub;
  }, [postId]);

  useEffect(() => {
    if (!chatId) return;

    const ref = collection(db, "chats", chatId, "messages");
    const q = query(ref, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          _id: docSnap.id,
          text: data.text,
          createdAt: data.createdAt?.toDate() || new Date(),
          user: {
            _id: data.senderId,
            name: data.senderName || "User",
          },
        };
      });
      setMessages(list);
    });

    return unsub;
  }, [chatId]);

  const handleSend = useCallback(
    async (msgs = []) => {
      const msg = msgs[0];
      if (!msg || !msg.text.trim()) return;

      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: msg.text.trim(),
        senderId: firebaseUser.uid,
        senderName: userProfile.name,
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
    [firebaseUser, userProfile]
  );

  const handleReserveBuyer = async () => {
    try {
      const postRef = doc(db, "posts", postId);

      await setDoc(
        postRef,
        {
          status: "reserved",
          reservedFor: otherUserId,
          reservedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setPost((prev) => ({
        ...prev,
        status: "reserved",
        reservedFor: otherUserId,
      }));
    } catch {
      alert("Error reserving item.");
    }
  };

  const handleCancelReservation = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelReservation = async () => {
    setShowCancelDialog(false);
    try {
      const postRef = doc(db, "posts", postId);
      await setDoc(
        postRef,
        {
          status: "available",
          reservedFor: null,
          reservedAt: null,
        },
        { merge: true }
      );

      setPost((prev) => ({
        ...prev,
        status: "available",
        reservedFor: null,
      }));
    } catch {
      alert("Error canceling reservation.");
    }
  };

  const renderCustomAvatar = (props) => (
    <Ionicons
      name="person-circle-outline"
      size={32}
      color={props.position === "left" ? "#999" : "#4b7bec"}
      style={{ marginLeft: props.position === "left" ? 0 : 4 }}
    />
  );

  if (!messages || !userProfile || !post) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const isSeller = post.userId === firebaseUser.uid;
  const isReserved = post.status === "reserved";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={120}
    >
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={42} color="#777" />
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", flex: 1 }}
        >
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.username}>{otherUserName}</Text>
            <Text style={styles.product}>{productTitle}</Text>
          </View>

          {isSeller && post.status === "available" && (
            <Button
              mode="contained"
              style={{ paddingHorizontal: 10, borderRadius: 8 }}
              onPress={handleReserveBuyer}
            >
              Reserve
            </Button>
          )}

          {isSeller && isReserved && post.reservedFor === otherUserId && (
            <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "flex-end" }}>
              <Ionicons
                name="qr-code-outline"
                size={32}
                color="#4b7bec"
                style={{ marginHorizontal: 12, marginRight: 24, alignSelf: "center" }}
                onPress={() => {
                  if (postId && otherUserId) {
                    router.push({
                      pathname: "/MeetupQRCode",
                      params: { postId, buyerId: otherUserId },
                    });
                  } else {
                    alert("QR code data is missing.");
                  }
                }}
              />
              <IconButton
                mode="contained"
                icon="close"
                style={{ borderRadius: 8 }}
                onPress={handleCancelReservation}
              />
            </View>
          )}

          {isReserved && post.reservedFor === firebaseUser.uid && (
            <Ionicons
              name="scan-outline"
              size={32}
              color="#4b7bec"
              style={{ marginLeft: 12, alignSelf: "center" }}
              onPress={() => {
                router.push("/ScanMeetup");
              }}
            />
          )}
        </View>
      </View>

      {(isReserved || post.status === "exchanged") && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#555" />

          {isSeller && post.reservedFor === otherUserId && post.status === "reserved" && (
            <Text style={styles.infoText}>
              You have reserved this item for {otherUserName}.
            </Text>
          )}

          {!isSeller && post.reservedFor === firebaseUser.uid && post.status === "reserved" && (
            <Text style={styles.infoText}>This item has been reserved for you.</Text>
          )}

          {!isSeller && post.reservedFor !== firebaseUser.uid && post.status === "reserved" && (
            <Text style={styles.infoText}>
              This item has been reserved for another person.
            </Text>
          )}

          {!isSeller && post.reservedFor === firebaseUser.uid && post.status === "exchanged" && (
            <Text style={styles.infoText}>The product has been delivered.</Text>
          )}

          {isSeller && post.status === "exchanged" && (
            <Text style={styles.infoText}>The product has been delivered.</Text>
          )}
        </View>
      )}

      <View style={{ flex: 1 }}>
        <GiftedChat
          messages={messages}
          onSend={(msgs) => handleSend(msgs)}
          user={{
            _id: firebaseUser.uid,
            name: userProfile?.name || "You",
          }}
          renderAvatar={renderCustomAvatar}
          renderAvatarOnTop
          renderUsernameOnMessage
          bottomOffset={20}
          placeholder="Type a message…"
          alwaysShowSend
        />
        <Portal>
          <Dialog visible={showCancelDialog} onDismiss={() => setShowCancelDialog(false)}>
            <Dialog.Title>Cancel Reservation</Dialog.Title>
            <Dialog.Content>
              <Text>Are you sure you want to cancel this reservation? </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowCancelDialog(false)} mode="text">No</Button>
              <Button onPress={confirmCancelReservation} style={{borderRadius: 8, paddingHorizontal: 10}} mode="contained" >Yes</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  username: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#222",
  },
  product: {
    fontSize: 14,
    color: "#666",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#555",
    flexShrink: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
