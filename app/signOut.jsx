import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { auth } from "../firebaseConfig";


export default function SignOut() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.replace("/");
            }
            });
            return unsubscribe;
    }, []);

    return (
        <View>
            <Text>Sign Out Page</Text>
            <TouchableOpacity onPress={() => auth.signOut()}>
                <Text>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}