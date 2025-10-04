import { clearTokens, clearOnboarded } from "../utils/secureStore";
import { useRouter } from "expo-router";

export function useLogout() {
    const router = useRouter();

    const logout = async () => {
        try {
            await clearTokens();
            await clearOnboarded();
            console.log("✅ User logged out, tokens cleared");

            // Redirect to login screen
            router.replace("/(auth)/login");
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return logout;
}
