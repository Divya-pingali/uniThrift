import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="post" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="signOut" />
    </Tabs>
  );
}
