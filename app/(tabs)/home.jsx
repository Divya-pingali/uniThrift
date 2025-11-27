import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Dimensions, Pressable, ScrollView, View } from "react-native";
import { FAB, Text } from "react-native-paper";
import PostCard from "../../components/PostCard";
import { auth, db } from "../../firebaseConfig";

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [userName, setUserName] = useState("");

  const screenWidth = Dimensions.get("window").width;

  const categories = [
    { display: "Clothing", firestore: "Clothing & Accessories", color: "#6750A41A", icon: "shirt-outline", iconColor: "#6750A4" },
    { display: "Electronics", firestore: "Electronics", color: "#007AFF1A", icon: "phone-portrait-outline", iconColor: "#007AFF" },
    { display: "Furniture", firestore: "Furniture", color: "#CD5C5C1A", icon: "bed-outline", iconColor: "#CD5C5C" },
    { display: "Kitchenware", firestore: "Kitchenware", color: "#FF8C001A", icon: "cafe-outline", iconColor: "#FF8C00" },
    { display: "Study Supplies", firestore: "Study Supplies", color: "#32CD321A", icon: "book-outline", iconColor: "#32CD32" },
    { display: "Personal Care", firestore: "Personal Care", color: "#DA70D61A", icon: "sparkles-outline", iconColor: "#DA70D6" },
    { display: "Appliances", firestore: "Appliances", color: "#0080801A", icon: "home-outline", iconColor: "#008080" },
  ];

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) setUserName(snap.data().name);
        else setUserName(user.displayName || "");
      }
    };
    fetchUserName();

    const q = query(collection(db, "posts"), where("status", "==", "available"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(fetched);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ marginTop: 24, marginBottom: 42, paddingHorizontal: 16 }}>
          <Text variant="titleMedium">Welcome,</Text>
          <Text variant="headlineMedium" style={{ fontWeight: "bold" }}>
            {userName}
          </Text>
        </View>

        <View>
          <Text
            variant="titleLarge"
            style={{
              fontWeight: "bold",
              marginBottom:8,
              paddingHorizontal: 16,
            }}
          >
            Recently Added
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {posts.slice(0, 10).map((post) => (
              <View
                key={post.id}
                style={{ width: screenWidth * 0.44 }}
              >
                <PostCard post={post} />
              </View>
            ))}
          </ScrollView>

          <Text
            variant="titleLarge"
            style={{
              fontWeight: "bold",
              marginBottom: 12,
              paddingHorizontal: 16,
            }}
          >
            Search by Category
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              paddingHorizontal: 16,
            }}
          >
            {categories.map((cat) => (
              <Pressable
                key={cat.display}
                style={({ pressed }) => [
                  {
                    width: "48%",
                    marginBottom: 12,
                    borderRadius: 8,
                    backgroundColor: cat.color,
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/CategoriesPosts",
                    params: { selected: cat.firestore },
                  })
                }
              >
                <View
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 12,
                    alignItems: "center",
                  }}
                >
                  <Ionicons name={cat.icon} size={32} color={cat.iconColor} />
                  <Text style={{ color: cat.iconColor, fontWeight: "bold", marginTop: 8, textAlign: "center" }}>
                    {cat.display}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      <FAB
        icon="magnify"
        size="medium"
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          backgroundColor: "#6750A4",
        }}
        onPress={() => router.push("/postSearch")}
        color="white"
      />
    </>
  );
}
