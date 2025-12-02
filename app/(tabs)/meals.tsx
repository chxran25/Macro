// app/(tabs)/meals.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    ScrollView,
    Pressable,
    Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SlidersHorizontal, ShoppingCart } from "lucide-react-native";
import { useRouter } from "expo-router";

import { getWeeklyPlan, createDailyPlanOrder } from "../../lib/api";
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

    // Cart bubble state
    const [cartBubbleVisible, setCartBubbleVisible] = useState(false);
    const [cartBubbleText, setCartBubbleText] = useState("Item added to cart");
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const bubbleAnim = useRef(new Animated.Value(0)).current;

    // Daily Plan modal state
    const [showDailyModal, setShowDailyModal] = useState(false);
    const [isPlacingDailyPlan, setIsPlacingDailyPlan] = useState(false);

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

        return () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (cartBubbleVisible) {
            Animated.spring(bubbleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 10,
            }).start();
        } else {
            Animated.spring(bubbleAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        }
    }, [cartBubbleVisible]);

    const days = useMemo<string[]>(() => {
        if (!weeklyPlan) return [];
        return Object.keys(weeklyPlan.plan);
    }, [weeklyPlan]);

    const mealsForSelectedDay = useMemo<Meal[]>(() => {
        if (!weeklyPlan || !selectedDay) return [];
        const sections = weeklyPlan.plan[selectedDay];
        if (!sections) return [];
        const values = Object.values(sections) as Meal[][];
        return values.flat();
    }, [weeklyPlan, selectedDay]);

    const dailyMealCount = useMemo(() => {
        return mealsForSelectedDay.length || 3;
    }, [mealsForSelectedDay]);

    const approxDailyCalories = useMemo(() => {
        if (!mealsForSelectedDay.length) return 0;
        return mealsForSelectedDay.reduce(
            (sum, meal) => sum + (meal.calories || 0),
            0
        );
    }, [mealsForSelectedDay]);

    const handleMealAddedToCart = (meal?: Meal) => {
        const msg = meal?.title
            ? `${meal.title} added to cart`
            : "Item added to cart";
        setCartBubbleText(msg);
        setCartBubbleVisible(true);

        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }

        hideTimerRef.current = setTimeout(() => {
            setCartBubbleVisible(false);
        }, 3000);
    };

    const handleCartBubblePress = () => {
        setCartBubbleVisible(false);
        router.push("/checkout");
    };

    const openDailyPlanModal = () => {
        if (!selectedDay) return;
        setShowDailyModal(true);
    };

    const handleConfirmDailyPlan = async () => {
        if (!selectedDay || isPlacingDailyPlan) return;

        try {
            setIsPlacingDailyPlan(true);
            const token = await getAccessToken();
            if (!token) {
                setErrMsg("You are not logged in.");
                return;
            }

            await createDailyPlanOrder(token, {
                dayName: selectedDay,
                mealFrequency: dailyMealCount,
            });

            setCartBubbleText(`${selectedDay} - Daily Meal added to cart`);
            setCartBubbleVisible(true);

            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }
            hideTimerRef.current = setTimeout(() => {
                setCartBubbleVisible(false);
            }, 3000);

            setShowDailyModal(false);
        } catch (e: any) {
            console.error("Error creating daily plan:", e);
            setErrMsg(e?.message || "Could not add daily plan to cart.");
        } finally {
            setIsPlacingDailyPlan(false);
        }
    };

    return (
        <View className="flex-1 bg-black">
            {/* Top bar */}
            <SafeAreaView edges={["top"]} className="bg-black">
                <View className="px-5 pt-4 pb-4 border-b border-neutral-900/50">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-1">
                            <Text className="text-white text-2xl font-bold mb-1">
                                Meal Plan
                            </Text>
                            <Text className="text-neutral-400 text-sm">
                                Your AI-crafted meals for the week
                            </Text>
                        </View>

                        <View className="flex-row items-center gap-2">
                            <Pressable
                                hitSlop={8}
                                className="w-11 h-11 rounded-2xl border border-neutral-800/80 items-center justify-center bg-neutral-900/50"
                            >
                                <SlidersHorizontal color="white" size={20} strokeWidth={2.5} />
                            </Pressable>

                            <Pressable
                                hitSlop={8}
                                onPress={() => router.push("/checkout")}
                                className="w-11 h-11 rounded-2xl border border-neutral-800/80 items-center justify-center bg-neutral-900/50"
                            >
                                <ShoppingCart color="white" size={20} strokeWidth={2.5} />
                            </Pressable>
                        </View>
                    </View>

                    {/* Weekly macro strip - Enhanced */}
                    {weeklyTotals && (
                        <View className="flex-row gap-2.5">
                            <View className="flex-1 px-3.5 py-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
                                <Text className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide mb-0.5">
                                    Calories
                                </Text>
                                <Text className="text-white text-base font-bold">
                                    {weeklyTotals.calories ?? 0}
                                </Text>
                                <Text className="text-emerald-400/70 text-[10px]">
                                    kcal/week
                                </Text>
                            </View>
                            <View className="flex-1 px-3.5 py-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                                <Text className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide mb-0.5">
                                    Protein
                                </Text>
                                <Text className="text-white text-base font-bold">
                                    {weeklyTotals.protein ?? 0}g
                                </Text>
                            </View>
                            <View className="flex-1 px-3.5 py-3 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                                <Text className="text-[10px] text-purple-400 font-semibold uppercase tracking-wide mb-0.5">
                                    Carbs
                                </Text>
                                <Text className="text-white text-base font-bold">
                                    {weeklyTotals.carbs ?? 0}g
                                </Text>
                            </View>
                            <View className="flex-1 px-3.5 py-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                                <Text className="text-[10px] text-amber-400 font-semibold uppercase tracking-wide mb-0.5">
                                    Fats
                                </Text>
                                <Text className="text-white text-base font-bold">
                                    {weeklyTotals.fat ?? 0}g
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </SafeAreaView>

            {/* States */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#10b981" />
                    <Text className="text-neutral-400 mt-4 font-medium">
                        Loading weekly plan…
                    </Text>
                </View>
            ) : needsRecommendations ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 items-center">
                        <Text className="text-6xl mb-4">🍽️</Text>
                        <Text className="text-white text-xl font-bold text-center mb-3">
                            No Meal Plan Yet
                        </Text>
                        <Text className="text-neutral-400 text-center mb-6 leading-relaxed">
                            Generate personalized recommendations to get started with your nutrition journey
                        </Text>
                        <Pressable
                            onPress={() => router.replace("/rec_meals")}
                            className="px-6 py-3.5 rounded-full bg-emerald-500 shadow-lg"
                        >
                            <Text className="text-white font-bold">
                                Generate Recommendations
                            </Text>
                        </Pressable>
                    </View>
                </View>
            ) : errMsg ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6">
                        <Text className="text-red-400 text-center leading-relaxed">
                            {errMsg}
                        </Text>
                    </View>
                </View>
            ) : !weeklyPlan || days.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 items-center">
                        <Text className="text-neutral-300 text-center mb-6 leading-relaxed">
                            No weekly plan available for this user.
                        </Text>
                        <Pressable
                            onPress={() => router.replace("/rec_meals")}
                            className="px-6 py-3.5 rounded-full bg-emerald-500"
                        >
                            <Text className="text-white font-bold">
                                Create from Recommendations
                            </Text>
                        </Pressable>
                    </View>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* Day selector - Enhanced */}
                    <View className="border-b border-neutral-900/50 bg-black/50 backdrop-blur-xl">
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{
                                paddingHorizontal: 20,
                                paddingVertical: 12,
                                gap: 10,
                            }}
                        >
                            {days.map((day) => {
                                const active = day === selectedDay;
                                return (
                                    <Pressable
                                        key={day}
                                        onPress={() => setSelectedDay(day as DayKey)}
                                        className={`px-5 py-2.5 rounded-full border-2 ${
                                            active
                                                ? "bg-emerald-500 border-emerald-400"
                                                : "bg-neutral-900/60 border-neutral-800/60"
                                        }`}
                                    >
                                        <Text
                                            className={`font-bold text-sm ${
                                                active
                                                    ? "text-white"
                                                    : "text-neutral-400"
                                            }`}
                                        >
                                            {day}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Order Daily / Weekly actions - Enhanced */}
                    <View className="px-5 mt-5 flex-row gap-3">
                        <Pressable
                            onPress={openDailyPlanModal}
                            className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 items-center justify-center shadow-xl"
                        >
                            <Text className="text-white font-bold text-base">
                                🎯 Order Daily
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                // TODO: weekly plan ordering
                            }}
                            className="flex-1 rounded-2xl bg-neutral-900/60 border-2 border-neutral-800/60 py-4 items-center justify-center"
                        >
                            <Text className="text-neutral-300 font-bold text-base">
                                📅 Order Weekly
                            </Text>
                        </Pressable>
                    </View>

                    {/* Meals list for selected day - Enhanced */}
                    <View className="px-5 mt-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <View>
                                <Text className="text-white text-xl font-bold">
                                    {selectedDay}
                                </Text>
                                <Text className="text-neutral-500 text-sm mt-0.5">
                                    {mealsForSelectedDay.length} meals • {approxDailyCalories} kcal
                                </Text>
                            </View>
                        </View>

                        {mealsForSelectedDay.length === 0 ? (
                            <View className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-6 items-center">
                                <Text className="text-neutral-500 text-center">
                                    No meals planned for this day
                                </Text>
                            </View>
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

            {/* Daily Plan modal - Enhanced */}
            <DailyPlanModal
                visible={showDailyModal}
                onClose={() => !isPlacingDailyPlan && setShowDailyModal(false)}
                dayName={selectedDay}
                mealCount={dailyMealCount}
                approxCalories={approxDailyCalories}
                onConfirm={handleConfirmDailyPlan}
                loading={isPlacingDailyPlan}
            />

            {/* Floating cart bubble - Enhanced with animation */}
            <Animated.View
                style={{
                    transform: [
                        {
                            translateY: bubbleAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [100, 0],
                            }),
                        },
                        {
                            scale: bubbleAnim,
                        },
                    ],
                    opacity: bubbleAnim,
                }}
                className="absolute left-0 right-0 bottom-6 px-4"
                pointerEvents={cartBubbleVisible ? "auto" : "none"}
            >
                <Pressable
                    onPress={handleCartBubblePress}
                    className="flex-row items-center justify-between px-5 py-4 rounded-2xl bg-white shadow-2xl"
                >
                    <View className="flex-1 mr-4">
                        <Text className="text-black font-bold text-base mb-1">
                            {cartBubbleText}
                        </Text>
                        <Text className="text-neutral-600 text-sm">
                            Tap to view cart & checkout
                        </Text>
                    </View>
                    <View className="bg-black rounded-full px-4 py-2">
                        <Text className="text-white font-bold text-sm">
                            View →
                        </Text>
                    </View>
                </Pressable>
            </Animated.View>
        </View>
    );
}

/* ===== Daily Plan Modal - Enhanced ===== */

type DailyPlanModalProps = {
    visible: boolean;
    onClose: () => void;
    dayName: string | null;
    mealCount: number;
    approxCalories: number;
    onConfirm: () => void;
    loading?: boolean;
};

const DailyPlanModal: React.FC<DailyPlanModalProps> = ({
                                                           visible,
                                                           onClose,
                                                           dayName,
                                                           mealCount,
                                                           approxCalories,
                                                           onConfirm,
                                                           loading,
                                                       }) => {
    if (!visible || !dayName) return null;

    return (
        <Pressable
            onPress={onClose}
            className="absolute inset-0 bg-black/75 justify-end"
        >
            {/* Inner sheet – stop propagation so taps inside don't close */}
            <Pressable onPress={(e) => e.stopPropagation()}>
                <View className="bg-neutral-950 rounded-t-3xl border-t border-neutral-800 shadow-2xl">
                    <View className="p-6 pb-8">
                        {/* Grab handle */}
                        <View className="w-12 h-1.5 rounded-full bg-neutral-700 self-center mb-6" />

                        {/* Header row */}
                        <View className="flex-row items-start justify-between mb-5">
                            <View className="flex-1 pr-3">
                                <Text className="text-[11px] text-emerald-400/90 font-semibold uppercase tracking-[1.2px] mb-1">
                                    Daily Smart Pack
                                </Text>
                                <Text className="text-white text-2xl font-extrabold mb-1">
                                    Lock in {dayName} 🎯
                                </Text>
                                <Text className="text-neutral-400 text-sm leading-relaxed">
                                    Get all your AI-crafted meals for{" "}
                                    <Text className="text-emerald-400 font-semibold">
                                        {dayName}
                                    </Text>{" "}
                                    in one simple delivery. No planning, no decisions – just eat
                                    and move on with your day.
                                </Text>
                            </View>

                            <View className="items-end">
                                <View className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 mb-2">
                                    <Text className="text-emerald-400 text-[10px] font-semibold">
                                        Best for consistency
                                    </Text>
                                </View>
                                <View className="px-3 py-2 rounded-2xl bg-neutral-900 border border-neutral-700 items-end">
                                    <Text className="text-neutral-400 text-[10px]">
                                        Starts from
                                    </Text>
                                    <Text className="text-white font-bold text-base">
                                        ₹800
                                    </Text>
                                    <Text className="text-emerald-400 text-[10px]">
                                        full day coverage
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Quick stats chips */}
                        <View className="flex-row gap-2 mb-5">
                            <View className="flex-1 px-3 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                                <Text className="text-[10px] text-neutral-400 uppercase mb-0.5">
                                    Meals today
                                </Text>
                                <Text className="text-white font-semibold text-sm">
                                    {mealCount} curated meals
                                </Text>
                            </View>
                            <View className="flex-1 px-3 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                                <Text className="text-[10px] text-neutral-400 uppercase mb-0.5">
                                    Approx. calories
                                </Text>
                                <Text className="text-white font-semibold text-sm">
                                    {approxCalories || 0} kcal
                                </Text>
                            </View>
                            <View className="flex-1 px-3 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                                <Text className="text-[10px] text-neutral-400 uppercase mb-0.5">
                                    Delivery
                                </Text>
                                <Text className="text-white font-semibold text-sm">
                                    6–10 AM slot
                                </Text>
                            </View>
                        </View>

                        {/* Benefits card */}
                        <View className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 mb-5">
                            <Text className="text-white text-base font-bold mb-3">
                                What you'll get today
                            </Text>

                            <View className="gap-2">
                                <View className="flex-row items-start">
                                    <Text className="text-emerald-400 mr-2 mt-[1px]">✓</Text>
                                    <Text className="text-neutral-300 text-sm flex-1">
                                        {mealCount} balanced meals from your{" "}
                                        <Text className="font-semibold text-white">Meal Plan</Text>
                                    </Text>
                                </View>

                                {approxCalories > 0 && (
                                    <View className="flex-row items-start">
                                        <Text className="text-emerald-400 mr-2 mt-[1px]">✓</Text>
                                        <Text className="text-neutral-300 text-sm flex-1">
                                            Around{" "}
                                            <Text className="font-semibold text-white">
                                                {approxCalories} kcal
                                            </Text>{" "}
                                            tuned to your goals
                                        </Text>
                                    </View>
                                )}

                                <View className="flex-row items-start">
                                    <Text className="text-emerald-400 mr-2 mt-[1px]">✓</Text>
                                    <Text className="text-neutral-300 text-sm flex-1">
                                        Fresh, single morning delivery between{" "}
                                        <Text className="font-semibold text-white">6–10 AM</Text>
                                    </Text>
                                </View>

                                <View className="flex-row items-start">
                                    <Text className="text-emerald-400 mr-2 mt-[1px]">✓</Text>
                                    <Text className="text-neutral-300 text-sm flex-1">
                                        One-tap checkout – no multiple payments or separate orders
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Why daily plan */}
                        <View className="bg-amber-500/10 border border-amber-500/35 rounded-2xl p-4 mb-5">
                            <Text className="text-amber-400 text-sm font-bold mb-2">
                                💡 Why lock in {dayName}?
                            </Text>
                            <Text className="text-amber-100/90 text-sm leading-relaxed">
                                Stay 100% on track · Remove decision fatigue · See consistent
                                progress without overthinking every meal.
                            </Text>
                        </View>

                        {/* CTA row */}
                        <View className="flex-row items-center mb-2">
                            <Text className="text-neutral-500 text-xs">
                                You can edit or cancel this plan anytime before 10 PM today.
                            </Text>
                        </View>

                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={onClose}
                                disabled={loading}
                                className="flex-1 border border-neutral-700 rounded-2xl py-4 items-center justify-center"
                            >
                                <Text className="text-neutral-300 font-semibold text-base">
                                    Maybe later
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={onConfirm}
                                disabled={loading}
                                className="flex-[1.5] rounded-2xl py-4 items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-xl"
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-bold text-base">
                                        Add {dayName} · ₹800
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Pressable>
    );
};
