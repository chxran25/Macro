// app/(tabs)/index.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Pressable,
    Animated,
    StatusBar,
    Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { getWeeklyPlan } from "../../lib/api";
import { getAccessToken } from "../../utils/secureStore";
import { mapBackendWeekPlanToWeeklyPlan } from "../../utils/mealPlanMapper";

import type {
    GetWeeklyPlanApiResponse,
    WeeklyPlan,
    Meal,
    DayKey
} from "../../types/meal";

/* =========================
   MOCK DATA
   ========================= */
const recommended = [
    {
        id: "r1",
        title: "Chicken Breast",
        subtitle: "High protein, low fat",
        image:
            "https://images.unsplash.com/photo-1604908176997-4316511a7e52?q=80&w=600"
    },
    {
        id: "r2",
        title: "Beef Steak",
        subtitle: "Rich in iron, lean cut",
        image:
            "https://images.unsplash.com/photo-1604908812141-7f9bfb9b4b50?q=80&w=600"
    },
    {
        id: "r3",
        title: "Tofu",
        subtitle: "Plant protein, versatile",
        image:
            "https://images.unsplash.com/photo-1615486363876-477b2a2d7a3c?q=80&w=600"
    }
];

type LogItem = { id: string; name: string; kcal: number; qty?: number };

const initialLog: LogItem[] = [
    { id: "a1", name: "Apple", kcal: 250, qty: 1 },
    { id: "a2", name: "Chicken Breast", kcal: 350, qty: 1 },
    { id: "a3", name: "Salad", kcal: 150, qty: 1 }
];

/* =========================
   SMALL COMPONENTS
   ========================= */
const PressableScale = ({
                            children,
                            onPress
                        }: {
    children: React.ReactNode;
    onPress?: () => void;
}) => {
    const scale = useRef(new Animated.Value(1)).current;
    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
                onPressIn={() =>
                    Animated.spring(scale, {
                        toValue: 0.94,
                        useNativeDriver: true
                    }).start()
                }
                onPressOut={() =>
                    Animated.spring(scale, {
                        toValue: 1,
                        useNativeDriver: true
                    }).start()
                }
                onPress={onPress}
                android_ripple={{ color: "#222" }}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <View className="mb-5">
        <Text className="text-white font-bold text-2xl mb-1">{title}</Text>
        {subtitle && <Text className="text-neutral-400 text-sm">{subtitle}</Text>}
    </View>
);

const Divider = () => (
    <View className="h-[1px] bg-neutral-900 my-6 opacity-70" />
);

const KV = ({ k, v }: { k: string; v: string }) => (
    <View className="flex-row justify-between items-center mb-3">
        <Text className="text-neutral-300 text-sm">{k}</Text>
        <Text className="text-white font-semibold text-sm">{v}</Text>
    </View>
);

const ProgressBar = ({
                         value,
                         goal,
                         color = "#10b981"
                     }: {
    value: number;
    goal: number;
    color?: string;
}) => {
    const pct = Math.max(0, Math.min(100, (value / goal) * 100 || 0));
    return (
        <View className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden mt-1.5">
            <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        </View>
    );
};

const Sparkline = ({ points }: { points: number[] }) => {
    const max = Math.max(...points, 1);
    return (
        <View className="flex-row items-end h-16 gap-1.5">
            {points.map((p, i) => {
                const h = Math.max(6, Math.round((p / max) * 56));
                const isToday = i === points.length - 1;
                return (
                    <View
                        key={i}
                        className="flex-1 rounded-full"
                        style={{ height: h, backgroundColor: isToday ? "#10b981" : "#404040" }}
                    />
                );
            })}
        </View>
    );
};

/* =========================
   MAIN HOME SCREEN
   ========================= */
export default function Home() {
    const scrollY = useRef(new Animated.Value(0)).current;

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 70],
        outputRange: [0, 1],
        extrapolate: "clamp"
    });

    const [log] = useState<LogItem[]>(initialLog);
    const totalKcal = useMemo(
        () => log.reduce((t, i) => t + i.kcal * (i.qty || 1), 0),
        [log]
    );

    const dailyGoal = 2000;
    const protein = { value: 120, goal: 200 };
    const fat = { value: 40, goal: 50 };
    const carbs = { value: 100, goal: 200 };
    const miniSeries = [1600, 1750, 1820, 1550, 1900, 1700, 1800];

    /* -------------------------
       Today's Meals Loading
       ------------------------- */
    const [todayMeals, setTodayMeals] = useState<{
        breakfast: Meal | null;
        lunch: Meal | null;
        dinner: Meal | null;
    }>({
        breakfast: null,
        lunch: null,
        dinner: null
    });

    const [todayLoading, setTodayLoading] = useState(true);
    const [todayError, setTodayError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setTodayLoading(true);
                setTodayError(null);

                const token = await getAccessToken();
                if (!token) {
                    setTodayError("You are not logged in.");
                    return;
                }

                const res: GetWeeklyPlanApiResponse | null = await getWeeklyPlan(token);

                if (!res || !res.weeklyPlan?.plan) {
                    setTodayMeals({ breakfast: null, lunch: null, dinner: null });
                    return;
                }

                const mapped: WeeklyPlan = mapBackendWeekPlanToWeeklyPlan(res.weeklyPlan);
                const jsDay = new Date().toLocaleDateString("en-US", { weekday: "long" });

                const resolvedDay = Object.keys(mapped.plan).find(
                    d => d.toLowerCase() === jsDay.toLowerCase()
                ) as DayKey;

                const allMeals = Object.values(mapped.plan[resolvedDay] || {}).flat();

                setTodayMeals({
                    breakfast: allMeals[0] || null,
                    lunch: allMeals[1] || null,
                    dinner: allMeals[2] || null
                });
            } catch (e: any) {
                setTodayError(e?.message || "Failed to load meals.");
            } finally {
                setTodayLoading(false);
            }
        })();
    }, []);

    /* -------------------------
       RENDER TODAY CARD
       ------------------------- */
    const renderTodayCard = (label: string, meal: Meal | null, icon: string) => {
        if (todayLoading) {
            return (
                <View className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-5 mb-4">
                    <View className="flex-row items-center">
                        <View className="flex-1 pr-4">
                            <View className="w-20 h-3 rounded-full bg-neutral-800 mb-3" />
                            <View className="w-40 h-5 rounded-full bg-neutral-800 mb-2" />
                            <View className="w-full h-3 rounded-full bg-neutral-800" />
                        </View>
                        <View className="w-24 h-24 rounded-2xl bg-neutral-800" />
                    </View>
                </View>
            );
        }

        if (!meal) {
            return (
                <View className="bg-neutral-900/30 border border-neutral-800/40 rounded-3xl p-5 mb-4">
                    <View className="flex-row items-center">
                        <View className="flex-1 pr-4">
                            <Text className="text-neutral-500 text-xs mb-2 uppercase tracking-wider">
                                {label}
                            </Text>
                            <Text className="text-neutral-600 text-base">
                                No {label.toLowerCase()} planned
                            </Text>
                        </View>
                        <View className="w-24 h-24 rounded-2xl bg-neutral-900/50 items-center justify-center">
                            <Text className="text-4xl opacity-20">{icon}</Text>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <LinearGradient
                colors={["#0f0f0f", "#141414"]}
                className="rounded-3xl border border-neutral-800 mb-4"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View className="flex-row p-5">
                    <View className="flex-1 pr-4">
                        <Text className="text-emerald-400 text-xs mb-2 uppercase tracking-wider">
                            {label}
                        </Text>
                        <Text className="text-white text-lg font-bold mb-2 leading-tight">
                            {meal.title}
                        </Text>

                        <Text
                            className="text-neutral-400 text-sm leading-relaxed mb-3"
                            numberOfLines={2}
                        >
                            {meal.description || `Delicious and healthy ${label.toLowerCase()}`}
                        </Text>

                        <View className="flex-row items-center gap-3">
                            <View className="bg-neutral-800/60 px-3 py-1.5 rounded-full">
                                <Text className="text-white text-xs font-semibold">
                                    {meal.calories} cal
                                </Text>
                            </View>
                            <View className="bg-neutral-800/60 px-3 py-1.5 rounded-full">
                                <Text className="text-white text-xs">
                                    P {meal.macros.protein}g
                                </Text>
                            </View>
                        </View>
                    </View>

                    {meal.image ? (
                        <Image
                            source={{ uri: meal.image }}
                            className="w-28 h-28 rounded-2xl"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-28 h-28 rounded-2xl bg-neutral-800/60 items-center justify-center">
                            <Text className="text-5xl opacity-30">{icon}</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>
        );
    };

    /* =========================
       SCREEN UI
       ========================= */
    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />

            {/* Floating Header */}
            <Animated.View
                style={{ opacity: headerOpacity }}
                className="absolute top-0 left-0 right-0 z-10 bg-black/90 border-b border-neutral-900"
            >
                <SafeAreaView edges={["top"]}>
                    <View className="py-4 items-center">
                        <Text className="text-white font-bold text-lg">Home</Text>
                    </View>
                </SafeAreaView>
            </Animated.View>

            <SafeAreaView edges={["top"]}>
                <ScrollView
                    className="px-5"
                    contentContainerStyle={{ paddingBottom: 90 }}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >
                    {/* TOP ROW */}
                    <View className="flex-row items-center justify-between mt-2 mb-8">
                        <View>
                            <Text className="text-white text-3xl font-bold mb-1">Home</Text>
                            <Text className="text-neutral-400 text-sm">
                                Welcome back to your journey
                            </Text>
                        </View>

                        <PressableScale>
                            <View className="bg-neutral-900 border border-neutral-700 px-5 py-3 rounded-2xl shadow-lg">
                                <Text className="text-white font-semibold text-sm">Preferences</Text>
                            </View>
                        </PressableScale>
                    </View>

                    {/* TODAY’S MEALS */}
                    <SectionHeader title="Today's Meals" subtitle="Your personalized meal plan" />

                    {todayError && (
                        <View className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                            <Text className="text-red-400 text-sm">{todayError}</Text>
                        </View>
                    )}

                    <View className="mb-2">
                        {renderTodayCard("Breakfast", todayMeals.breakfast, "🌅")}
                        {renderTodayCard("Lunch", todayMeals.lunch, "☀️")}
                        {renderTodayCard("Dinner", todayMeals.dinner, "🌙")}
                    </View>

                    <Divider />

                    {/* RECOMMENDED */}
                    <SectionHeader title="Recommended" subtitle="Curated for your goals" />

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="-mx-5 px-5 mb-2"
                        contentContainerStyle={{ paddingRight: 20 }}
                    >
                        {recommended.map(r => (
                            <View
                                key={r.id}
                                className="w-56 mr-4 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden"
                            >
                                <View className="relative">
                                    <Image source={{ uri: r.image }} className="w-full h-40" />
                                    <View className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
                                </View>
                                <View className="p-4">
                                    <Text className="text-white font-bold text-lg mb-1">{r.title}</Text>
                                    <Text className="text-neutral-400 text-sm">{r.subtitle}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <Divider />

                    {/* NUTRITION OVERVIEW */}
                    <SectionHeader title="Nutrition Overview" subtitle="Daily macro tracking" />

                    <View className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6">
                        <KV k="Daily Calories" v={`${totalKcal} / ${dailyGoal} kcal`} />
                        <ProgressBar value={totalKcal} goal={dailyGoal} color="#10b981" />

                        <View className="mt-6">
                            <KV k="Protein" v={`${protein.value}g / ${protein.goal}g`} />
                            <ProgressBar value={protein.value} goal={protein.goal} color="#3b82f6" />
                        </View>

                        <View className="mt-5">
                            <KV k="Fat" v={`${fat.value}g / ${fat.goal}g`} />
                            <ProgressBar value={fat.value} goal={fat.goal} color="#f59e0b" />
                        </View>

                        <View className="mt-5">
                            <KV k="Carbs" v={`${carbs.value}g / ${carbs.goal}g`} />
                            <ProgressBar value={carbs.value} goal={carbs.goal} color="#8b5cf6" />
                        </View>
                    </View>

                    {/* CALORIE INTAKE CARD */}
                    <View className="mt-6 bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6">
                        <Text className="text-neutral-400 text-sm uppercase tracking-wide mb-1">
                            Calorie Intake
                        </Text>

                        <Text className="text-white text-4xl font-bold">{totalKcal}</Text>
                        <Text className="text-xs text-neutral-500 mb-2">kcal consumed today</Text>

                        <View className="flex-row items-center mb-5">
                            <Text className="text-emerald-400 text-sm font-semibold">+5% ↗</Text>
                            <Text className="text-neutral-500 text-xs ml-2">vs last 7 days</Text>
                        </View>

                        <Sparkline points={miniSeries} />

                        <View className="flex-row justify-between mt-3 px-1">
                            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                                <Text
                                    key={i}
                                    className={`text-xs font-medium ${
                                        i === 6 ? "text-emerald-400" : "text-neutral-600"
                                    }`}
                                >
                                    {d}
                                </Text>
                            ))}
                        </View>
                    </View>

                    <Divider />

                    {/* QUICK LOGGER */}
                    <SectionHeader title="Quick Logger" subtitle="Log your meals & habits" />

                    <View className="gap-4">
                        <TextInput
                            placeholder="Search food items..."
                            placeholderTextColor="#666"
                            className="bg-neutral-900/70 text-white rounded-2xl px-5 py-4 border border-neutral-800 text-base"
                        />

                        <View className="items-end">
                            <PressableScale>
                                <View className="bg-emerald-500 rounded-full px-6 py-3.5 shadow-lg">
                                    <Text className="text-white font-bold text-sm">Add Entry</Text>
                                </View>
                            </PressableScale>
                        </View>

                        {/* Food Log */}
                        <View className="gap-3 mt-2">
                            {initialLog.map(item => (
                                <View
                                    key={item.id}
                                    className="flex-row justify-between items-center bg-neutral-900/70 border border-neutral-800 px-5 py-4 rounded-2xl"
                                >
                                    <View className="flex-1">
                                        <Text className="text-white font-semibold text-base mb-1">
                                            {item.name}
                                        </Text>
                                        <Text className="text-neutral-400 text-sm">{item.kcal} kcal</Text>
                                    </View>

                                    <View className="bg-neutral-800/60 px-4 py-2 rounded-full">
                                        <Text className="text-white font-semibold">{item.qty ?? 1}×</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Exercise + Water */}
                        <View className="gap-3 mt-2">
                            <PressableScale>
                                <View className="flex-row justify-between items-center bg-neutral-900/70 border border-neutral-800 px-5 py-4 rounded-2xl">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-10 h-10 rounded-full bg-orange-500/20 items-center justify-center mr-3">
                                            <Text className="text-lg">💪</Text>
                                        </View>
                                        <Text className="text-white font-semibold">Add Exercise</Text>
                                    </View>
                                    <Text className="text-white text-xl">→</Text>
                                </View>
                            </PressableScale>

                            <PressableScale>
                                <View className="flex-row justify-between items-center bg-neutral-900/70 border border-neutral-800 px-5 py-4 rounded-2xl">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                                            <Text className="text-lg">💧</Text>
                                        </View>
                                        <Text className="text-white font-semibold">
                                            Track Water Intake
                                        </Text>
                                    </View>
                                    <Text className="text-white text-xl">→</Text>
                                </View>
                            </PressableScale>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
