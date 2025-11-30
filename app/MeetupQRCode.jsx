import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { useTheme } from "react-native-paper";
import QRCode from "react-native-qrcode-svg";
import { auth } from "../firebaseConfig";

export default function ShowMeetupQR() {
  const { postId, buyerId } = useLocalSearchParams();
  const firebaseUser = auth.currentUser;
  const theme = useTheme();

  if (!postId || !buyerId) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <Text style={{ color: theme.colors.error, fontSize: 16 }}>
          Missing QR code data. Please return to chat and try again.
        </Text>
      </View>
    );
  }

  const qrData = JSON.stringify({
    postId,
    sellerId: firebaseUser.uid,
    buyerId,
    type: "meetupConfirmation",
  });

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{
          marginBottom: 20,
          fontSize: 18,
          fontWeight: "600",
          color: theme.colors.onBackground,
        }}
      >
        Show this QR to the buyer
      </Text>
      <QRCode
        value={qrData}
        size={240}
        color={theme.colors.onBackground}
        backgroundColor={theme.colors.background}
      />
    </View>
  );
}
