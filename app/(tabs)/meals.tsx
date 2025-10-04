// app/(tabs)/meals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SlidersHorizontal } from "lucide-react-native";

import { getWeeklyPlan } from "../../lib/api";
import type { WeeklyPlanResponse, Meal } from "../../types/meal";
import { getAccessToken } from "../../utils/secureStore";

// --- helper: make sure we always have an array to render ---
function toMealArray(value: unknown): Meal[] {
    if (Array.isArray(value)) return value as Meal[];
    if (value && typeof value === "object") {
        // some backends may send an object keyed by id; take the values
        return Object.values(value as Record<string, Meal>);
    }
    return [];
}

export default function Meals() {
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState<string | null>(null);
    const [data, setData] = useState<WeeklyPlanResponse | null>(null);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

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

                const res = await getWeeklyPlan(token);
                setData(res);

                const dayKeys = Object.keys(res.weeklyPlan?.plan || {});
                if (dayKeys.length > 0) setSelectedDay(dayKeys[0]);
            } catch (e: any) {
                setErrMsg(e?.message || "Failed to fetch weekly plan.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const days = useMemo<string[]>(
        () => Object.keys(data?.weeklyPlan?.plan || {}),
        [data]
    );

    // sections can be Record<string, Meal[] | Record<string, Meal> | unknown>
    const sections = useMemo<Record<string, unknown>>(() => {
        if (!data || !selectedDay) return {};
        const day = data.weeklyPlan?.plan?.[selectedDay];
        return (day as Record<string, unknown>) || {};
    }, [data, selectedDay]);

    return (
        <View className="flex-1 bg-black">
            {/* Header */}
            <SafeAreaView edges={["top"]} className="bg-black">
                <View className="flex-row items-center justify-between px-5 py-3 border-b border-neutral-900">
                    <Text className="text-white text-lg font-semibold">Meal Plan</Text>
                    <Pressable hitSlop={8}>
                        <SlidersHorizontal color="white" size={22} />
                    </Pressable>
                </View>
            </SafeAreaView>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                    <Text className="text-neutral-400 mt-3">Loading weekly plan…</Text>
                </View>
            ) : errMsg ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-neutral-300 text-center">{errMsg}</Text>
                </View>
            ) : !data || days.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-neutral-300 text-center">
                        No weekly plan available for this user.
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
                        {days.map((day) => {
                            const active = day === selectedDay;
                            return (
                                <Pressable
                                    key={day}
                                    onPress={() => setSelectedDay(day)}
                                    className={`px-4 py-3 rounded-full mr-3 ${active ? "bg-white" : ""}`}
                                >
                                    <Text className={active ? "text-black font-semibold" : "text-white"}>
                                        {day}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {/* Sections for selected day */}
                    <View className="px-5">
                        {Object.entries(sections).map(([sectionName, mealsUnknown]) => {
                            const meals = toMealArray(mealsUnknown);

                            return (
                                <View key={sectionName} className="mt-6">
                                    <Text className="text-white text-lg font-semibold mb-3">{sectionName}</Text>

                                    {meals.length === 0 ? (
                                        <Text className="text-neutral-500 text-sm">No items.</Text>
                                    ) : (
                                        meals.map((meal, idx) => (
                                            <View
                                                key={meal.id || `${sectionName}-${idx}`}
                                                className="flex-row bg-[#141414] rounded-2xl overflow-hidden mb-3"
                                            >
                                                <Image
                                                    source={{ uri: meal.image || "https://picsum.photos/200/300" }}
                                                    className="w-28 h-28"
                                                    resizeMode="cover"
                                                />
                                                <View className="flex-1 p-3 justify-center">
                                                    {!!meal.calories && (
                                                        <Text className="text-neutral-400 text-xs mb-1">{meal.calories} cal</Text>
                                                    )}
                                                    <Text className="text-white font-medium mb-1">{meal.title || "Meal"}</Text>
                                                    {meal.macros && (
                                                        <Text className="text-neutral-400 text-xs">
                                                            Protein: {meal.macros.protein ?? 0}g | Carbs: {meal.macros.carbs ?? 0}g | Fat: {meal.macros.fat ?? 0}g
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
