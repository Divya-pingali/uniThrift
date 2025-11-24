import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { ActivityIndicator, Searchbar, Text } from "react-native-paper";
import { auth, db } from "../../firebaseConfig";

export default function ChatListScreen() {
  const router = useRouter();
  const firebaseUser = auth.currentUser;

  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [userProfiles, setUserProfiles] = useState({});
  const [productTitles, setProductTitles] = useState({});

  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", firebaseUser.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setChats(items);
      setFilteredChats(items);
      setLoading(false);

      const profilePromises = items.map(async (chat) => {
        const otherUserId = chat.participants.find(
          (uid) => uid !== firebaseUser.uid
        );

        if (!otherUserId || userProfiles[otherUserId]) return null;

        const ref = doc(db, "users", otherUserId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          return { uid: otherUserId, name: snap.data().name };
        }

        return null;
      });

      const profiles = await Promise.all(profilePromises);
      const newProfiles = { ...userProfiles };
      profiles.forEach((p) => {
        if (p) newProfiles[p.uid] = p.name;
      });
      setUserProfiles(newProfiles);

      const titlePromises = items.map(async (chat) => {
        if (!chat.listingId || productTitles[chat.listingId]) return null;

        const ref = doc(db, "posts", chat.listingId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          return { id: chat.listingId, title: snap.data().title };
        }

        return null;
      });

      const titles = await Promise.all(titlePromises);
      const newTitles = { ...productTitles };
      titles.forEach((t) => {
        if (t) newTitles[t.id] = t.title;
      });
      setProductTitles(newTitles);
    });

    return () => unsub();
  }, [firebaseUser]);

  const handleSearch = (text) => {
    setSearch(text);
    const term = text.toLowerCase();

    if (!term.trim()) {
      setFilteredChats(chats);
      return;
    }

    const filtered = chats.filter((chat) => {
      const otherUserId = chat.participants.find(
        (uid) => uid !== firebaseUser.uid
      );
      const otherUserName = userProfiles[otherUserId] || "";
      const productTitle = chat.listingId
        ? productTitles[chat.listingId] || ""
        : chat.listingName || "";
      const lastMessage = chat.lastMessage || "";

      return (
        otherUserName.toLowerCase().includes(term) ||
        productTitle.toLowerCase().includes(term) ||
        lastMessage.toLowerCase().includes(term)
      );
    });

    setFilteredChats(filtered);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );

  if (!chats || chats.length === 0)
    return (
      <View style={styles.center}>
        <Searchbar
          placeholder="Search conversations…"
          value={search}
          onChangeText={handleSearch}
          style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 8 }}
        />
        <Text>No conversations yet</Text>
      </View>
    );

  return (
    <>
      <Searchbar
        placeholder="Search conversations…"
        value={search}
        onChangeText={handleSearch}
        style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 8 }}
      />

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: "#eee" }} />
        )}
        renderItem={({ item }) => {
          const otherUserId = item.participants.find(
            (uid) => uid !== firebaseUser.uid
          );

          const otherUserName = userProfiles[otherUserId] || "User";

          const productTitle = item.listingId
            ? productTitles[item.listingId] || "Listing"
            : item.listingName || "Listing";

          const lastMessage = item.lastMessage || "No messages yet";

          const time = item.lastMessageAt
            ? new Date(item.lastMessageAt.seconds * 1000).toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" }
              )
            : "";

          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/chats/[chatId]",
                  params: {
                    chatId: item.id,
                    otherUserName,
                    productTitle,
                  },
                })
              }
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: "#f4f4f4" },
              ]}
            >
              <View style={styles.avatarContainer}>
                <Ionicons name="person-circle-outline" size={48} color="#999" />
              </View>

              <View style={styles.content}>
                <View style={styles.topRow}>
                  <Text style={styles.name}>{otherUserName}</Text>
                  <Text style={styles.time}>{time}</Text>
                </View>

                <Text numberOfLines={1} style={styles.productTag}>
                  {productTitle}
                </Text>

                <Text numberOfLines={1} style={styles.message}>
                  {lastMessage}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "white",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  productTag: {
    alignSelf: "flex-start",
    backgroundColor: "#F2F4F7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    color: "#666",
  },
});
