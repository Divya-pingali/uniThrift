import { Tabs, useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import { Icon } from "react-native-paper";
import CreateListing from "../../components/CreateListing";

export default function TabsLayout() {
  const [showListingModal, setShowListingModal] = useState(false);
  const router = useRouter();

  return (
    <>
      <Modal
        visible={showListingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowListingModal(false)}
      >
        <Pressable
          style={styles.modalBackground}
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
          tabBarActiveTintColor: "#6200ee",
          tabBarInactiveTintColor: "#858585",
          headerShown: false,
        }}
      >
        <Tabs.Screen 
          name="home" 
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Icon source="home" color={color} size={size} />
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
            tabBarIcon: ({ color, size }) => (
              <Icon source="plus-box" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen 
          name="MapScreen" 
          options={{
            title: "Map",
            tabBarIcon: ({ color, size }) => (
              <Icon source="map" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen 
          name="profile" 
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Icon source="account" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen 
          name="signOut" 
          options={{
            title: "Sign Out",
            tabBarIcon: ({ color, size }) => (
              <Icon source="logout" color={color} size={size} />
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
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  }
});
