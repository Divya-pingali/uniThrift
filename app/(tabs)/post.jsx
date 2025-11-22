import { useState } from "react";
import { StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import CreateListing from "../../components/CreateListing";
import CreatePost from "../../components/CreatePost";

export default function Post() {
  const [postType, setPostType] = useState(null);

  const handlePostSuccess = () => setPostType(null);

  return (
    <>
      {!postType ? (
        <CreateListing onSelect={setPostType} />
      ) : (
        <>
          <Button onPress={() => setPostType(null)} style={styles.backButton}>
            Go Back
          </Button>
          <CreatePost type={postType} onPostSuccess={handlePostSuccess} />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10
  }
});