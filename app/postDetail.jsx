import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Button, Divider, Text, useTheme } from "react-native-paper";
import { db } from "../firebaseConfig";

import { useRouter } from "expo-router";
import BackButton from "../components/BackButton";
import CATEGORY_COLORS from "../constants/categoryColors";
import { auth } from "../firebaseConfig";

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userBio, setUserBio] = useState("");
  const [userImage, setUserImage] = useState("");
  const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const theme = useTheme();

  useEffect(() => {
    const fetchPost = async () => {
      const ref = doc(db, "posts", id);
      const snap = await getDoc(ref);
      if (snap.exists()) setPost({ id, ...snap.data() });
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  useEffect(() => {
    async function fetchUserDetails() {
      if (!post?.userId) return;
      const userRef = doc(db, "users", post.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserName(data.name || "");
        setUserBio(data.bio || "");
        setUserImage(data.image || "");
      }
    }
    fetchUserDetails();
  }, [post]);

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

    const sellerDocRef = doc(db, "users", sellerId);
    const sellerDocSnap = await getDoc(sellerDocRef);
    const sellerName = sellerDocSnap.exists()
      ? sellerDocSnap.data().name
      : "Seller";

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", buyerId)
    );

    const snap = await getDocs(q);

    let existingChat = null;

    snap.forEach((docSnap) => {
      const c = docSnap.data();
      if (c.participants.includes(sellerId) && c.listingId === listingId) {
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
      params: {
        chatId: chatId,
        otherUserName: sellerName,
        productTitle: post.title,
        postId: listingId,
      },
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          marginTop: 8,
        }}
      >
        <BackButton fallback="/(tabs)/home" />
      </View>

      {loading || !post ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.colors.background,
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={{ backgroundColor: theme.colors.background }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={{ uri: post.image }}
            style={{
              width: "100%",
              height: 450,
              borderRadius: 8,
              marginBottom: 12,
            }}
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
              {tags.map((tag, index) => {
                const category = CATEGORY_COLORS[tag];
                const bgColor = category
                  ? category.color
                  : theme.colors.surfaceVariant;
                const textColor = category ? category.textColor : "#FFFFFF";
                return (
                  <View
                    key={index}
                    style={{
                      backgroundColor: bgColor,
                      borderRadius: 6,
                      paddingVertical: 4,
                      paddingHorizontal: 7,
                      marginRight: 6,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "700",
                        color: textColor,
                        textTransform: "uppercase",
                      }}
                    >
                      {tag}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          <View
            style={{
              alignItems: "flex-start",
              marginBottom: 12,
              width: "100%",
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                marginBottom: 12,
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
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 16,
                      color: "#2e7d32",
                    }}
                  >
                    {`$${post.sellingPrice}`}
                  </Text>
                )}
                {post.postType === "rent" && (
                  <View
                    style={{ flexDirection: "row", alignItems: "baseline" }}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        fontSize: 16,
                        color: "#0d47a1",
                      }}
                    >
                      {`$${post.rentalPrice}`}
                    </Text>
                    <Text style={{ color: "#0d47a1" }}> / </Text>
                    <Text
                      style={{
                        fontWeight: "400",
                        fontSize: 12,
                        color: "#0d47a1",
                      }}
                    >
                      {post.rentalPriceUnit}
                    </Text>
                  </View>
                )}
                {post.postType === "donate" && (
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 16,
                      color: "#6a1b9a",
                    }}
                  >
                    {"FREE"}
                  </Text>
                )}
              </View>
              {post.postType === "rent" && post.rentalPriceDeposit && (
                <View
                  style={{
                    marginLeft: 8,
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: "#ffc10730",
                  }}
                >
                  <View
                    style={{ flexDirection: "row", alignItems: "baseline" }}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        fontSize: 16,
                        color: "#ff8f00",
                      }}
                    >
                      {`$${post.rentalPriceDeposit}`}
                    </Text>
                    <Text
                      style={{
                        fontWeight: "400",
                        fontSize: 12,
                        color: "#ff8f00",
                        marginLeft: 4,
                      }}
                    >
                      Refundable Deposit
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View
            style={{
              backgroundColor: theme.colors.surfaceContainerLow,
              borderRadius: 8,
              padding: 12,
              marginTop: 4,
              marginBottom: 16,
            }}
          >
            <Text variant="titleMedium" style={{ marginBottom: 4 }}>
              Item Description
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}
            >
              {post.description}
            </Text>
          </View>

          {post.postType === "rent" && post.rentalPriceDuration && (
            <View style={{ padding: 8, marginBottom: 16 }}>
              <Text variant="titleMedium" style={{ marginBottom: 2 }}>
                Available For
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface }}
              >
                {post.rentalPriceDuration}
              </Text>
            </View>
          )}

          {post.location && (
            <View
              style={{
                borderRadius: 8,
                backgroundColor: theme.colors.surfaceContainerLow,
                borderWidth: 0.2,
                borderColor: theme.colors.outline,
                overflow: "hidden",
                marginBottom: 16,
              }}
              elevation={4}
            >
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
                  <Text
                    variant="titleMedium"
                    style={{ paddingLeft: 12, paddingTop: 8, marginBottom: 4 }}
                  >
                    Pickup Location
                  </Text>
                  <Ionicons
                    name="open-outline"
                    size={16}
                    color={theme.colors.onSurface}
                    style={{ marginLeft: 6, paddingTop: 6, marginBottom: 4 }}
                  />
                </View>
                <Text
                  variant="bodySmall"
                  style={{
                    paddingHorizontal: 12,
                    paddingBottom: 12,
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  {post.location?.text?.text}
                </Text>
              </Pressable>
            </View>
          )}
          <Divider style={{ marginVertical: 16 }} />
          <Text
            variant="titleMedium"
            style={{ marginBottom: 2, paddingHorizontal: 8 }}
          >
            Listed by
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 16,
              width: "80%",
              paddingHorizontal: 8,
            }}
          >
            {userImage ? (
              <Image
                source={{ uri: userImage }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  marginRight: 12,
                }}
              />
            ) : (
              <Ionicons
                name="person-circle"
                size={48}
                color={theme.colors.onSurfaceVariant}
                style={{ marginRight: 12 }}
              />
            )}
            <View>
              <Text variant="titleSmall" style={{ fontWeight: "bold" }}>
                {userName}
              </Text>
              {userBio ? (
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {userBio}
                </Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
      )}

      <View
        style={{
          backgroundColor: theme.colors.background,
          paddingBottom: 24,
          paddingTop: 8,
        }}
      >
        <Button
          onPress={startChat}
          mode="contained"
          style={{
            marginHorizontal: 24,
            borderRadius: 16,
            height: 45,
            justifyContent: "center",
          }}
        >
          Contact Seller
        </Button>
      </View>
    </View>
  );
}
