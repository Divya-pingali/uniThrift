import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button, Card } from "react-native-paper";
import PostCard from "../../components/PostCard";
import { auth } from "../../firebaseConfig";

export default function Profile() {
        const router = useRouter();
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
                const fetchUserDataAndPosts = async () => {
                        try {
                                const authInstance = getAuth();
                                const db = getFirestore();
                                const user = authInstance.currentUser;
                                if (!user) return;
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
                                // Fetch user posts
                                const postsRef = collection(db, "posts");
                                const q = query(postsRef, where("userId", "==", user.uid));
                                const querySnapshot = await getDocs(q);
                                const userPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                setPosts(userPosts);
                        } catch (error) {
                                console.error("Error fetching user data or posts:", error);
                        } finally {
                                setLoading(false);
                        }
                };
                fetchUserDataAndPosts();
        }, []);

        const renderHeader = () => (
                <>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                <Text style={{ fontWeight: "bold", fontSize: 22 }}>Profile</Text>
                                <Button mode="outlined" onPress={signOut}
                                        style={styles.signOutButton}>
                                        Sign Out
                                </Button>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/editProfile')}>
                        <Card style={{ width: "100%", paddingBottom: 20, paddingHorizontal: 15 }}>
                                <View style={styles.bioContainer}>
                                        <View style={{ alignItems: "center", width: "25%" }}>
                                                {userImage ? (
                                                        <Image source={{ uri: userImage }} style={{ width: 70, height: 70, borderRadius: 35 }} />

                                                ) : (
                                                        <Ionicons name="person-circle" size={70} />
                                                )}
                                        </View>
                                        <View style={{ marginTop: 16, width: "74%" }}>
                                                <Text variant="titleMedium" style={styles.title}>{userName}</Text>
                                                {userBio ? (
                                                        <Text style={{ marginTop: 4, color: "#666", textAlign: "left" }}>{userBio}</Text>
                                                ) : null}
                                        </View>
                                </View>
                        </Card>
                        </TouchableOpacity>
                        <Text style={{ fontWeight: "bold", fontSize: 18, marginTop: 24 }}>Your Posts</Text>
                </>
        );

        if (loading) {
                return (
                        <View style={styles.container}>
                                {renderHeader()}
                                <Text>Loading...</Text>
                        </View>
                );
        }

        return (
                <View style={styles.container}>
                        <FlatList
                                data={posts}
                                numColumns={2}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => <PostCard post={item} />}
                                ListHeaderComponent={renderHeader}
                                ListEmptyComponent={<Text style={{ marginTop: 16 }}>No posts found.</Text>}
                                contentContainerStyle={{ paddingBottom: 24 }}
                        />
                </View>
        );
}

const styles = StyleSheet.create({
        container: {
                flex: 1,
                padding: 24,
        },
        title: {
                fontWeight: "600",
                textAlign: "left",
        },
        bioContainer: {
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
        },
        signOutButton: {
                borderRadius: 6,
                paddingVertical: 2,
                paddingHorizontal: 8,
                alignSelf: "flex-start",
        },
});