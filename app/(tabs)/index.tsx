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
    Image,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getWeeklyPlan } from "../../lib/api";
import { getAccessToken } from "../../utils/secureStore";
import { mapBackendWeekPlanToWeeklyPlan } from "../../utils/mealPlanMapper";
import type {
    GetWeeklyPlanApiResponse,
    WeeklyPlan,
    Meal,
    DayKey,
} from "../../types/meal";

/* ---------- Mock Data (kept for Recommended + Logger) ---------- */
const recommended = [
    {
        id: "r1",
        title: "Chicken Breast",
        subtitle: "High protein, low fat",
        image: "https://images.unsplash.com/photo-1604908176997-4316511a7e52?q=80&w=600",
    },
    {
        id: "r2",
        title: "Beef Steak",
        subtitle: "Rich in iron, lean cut",
        image: "https://images.unsplash.com/photo-1604908812141-7f9bfb9b4b50?q=80&w=600",
    },
    {
        id: "r3",
        title: "Tofu",
        subtitle: "Plant protein, versatile",
        image: "https://images.unsplash.com/photo-1615486363876-477b2a2d7a3c?q=80&w=600",
    },
];

type LogItem = { id: string; name: string; kcal: number; qty?: number };
const initialLog: LogItem[] = [
    { id: "a1", name: "Apple", kcal: 250, qty: 1 },
    { id: "a2", name: "Chicken Breast", kcal: 350, qty: 1 },
    { id: "a3", name: "Salad", kcal: 150, qty: 1 },
];

/* ---------- Small UI ---------- */
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
                    Animated.spring(scale, {
                        toValue: 0.98,
                        useNativeDriver: true,
                    }).start()
                }
                onPressOut={() =>
                    Animated.spring(scale, {
                        toValue: 1,
                        useNativeDriver: true,
                    }).start()
                }
                onPress={onPress}
                android_ripple={{ color: "#2a2a2a" }}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};

const SectionHeader = ({ title }: { title: string }) => (
    <Text className="text-white font-semibold text-xl mb-4">{title}</Text>
);

const Divider = () => <View className="h-[1px] bg-neutral-900 my-8" />;

const KV = ({ k, v }: { k: string; v: string }) => (
    <View className="flex-row justify-between items-center mb-2">
        <Text className="text-neutral-300">{k}</Text>
        <Text className="text-neutral-400">{v}</Text>
    </View>
);

const ProgressBar = ({ value, goal }: { value: number; goal: number }) => {
    const pct = Math.max(0, Math.min(100, (value / goal) * 100 || 0));
    return (
        <View className="w-full h-3 rounded-full bg-neutral-850 overflow-hidden">
            <View className="h-full bg-white" style={{ width: `${pct}%` }} />
        </View>
    );
};

const Sparkline = ({ points }: { points: number[] }) => {
    const max = Math.max(...points, 1);
    return (
        <View className="flex-row items-end h-16 gap-2">
            {points.map((p, i) => {
                const h = Math.max(6, Math.round((p / max) * 56));
                return (
                    <View
                        key={i}
                        className="w-2 rounded-full bg-neutral-700"
                        style={{ height: h }}
                    />
                );
            })}
        </View>
    );
};

/* ---------- Types for Today's Meals ---------- */
type TodayMeals = {
    breakfast: Meal | null;
    lunch: Meal | null;
    dinner: Meal | null;
};

/* ---------- Screen ---------- */
export default function Home() {
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 40],
        outputRange: [0, 1],
        extrapolate: "clamp",
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

    /* -------- Today’s meals state -------- */
    const [todayMeals, setTodayMeals] = useState<TodayMeals>({
        breakfast: null,
        lunch: null,
        dinner: null,
    });
    const [todayLoading, setTodayLoading] = useState<boolean>(true);
    const [todayError, setTodayError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setTodayLoading(true);
                setTodayError(null);

                const token = await getAccessToken();
                if (!token) {
                    console.log("[HOME] No token – user not logged in.");
                    setTodayError("You are not logged in.");
                    setTodayMeals({
                        breakfast: null,
                        lunch: null,
                        dinner: null,
                    });
                    return;
                }

                const res: GetWeeklyPlanApiResponse | null =
                    await getWeeklyPlan(token);

                console.log(
                    "[HOME] /getWeekly raw response:",
                    JSON.stringify(res, null, 2)
                );

                if (!res || !res.weeklyPlan || !res.weeklyPlan.plan) {
                    console.log("[HOME] No weeklyPlan.plan found for user.");
                    setTodayMeals({
                        breakfast: null,
                        lunch: null,
                        dinner: null,
                    });
                    return;
                }

                const mapped: WeeklyPlan = mapBackendWeekPlanToWeeklyPlan(
                    res.weeklyPlan
                );

                console.log(
                    "[HOME] mapped WeeklyPlan keys:",
                    Object.keys(mapped.plan)
                );

                const jsWeekday = new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                });
                console.log("[HOME] JS weekday:", jsWeekday);

                const resolvedDay = Object.keys(mapped.plan).find(
                    (d) => d.toLowerCase() === jsWeekday.toLowerCase()
                ) as DayKey | undefined;

                console.log("[HOME] resolved DayKey from plan:", resolvedDay);

                if (!resolvedDay) {
                    console.log(
                        "[HOME] Could not find matching day in mapped.plan"
                    );
                    setTodayMeals({
                        breakfast: null,
                        lunch: null,
                        dinner: null,
                    });
                    return;
                }

                const sectionsForToday = mapped.plan[resolvedDay];
                console.log(
                    "[HOME] sections for today:",
                    Object.keys(sectionsForToday || {})
                );

                const allMealsForToday = Object.values(
                    sectionsForToday || {}
                ).flat() as Meal[];

                console.log(
                    "[HOME] all meals for today (id + title):",
                    allMealsForToday.map((m) => ({
                        id: m.id,
                        title: m.title,
                    }))
                );

                // 👉 Simple, deterministic mapping:
                // first meal → breakfast, second → lunch, third → dinner
                const breakfast = allMealsForToday[0] ?? null;
                const lunch = allMealsForToday[1] ?? null;
                const dinner = allMealsForToday[2] ?? null;

                console.log("[HOME] picked slots:", {
                    breakfast: breakfast?.title || null,
                    lunch: lunch?.title || null,
                    dinner: dinner?.title || null,
                });

                setTodayMeals({ breakfast, lunch, dinner });
            } catch (e: any) {
                console.error("[HOME] Error loading today's meals:", e);
                setTodayError(
                    e?.message || "Failed to load today's meals."
                );
                setTodayMeals({
                    breakfast: null,
                    lunch: null,
                    dinner: null,
                });
            } finally {
                setTodayLoading(false);
            }
        })();
    }, []);

    const renderTodayCard = (label: string, meal: Meal | null) => {
        if (todayLoading) {
            // skeleton shimmer-ish card while loading
            return (
                <View className="bg-neutral-900/70 border border-neutral-800 rounded-3xl px-4 py-4 mb-3 flex-row items-center">
                    <View className="flex-1 mr-3">
                        <View className="w-16 h-3 rounded-full bg-neutral-800 mb-2" />
                        <View className="w-32 h-4 rounded-full bg-neutral-800 mb-1" />
                        <View className="w-40 h-3 rounded-full bg-neutral-800" />
                    </View>
                    <View className="w-20 h-20 rounded-2xl bg-neutral-800" />
                </View>
            );
        }

        if (!meal) {
            return (
                <View className="bg-neutral-900/40 border border-neutral-800/80 rounded-3xl px-4 py-4 mb-3 flex-row items-center">
                    <View className="flex-1 mr-3">
                        <Text className="text-neutral-400 text-xs mb-1">
                            {label}
                        </Text>
                        <Text className="text-neutral-500 text-sm">
                            No {label.toLowerCase()} planned.
                        </Text>
                    </View>
                    <View className="w-20 h-20 rounded-2xl bg-neutral-900" />
                </View>
            );
        }

        const imgUri =
            typeof meal.image === "string" && meal.image.length > 0
                ? meal.image
                : undefined;

        return (
            <View className="bg-neutral-900 border border-neutral-800 rounded-3xl px-4 py-4 mb-3 flex-row items-center">
                <View className="flex-1 mr-3">
                    <Text className="text-neutral-400 text-xs mb-1">
                        {label}
                    </Text>
                    <Text className="text-white text-base font-semibold mb-1">
                        {meal.title}
                    </Text>
                    <Text
                        className="text-neutral-400 text-xs"
                        numberOfLines={2}
                    >
                        {meal.description ||
                            `Approx. ${meal.calories} kcal • P ${meal.macros.protein}g • C ${meal.macros.carbs}g • F ${meal.macros.fat}g`}
                    </Text>
                </View>
                {imgUri ? (
                    <Image
                        source={{ uri: imgUri }}
                        className="w-20 h-20 rounded-2xl"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-20 h-20 rounded-2xl bg-neutral-800 items-center justify-center">
                        <Text className="text-[11px] text-neutral-500 text-center px-2">
                            No Image
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />

            {/* Floating header */}
            <Animated.View
                style={{ opacity: headerOpacity }}
                className="absolute top-0 left-0 right-0 z-10 bg-black/85"
            >
                <SafeAreaView
                    edges={["top"]}
                    className="border-b border-neutral-900"
                >
                    <View className="py-3 items-center">
                        <Text className="text-white font-semibold text-base">
                            Home
                        </Text>
                    </View>
                </SafeAreaView>
            </Animated.View>

            <SafeAreaView edges={["top"]}>
                <ScrollView
                    className="px-6"
                    contentContainerStyle={{ paddingBottom: 64 }}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >
                    {/* Top Row */}
                    <View className="flex-row items-center justify-between mt-1 mb-6">
                        <Text className="text-white text-2xl font-semibold">
                            Home
                        </Text>
                        <PressableScale onPress={() => {}}>
                            <View className="bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-2xl">
                                <Text className="text-white">
                                    Edit Preferences
                                </Text>
                            </View>
                        </PressableScale>
                    </View>

                    {/* Today’s Meals (UPDATED) */}
                    <SectionHeader title="Today’s Meals" />

                    {todayError && !todayLoading ? (
                        <View className="mb-3">
                            <Text className="text-red-400 text-xs mb-2">
                                {todayError}
                            </Text>
                        </View>
                    ) : null}

                    <View className="mb-2">
                        {renderTodayCard("Breakfast", todayMeals.breakfast)}
                        {renderTodayCard("Lunch", todayMeals.lunch)}
                        {renderTodayCard("Dinner", todayMeals.dinner)}
                    </View>

                    <Divider />

                    {/* Recommended */}
                    <SectionHeader title="Recommended" />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 24 }}
                        className="-ml-1 mb-2"
                        snapToInterval={208}
                        decelerationRate="fast"
                    >
                        <View className="w-6" />
                        {recommended.map((r) => (
                            <View
                                key={r.id}
                                className="w-52 mr-4 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden"
                            >
                                <Image
                                    source={{ uri: r.image }}
                                    className="w-52 h-36"
                                />
                                <View className="p-4">
                                    <Text className="text-white font-semibold text-base mb-0.5">
                                        {r.title}
                                    </Text>
                                    <Text className="text-neutral-400 text-xs">
                                        {r.subtitle}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        <View className="w-2" />
                    </ScrollView>

                    <Divider />

                    {/* Calorie Tracking */}
                    <SectionHeader title="Calorie Tracking" />
                    <View className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5">
                        <KV
                            k="Daily Calories"
                            v={`${totalKcal}/${dailyGoal} kcal`}
                        />
                        <ProgressBar value={totalKcal} goal={dailyGoal} />

                        <View className="mt-5">
                            <KV
                                k="Protein"
                                v={`${protein.value}g/${protein.goal}g`}
                            />
                            <ProgressBar
                                value={protein.value}
                                goal={protein.goal}
                            />
                        </View>

                        <View className="mt-4">
                            <KV k="Fat" v={`${fat.value}g/${fat.goal}g`} />
                            <ProgressBar value={fat.value} goal={fat.goal} />
                        </View>

                        <View className="mt-4">
                            <KV
                                k="Carbs"
                                v={`${carbs.value}g/${carbs.goal}g`}
                            />
                            <ProgressBar
                                value={carbs.value}
                                goal={carbs.goal}
                            />
                        </View>
                    </View>

                    {/* Calorie Intake Card */}
                    <View className="mt-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-5">
                        <Text className="text-neutral-300 mb-1">
                            Calorie Intake
                        </Text>
                        <Text className="text-white text-3xl font-semibold">
                            {totalKcal} kcal
                        </Text>
                        <Text className="text-green-400 mt-1 mb-4">
                            Last 7 Days +5%
                        </Text>
                        <Sparkline points={miniSeries} />
                        <View className="flex-row justify-between mt-3">
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                                (d) => (
                                    <Text
                                        key={d}
                                        className="text-neutral-500"
                                    >
                                        {d}
                                    </Text>
                                )
                            )}
                        </View>
                    </View>

                    <Divider />

                    {/* Calorie Logger */}
                    <SectionHeader title="Calorie Logger" />
                    <View className="gap-4">
                        <View className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3">
                            <Text className="text-neutral-500">Select</Text>
                        </View>

                        <TextInput
                            placeholder="Search food items"
                            placeholderTextColor="#8b8b8b"
                            className="bg-neutral-900 text-white rounded-2xl px-4 py-3 border border-neutral-800"
                        />

                        <View className="items-end">
                            <PressableScale onPress={() => {}}>
                                <View className="bg-white rounded-full px-5 py-3">
                                    <Text className="text-black font-semibold">
                                        Add Entry
                                    </Text>
                                </View>
                            </PressableScale>
                        </View>

                        <View className="gap-3">
                            {initialLog.map((item) => (
                                <View
                                    key={item.id}
                                    className="flex-row justify-between items-center bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3"
                                >
                                    <View>
                                        <Text className="text-white">
                                            {item.name}
                                        </Text>
                                        <Text className="text-neutral-400 text-sm">
                                            {item.kcal} kcal
                                        </Text>
                                    </View>
                                    <Text className="text-neutral-300">
                                        {item.qty ?? 1}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View className="gap-3 mt-2 mb-2">
                            <PressableScale onPress={() => {}}>
                                <View className="flex-row justify-between items-center bg-neutral-900 border border-neutral-800 px-4 py-4 rounded-2xl">
                                    <Text className="text-white">
                                        Add Exercise
                                    </Text>
                                    <Text className="text-white text-xl">＋</Text>
                                </View>
                            </PressableScale>

                            <PressableScale onPress={() => {}}>
                                <View className="flex-row justify-between items-center bg-neutral-900 border border-neutral-800 px-4 py-4 rounded-2xl">
                                    <Text className="text-white">
                                        Track Water Intake
                                    </Text>
                                    <Text className="text-white text-xl">＋</Text>
                                </View>
                            </PressableScale>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
