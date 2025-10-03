import { useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Pressable,
    Animated,
    StatusBar,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ---------- Mock Data ----------
const todaysMeals = [
    {
        id: "brk",
        title: "Breakfast",
        subtitle: "Scrambled eggs with spinach and feta",
        image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=400",
    },
    {
        id: "ln",
        title: "Lunch",
        subtitle: "Grilled chicken salad with mixed greens",
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=400",
    },
    {
        id: "dn",
        title: "Dinner",
        subtitle: "Salmon with roasted vegetables",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400",
    },
];

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
                return <View key={i} className="w-2 rounded-full bg-neutral-700" style={{ height: h }} />;
            })}
        </View>
    );
};

// ---------- Screen ----------
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

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />

            {/* Floating header */}
            <Animated.View
                style={{ opacity: headerOpacity }}
                className="absolute top-0 left-0 right-0 z-10 bg-black/85"
            >
                <SafeAreaView edges={["top"]} className="border-b border-neutral-900">
                    <View className="py-3 items-center">
                        <Text className="text-white font-semibold text-base">Home</Text>
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
                        <Text className="text-white text-2xl font-semibold">Home</Text>
                        <PressableScale onPress={() => {}}>
                            <View className="bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-2xl">
                                <Text className="text-white">Edit Preferences</Text>
                            </View>
                        </PressableScale>
                    </View>

                    {/* Today’s Meals */}
                    <SectionHeader title="Today’s Meals" />
                    <View className="gap-4">
                        {todaysMeals.map((m) => (
                            <View
                                key={m.id}
                                className="flex-row items-center bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5"
                            >
                                <Image source={{ uri: m.image }} className="w-18 h-18 rounded-xl mr-3.5" />
                                <View className="flex-1">
                                    <Text className="text-neutral-400 text-xs mb-0.5">Delivered</Text>
                                    <Text className="text-white font-semibold text-base mb-0.5">{m.title}</Text>
                                    <Text className="text-neutral-400" numberOfLines={2}>
                                        {m.subtitle}
                                    </Text>
                                </View>
                            </View>
                        ))}
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
                                <Image source={{ uri: r.image }} className="w-52 h-36" />
                                <View className="p-4">
                                    <Text className="text-white font-semibold text-base mb-0.5">{r.title}</Text>
                                    <Text className="text-neutral-400 text-xs">{r.subtitle}</Text>
                                </View>
                            </View>
                        ))}
                        <View className="w-2" />
                    </ScrollView>

                    <Divider />

                    {/* Calorie Tracking */}
                    <SectionHeader title="Calorie Tracking" />
                    <View className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5">
                        <KV k="Daily Calories" v={`${totalKcal}/${dailyGoal} kcal`} />
                        <ProgressBar value={totalKcal} goal={dailyGoal} />

                        <View className="mt-5">
                            <KV k="Protein" v={`${protein.value}g/${protein.goal}g`} />
                            <ProgressBar value={protein.value} goal={protein.goal} />
                        </View>

                        <View className="mt-4">
                            <KV k="Fat" v={`${fat.value}g/${fat.goal}g`} />
                            <ProgressBar value={fat.value} goal={fat.goal} />
                        </View>

                        <View className="mt-4">
                            <KV k="Carbs" v={`${carbs.value}g/${carbs.goal}g`} />
                            <ProgressBar value={carbs.value} goal={carbs.goal} />
                        </View>
                    </View>

                    {/* Calorie Intake Card */}
                    <View className="mt-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-5">
                        <Text className="text-neutral-300 mb-1">Calorie Intake</Text>
                        <Text className="text-white text-3xl font-semibold">{totalKcal} kcal</Text>
                        <Text className="text-green-400 mt-1 mb-4">Last 7 Days +5%</Text>
                        <Sparkline points={miniSeries} />
                        <View className="flex-row justify-between mt-3">
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                                <Text key={d} className="text-neutral-500">{d}</Text>
                            ))}
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
                                    <Text className="text-black font-semibold">Add Entry</Text>
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
                                        <Text className="text-white">{item.name}</Text>
                                        <Text className="text-neutral-400 text-sm">{item.kcal} kcal</Text>
                                    </View>
                                    <Text className="text-neutral-300">{item.qty ?? 1}</Text>
                                </View>
                            ))}
                        </View>

                        <View className="gap-3 mt-2 mb-2">
                            <PressableScale onPress={() => {}}>
                                <View className="flex-row justify-between items-center bg-neutral-900 border border-neutral-800 px-4 py-4 rounded-2xl">
                                    <Text className="text-white">Add Exercise</Text>
                                    <Text className="text-white text-xl">＋</Text>
                                </View>
                            </PressableScale>

                            <PressableScale onPress={() => {}}>
                                <View className="flex-row justify-between items-center bg-neutral-900 border border-neutral-800 px-4 py-4 rounded-2xl">
                                    <Text className="text-white">Track Water Intake</Text>
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
