import { useNavigation, useRouter } from "expo-router";
import { IconButton } from "react-native-paper";

export default function BackButton({ fallback = "/(tabs)/home" }) {
  const router = useRouter();
  const navigation = useNavigation();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }
  };

  return (
    <IconButton
      icon="arrow-left"
      size={28}
      onPress={handleBack}
    />
  );
}