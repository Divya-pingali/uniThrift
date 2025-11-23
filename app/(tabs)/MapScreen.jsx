import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import MapView from "react-native-map-clustering";
import { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Button, Text } from "react-native-paper";
import { db } from "../../firebaseConfig";

function MapScreen() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const router = useRouter();

  const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

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
              // fallback: return post as is
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

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 22.3193,
          longitude: 114.1694,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        clusterColor="#2e7d32"   
        clusterTextColor="white"    
        spiralEnabled={true}   
      >
        {posts.map(post => {
          if (!post.location?.latitude || !post.location?.longitude) return null;
            let pinColor = 'green'; 
            if (post.postType === 'rent') pinColor = 'blue'; 
            if (post.postType === 'donate') pinColor = 'purple';
            return (
              <Marker
                key={post.id}
                coordinate={{
                  latitude: post.location.latitude,
                  longitude: post.location.longitude,
                }}
                onPress={() => setSelectedPost(post)}
                pinColor={pinColor}
              >
                <View>
                <Ionicons name="location-sharp" size={35} color={pinColor} />
                </View>
              </Marker>
            );
        })}
      </MapView>

      {/* Preview Card */}
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
