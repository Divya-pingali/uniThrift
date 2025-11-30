import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, TouchableOpacity, View } from "react-native";
import { Card, Divider, Text, useTheme } from "react-native-paper";
import { auth } from "../firebaseConfig";

const PostCard = ({ post = {}, editable = false }) => {
  const router = useRouter();
  const theme = useTheme();
  const {
    image,
    postType,
    rentalPrice,
    rentalPriceUnit,
    sellingPrice,
    title,
    userId,
    id,
  } = post;
  const currentUser = auth.currentUser;
  const PRICE_FONT_SIZE = 14;

  return (
    <View
      style={{
        width: "100%",
        justifyContent: "space-between",
      }}
    >
      <View style={{ position: "relative" }}>
        {editable && currentUser && userId === currentUser.uid && (
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 1,
              padding: 8,
              backgroundColor: theme.colors.surfaceContainerLow,
              borderRadius: 8,
              elevation: 3,
            }}
            onPress={() =>
              router.push({ pathname: `/post`, params: { type: postType, id } })
            }
          >
            <Ionicons name="pencil" size={18} color={theme.colors.onSurface} />
          </TouchableOpacity>
        )}
        <Pressable
          onPress={() =>
            router.push({ pathname: `/postDetail`, params: { id } })
          }
        >
          <View
            style={{
              marginBottom: 16,
              backgroundColor: theme.colors.surfaceContainerLowest,
              borderRadius: 16,
              elevation: 2,
              overflow: "hidden",
              borderWidth: 0.15,
              borderColor: theme.colors.outline,
            }}
          >
            <Card.Cover
              source={{ uri: image }}
              style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
            />
            <Divider />
            <View style={{ padding: 10 }}>
              <Text
                variant="titleMedium"
                numberOfLines={2}
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: theme.colors.onSurface,
                  marginBottom: 4,
                }}
              >
                {title}
              </Text>
              {postType === "sell" && sellingPrice ? (
                <View
                  style={{
                    backgroundColor: "#2e7d3215",
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 6,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      color: "#2e7d32",
                      fontWeight: "700",
                      fontSize: PRICE_FONT_SIZE,
                    }}
                  >
                    ${sellingPrice}
                  </Text>
                </View>
              ) : null}

              {postType === "rent" && rentalPrice ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#0d47a11A",
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 6,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      color: "#0d47a1",
                      fontWeight: "700",
                      fontSize: PRICE_FONT_SIZE,
                      marginRight: 4,
                    }}
                  >
                    ${rentalPrice}
                  </Text>
                  <Text
                    style={{
                      color: "#0d47a1",
                      fontWeight: "600",
                      fontSize: PRICE_FONT_SIZE,
                    }}
                  >
                    / {rentalPriceUnit}
                  </Text>
                </View>
              ) : null}

              {postType === "donate" ? (
                <View
                  style={{
                    backgroundColor: "#6a1b9a20",
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 6,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      color: "#6a1b9a",
                      fontWeight: "700",
                      fontSize: PRICE_FONT_SIZE,
                    }}
                  >
                    FREE
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

export default PostCard;
