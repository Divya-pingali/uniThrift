import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CreatePost from "../../components/CreatePost";

export default function Post() {
  return (
    <SafeAreaView style={styles.container}>
      <CreatePost/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
