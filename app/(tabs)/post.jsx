import { useLocalSearchParams, useRouter } from "expo-router";
import CreatePost from "../../components/CreatePost";

export default function Post() {
  const { type } = useLocalSearchParams();
  const router = useRouter();

  const handlePostSuccess = () => {
    router.replace("/post");
  };

  return <CreatePost type={type} onPostSuccess={handlePostSuccess} />;
}
