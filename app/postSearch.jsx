import { useRouter } from "expo-router";
import {
  collection,
  endAt,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
} from "firebase/firestore";
import { useRef, useState } from "react";
import { Dimensions, FlatList, Pressable, View } from "react-native";
import {
  ActivityIndicator,
  Searchbar,
  Text,
  useTheme,
} from "react-native-paper";
import BackButton from "../components/BackButton";
import PostCard from "../components/PostCard";
import { db } from "../firebaseConfig";

export default function PostSearchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const screenWidth = Dimensions.get("window").width;

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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: 14,
          marginTop: 14,
        }}
      >
        <BackButton fallback="/(tabs)/home" />
        <Searchbar
          placeholder="Search posts…"
          value={search}
          onChangeText={handleChange}
          onSubmitEditing={() => {
            setSuggestions([]);
            searchPosts(search);
          }}
          style={{
            flex: 1,
            backgroundColor: theme.colors.surfaceContainerLow,
          }}
          inputStyle={{ color: theme.colors.onSurface }}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          iconColor={theme.colors.primary}
          autoFocus
        />
      </View>
      {suggestions.length > 0 && (
        <View
          style={{
            marginHorizontal: 14,
            backgroundColor: theme.colors.surfaceContainerLow,
            borderRadius: 8,
            paddingVertical: 8,
          }}
        >
          {suggestions.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => selectSuggestion(item)}
              style={({ pressed }) => [
                { padding: 12 },
                pressed && { backgroundColor: theme.colors.surfaceDisabled },
              ]}
            >
              <Text style={{ fontSize: 16, color: theme.colors.onSurface }}>
                {item.title}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{
          paddingHorizontal: 14,
        }}
        renderItem={({ item }) => (
          <View style={{ width: screenWidth * 0.44, marginBottom: 14 }}>
            <PostCard
              post={item}
              onPress={() => router.push(`/postDetail?postId=${item.id}`)}
            />
          </View>
        )}
      />
    </View>
  );
}
