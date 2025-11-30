import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Button, Text, useTheme } from "react-native-paper";
import BackButton from "../../components/BackButton";
import { db } from "../../firebaseConfig";

function MapScreen() {
  const theme = useTheme();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const router = useRouter();
  const mapRef = useRef(null);

  const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const locationGroups = posts.reduce((acc, post) => {
    const key = `${post.location?.latitude},${post.location?.longitude}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {});

  function getJitterPosition(index, total) {
    if (total <= 1) return { latOffset: 0, lngOffset: 0 };
    const radius = 0.00012;
    const angle = (index / total) * 2 * Math.PI;

    return {
      latOffset: Math.cos(angle) * radius,
      lngOffset: Math.sin(angle) * radius,
    };
  }

  useEffect(() => {
    const fetchPosts = async () => {
      const snap = await getDocs(collection(db, "posts"));
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const updatedData = await Promise.all(
        data.map(async post => {
          if (
            post.location?.placeId &&
            (!post.location.latitude || !post.location.longitude)
          ) {
            try {
              const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${post.location.placeId}&key=${MAPS_KEY}`;
              const res = await fetch(url);
              const json = await res.json();
              if (json.results.length > 0) {
                const { lat, lng } = json.results[0].geometry.location;
                return {
                  ...post,
                  location: {
                    ...post.location,
                    latitude: lat,
                    longitude: lng,
                  },
                };
              }
            } catch (e) {
              return post;
            }
          }
          return post;
        })
      );

      setPosts(updatedData);
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setUserLocation(coords);

      mapRef.current?.animateToRegion(
        {
          ...coords,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    };

    getLocation();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 24,
          paddingHorizontal: 16,
          backgroundColor: theme.colors.background,
          zIndex: 10,
        }}
      >
        <BackButton fallback="/(tabs)/home" />
        <Text
          style={{
            fontWeight: "bold",
            fontSize: 22,
            marginLeft: 8,
            color: theme.colors.onSurface,
          }}
        >
          Map
        </Text>
      </View>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={true}
        initialRegion={{
          latitude: userLocation?.latitude || 22.3193,
          longitude: userLocation?.longitude || 114.1694,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {posts.map(post => {
          if (!post.location?.latitude || !post.location?.longitude) return null;

          const key = `${post.location.latitude},${post.location.longitude}`;
          const group = locationGroups[key];
          const index = group.indexOf(post);
          const total = group.length;

          const { latOffset, lngOffset } = getJitterPosition(index, total);

          const lat = post.location.latitude + latOffset;
          const lng = post.location.longitude + lngOffset;

          return (
            <Marker
              key={post.id}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => setSelectedPost(post)}
              pinColor={
                post.postType === "sell"
                  ? "green"
                  : post.postType === "rent"
                  ? "blue"
                  : post.postType === "donate"
                  ? "purple"
                  : "red"
              }
            />
          );
        })}
      </MapView>

      {selectedPost && (
        <View style={styles.previewCard}>
          <Image
            source={{ uri: selectedPost.image }}
            style={styles.previewImg}
          />

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.previewTitle}>{selectedPost.title}</Text>

            <Text style={styles.previewPrice}>
              {selectedPost.postType === "sell" &&
                `$${selectedPost.sellingPrice}`}
              {selectedPost.postType === "rent" &&
                `$${selectedPost.rentalPrice} / ${selectedPost.rentalPriceUnit}`}
              {selectedPost.postType === "donate" && "FREE"}
            </Text>
          </View>

          <Button
            mode="contained"
            style={{ margin: 8, borderRadius: 4, height: 45 }}
            onPress={() => router.push(`/postDetail?id=${selectedPost.id}`)}
          >
            View
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 6,
  },
  previewImg: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  previewTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  previewPrice: {
    marginTop: 4,
    fontSize: 14,
    color: "rgba(0,0,0,0.7)",
  },
});

export default MapScreen;
