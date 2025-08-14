import { Tabs } from "expo-router";
import { Home, Utensils, Search, User2 } from "lucide-react-native";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,                // ← hides default headers
                tabBarStyle: {
                    backgroundColor: "#0f0f0f",
                    borderTopColor: "#1f1f1f",
                    height: 72,
                },
                tabBarActiveTintColor: "white",
                tabBarInactiveTintColor: "#8b8b8b",
            }}
        >
            <Tabs.Screen name="index"   options={{ title: "Home",   tabBarIcon: ({ color }) => <Home   color={color} size={22}/> }} />
            <Tabs.Screen name="meals"   options={{ title: "Meals",  tabBarIcon: ({ color }) => <Utensils color={color} size={22}/> }} />
            <Tabs.Screen name="search"  options={{ title: "Search", tabBarIcon: ({ color }) => <Search color={color} size={22}/> }} />
            <Tabs.Screen name="profile" options={{ title: "Profile",tabBarIcon: ({ color }) => <User2  color={color} size={22}/> }} />
        </Tabs>
    );
}
