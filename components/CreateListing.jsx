import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Card, Text, useTheme } from "react-native-paper";

const CreateListing = ({ onSelect }) => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const slideAnim = useRef(new Animated.Value(250)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <Card style={styles.cardContainer}>
        <Text variant="headlineSmall" style={styles.title}>
          Create New Listing
        </Text>

        <Card.Content>
          <View style={styles.innerView}>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.optionCard}
              onPress={() => onSelect("sell")}
            >
              <View style={styles.iconCircle}>
                <Ionicons
                  name="pricetags-outline"
                  size={32}
                  color={theme.colors.primary}
                />
              </View>
              <Text variant="titleMedium" style={styles.optionText}>
                Sell
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={1}
              style={styles.optionCard}
              onPress={() => onSelect("rent")}
            >
              <View style={styles.iconCircle}>
                <Ionicons
                  name="sync-outline"
                  size={32}
                  color={theme.colors.primary}
                />
              </View>
              <Text variant="titleMedium" style={styles.optionText}>
                Rent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={1}
              style={styles.optionCard}
              onPress={() => onSelect("donate")}
            >
              <View style={styles.iconCircle}>
                <Ionicons
                  name="heart-outline"
                  size={32}
                  color={theme.colors.primary}
                />
              </View>
              <Text variant="titleMedium" style={styles.optionText}>
                Donate
              </Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const makeStyles = (theme) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 0,
      width: "100%",
      alignItems: "center",
    },
    cardContainer: {
      width: "100%",
      height: 250,
      paddingVertical: 30,
      backgroundColor: theme.colors.surface
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
      justifyContent: "center",
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.tertiaryContainer,
      alignItems: "center",
      justifyContent: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    title: {
      fontWeight: "bold",
      alignSelf: "center",
      margin: 15,
      color: theme.colors.onSurface,
    },
    optionText: {
      marginTop: 10,
      fontWeight: "500",
      color: theme.colors.onSurface,
    },
  });

export default CreateListing;