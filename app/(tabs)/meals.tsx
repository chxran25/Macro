import React, { useEffect, useMemo, useState, useRef } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    ScrollView,
    Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SlidersHorizontal , ShoppingCart} from "lucide-react-native";
import { useRouter } from "expo-router";

import { getWeeklyPlan } from "../../lib/api";
import type {
    WeeklyPlan,
    Meal,
    DayKey,
    GetWeeklyPlanApiResponse,
} from "../../types/meal";
import { getAccessToken } from "../../utils/secureStore";
import { mapBackendWeekPlanToWeeklyPlan } from "../../utils/mealPlanMapper";
import MealCard from "../../components/MealCard";


type WeeklyTotals = {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
};

export default function Meals() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState<string | null>(null);
    const [needsRecommendations, setNeedsRecommendations] = useState(false);

    const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
    const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [weeklyTotals, setWeeklyTotals] = useState<WeeklyTotals | null>(null);

    // 🔔 Cart bubble state
    const [cartBubbleVisible, setCartBubbleVisible] = useState(false);
    const [cartBubbleText, setCartBubbleText] = useState("Item added to cart");
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

                const res: GetWeeklyPlanApiResponse | null =
                    await getWeeklyPlan(token);

                if (!res || !res.weeklyPlan || !res.weeklyPlan.plan) {
                    setNeedsRecommendations(true);
                    setWeeklyPlan(null);
                    return;
                }

                console.log(
                    "[MEALS TAB] weekly plan from backend:",
                    JSON.stringify(res.weeklyPlan.plan, null, 2)
                );

                const mapped = mapBackendWeekPlanToWeeklyPlan(res.weeklyPlan);
                setWeeklyPlan(mapped);

                // capture weekly totals if backend sent them
                const totals = (res.weeklyPlan as any)?.totals;
                if (totals && typeof totals === "object") {
                    setWeeklyTotals({
                        calories: totals.calories,
                        protein: totals.protein,
                        carbs: totals.carbs,
                        fat: totals.fat,
                    });
                }

                const dayKeys = Object.keys(mapped.plan);
                if (dayKeys.length > 0) {
                    setSelectedDay(dayKeys[0] as DayKey);
                }
            } catch (e: any) {
                setErrMsg(e?.message || "Failed to fetch weekly plan.");
            } finally {
                setLoading(false);
            }
        })();

        // Cleanup timer on unmount
        return () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }
        };
    }, []);

    /* ---------- Day list ---------- */
    const days = useMemo<string[]>(() => {
        if (!weeklyPlan) return [];
        return Object.keys(weeklyPlan.plan);
    }, [weeklyPlan]);

    /* ---------- Meals for selected day ---------- */
    const mealsForSelectedDay = useMemo<Meal[]>(() => {
        if (!weeklyPlan || !selectedDay) return [];

        const sections = weeklyPlan.plan[selectedDay];
        if (!sections) return [];

        const values = Object.values(sections) as Meal[][];
        return values.flat();
    }, [weeklyPlan, selectedDay]);

    /* ---------- Handle meal added to cart ---------- */
    const handleMealAddedToCart = (meal?: Meal) => {
        // Set text like "Paneer Bowl added to cart"
        const msg = meal?.title
            ? `${meal.title} added to cart`
            : "Item added to cart";
        setCartBubbleText(msg);
        setCartBubbleVisible(true);

        // Reset previous timer
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }

        // Auto hide after 3 seconds
        hideTimerRef.current = setTimeout(() => {
            setCartBubbleVisible(false);
        }, 3000);
    };

    const handleCartBubblePress = () => {
        setCartBubbleVisible(false);
        router.push("/checkout"); // 🔁 adjust if your route path differs
    };

    return (
        <View className="flex-1 bg-black">
            {/* ---------- Top bar ---------- */}
            <SafeAreaView edges={["top"]} className="bg-black">
                <View className="px-5 pt-3 pb-2 border-b border-neutral-900">
                    <View className="flex-row items-center justify-between mb-2">
                        <View>
                            <Text className="text-white text-xl font-semibold">
                                Meal Plan
                            </Text>
                            <Text className="text-neutral-400 text-xs mt-1">
                                Your AI-crafted meals for the week
                            </Text>
                        </View>

                        <View className="flex-row items-center">
                            {/* Optional filter icon */}
                            <Pressable
                                hitSlop={8}
                                className="w-9 h-9 rounded-full border border-white/10 items-center justify-center bg-white/5 mr-2"
                            >
                                <SlidersHorizontal color="white" size={18} />
                            </Pressable>

                            {/* Cart icon → /checkout */}
                            <Pressable
                                hitSlop={8}
                                onPress={() => router.push("/checkout")}
                                className="w-9 h-9 rounded-full border border-white/10 items-center justify-center bg-white/5"
                            >
                                <ShoppingCart color="white" size={18} />
                            </Pressable>
                        </View>
                    </View>


                    {/* Weekly macro strip */}
                    {weeklyTotals && (
                        <View className="flex-row mt-2">
                            <View className="flex-1 mr-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                                <Text className="text-[10px] text-neutral-400">
                                    Weekly Calories
                                </Text>
                                <Text className="text-white text-sm font-semibold mt-0.5">
                                    {weeklyTotals.calories ?? 0} kcal
                                </Text>
                            </View>
                            <View className="flex-[0.9] mr-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                                <Text className="text-[10px] text-neutral-400">
                                    Protein
                                </Text>
                                <Text className="text-white text-sm font-semibold mt-0.5">
                                    {weeklyTotals.protein ?? 0} g
                                </Text>
                            </View>
                            <View className="flex-[0.9] mr-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                                <Text className="text-[10px] text-neutral-400">
                                    Carbs
                                </Text>
                                <Text className="text-white text-sm font-semibold mt-0.5">
                                    {weeklyTotals.carbs ?? 0} g
                                </Text>
                            </View>
                            <View className="flex-[0.9] px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                                <Text className="text-[10px] text-neutral-400">
                                    Fats
                                </Text>
                                <Text className="text-white text-sm font-semibold mt-0.5">
                                    {weeklyTotals.fat ?? 0} g
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </SafeAreaView>

            {/* ---------- States ---------- */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                    <Text className="text-neutral-400 mt-3">
                        Loading weekly plan…
                    </Text>
                </View>
            ) : needsRecommendations ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-neutral-300 text-center mb-4">
                        You don’t have a weekly plan yet. Generate
                        recommendations to get started.
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
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-neutral-300 text-center">
                        {errMsg}
                    </Text>
                </View>
            ) : !weeklyPlan || days.length === 0 ? (
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
                <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                    {/* Day selector */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="border-b border-neutral-900 bg-black"
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                        }}
                    >
                        {days.map((day) => {
                            const active = day === selectedDay;
                            return (
                                <Pressable
                                    key={day}
                                    onPress={() => setSelectedDay(day as DayKey)}
                                    className={`px-4 py-2 mr-3 rounded-full border ${
                                        active
                                            ? "bg-white border-white"
                                            : "bg-white/5 border-white/10"
                                    }`}
                                >
                                    <Text
                                        className={
                                            active
                                                ? "text-black font-semibold text-sm"
                                                : "text-white text-sm"
                                        }
                                    >
                                        {day}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {/* Meals list for selected day */}
                    <View className="px-5 mt-4">
                        <View className="flex-row items-baseline mb-3">
                            <Text className="text-white text-base font-semibold">
                                {selectedDay}
                            </Text>
                            <Text className="text-neutral-500 text-xs ml-2">
                                {mealsForSelectedDay.length} meals planned
                            </Text>
                        </View>

                        {mealsForSelectedDay.length === 0 ? (
                            <Text className="text-neutral-500 text-sm">
                                No meals for this day.
                            </Text>
                        ) : (
                            mealsForSelectedDay.map((meal, index) => (
                                <MealCard
                                    key={`${meal.id}-${selectedDay}-${index}`}
                                    meal={meal}
                                    onPress={setSelectedMeal}
                                    onAddedToCart={handleMealAddedToCart}
                                />
                            ))
                        )}
                    </View>
                </ScrollView>
            )}

            {/* 🔔 Floating cart bubble (Swiggy-style) */}
            {cartBubbleVisible && (
                <View className="absolute left-0 right-0 bottom-4 px-4">
                    <Pressable
                        onPress={handleCartBubblePress}
                        className="flex-row items-center justify-between px-4 py-3 rounded-2xl bg-white"
                        style={{
                            shadowColor: "#000",
                            shadowOpacity: 0.25,
                            shadowRadius: 6,
                            elevation: 6,
                        }}
                    >
                        <View className="flex-1 mr-3">
                            <Text className="text-black font-semibold text-sm">
                                {cartBubbleText}
                            </Text>
                            <Text className="text-neutral-700 text-xs mt-0.5">
                                Tap to view cart & checkout
                            </Text>
                        </View>
                        <Text className="text-black font-semibold text-xs">
                            View Cart →
                        </Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}
