import { useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Animated,
    StatusBar,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// ---------- Types & Mock data (swap with API) ----------
type Recipe = {
    id: string;
    meal: "Breakfast" | "Lunch" | "Dinner";
    title: string;
    description: string;
    image: string;
};

const suggested: Recipe[] = [
    {
        id: "r1",
        meal: "Breakfast",
        title: "Avocado Toast with Poached Egg",
        description:
            "A classic breakfast with a healthy twist, featuring creamy avocado and a perfectly poached egg on whole-grain toast.",
        image:
            "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=400",
    },
    {
        id: "r2",
        meal: "Lunch",
        title: "Grilled Chicken Salad with Lemon Vinaigrette",
        description:
            "A light and refreshing salad with grilled chicken, mixed greens, cherry tomatoes, and a zesty lemon vinaigrette.",
        image:
            "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=400",
    },
    {
        id: "r3",
        meal: "Dinner",
        title: "Salmon with Roasted Vegetables",
        description:
            "A flavorful dinner featuring baked salmon with a side of roasted broccoli, carrots, and bell peppers.",
        image:
            "https://images.unsplash.com/photo-1514517220036-1384c2485082?q=80&w=400",
    },
];

// ---------- Small UI ----------
const PressableScale = ({
                            children,
                            onPress,
                        }: {
    children: React.ReactNode;
    onPress?: () => void;
}) => {
    const scale = useRef(new Animated.Value(1)).current;
    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
                onPressIn={() =>
                    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()
                }
                onPressOut={() =>
                    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
                }
                onPress={onPress}
                android_ripple={{ color: "#2a2a2a" }}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};

const RecipeRow = ({ data }: { data: Recipe }) => (
    <View className="flex-row items-start justify-between bg-neutral-900 border border-neutral-800 rounded-3xl p-4 mb-4">
        <View className="flex-1 pr-4">
            <Text className="text-neutral-400 text-xs mb-1">{data.meal}</Text>
            <Text className="text-white font-semibold text-base leading-5 mb-1">
                {data.title}
            </Text>
            <Text className="text-neutral-400 leading-5">{data.description}</Text>
        </View>
        <Image source={{ uri: data.image }} className="w-20 h-20 rounded-2xl" />
    </View>
);

// ---------- Screen ----------
export default function RecipesScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />

            <SafeAreaView edges={["top"]}>
                {/* Top bar */}
                <View className="flex-row items-center px-5 pb-2 pt-1">
                    <PressableScale onPress={() => router.back()}>
                        <View className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 items-center justify-center mr-2">
                            <Text className="text-white text-lg">←</Text>
                        </View>
                    </PressableScale>
                    <Text className="text-white text-xl font-semibold">Recipes</Text>
                </View>

                <ScrollView
                    className="px-5"
                    contentContainerStyle={{ paddingBottom: 64 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="mt-2 mb-6">
                        <Text className="text-neutral-300">Suggested for you</Text>
                    </View>

                    {suggested.map((r) => (
                        <RecipeRow key={r.id} data={r} />
                    ))}

                    <PressableScale onPress={() => console.log("See more recipes")}>
                        <View className="mt-4 items-center">
                            <Text className="text-neutral-300">See more recipes</Text>
                        </View>
                    </PressableScale>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
