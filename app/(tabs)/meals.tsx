import { View, Text, ScrollView, Image, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SlidersHorizontal } from "lucide-react-native";
import { useState } from "react";
import { recipesByMeal, recommended } from "../../lib/data";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Meals() {
    const [selectedDay, setSelectedDay] = useState("Tue");

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
                                className={`px-4 py-3 rounded-full mr-3 ${
                                    active ? "bg-white" : ""
                                }`}
                            >
                                <Text className={active ? "text-black font-semibold" : "text-white"}>
                                    {day}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                {/* Meal sections */}
                <View className="px-5">
                    {Object.entries(recipesByMeal).map(([section, meals]) => (
                        <View key={section} className="mt-6">
                            <Text className="text-white text-lg font-semibold mb-3">{section}</Text>
                            {meals.map((meal) => (
                                <View
                                    key={meal.id}
                                    className="flex-row bg-[#141414] rounded-2xl overflow-hidden mb-3"
                                >
                                    <Image
                                        source={{ uri: meal.image }}
                                        className="w-28 h-28"
                                        resizeMode="cover"
                                    />
                                    <View className="flex-1 p-3 justify-center">
                                        <Text className="text-neutral-400 text-xs mb-1">
                                            {meal.calories} cal
                                        </Text>
                                        <Text className="text-white font-medium mb-1">
                                            {meal.title}
                                        </Text>
                                        <Text className="text-neutral-400 text-xs">
                                            Protein: {meal.macros.protein}g | Carbs: {meal.macros.carbs}g | Fat: {meal.macros.fat}g
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}

                    {/* Recommended recipes */}
                    <View className="mt-6">
                        <Text className="text-white text-lg font-semibold mb-3">
                            Recommended Recipes
                        </Text>
                        {recommended.map((meal) => (
                            <View
                                key={meal.id}
                                className="flex-row bg-[#141414] rounded-2xl overflow-hidden mb-3"
                            >
                                <Image
                                    source={{ uri: meal.image }}
                                    className="w-28 h-28"
                                    resizeMode="cover"
                                />
                                <View className="flex-1 p-3 justify-center">
                                    <Text className="text-white font-medium mb-1">{meal.title}</Text>
                                    {meal.description && (
                                        <Text
                                            className="text-neutral-400 text-xs mb-2"
                                            numberOfLines={2}
                                        >
                                            {meal.description}
                                        </Text>
                                    )}
                                    <Pressable className="bg-white rounded-full px-4 py-1 self-start">
                                        <Text className="text-black text-sm font-semibold">Add</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
