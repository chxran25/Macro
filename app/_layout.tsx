import { Stack } from "expo-router";
import "./globals.css";

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* Landing page (app/index.tsx) */}
            <Stack.Screen name="index" />

            {/* Auth group */}
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />

            {/* Tabs group */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    );
}
