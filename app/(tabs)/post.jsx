import { useState } from 'react';
import { StyleSheet } from "react-native";
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from "react-native-safe-area-context";
import CreatePost from "../../components/CreatePost";

export default function Post() {
  const [postType, setPostType] = useState(null);

  const handlePostSuccess = () => {
    setPostType(null);
  };

  if (!postType) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>What would you like to do?</Text>
        <Button mode="contained" onPress={() => setPostType('sell')} style={styles.button}>
          Sell an item
        </Button>
        <Button mode="contained" onPress={() => setPostType('rent')} style={styles.button}>
          Rent out an item
        </Button>
        <Button mode="contained" onPress={() => setPostType('donate')} style={styles.button}>
          Donate an item
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Button onPress={() => setPostType(null)} style={styles.backButton}>Go Back</Button>
      <CreatePost type={postType} onPostSuccess={handlePostSuccess} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
  },
  button: {
    width: '80%',
    marginVertical: 8,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
  }
});
