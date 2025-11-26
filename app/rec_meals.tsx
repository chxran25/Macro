// app/rec_meals.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Image,
    Pressable,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, RotateCcw } from "lucide-react-native";
import { useRouter } from "expo-router";

import { recommendWeeklyMeals } from "../lib/api";
import type { Meal } from "../types/meal";
import { getAccessToken } from "../utils/secureStore";

/* ---------- Helpers ---------- */

// Normalize backend mealDoc -> UI Meal type
function normalizeMeal(m: any): Meal {
    // Helper to safely get a string URL
    const getImageUrl = (img: any): string => {
        if (!img) return "";
        if (typeof img === "string") return img;
        if (typeof img === "object") {
            if (typeof img.uri === "string") return img.uri;
            if (typeof img.url === "string") return img.url;
        }
        return "";
    };

    return {
        id: (m?._id || m?.id || "").toString(),
        title: m?.title || m?.name || "Meal",
        image: getImageUrl(m?.image || m?.img),
        calories: Number(m?.calories ?? 0),
        macros: {
            protein: Number(m?.macros?.protein ?? m?.protein ?? 0),
            carbs: Number(m?.macros?.carbs ?? m?.carbs ?? 0),
            fat: Number(m?.macros?.fat ?? m?.fat ?? 0),
        },
        description: m?.description || "",
    };
}

// Days in order we want to show
const DAY_ORDER = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

// weekPlan: { Monday: { "Meal 1": mealDoc, ... }, ... }
type WeekPlan = Record<string, Record<string, any>>;

export default function RecMeals() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState<string | null>(null);

    const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    // Fetch recommendations once when screen mounts
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setErrMsg(null);

                const token = await getAccessToken();
                if (!token) {
                    setErrMsg("You are not logged in.");
                    return;
                }

                const res = await recommendWeeklyMeals(token);
                console.log(
                    "[REC_MEALS] weekPlan from backend:",
                    JSON.stringify(res.weekPlan, null, 2)
                );
                if (!res || !res.success) {
                    throw new Error(res?.message || "Failed to generate weekly plan.");
                }

                const wp = res.weekPlan as WeekPlan | undefined;
                if (!wp || typeof wp !== "object") {
                    throw new Error("Invalid weekly plan received from server.");
                }

                setWeekPlan(wp);

                // Pick first day present in the plan, using our DAY_ORDER for nicer UX
                const availableDays = DAY_ORDER.filter((d) => wp[d]);
                if (availableDays.length > 0) {
                    setSelectedDay(availableDays[0]);
                } else {
                    // Fallback to whatever keys exist
                    const keys = Object.keys(wp);
                    if (keys.length > 0) setSelectedDay(keys[0]);
                }
            } catch (e: any) {
                setErrMsg(e?.message || "Failed to fetch recommended meals.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Sort days according to our fixed order, only including those in weekPlan
    const dayKeys = useMemo<string[]>(() => {
        if (!weekPlan) return [];
        const keysInPlan = Object.keys(weekPlan);
        const ordered = DAY_ORDER.filter((d) => keysInPlan.includes(d));
        const leftovers = keysInPlan.filter((k) => !DAY_ORDER.includes(k));
        return [...ordered, ...leftovers];
    }, [weekPlan]);

    const mealsForSelectedDay = useMemo(() => {
        if (!weekPlan || !selectedDay) return [];
        const dayObj = weekPlan[selectedDay] || {};
        // dayObj is { "Meal 1": mealDoc, "Meal 2": mealDoc, ... }
        return Object.entries(dayObj).map(([label, mealDoc]) => ({
            label,
            meal: normalizeMeal(mealDoc),
        }));
    }, [weekPlan, selectedDay]);

    const handleRetry = async () => {
        try {
            setLoading(true);
            setErrMsg(null);
            const token = await getAccessToken();
            if (!token) throw new Error("You are not logged in.");

            const res = await recommendWeeklyMeals(token);
            if (!res || !res.success) {
                throw new Error(res?.message || "Failed to generate weekly plan.");
            }

            const wp = res.weekPlan as WeekPlan | undefined;
            if (!wp || typeof wp !== "object") {
                throw new Error("Invalid weekly plan received from server.");
            }

            setWeekPlan(wp);
            const availableDays = DAY_ORDER.filter((d) => wp[d]);
            if (availableDays.length > 0) {
                setSelectedDay(availableDays[0]);
            } else {
                const keys = Object.keys(wp);
                if (keys.length > 0) setSelectedDay(keys[0]);
            }
        } catch (e: any) {
            setErrMsg(e?.message || "Failed to fetch recommended meals.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-black">
            <SafeAreaView edges={["top"]} className="bg-black">
                <View className="flex-row items-center justify-between px-5 py-3 border-b border-neutral-900">
                    <Text className="text-white text-lg font-semibold">
                        Recommended Meals
                    </Text>

                    {/* Save & Continue — backend already stored weeklyPlan in user.weeklyPlan */}
                    <Pressable
                        onPress={() => router.replace("/(tabs)/meals")}
                        className="px-3 py-1 rounded-full bg-white flex-row items-center"
                        hitSlop={10}
                    >
                        <Check size={16} color="black" />
                        <Text className="text-black font-semibold ml-1">
                            Save & Continue
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                    <Text className="text-neutral-400 mt-3">
                        Creating your recommendations…
                    </Text>
                </View>
            ) : errMsg ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-neutral-300 text-center mb-4">
                        {errMsg}
                    </Text>
                    <Pressable
                        onPress={handleRetry}
                        className="px-4 py-2 rounded-full bg-white/10 border border-white/10 flex-row items-center"
                    >
                        <RotateCcw color="white" size={18} />
                        <Text className="text-white ml-2">Try again</Text>
                    </Pressable>
                </View>
            ) : !weekPlan || dayKeys.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-neutral-300 text-center">
                        No recommendations available.
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                    {/* Day selector */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="border-b border-neutral-900"
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                    >
                        {dayKeys.map((day) => {
                            const active = day === selectedDay;
                            return (
                                <Pressable
                                    key={day}
                                    onPress={() => setSelectedDay(day)}
                                    className={`px-4 py-3 rounded-full mr-3 ${
                                        active ? "bg-white" : ""
                                    }`}
                                >
                                    <Text
                                        className={
                                            active
                                                ? "text-black font-semibold"
                                                : "text-white"
                                        }
                                    >
                                        {day}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {/* Meals for selected day */}
                    <View className="px-5">
                        {mealsForSelectedDay.length === 0 ? (
                            <Text className="text-neutral-500 text-sm mt-6">
                                No meals found for this day.
                            </Text>
                        ) : (
                            mealsForSelectedDay.map(({ label, meal }, idx) => {
                                const imgUri =
                                    typeof meal.image === "string" &&
                                    meal.image.length > 0
                                        ? meal.image
                                        : "https://picsum.photos/200/300";

                                return (
                                    <View
                                        key={`${meal.id || "meal"}-${label}-${idx}`} // 👈 guaranteed unique
                                        className="mt-6"
                                    >
                                        <Text className="text-white text-sm font-semibold mb-2">
                                            {label}
                                        </Text>

                                        <View className="flex-row bg-[#141414] rounded-2xl overflow-hidden mb-3">
                                            <Image
                                                source={{ uri: imgUri }}
                                                className="w-28 h-28"
                                                resizeMode="cover"
                                            />

                                            <View className="flex-1 p-3 justify-center">
                                                {!!meal.calories && (
                                                    <Text className="text-neutral-400 text-xs mb-1">
                                                        {meal.calories} cal
                                                    </Text>
                                                )}
                                                <Text className="text-white font-medium mb-1">
                                                    {meal.title}
                                                </Text>
                                                <Text className="text-neutral-400 text-xs">
                                                    Protein: {meal.macros.protein}g | Carbs:{" "}
                                                    {meal.macros.carbs}g | Fat:{" "}
                                                    {meal.macros.fat}g
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
