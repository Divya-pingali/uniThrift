import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Text } from "react-native-paper";

const CreateListing = ({onSelect}) => {
  return (
    <View style={styles.container}>
      <Card style={styles.cardContainer}>
        <Text
          variant="headlineSmall"
          style={styles.title}
        >
            Create a New Listing
        </Text>

        <Card.Content>
          <View style={styles.innerView}> 
            <TouchableOpacity activeOpacity={1}style={styles.optionCard} onPress={() => onSelect("sell")}>
              <View style={styles.iconCircle}>
                <Ionicons name="pricetags-outline" size={32} color="black" />
              </View>
              <Text variant="titleMedium" style={styles.optionText}>Sell</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={1} style={styles.optionCard} onPress={() => onSelect("rent")}>
              <View style={styles.iconCircle}>
                <Ionicons name="sync-outline" size={32} color= "black" />
              </View>
              <Text variant="titleMedium" style={styles.optionText}>Rent</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={1} style={styles.optionCard} onPress={() => onSelect("donate")}>
              <View style={styles.iconCircle}>
                <Ionicons name="heart-outline" size={32} color="black"/>
              </View>
              <Text variant="titleMedium" style={styles.optionText}>Donate</Text>
            </TouchableOpacity>

          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    flexDirection: "column",
    alignItems: "center",
  },
  cardContainer: {
    width: "100%",
    height: 250,
    paddingVertical: 30,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  innerView: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  optionCard: {
    width: "30%",
    height: 115,
    alignItems: "center",
    justifyContent: "center"
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontWeight: "600",
    alignSelf: "center",
    margin: 15,
  },
  optionText: {
    marginTop: 10,
    fontWeight: "500",
  },
});

export default CreateListing;