import { Image, StyleSheet, View } from "react-native";
import { Card, Chip, Text } from "react-native-paper";

const PostCard = ({ post }) => {
  if (!post) return null;

  const {
    title,
    description,
    image,
    tags = [],
    postType,
    sellingPrice,
    rentalPrice,
    rentalPriceUnit,
    rentalPriceDuration,
    rentalPriceDeposit,
    location
  } = post;

  const renderPrice = () => {
    if (postType === "sell") {
      return <Text style={styles.price}>${sellingPrice}</Text>;
    }

    if (postType === "donate") {
      return <Text style={styles.price}>FREE</Text>;
    }

    if (postType === "rent") {
      return (
        <View>
          <Text style={styles.price}>
            ${rentalPrice} / {rentalPriceUnit}
          </Text>
          {rentalPriceDeposit ? (
            <Text style={styles.subInfo}>Deposit: ${rentalPriceDeposit}</Text>
          ) : null}
          {rentalPriceDuration ? (
            <Text style={styles.subInfo}>Availability: {rentalPriceDuration}</Text>
          ) : null}
        </View>
      );
    }

    return null;
  };

  return (
    <Card style={styles.card} mode="outlined">
      {image && (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      )}

      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>

        <Text style={styles.description}>{description}</Text>

        {/* Price */}
        <View style={{ marginTop: 6 }}>{renderPrice()}</View>

        {/* Location */}
        {location?.structured_formatting?.main_text ? (
          <Text style={styles.location}>
            {location.structured_formatting.main_text}
          </Text>
        ) : null}

        {/* Tags */}
        <View style={styles.tagContainer}>
          {tags.map((tag) => (
            <Chip key={tag} compact style={styles.tag}>
              {tag}
            </Chip>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "92%",
    alignSelf: "center",
    marginVertical: 10,
    borderRadius: 12,
  },
  image: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  title: {
    marginTop: 8,
    fontWeight: "600",
  },
  description: {
    marginTop: 4,
    color: "#444",
  },
  price: {
    marginTop: 8,
    fontWeight: "700",
    fontSize: 16,
    color: "#1a73e8",
  },
  subInfo: {
    fontSize: 13,
    color: "#666",
  },
  location: {
    marginTop: 6,
    fontSize: 14,
    color: "#444",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    marginRight: 6,
    marginBottom: 6,
  },
});

export default PostCard;
