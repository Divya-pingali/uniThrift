// app/chats/[chatId].js
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
    setDoc
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import { ActivityIndicator } from "react-native-paper";
import { auth, db } from "../../firebaseConfig";

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams();

  // Logged in user
  const firebaseUser = auth.currentUser;
  const [userProfile, setUserProfile] = useState(null);

  // Messages loaded from Firestore
  const [messages, setMessages] = useState(null);

  // Fetch user’s Firestore profile to get "name"
  useEffect(() => {
    async function fetchUser() {
      if (!firebaseUser) return;
      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setUserProfile(snap.data());
    }
    fetchUser();
  }, [firebaseUser]);

  // Listen for messages
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          _id: docSnap.id,
          text: data.text,
          createdAt: data.createdAt?.toDate() || new Date(),
          user: {
            _id: data.senderId
          }
        };
      });

      setMessages(msgs);
    });

    return () => unsub();
  }, [chatId]);

  // Send a message
  const handleSend = useCallback(async (msgs = []) => {
    const m = msgs[0];
    if (!m || !m.text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: m.text.trim(),
      senderId: firebaseUser.uid,
      createdAt: serverTimestamp(),
    });

    // update chat metadata
    await setDoc(
      doc(db, "chats", chatId),
      {
        lastMessage: m.text.trim(),
        lastMessageAt: serverTimestamp(),
      },
      { merge: true }
    );
  }, [chatId, firebaseUser]);

  if (!messages || !userProfile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GiftedChat
      messages={messages}
      onSend={(msgs) => handleSend(msgs)}
      user={{
        _id: firebaseUser.uid,
        name: userProfile?.name || "User"
      }}
      placeholder="Type a message..."
      alwaysShowSend
    />
  );
}
