import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
    const tabBg = "#0a0a0a";
    const border = "#1f1f1f";

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#ffffff",
                tabBarInactiveTintColor: "#9ca3af",
                tabBarStyle: {
                    backgroundColor: tabBg,
                    borderTopColor: border,
                    height: Platform.select({ ios: 84, android: 74 }),
                    paddingTop: 8,
                    paddingBottom: Platform.select({ ios: 20, android: 14 }),
                },
                tabBarLabelStyle: { fontSize: 11 },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" color={color} size={size} />
                    ),
                }}
            />

            <Tabs.Screen
                name="meals"
                options={{
                    title: "Meals",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="restaurant-outline" color={color} size={size} />
                    ),
                }}
            />

            <Tabs.Screen
                name="recipes"
                options={{
                    title: "Recipes",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="book-outline" color={color} size={size} />
                    ),
                }}
            />

            <Tabs.Screen
                name="search"
                options={{
                    title: "Search",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="search-outline" color={color} size={size} />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-circle-outline" color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}
