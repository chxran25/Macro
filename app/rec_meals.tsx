// app/rec_meals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, RotateCcw } from "lucide-react-native";
import { useRouter } from "expo-router";

import { recommendWeeklyMeals } from "../lib/api";
import type { Meal } from "../types/meal";
import { getAccessToken } from "../utils/secureStore";

/* ---------- Helpers ---------- */
function normalizeMeal(m: any): Meal {
    return {
        id: (m?._id || m?.id || "").toString(),
        title: m?.title || m?.name || "Meal",
        image: m?.image || m?.img || "",
        calories: Number(m?.calories ?? 0),
        macros: {
            protein: Number(m?.macros?.protein ?? m?.protein ?? 0),
            carbs: Number(m?.macros?.carbs ?? m?.carbs ?? 0),
            fat: Number(m?.macros?.fat ?? m?.fat ?? 0),
        },
        description: m?.description || "",
    };
}

function toMealArray(value: unknown): Meal[] {
    const asArray = Array.isArray(value)
        ? (value as any[])
        : value && typeof value === "object"
            ? Object.values(value as Record<string, any>)
            : [];
    return asArray.map(normalizeMeal);
}

/** Safely extract the "plan" object from different possible keys:
 *  - res.weeklyPlan.plan
 *  - res.weekPlan.plan
 *  - res.plan
 *  - res.recommendations
 */
function getPlanObject(payload: any): Record<string, unknown> | null {
    if (!payload || typeof payload !== "object") return null;

    const weeklyPlan = payload?.weeklyPlan?.plan;
    if (weeklyPlan && typeof weeklyPlan === "object") return weeklyPlan;

    const weekPlan = payload?.weekPlan?.plan;
    if (weekPlan && typeof weekPlan === "object") return weekPlan;

    const directPlan = payload?.plan;
    if (directPlan && typeof directPlan === "object") return directPlan;

    const recs = payload?.recommendations;
    if (recs && typeof recs === "object") return recs;

    return null;
}

export default function RecMeals() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState<string | null>(null);
    const [raw, setRaw] = useState<any>(null);

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

                // Create recommendations
                const res = await recommendWeeklyMeals(token);
                setRaw(res);

                // If the backend returned a weekly-style object (days as keys), preselect first day
                const planObj = getPlanObject(res);
                if (planObj) {
                    const keys = Object.keys(planObj);
                    // Heuristic: if keys look like days, treat as weekly
                    const looksWeekly = keys.some(k =>
                        ["mon","tue","wed","thu","fri","sat","sun"].some(d => k.toLowerCase().startsWith(d)) ||
                        ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].includes(k.toLowerCase())
                    );
                    if (looksWeekly && keys.length > 0) setSelectedDay(keys[0]);
                }
            } catch (e: any) {
                setErrMsg(e?.message || "Failed to fetch recommended meals.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // If planObj contains day keys, we show a day selector; otherwise it's a single-day plan.
    const planObj = useMemo(() => getPlanObject(raw), [raw]);

    const dayKeys = useMemo<string[]>(() => {
        if (!planObj) return [];
        const keys = Object.keys(planObj);
        const looksWeekly = keys.some(k =>
            ["mon","tue","wed","thu","fri","sat","sun"].some(d => k.toLowerCase().startsWith(d)) ||
            ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].includes(k.toLowerCase())
        );
        return looksWeekly ? keys : [];
    }, [planObj]);

    const sections: Record<string, unknown> = useMemo(() => {
        if (!planObj) return {};
        // Weekly: pick selected day (or first)
        if (dayKeys.length > 0) {
            const key = selectedDay ?? dayKeys[0];
            const dayObj = (planObj as any)?.[key];
            return (dayObj as Record<string, unknown>) ?? {};
        }
        // Single-day style: planObj itself is sections
        return planObj;
    }, [planObj, dayKeys, selectedDay]);

    return (
        <View className="flex-1 bg-black">
            <SafeAreaView edges={["top"]} className="bg-black">
                <View className="flex-row items-center justify-between px-5 py-3 border-b border-neutral-900">
                    <Text className="text-white text-lg font-semibold">Recommended Meals</Text>
                    <Pressable
                        onPress={() => router.replace("/(tabs)/meals")}
                        className="px-3 py-1 rounded-full bg-white flex-row items-center"
                        hitSlop={10}
                    >
                        <Check size={16} color="black" />
                        <Text className="text-black font-semibold ml-1">Save & Continue</Text>
                    </Pressable>
                </View>
            </SafeAreaView>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                    <Text className="text-neutral-400 mt-3">Creating your recommendations…</Text>
                </View>
            ) : errMsg ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-neutral-300 text-center mb-4">{errMsg}</Text>
                    <Pressable
                        onPress={async () => {
                            try {
                                setLoading(true);
                                setErrMsg(null);
                                const token = await getAccessToken();
                                if (!token) throw new Error("You are not logged in.");
                                const res = await recommendWeeklyMeals(token);
                                setRaw(res);
                            } catch (e: any) {
                                setErrMsg(e?.message || "Failed to fetch recommended meals.");
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="px-4 py-2 rounded-full bg-white/10 border border-white/10 flex-row items-center"
                    >
                        <RotateCcw color="white" size={18} />
                        <Text className="text-white ml-2">Try again</Text>
                    </Pressable>
                </View>
            ) : !planObj ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-neutral-300 text-center">
                        No recommendations available.
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                    {/* Day selector (only if plan looks weekly) */}
                    {dayKeys.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="border-b border-neutral-900"
                            contentContainerStyle={{ paddingHorizontal: 16 }}
                        >
                            {dayKeys.map((day) => {
                                const active = day === (selectedDay ?? dayKeys[0]);
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
                    )}

                    {/* Sections */}
                    <View className="px-5">
                        {Object.entries(sections).length === 0 ? (
                            <Text className="text-neutral-500 text-sm mt-6">No items found in recommendations.</Text>
                        ) : (
                            Object.entries(sections).map(([sectionName, mealsUnknown]) => {
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
                                                        <Text className="text-white font-medium mb-1">{meal.title}</Text>
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
                            })
                        )}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
