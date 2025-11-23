import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
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
import { StyleSheet, View } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import { ActivityIndicator, Text } from "react-native-paper";
import { auth, db } from "../../firebaseConfig";

export default function ChatScreen() {
  const params = useLocalSearchParams();

  const chatId = params.chatId;
  const otherUserName = params.otherUserName;
  const productTitle = params.productTitle;

  const firebaseUser = auth.currentUser;

  const [messages, setMessages] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

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

    return () => unsub();
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

  const renderCustomAvatar = (props) => (
    <Ionicons
      name="person-circle-outline"
      size={32}
      color={props.position === "left" ? "#999" : "#4b7bec"}
      style={{ marginLeft: props.position === "left" ? 0 : 4 }}
    />
  );

  if (!messages || !userProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={42} color="#777" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.username}>{otherUserName}</Text>
          <Text style={styles.product}>{productTitle}</Text>
        </View>
      </View>

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
    </View>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
