import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { auth } from "../firebaseConfig";

export default function SignOut() {
		const signOut = async () => {
				try {
						await auth.signOut();
				} catch (error) {
						console.log("Error signing out: ", error);
				}
		};

		return (
				<View style={styles.container}>
						<Text style={styles.title}>Sign Out Page</Text>
						<Button onPress={signOut} style={styles.button}>
								Sign Out
						</Button>
				</View>
		);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 24,
		justifyContent: "center",
	},

	title: {
		fontWeight: "600",
		textAlign: "center",
	},

	button: {
		paddingVertical: 4,
		borderRadius: 6,
	},

});
