import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import QRCode from "react-native-qrcode-svg";
import BackButton from "../components/BackButton";
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
        <View style={{ backgroundColor: theme.colors.background, width: '100%', paddingHorizontal: 16 }}>
          <BackButton fallback="/(tabs)/chat" />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingHorizontal: 16,
            width: '100%'
          }}
        >
          <Text
            variant="headlineSmall"
            style={{
              fontWeight: "bold",
              marginLeft: 8,
              color: theme.colors.onBackground,
            }}
          >
            Meetup QR
          </Text>
        </View>
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
        backgroundColor: theme.colors.background
      }}
    >
      <View style={{ backgroundColor: theme.colors.background, paddingTop: 8 }}>
        <BackButton fallback="/(tabs)/chat" />
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingHorizontal: 16,
        }}
      >
        <Text
          variant="headlineSmall"
          style={{
            fontWeight: "bold",
            color: theme.colors.onBackground,
          }}
        >
          Meetup QR
        </Text>
      </View>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
          size={275}
          color={theme.colors.onBackground}
          backgroundColor={theme.colors.background}
        />
      </View>
    </View>
  );
}
