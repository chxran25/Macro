import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";

export function useAuthRedirect() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // assuming you stored refreshToken securely after login
                const token = await SecureStore.getItemAsync("refreshToken");

                if (!token) {
                    router.replace("/(auth)/login");
                    return;
                }

                // TODO: replace with your actual refresh/validate API call
                const res = await fetch("https://calorieboy.onrender.com/api/users/validate", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    router.replace("/(tabs)");
                } else {
                    router.replace("/(auth)/login");
                }
            } catch (e) {
                router.replace("/(auth)/login");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    return { loading };
}
