import { Stack } from "expo-router";
import "./globals.css";

export default function RootLayout() {
  return (
      <Stack screenOptions={{ headerShown: false }}>
        {/* Explicitly hide for the (tabs) group too */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
  );
}
