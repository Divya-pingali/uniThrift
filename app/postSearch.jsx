import { useRouter } from "expo-router";
import {
    collection,
    endAt,
    getDocs,
    limit,
    orderBy,
    query,
    startAt
} from "firebase/firestore";
import { useRef, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { ActivityIndicator, Searchbar, Text } from "react-native-paper";
import PostCard from "../components/PostCard";
import { db } from "../firebaseConfig";

export default function PostSearchScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const fetchSuggestions = async (term) => {
    if (!term.trim()) {
      setSuggestions([]);
      return;
    }

    const postsRef = collection(db, "posts");

    const q = query(
      postsRef,
      orderBy("title"),
      startAt(term),
      endAt(term + "\uf8ff"),
      limit(5) 
    );

    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setSuggestions(items);
  };

  const searchPosts = async (term) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    const postsRef = collection(db, "posts");

    const q = query(
      postsRef,
      orderBy("title"),
      startAt(term),
      endAt(term + "\uf8ff")
    );

    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    setLoading(false);
    setResults(items);
  };

  const handleChange = (text) => {
    setSearch(text);
    setResults([]); 
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 200);
  };

  const selectSuggestion = async (item) => {
    setSearch(item.title);
    setSuggestions([]);

    const exactMatches = suggestions.filter((s) =>
      s.title.toLowerCase().startsWith(item.title.toLowerCase())
    );

    if (exactMatches.length < 5) {
      setResults(exactMatches);
      return;
    }

    await searchPosts(item.title);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Searchbar
        placeholder="Search posts…"
        value={search}
        onChangeText={handleChange}
        onSubmitEditing={() => {
          setSuggestions([]);
          searchPosts(search);
        }}
        style={{ margin: 14 }}
      />
      {suggestions.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: 72,
            left: 14,
            right: 14,
            backgroundColor: "white",
            borderRadius: 8,
            paddingVertical: 8,
            elevation: 5,
            zIndex: 50
          }}
        >
          {suggestions.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => selectSuggestion(item)}
              style={{ padding: 12 }}
            >
              <Text style={{ fontSize: 16 }}>{item.title}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: suggestions.length > 0 ? 60 : 0
        }}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => router.push(`/posts/${item.id}`)}
          />
        )}
      />
    </View>
  );
}
