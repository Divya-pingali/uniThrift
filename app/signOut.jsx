import { Text, TouchableOpacity, View } from "react-native";
import { auth } from "../firebaseConfig";


export default function SignOut() {
    const handleSignOut = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.log("Error signing out: ", error);
        }
    };

    return (
        <View>
            <Text>Sign Out Page</Text>
            <TouchableOpacity onPress={handleSignOut}>
                <Text>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}