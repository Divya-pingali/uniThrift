import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from "react-native";
import { Chip, Text, useTheme } from "react-native-paper";
import PostCard from "../components/PostCard";
import { db } from "../firebaseConfig";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CategoriesPosts() {
  const params = useLocalSearchParams();
  const initialSelected = decodeURIComponent(params.selected || "");
  const theme = useTheme();

  const [selectedCategories, setSelectedCategories] = useState(
    initialSelected ? [initialSelected] : []
  );
  const [posts, setPosts] = useState([]);
  const screenWidth = Dimensions.get("window").width;
  const categories = [
    "Electronics",
    "Furniture",
    "Kitchenware",
    "Study Supplies",
    "Clothing & Accessories",
    "Appliances",
    "Personal Care",
  ];

  useEffect(() => {
    const q = query(collection(db, "posts"), where("status", "==", "available"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(fetched);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (params.selected) {
      setSelectedCategories([decodeURIComponent(params.selected)]);
    }
  }, [params.selected]);

  const toggleCategory = (cat) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) return prev.filter((c) => c !== cat);
      if (prev.length >= 3) return prev;
      return [...prev, cat];
    });
  };

  const filteredPosts = posts.filter(
    (p) => p.tags && p.tags.some((tag) => selectedCategories.includes(tag))
  );

  const sortedCategories = [...categories].sort((a, b) => {
    const aSelected = selectedCategories.includes(a);
    const bSelected = selectedCategories.includes(b);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

  const renderHeader = () => (
    <>
      <Text
        variant="headlineMedium"
        style={{
          fontWeight: "bold",
          marginTop: 24
        }}
      >
        Browse
      </Text>
      <Text
        variant="titleMedium"
        style={{
          marginBottom: 18,
        }}
      >
        Select categories
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginBottom: 36,
        }}
      >
        {sortedCategories.map((cat) => {
          const selected = selectedCategories.includes(cat);
          return (
            <Chip
              key={cat}
              mode="outlined"
              selected={selected}
              selectedColor={theme.colors.primary}
              onPress={() => toggleCategory(cat)}
              icon={() => (
                <Ionicons
                  name={selected ? "checkmark" : null}
                  size={16}
                  color={
                    selected
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.primary
                  }
                />
              )}
              style={[
                styles.chip,
                { borderColor: theme.colors.primary },
                selected && {
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
              textStyle={
                selected && { color: theme.colors.onPrimaryContainer }
              }
            >
              {cat}
            </Chip>
          );
        })}
      </ScrollView>
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={filteredPosts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              width: screenWidth * 0.44
            }}
          >
            <PostCard post={item} />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 280}}>
            No posts found.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    marginRight: 8,
  },
});
