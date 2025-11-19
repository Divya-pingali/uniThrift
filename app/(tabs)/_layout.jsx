import { Tabs } from "expo-router";
import { Icon } from "react-native-paper";

export default function TabsLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        tabBarPosition: "bottom",
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: "#6200ee",
        tabBarInactiveTintColor: "#858585",
        tabBarActiveBackgroundColor: "#F8F5FF",
        tabBarInactiveBackgroundColor: "#ffffff",
        tabBarItemStyle: {
          borderRadius: 10
        },
      }}
    >
      <Tabs.Screen 
        name="home" 
        options = {{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Icon source="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen 
        name="post" 
        options={{
          title: "Post",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Icon source="plus-box" color={color} size={size} />,
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Icon source="account" color={color} size={size} />,
        }}
      />
      <Tabs.Screen 
        name="signOut"
        options = {{
          title: "Sign Out",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Icon source="logout" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
