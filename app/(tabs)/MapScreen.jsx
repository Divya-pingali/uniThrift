import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Appearance, Image, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Button, Text, useTheme } from "react-native-paper";
import { db } from "../../firebaseConfig";

function MapScreen() {
  const theme = useTheme();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());

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

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });

    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View
        onLayout={e => {
          const h = e.nativeEvent.layout.height || 0;
          setHeaderHeight(h);
        }}
        style={{
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          paddingTop: 24,
          paddingHorizontal: 8,
          backgroundColor: theme.colors.background,
        }}
      >
        <Text
          variant="headlineMedium"
          style={{
            fontWeight: "bold",
            marginLeft: 8,
            color: theme.colors.onSurface,
          }}
        >
          Map
        </Text>
        <Text
          variant="titleMedium"
          style={{
            marginLeft: 8,
            marginBottom: 12,
            color: theme.colors.onSurface,
            opacity: 0.8,
          }}
        >
          Find listings near you
        </Text>
      </View>
      <MapView
        key={colorScheme}
        ref={mapRef}
        style={[StyleSheet.absoluteFill, { top: headerHeight, bottom: 0 }]}
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
        <View style={[styles.previewCard, { backgroundColor: theme.colors.surfaceContainerLowest }]}>
          <Image
            source={{ uri: selectedPost.image }}
            style={styles.previewImg}
          />

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.previewTitle, { color: theme.colors.onSurface }]}>{selectedPost.title}</Text>

            {/* Price badge similar to postDetail.jsx */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View
                style={{
                  borderRadius: 8,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  backgroundColor:
                    selectedPost.postType === "sell"
                      ? '#2e7d3215'
                      : selectedPost.postType === "rent"
                      ? '#0d47a11A'
                      : '#6a1b9a20',
                }}
              >
                {selectedPost.postType === 'sell' && (
                  <Text style={{ fontWeight: '700', fontSize: 14, color: '#2e7d32' }}>
                    {`$${selectedPost.sellingPrice}`}
                  </Text>
                )}

                {selectedPost.postType === 'rent' && (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ fontWeight: '700', fontSize: 14, color: '#0d47a1' }}>
                      {`$${selectedPost.rentalPrice}`}
                    </Text>
                    <Text style={{ color: '#0d47a1', marginLeft: 6 }}>{`/ ${selectedPost.rentalPriceUnit}`}</Text>
                  </View>
                )}

                {selectedPost.postType === 'donate' && (
                  <Text style={{ fontWeight: '700', fontSize: 14, color: '#6a1b9a' }}>
                    {'FREE'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <Button
            mode="contained"
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            style={{ margin: 8, borderRadius: 8 }}
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
