import { useRouter } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList } from "react-native";
import { FAB, Text } from "react-native-paper";
import PostCard from "../../components/PostCard";
import { db } from "../../firebaseConfig";

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPosts(fetched);
    });

    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <>
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      numColumns={2}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ margin: 16 }}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      renderItem={({ item }) => <PostCard post={item} />}
      ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>No posts yet</Text>}
    />
    <FAB
      icon="magnify"
      size="medium"
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'white',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4
      }}
      onPress={() => {
        router.push('/postSearch');
      }}
    />
    </>
  );
}
