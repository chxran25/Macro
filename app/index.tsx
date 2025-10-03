import { Redirect } from "expo-router";

export default function Index() {
    console.log("✅ app/index.tsx loaded");  // Debug log

    return <Redirect href="/(auth)/login" />;
}
