// app/chats/index.js
import { useRouter } from "expo-router";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { ActivityIndicator, Divider, Text } from "react-native-paper";
import { auth, db } from "../../firebaseConfig";

export default function ChatsListScreen() {
  const router = useRouter();
  const firebaseUser = auth.currentUser;
  const [chats, setChats] = useState(null);

  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", firebaseUser.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setChats(items);
    });

    return () => unsub();
  }, [firebaseUser]);

  if (!chats) {
    return <Loading />;
  }

  if (chats.length === 0) {
    return <Empty />;
  }

  return (
    <FlatList
      data={chats}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={Divider}
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/chats/[chatId]",
              params: { chatId: item.id },
            })
          }
        >
          <View style={{ padding: 16 }}>
            <Text variant="titleMedium">Conversation</Text>
            <Text style={{ marginTop: 4, opacity: 0.65 }}>
              {item.lastMessage || "No messages yet"}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator />
    </View>
  );
}

function Empty() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>No conversations yet</Text>
    </View>
  );
}
