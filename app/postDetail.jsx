import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from "expo-router";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, View } from "react-native";
import { Button, Text } from "react-native-paper";
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
  const sellerId = post.userId;
  const listingId = post.id;

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

  if (!chatId) {
    const ref = await addDoc(collection(db, "chats"), {
      participants: [buyerId, sellerId],
      listingId,
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
    });

    chatId = ref.id;
  }

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
            style={{ width: "100%", height: 450, borderRadius: 8, marginBottom: 12 }}
            elevation={4}
          />

          {tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              {tags.map((tag, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.05)",
                    borderRadius: 6,
                    paddingVertical: 4,
                    paddingHorizontal: 7,
                    marginRight: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "bold",
                      color: "rgba(0,0,0,1)",
                      textTransform: "uppercase",
                    }}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={{ alignItems: "flex-start", marginBottom: 12, width: "100%" }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                marginBottom: 12
              }}
            >
              {post.title}
            </Text>
            
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  backgroundColor:
                    post.postType === "sell"
                      ? "#2e7d3215"
                      : post.postType === "rent"
                      ? "#0d47a11A"
                      : "#6a1b9a20",
                }}
              >
                {post.postType === "sell" && (
                  <Text style={{ fontWeight: "700", fontSize: 16, color: "#2e7d32" }}>
                    {`$${post.sellingPrice}`}
                  </Text>
                )}
                {post.postType === "rent" && (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ fontWeight: "700", fontSize: 16, color: "#0d47a1" }}>
                      {`$${post.rentalPrice}`}
                    </Text>
                    <Text style={{ color: '#0d47a1' }}> / </Text>
                    <Text style={{ fontWeight: "400",fontSize: 12, color: "#0d47a1" }}>
                      {post.rentalPriceUnit}
                    </Text>
                  </View>
                )}
                {post.postType === "donate" && (
                  <Text style={{ fontWeight: "700", fontSize: 16, color: "#6a1b9a" }}>
                    {"FREE"}
                  </Text>
                )}
              </View>
              {post.postType === "rent" && post.rentalPriceDeposit && (
                <View style={{ marginLeft: 8, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#ffc10730" }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ fontWeight: "700", fontSize: 16, color: "#ff8f00" }}>
                      {`$${post.rentalPriceDeposit}`}
                    </Text>
                    <Text style={{ fontWeight: "400", fontSize: 12, color: "#ff8f00", marginLeft: 4 }}>
                      Refundable Deposit
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
            
          <View style={{ backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 8, padding: 12, marginTop: 4, marginBottom: 16 }}>
            <Text variant="titleMedium" style={{ marginBottom: 4 }}>Item Description</Text>
            <Text variant="bodyMedium" style={{ color: "rgba(0,0,0,0.7)", lineHeight: 22 }}>
              {post.description}
            </Text>
          </View>

          {post.postType === "rent" && post.rentalPriceDuration && (
            <View style={{ padding: 8, marginBottom: 16 }}>
              <Text variant="titleMedium" style={{ marginBottom: 2 }}>Available For</Text>
              <Text variant="bodyMedium" style={{ color: "rgba(0,0,0,0.7)" }}>
                {post.rentalPriceDuration}
              </Text>
            </View>
          )}

          { post.location && (
            <View style={{ borderRadius: 8, backgroundColor: "rgba(225,225,225,1)", border: 2, borderColor:'#aeaeae', overflow: "hidden" }} elevation={4}>
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
                    style={{ width: "100%", height: 220 }}
                  />
                )}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text variant="titleMedium" style={{ paddingLeft: 12, paddingTop: 8, marginBottom: 4 }}>Pickup Location</Text>
                  <Ionicons name="open-outline" size={16} color="black" style={{ marginLeft: 6, paddingTop: 6, marginBottom: 4 }} />
                </View>
                <Text variant="bodySmall" style={{ paddingHorizontal: 12, paddingBottom: 12, color: "rgba(0,0,0,0.7)" }}>
                  {post.location?.text?.text}
                </Text>
              </Pressable>
              
            </View>
          )}
        </ScrollView>
      )}

      <Button onPress={startChat} mode="contained" style={{ margin: 8, width: "90%", alignSelf: "center", borderRadius: 16, height: 45, justifyContent: "center" }}>
        Contact Seller
      </Button>
    </>
  );
}
