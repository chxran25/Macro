import { useEffect, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { getRefreshToken, getOnboarded } from "../utils/secureStore";

export function useAuthRedirect() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            try {
                const refresh = await getRefreshToken();
                const onboarded = await getOnboarded(); // "true" | "false" | null

                if (!refresh) {
                    // not logged in
                    if (pathname !== "/(auth)/login") router.replace("/(auth)/login");
                    return;
                }

                // logged in – decide first-time vs regular
                if (onboarded !== "true") {
                    if (pathname !== "/(tabs)/meals") router.replace("/(tabs)/meals");
                    return;
                }

                // regular users go to tabs home (which renders (tabs)/index.tsx)
                if (!pathname.startsWith("/(tabs)")) router.replace("/(tabs)");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        run();
        return () => {
            mounted = false;
        };
    }, [pathname, router]);

    return { loading };
}
