// app/(tabs)/meals.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    FlatList,
    Modal,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SlidersHorizontal } from "lucide-react-native";
import { useRouter } from "expo-router";

import { getWeeklyPlan } from "../../lib/api";
import type { WeeklyMealPlanApiResponse, DayKey, Meal } from "../../types/meal";

import { getAccessToken } from "../../utils/secureStore";
import { mapBackendWeekPlanToWeeklyPlan } from "../../utils/mealPlanMapper";
import MealCard from "../../components/MealCard";

const DAY_ORDER: DayKey[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

export default function Meals() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState<string | null>(null);
    const [needsRecommendations, setNeedsRecommendations] = useState(false);

    const [weeklyPlan, setWeeklyPlan] = useState<any>(null);
    const [selectedDay, setSelectedDay] = useState<DayKey>("Monday");

    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

    /* -----------------------------------------------------
     *  LOAD WEEKLY PLAN FROM API
     * ----------------------------------------------------- */
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setErrMsg(null);
                setNeedsRecommendations(false);

                const token = await getAccessToken();
                if (!token) {
                    setErrMsg("You are not logged in.");
                    return;
                }

                const res: WeeklyMealPlanApiResponse | null = await getWeeklyPlan(token);



                if (!res) {
                    setNeedsRecommendations(true);
                    setWeeklyPlan(null);
                    return;
                }
                console.log(
                    "[MEALS TAB] weekly plan from backend:",
                    JSON.stringify(res.weekPlan, null, 2)
                );

                const mapped = mapBackendWeekPlanToWeeklyPlan(res.weekPlan);
                setWeeklyPlan(mapped);

                // Auto-select first available day
                const dayKeys = Object.keys(mapped.plan);
                if (dayKeys.length > 0) setSelectedDay(dayKeys[0] as DayKey);
            } catch (e: any) {
                setErrMsg(e?.message || "Failed to fetch weekly plan.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* -----------------------------------------------------
     *  GET MEALS FOR SELECTED DAY (flatten sections)
     * ----------------------------------------------------- */
    const mealsForSelectedDay = useMemo<Meal[]>(() => {
        if (!weeklyPlan) return [];

        const sections = weeklyPlan.plan[selectedDay];
        if (!sections) return [];

        // sections: Record<SectionName, Meal[]>
        // Object.values(sections) → Meal[][]
        const values = Object.values(sections) as Meal[][];

        // flatten Meal[][] → Meal[]
        return values.flat();
    }, [weeklyPlan, selectedDay]);

    /* -----------------------------------------------------
     *  RENDER
     * ----------------------------------------------------- */
    return (
        <View className="flex-1 bg-black">
            {/* TOP BAR */}
            <SafeAreaView edges={["top"]} className="bg-black">
                <View className="flex-row items-center justify-between px-5 py-3 border-b border-neutral-900">
                    <Text className="text-white text-lg font-semibold">Meal Plan</Text>
                    <Pressable hitSlop={8}>
                        <SlidersHorizontal color="white" size={22} />
                    </Pressable>
                </View>
            </SafeAreaView>

            {/* LOADING */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                    <Text className="text-neutral-400 mt-3">Loading weekly plan…</Text>
                </View>
            ) : needsRecommendations ? (
                /* NO PLAN → SHOW CTA */
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-neutral-300 text-center mb-4">
                        You don’t have a weekly plan yet. Generate recommendations to get started.
                    </Text>

                    <Pressable
                        onPress={() => router.replace("/rec_meals")}
                        className="px-5 py-3 rounded-2xl bg-white"
                    >
                        <Text className="text-black font-semibold">
                            Generate Recommendations
                        </Text>
                    </Pressable>
                </View>
            ) : errMsg ? (
                /* ERROR */
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-neutral-300 text-center">{errMsg}</Text>
                </View>
            ) : !weeklyPlan ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-neutral-300 text-center">
                        No weekly plan available for this user.
                    </Text>

                    <Pressable
                        onPress={() => router.replace("/rec_meals")}
                        className="mt-4 px-5 py-3 rounded-2xl bg-white"
                    >
                        <Text className="text-black font-semibold">
                            Create from Recommendations
                        </Text>
                    </Pressable>
                </View>
            ) : (
                /* WEEKLY PLAN LOADED */
                <View className="flex-1">
                    {/* DAY SELECTOR */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="border-b border-neutral-900"
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                    >
                        {DAY_ORDER.filter((d) => weeklyPlan.plan[d]).map((day) => {
                            const active = day === selectedDay;
                            return (
                                <Pressable
                                    key={day}
                                    onPress={() => setSelectedDay(day)}
                                    className={`px-4 py-3 rounded-full mr-3 ${
                                        active ? "bg-white" : "bg-neutral-900"
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

                    {/* LIST OF MEALS */}
                    <FlatList
                        data={mealsForSelectedDay}
                        keyExtractor={(item, index) => `${item.id}-${index}`}  // 👈 change this
                        contentContainerStyle={{ padding: 16 }}
                        renderItem={({ item }) => (
                            <MealCard meal={item} onPress={setSelectedMeal} />
                        )}
                    />


                    {/* MEAL DETAIL MODAL */}
                    <Modal
                        visible={!!selectedMeal}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setSelectedMeal(null)}
                    >
                        <Pressable
                            className="flex-1 bg-black/60 justify-end"
                            onPress={() => setSelectedMeal(null)}
                        >
                            <Pressable
                                onPress={(e) => e.stopPropagation()}
                                className="bg-neutral-900 rounded-t-3xl px-5 pt-5 pb-8 max-h-[75%]"
                            >
                                {selectedMeal && (
                                    <>
                                        {/* IMAGE */}
                                        {selectedMeal.image && (
                                            <Image
                                                source={{ uri: selectedMeal.image }}
                                                className="w-full h-48 rounded-xl mb-4"
                                                resizeMode="cover"
                                            />
                                        )}

                                        <Text className="text-white text-xl font-semibold mb-2">
                                            {selectedMeal.title}
                                        </Text>

                                        {selectedMeal.description && (
                                            <Text className="text-neutral-300 text-sm mb-3">
                                                {selectedMeal.description}
                                            </Text>
                                        )}

                                        <Text className="text-neutral-400 text-sm">
                                            {selectedMeal.calories} kcal
                                        </Text>

                                        <Text className="text-neutral-500 text-xs mb-4">
                                            Protein {selectedMeal.macros.protein}g • Carbs{" "}
                                            {selectedMeal.macros.carbs}g • Fat{" "}
                                            {selectedMeal.macros.fat}g
                                        </Text>

                                        {selectedMeal.raw && (
                                            <Text className="text-neutral-500 text-xs">
                                                {selectedMeal.raw.cuisineType
                                                    ? `Cuisine: ${selectedMeal.raw.cuisineType}  `
                                                    : ""}
                                                {selectedMeal.raw.category
                                                    ? `• Category: ${selectedMeal.raw.category}  `
                                                    : ""}
                                                {selectedMeal.raw.dietType
                                                    ? `• Diet: ${selectedMeal.raw.dietType}`
                                                    : ""}
                                            </Text>
                                        )}
                                    </>
                                )}
                            </Pressable>
                        </Pressable>
                    </Modal>
                </View>
            )}
        </View>
    );
}
