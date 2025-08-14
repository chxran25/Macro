import React, { useMemo, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, Animated, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

const dietaryOptions = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"];
const fitnessGoals   = ["Weight Loss", "Muscle Gain", "Maintenance"];
const activityLevels = ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Extra Active"];

export default function MacroGoalsScreen() {
    const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
    const [selectedGoal, setSelectedGoal]   = useState<string | null>(null);
    const [weight, setWeight]               = useState("");
    const [calories, setCalories]           = useState("");
    const [activity, setActivity]           = useState<string | null>(null);

    const scrollY = useRef(new Animated.Value(0)).current;

    const headerOpacity  = scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 1], extrapolate: "clamp" });
    const titleScale     = scrollY.interpolate({ inputRange: [0, 60], outputRange: [1, 0.95], extrapolate: "clamp" });
    const headerElev     = scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 6], extrapolate: "clamp" });

    const toggleDiet = (item: string) => {
        setSelectedDiets((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
    };

    /** Small animated press helper */
    const PressableScale: React.FC<React.ComponentProps<typeof Pressable> & { active?: boolean; className?: string; }> =
        ({ children, active, ...props }) => {
            const scale = useRef(new Animated.Value(1)).current;
            const onPressIn  = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, friction: 7 }).start();
            const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, friction: 7 }).start();
            return (
                <Animated.View style={{ transform: [{ scale }] }}>
                    <Pressable {...props} onPressIn={onPressIn} onPressOut={onPressOut} hitSlop={8} android_ripple={{ color: "#2a2a2a" }}>
                        {children}
                    </Pressable>
                </Animated.View>
            );
        };

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            {/* Floating header that appears on scroll */}
            <Animated.View
                style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    opacity: headerOpacity,
                    elevation: 0, // Android shadow handled by background overlay
                }}
            >
                <SafeAreaView edges={["top"]} className="bg-black/85">
                    <View className="px-5 py-3 border-b border-neutral-900 flex-row items-center justify-center">
                        <Text className="text-white text-base font-semibold">Macro Goals</Text>
                    </View>
                </SafeAreaView>
            </Animated.View>

            <SafeAreaView edges={["top"]} className="bg-black">
                {/* Static header at top of content */}
                <View className="px-5 pb-2">
                    <View className="flex-row items-center justify-center py-2">
                        <Animated.Text style={{ transform: [{ scale: titleScale }] }} className="text-white text-lg font-semibold">
                            Macro Goals
                        </Animated.Text>
                    </View>
                </View>
            </SafeAreaView>

            <Animated.ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{ paddingBottom: 28 }}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
            >
                {/* Dietary Restrictions */}
                <Text className="text-white text-xl font-semibold mb-3">Dietary Restrictions</Text>
                <View className="gap-3 mb-6">
                    {dietaryOptions.map((item) => {
                        const active = selectedDiets.includes(item);
                        return (
                            <PressableScale key={item} onPress={() => toggleDiet(item)}>
                                <View className={`flex-row items-center px-4 py-3 rounded-2xl border ${active ? "border-white bg-white/10" : "border-neutral-700"}`}>
                                    <View className={`w-5 h-5 mr-3 rounded-md border ${active ? "bg-white border-white" : "border-neutral-500"}`} />
                                    <Text className="text-white">{item}</Text>
                                </View>
                            </PressableScale>
                        );
                    })}
                </View>

                {/* Fitness Goals */}
                <Text className="text-white text-xl font-semibold mb-3">Fitness Goals</Text>
                <View className="flex-row flex-wrap gap-3 mb-6">
                    {fitnessGoals.map((g) => {
                        const active = selectedGoal === g;
                        return (
                            <PressableScale key={g} onPress={() => setSelectedGoal(g)}>
                                <View className={`px-4 py-2 rounded-xl border ${active ? "bg-white border-white" : "border-neutral-700"}`}>
                                    <Text className={active ? "text-black" : "text-white"}>{g}</Text>
                                </View>
                            </PressableScale>
                        );
                    })}
                </View>

                {/* Target */}
                <Text className="text-white text-xl font-semibold mb-3">Target</Text>
                <View className="gap-3 mb-6">
                    <TextInput
                        value={weight}
                        onChangeText={setWeight}
                        placeholder="Weight (lbs)"
                        placeholderTextColor="#777"
                        keyboardType="numeric"
                        className="bg-neutral-900 text-white rounded-2xl px-4 py-3"
                    />
                    <TextInput
                        value={calories}
                        onChangeText={setCalories}
                        placeholder="Calorie intake"
                        placeholderTextColor="#777"
                        keyboardType="numeric"
                        className="bg-neutral-900 text-white rounded-2xl px-4 py-3"
                    />
                </View>

                {/* Activity */}
                <Text className="text-white text-xl font-semibold mb-3">Activity Level</Text>
                <View className="flex-row flex-wrap gap-3 mb-8">
                    {activityLevels.map((lvl) => {
                        const active = activity === lvl;
                        return (
                            <PressableScale key={lvl} onPress={() => setActivity(lvl)}>
                                <View className={`px-4 py-2 rounded-xl border ${active ? "bg-white border-white" : "border-neutral-700"}`}>
                                    <Text className={active ? "text-black" : "text-white"}>{lvl}</Text>
                                </View>
                            </PressableScale>
                        );
                    })}
                </View>

                <PressableScale onPress={() => {/* navigate or compute later */}}>
                    <View className="bg-white rounded-full py-4 items-center">
                        <Text className="text-black font-semibold">Generate Meal Plan</Text>
                    </View>
                </PressableScale>
            </Animated.ScrollView>
        </View>
    );
}
