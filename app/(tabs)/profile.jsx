import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, doc, getDoc, getFirestore, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Dimensions, FlatList, Image, StyleSheet, TouchableHighlight, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import PostCard from "../../components/PostCard";
import { auth } from "../../firebaseConfig";

export default function Profile() {
  const router = useRouter();
  const theme = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userBio, setUserBio] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userImage, setUserImage] = useState(null);

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.log("Error signing out: ", error);
    }
  };

  useEffect(() => {
    const authInstance = getAuth();
    const db = getFirestore();
    const user = authInstance.currentUser;
    if (!user) return;

    // Fetch user data once
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserName(data.name || "Your Profile");
          setUserEmail(data.email || "");
          setUserBio(data.bio || "");
          setUserPhone(data.phone || "");
          setUserImage(data.image || null);
        } else {
          setUserName(user.displayName || "Your Profile");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();

    // Real-time listener for user's posts
    const postsRef = collection(db, "posts");
    const q = query(postsRef, where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(userPosts);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const screenWidth = Dimensions.get("window").width;

  const renderHeader = () => (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Text variant="headlineMedium" style={{ fontWeight: "bold" }}>Profile</Text>
        <Button mode="text" onPress={signOut} textColor={theme.colors.error}>Sign Out</Button>
      </View>

      <TouchableHighlight
        onPress={() => router.push("/editProfile")}
        underlayColor="rgba(0,0,0,0.1)"
        style={styles(theme).touchableCard}
      >
        <View style={styles(theme).profileCard}>
          <View style={styles(theme).imageContainer}>
            {userImage ? (
              <Image source={{ uri: userImage }} style={styles(theme).profileImage} />
            ) : (
              <Ionicons name="person-circle" size={120} color="#ccc" style={styles(theme).defaultImage} />
            )}
          </View>
          <View style={styles(theme).textContainer}>
            <Text variant="headlineSmall" style={styles(theme).userName}>{userName}</Text>
            {userEmail && <Text variant="bodySmall" style={styles(theme).userEmail}>{userEmail}</Text>}
            {userBio && <Text variant="bodySmall" style={styles(theme).userBio}>{userBio}</Text>}
          </View>
        </View>
      </TouchableHighlight>

      <Text
        variant="titleLarge"
        style={{ fontWeight: "bold", marginBottom: 12, marginTop: 42 }}
      >
        Your Posts
      </Text>
    </>
  );

  if (loading) {
    return (
      <View style={styles(theme).container}>
        {renderHeader()}
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      <FlatList
        data={posts}
        numColumns={2}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ width: screenWidth * 0.44 }}>
            <PostCard post={item} editable={true} />
          </View>
        )}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={{ marginTop: 16 }}>No posts found.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    backgroundColor: theme.colors.background
  },
  title: {
    fontWeight: "600",
    textAlign: "left"
  },
  bioContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  profileCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 8,
    elevation: 4,
    borderWidth: 0.25,
    borderColor: "#aeaeae",
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 16,
  },
  touchableCard: {
    borderRadius: 16,
    margin: 4,
    marginTop: 50,
  },
  imageContainer: {
    position: 'absolute',
    top: -60,
    alignItems: 'center',
    zIndex: 1,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#aeaeae',
  },
  defaultImage: {
    width: 120,
    height: 120,
    borderRadius: 60
  },
  textContainer: {
    alignItems: 'center',
    width: '100%'
  },
  userName: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  userEmail: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 8,
  },
  userBio: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  }
});
