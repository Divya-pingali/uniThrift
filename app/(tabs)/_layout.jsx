import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import CreateListing from "../../components/CreateListing";

export default function TabsLayout() {
  const [showListingModal, setShowListingModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const hideTabBar = pathname === "/post" || pathname.startsWith("/post/");
  const theme = useTheme();

  return (
    <>
      <Modal
        visible={showListingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowListingModal(false)}
      >
        <Pressable
          style={[
            styles.modalBackground,
            { backgroundColor: theme.colors.backdrop },
          ]}
          onPress={() => setShowListingModal(false)}
        >
          <Pressable style={styles.bottomContainer} onPress={() => {}}>
            <CreateListing
              onSelect={(type) => {
                setShowListingModal(false);
                router.push(`/post?type=${type}`);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.outline,
          headerShown: false,
          tabBarStyle: hideTabBar
            ? { display: "none" }
            : { backgroundColor: theme.colors.surface },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="MapScreen"
          options={{
            title: "Map",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "compass" : "compass-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="post"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setShowListingModal(true);
            },
          }}
          options={{
            title: "Post",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "add-circle" : "add-circle"}
                color={color}
                size={size}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "chatbubbles" : "chatbubbles-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
