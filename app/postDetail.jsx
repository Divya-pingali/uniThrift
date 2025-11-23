import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from "expo-router";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, View } from "react-native";
import { Button, Chip, Divider, Text } from "react-native-paper";
import { db } from "../firebaseConfig";

import { useRouter } from "expo-router";
import { auth } from "../firebaseConfig";



export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const fetchPost = async () => {
      const ref = doc(db, "posts", id);
      const snap = await getDoc(ref);
      if (snap.exists()) setPost({ id, ...snap.data() });
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  const placeId = post?.location?.placeId;
  const queryText =
    post?.location?.structuredFormat?.text ||
    post?.location?.structuredFormat?.secondaryText?.text ||
    "Location";

  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!placeId) return;
    const fetchCoords = async () => {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${MAPS_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.results.length > 0) {
        const { lat, lng } = json.results[0].geometry.location;
        setCoords({ lat, lng });
      }
    };
    fetchCoords();
  }, [placeId]);

  const tags = Array.isArray(post?.tags) ? post.tags : [];

  const router = useRouter();

async function startChat() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const buyerId = currentUser.uid;
  const sellerId = post.userId;   // <-- IMPORTANT: your field
  const listingId = post.id;

  // 1. Check if chat already exists
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", buyerId)
  );

  const snap = await getDocs(q);

  let existingChat = null;

  snap.forEach((docSnap) => {
    const c = docSnap.data();
    if (
      c.participants.includes(sellerId) &&
      c.listingId === listingId
    ) {
      existingChat = docSnap.id;
    }
  });

  let chatId = existingChat;

  // 2. No chat found? Create a new one
  if (!chatId) {
    const ref = await addDoc(collection(db, "chats"), {
      participants: [buyerId, sellerId],
      listingId,
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
    });

    chatId = ref.id;
  }

  // 3. Navigate to chat
  router.push({
    pathname: "/chats/[chatId]",
    params: { chatId },
  });
}

  return (
    <>
      {loading || !post ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
          <Image
            source={{ uri: post.image }}
            style={{ width: "100%", height: 400, borderRadius: 4, marginBottom: 16 }}
            elevation={1}
          />

          <View style={{ alignItems: "flex-start", marginBottom: 8, width: "100%" }}>
           <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              marginBottom: 6
            }}
          >
            {post.title}
          </Text>

          {tags.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          {tags.map((tag, index) => (
            <Chip
              key={index}
              style={{
                marginRight: 4,
                marginBottom: 4,
                borderRadius: 999,
                height: 32,
                justifyContent: "center",
              }}
              textStyle={{
                fontSize: 10,
                textTransform: "uppercase",
                fontWeight: 'bold'
              }}
            >
              {tag}
            </Chip>
          ))}
        </View>
      )}
            <View
              style={{
                borderRadius: 6,
                paddingVertical: 16,
                paddingHorizontal: 16,
                alignSelf: "flex-start",
                backgroundColor:
                  post.postType === "sell"
                    ? "#2e7d3215"
                    : post.postType === "rent"
                    ? "#0d47a11A"
                    : "#6a1b9a20",
                borderColor:
                  post.postType === "sell"
                    ? "#2e7d32"
                    : post.postType === "rent"
                    ? "#0d47a1"
                    : "#6a1b9a",
                borderWidth: 1,
              }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 15,
                  color:
                    post.postType === "sell"
                      ? "#2e7d32"
                      : post.postType === "rent"
                      ? "#0d47a1"
                      : "#6a1b9a",
                }}
              >
                {post.postType === "sell" && `$${post.sellingPrice}`}
                {post.postType === "rent" && `$${post.rentalPrice} / ${post.rentalPriceUnit}`}
                {post.postType === "donate" && "FREE"}
              </Text>
            </View>
            
            <Text variant="titleMedium" style={{ marginTop: 12 }}>Item Description</Text>
            <Text variant="bodyMedium" style={{ color: "rgba(0,0,0,0.7)", lineHeight: 22 }}>
              {post.description}
            </Text>

            { post.postType === "rent" && post.rentalPriceDeposit && (
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#E3E2E6", padding: 12, borderRadius: 8, marginVertical: 16 }}>
                <Ionicons name="information-circle-outline" size={25} color="#49454F" style={{ margin: 3 }} />
                <Text variant="titleSmall" style={{ marginBottom: 4 }}>
                  This item requires an initial deposit of {post.rentalPriceDeposit} HKD
                </Text>
              </View>
            )}

            { post.postType === "rent" && post.rentalPriceDuration && (
              <>
                <Text variant="titleMedium" style={{ marginTop: 8 }}>Available for</Text>
                <Text variant="titleSmall" style={{ marginBottom: 12, color: "rgba(0,0,0,0.6)" }}>
                  {post.rentalPriceDuration}
                </Text>
              </>
            )}
          </View>

          {post.location && (
            <>
              <Divider style={{ marginVertical: 16 }} color="rgba(0,0,0,0.4)" width="100%" />
              <Text variant="titleMedium" style={{ marginTop: 12 }}>Pickup Location</Text>
              <Text variant="titleSmall" style={{ marginBottom: 8, color: "rgba(0,0,0,0.6)" }}>
                {post.location?.text?.text}
              </Text>
              <Pressable
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      queryText
                    )}&query_place_id=${placeId}`
                  )
                }
              >
                {coords && (
                  <Image
                    source={{
                      uri: `https://maps.googleapis.com/maps/api/staticmap?size=600x300&scale=2&zoom=16&markers=color:red|${coords.lat},${coords.lng}&key=${MAPS_KEY}`,
                    }}
                    style={{ width: "100%", height: 220, borderRadius: 8, marginTop: 16 }}
                  />
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      )}

      <Button onPress={startChat} mode="contained" style={{ margin: 8, width: "90%", alignSelf: "center", borderRadius: 4, height: 45 }}>
        Contact Seller
      </Button>
    </>
  );
}
