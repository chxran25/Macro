import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Switch,
    StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function Register() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [step, setStep] = useState(0);

    // ========= FORM STATE =========
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");

    const [gender, setGender] = useState("");
    const [age, setAge] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [fitnessGoal, setFitnessGoal] = useState("");

    const [dietType, setDietType] = useState("");
    const [spicePreference, setSpicePreference] = useState("");
    const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
    const [otherAllergens, setOtherAllergens] = useState("");

    const [foodDislikes, setFoodDislikes] = useState("");
    const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([]);

    const [mealFrequency, setMealFrequency] = useState("");
    const [eatingWindow, setEatingWindow] = useState("");
    const [useMacroCalculator, setUseMacroCalculator] = useState(false);
    const [calories, setCalories] = useState("");
    const [protein, setProtein] = useState("");
    const [carbs, setCarbs] = useState("");
    const [fat, setFat] = useState("");

    const toggleArrayValue = (arr: string[], value: string, setter: (val: string[]) => void) => {
        if (arr.includes(value)) setter(arr.filter((x) => x !== value));
        else setter([...arr, value]);
    };

    const onSubmit = async () => {
        try {
            if (!name || !phoneNumber || !address) {
                Alert.alert("Error", "Please fill required fields.");
                return;
            }

            const res = await fetch("https://calorieboy.onrender.com/api/users/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    phoneNumber,
                    addresses: [address],
                    gender,
                    fitnessGoal,
                    dietType,
                    spicePreference,
                    cuisinePreferences,
                    mealFrequency,
                    calories: Number(calories),
                    protein: Number(protein),
                    carbs: Number(carbs),
                    fat: Number(fat),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Signup failed");

            Alert.alert("OTP Sent", "Please verify your phone number.");
            router.push({ pathname: "/(auth)/verify-otp", params: { phone: phoneNumber.trim() } });
        } catch (e: any) {
            Alert.alert("Error", e.message);
        }
    };

    // ========= STEP SCREENS =========

    const Card = ({ children }: { children: React.ReactNode }) => (
        <View
            className="rounded-3xl p-8 border border-white/10 bg-white/5 mb-8"
            style={{
                shadowColor: "#000",
                shadowOpacity: 0.4,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 12 },
                elevation: 12,
            }}
        >
            {children}
        </View>
    );

    const StepOne = () => (
        <Card>
            <Text className="text-white text-3xl font-bold mb-8">Create Account</Text>
            <View className="space-y-4">
                <View>
                    <Text className="text-neutral-300 mb-2 text-sm font-medium tracking-wide">FULL NAME</Text>
                    <TextInput
                        placeholder="John Doe"
                        placeholderTextColor="#6B7280"
                        className="bg-neutral-900/80 rounded-2xl px-5 py-4 text-white text-lg border border-white/5"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View className="mt-5">
                    <Text className="text-neutral-300 mb-2 text-sm font-medium tracking-wide">PHONE NUMBER</Text>
                    <View className="bg-neutral-900/80 rounded-2xl px-4 py-4 border border-white/5">
                        <View className="flex-row items-center">
                            <View className="flex-row items-center bg-emerald-500/10 rounded-xl px-3 py-2 mr-3 border border-emerald-500/20">
                                <Text className="text-2xl">🇮🇳</Text>
                                <Text className="text-white ml-2 font-bold text-base">+91</Text>
                            </View>
                            <TextInput
                                placeholder="XXXXXXXXXX"
                                placeholderTextColor="#6B7280"
                                keyboardType="phone-pad"
                                className="flex-1 text-white text-lg font-medium"
                                value={phoneNumber}
                                onChangeText={(t) => {
                                    if (t && !t.startsWith("+91")) {
                                        setPhoneNumber("+91" + t.replace(/^\+?91?/, "").replace(/\D/g, ""));
                                    } else {
                                        setPhoneNumber(t.replace(/[^\d+]/g, ""));
                                    }
                                }}
                                maxLength={13}
                            />
                        </View>
                    </View>
                </View>

                <View className="mt-5">
                    <Text className="text-neutral-300 mb-2 text-sm font-medium tracking-wide">ADDRESS</Text>
                    <TextInput
                        placeholder="Enter your delivery address"
                        placeholderTextColor="#6B7280"
                        className="bg-neutral-900/80 rounded-2xl px-5 py-4 text-white text-base border border-white/5"
                        value={address}
                        onChangeText={setAddress}
                        multiline
                        numberOfLines={2}
                    />
                </View>
            </View>
        </Card>
    );

    const StepTwo = () => (
        <Card>
            <Text className="text-white text-3xl font-bold mb-8">Personal Details</Text>
            <View className="space-y-4">
                {[
                    { label: "GENDER", placeholder: "Male / Female / Other", state: gender, set: setGender },
                    { label: "AGE", placeholder: "Enter your age", state: age, set: setAge, keyboardType: "numeric" },
                    { label: "HEIGHT (CM)", placeholder: "e.g., 175", state: height, set: setHeight, keyboardType: "numeric" },
                    { label: "WEIGHT (KG)", placeholder: "e.g., 70", state: weight, set: setWeight, keyboardType: "numeric" },
                ].map((field, i) => (
                    <View key={i} className={i > 0 ? "mt-5" : ""}>
                        <Text className="text-neutral-300 mb-2 text-sm font-medium tracking-wide">{field.label}</Text>
                        <TextInput
                            placeholder={field.placeholder}
                            placeholderTextColor="#6B7280"
                            className="bg-neutral-900/80 rounded-2xl px-5 py-4 text-white text-lg border border-white/5"
                            value={field.state}
                            onChangeText={field.set}
                            keyboardType={field.keyboardType as any || "default"}
                        />
                    </View>
                ))}

                <View className="mt-6">
                    <Text className="text-neutral-300 mb-3 text-sm font-medium tracking-wide">FITNESS GOAL</Text>
                    <View className="flex-row flex-wrap gap-3">
                        {["Maintain", "Lose Fat", "Build Muscle"].map((goal) => (
                            <TouchableOpacity
                                key={goal}
                                onPress={() => setFitnessGoal(goal)}
                                className={`px-6 py-3 rounded-2xl border-2 ${
                                    fitnessGoal === goal
                                        ? "bg-emerald-400 border-emerald-400"
                                        : "bg-neutral-900/50 border-white/10"
                                }`}
                            >
                                <Text className={`font-semibold text-base ${
                                    fitnessGoal === goal ? "text-black" : "text-white"
                                }`}>
                                    {goal}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Card>
    );

    const StepThree = () => (
        <Card>
            <Text className="text-white text-3xl font-bold mb-8">Diet Preferences</Text>

            <View className="mb-6">
                <Text className="text-neutral-300 mb-3 text-sm font-medium tracking-wide">DIET TYPE</Text>
                <View className="flex-row flex-wrap gap-3">
                    {["Veg", "Non-Veg", "Both"].map((dt) => (
                        <TouchableOpacity
                            key={dt}
                            onPress={() => setDietType(dt)}
                            className={`px-6 py-3 rounded-2xl border-2 ${
                                dietType === dt
                                    ? "bg-emerald-400 border-emerald-400"
                                    : "bg-neutral-900/50 border-white/10"
                            }`}
                        >
                            <Text className={`font-semibold text-base ${
                                dietType === dt ? "text-black" : "text-white"
                            }`}>
                                {dt}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View className="mt-8">
                <Text className="text-neutral-300 mb-3 text-sm font-medium tracking-wide">SPICE LEVEL</Text>
                <View className="flex-row flex-wrap gap-3">
                    {[
                        { label: "Not Spicy", emoji: "😊" },
                        { label: "Mild", emoji: "🌶️" },
                        { label: "Medium", emoji: "🌶️🌶️" },
                        { label: "Spicy", emoji: "🔥" },
                    ].map((sp) => (
                        <TouchableOpacity
                            key={sp.label}
                            onPress={() => setSpicePreference(sp.label)}
                            className={`px-5 py-3 rounded-2xl border-2 flex-row items-center ${
                                spicePreference === sp.label
                                    ? "bg-emerald-400 border-emerald-400"
                                    : "bg-neutral-900/50 border-white/10"
                            }`}
                        >
                            <Text className="mr-2 text-base">{sp.emoji}</Text>
                            <Text className={`font-semibold text-base ${
                                spicePreference === sp.label ? "text-black" : "text-white"
                            }`}>
                                {sp.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Card>
    );

    const StepFour = () => (
        <Card>
            <Text className="text-white text-3xl font-bold mb-8">Food & Cuisine</Text>

            <View className="mb-6">
                <Text className="text-neutral-300 mb-2 text-sm font-medium tracking-wide">FOOD DISLIKES (OPTIONAL)</Text>
                <TextInput
                    placeholder="e.g., mushrooms, broccoli..."
                    placeholderTextColor="#6B7280"
                    className="bg-neutral-900/80 rounded-2xl px-5 py-4 text-white text-base border border-white/5"
                    value={foodDislikes}
                    onChangeText={setFoodDislikes}
                    multiline
                    numberOfLines={3}
                />
            </View>

            <View className="mt-8">
                <Text className="text-neutral-300 mb-4 text-sm font-medium tracking-wide">CUISINE PREFERENCES</Text>
                {[
                    { name: "Indian South", emoji: "🥘" },
                    { name: "Indian North", emoji: "🍛" },
                    { name: "Continental", emoji: "🍝" },
                    { name: "Asian", emoji: "🍜" },
                ].map((cuisine) => (
                    <TouchableOpacity
                        key={cuisine.name}
                        onPress={() => toggleArrayValue(cuisinePreferences, cuisine.name, setCuisinePreferences)}
                        className="flex-row items-center mb-4 bg-neutral-900/50 rounded-2xl p-4 border border-white/5"
                    >
                        <View
                            className={`w-6 h-6 mr-4 rounded-lg border-2 items-center justify-center ${
                                cuisinePreferences.includes(cuisine.name)
                                    ? "bg-emerald-400 border-emerald-400"
                                    : "bg-transparent border-white/20"
                            }`}
                        >
                            {cuisinePreferences.includes(cuisine.name) && (
                                <Text className="text-black font-bold text-sm">✓</Text>
                            )}
                        </View>
                        <Text className="text-xl mr-3">{cuisine.emoji}</Text>
                        <Text className="text-white font-medium text-lg">{cuisine.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Card>
    );

    const StepFive = () => (
        <Card>
            <Text className="text-white text-3xl font-bold mb-8">Meal Planning</Text>

            <View className="mb-6">
                <Text className="text-neutral-300 mb-3 text-sm font-medium tracking-wide">DAILY MEALS</Text>
                <View className="flex-row flex-wrap gap-3">
                    {["3 Meals", "4 Meals", "5 Meals", "6 Meals"].map((mf) => (
                        <TouchableOpacity
                            key={mf}
                            onPress={() => setMealFrequency(mf)}
                            className={`px-6 py-3 rounded-2xl border-2 ${
                                mealFrequency === mf
                                    ? "bg-emerald-400 border-emerald-400"
                                    : "bg-neutral-900/50 border-white/10"
                            }`}
                        >
                            <Text className={`font-semibold text-base ${
                                mealFrequency === mf ? "text-black" : "text-white"
                            }`}>
                                {mf}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View className="mt-8 bg-neutral-900/50 rounded-2xl p-5 border border-white/5">
                <View className="flex-row items-center justify-between mb-5">
                    <View>
                        <Text className="text-white font-bold text-lg">Use Macro Calculator</Text>
                        <Text className="text-neutral-400 text-sm mt-1">Auto-calculate your macros</Text>
                    </View>
                    <Switch
                        value={useMacroCalculator}
                        onValueChange={setUseMacroCalculator}
                        trackColor={{ false: "#374151", true: "#10b981" }}
                        thumbColor={useMacroCalculator ? "#fff" : "#f4f4f5"}
                    />
                </View>
            </View>

            <View className="mt-6 space-y-4">
                <Text className="text-neutral-300 mb-3 text-sm font-medium tracking-wide">DAILY TARGETS</Text>
                {[
                    { label: "Calories", placeholder: "e.g., 2000", state: calories, set: setCalories, unit: "kcal" },
                    { label: "Protein", placeholder: "e.g., 150", state: protein, set: setProtein, unit: "g" },
                    { label: "Carbs", placeholder: "e.g., 250", state: carbs, set: setCarbs, unit: "g" },
                    { label: "Fat", placeholder: "e.g., 70", state: fat, set: setFat, unit: "g" },
                ].map((field, idx) => (
                    <View key={idx} className={idx > 0 ? "mt-4" : ""}>
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-neutral-300 text-sm font-medium tracking-wide">
                                {field.label.toUpperCase()}
                            </Text>
                            <Text className="text-emerald-400 text-xs font-semibold">{field.unit}</Text>
                        </View>
                        <TextInput
                            placeholder={field.placeholder}
                            placeholderTextColor="#6B7280"
                            keyboardType="numeric"
                            className="bg-neutral-900/80 rounded-2xl px-5 py-4 text-white text-lg border border-white/5"
                            value={field.state}
                            onChangeText={field.set}
                        />
                    </View>
                ))}
            </View>
        </Card>
    );

    const steps = [<StepOne />, <StepTwo />, <StepThree />, <StepFour />, <StepFive />];

    return (
        <SafeAreaView
            edges={["top", "bottom"]}
            className="flex-1 bg-black"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            <StatusBar barStyle="light-content" />

            {/* Decorative background blobs */}
            <View pointerEvents="none">
                <View
                    className="absolute top-0 right-0 h-56 w-56 rounded-full bg-emerald-500/10"
                    style={{ top: -80, right: -80 }}
                />
                <View
                    className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald-500/5"
                    style={{ bottom: -100, left: -100 }}
                />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{ paddingVertical: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Section */}
                    <View className="items-center mb-12">
                        <View className="mb-4">
                            <Text className="text-white text-6xl font-extrabold tracking-tight">
                                CalorieBoy
                            </Text>
                            <View className="h-1.5 bg-emerald-400 rounded-full mt-3 w-24 self-center" />
                        </View>

                        <Text className="text-white text-3xl font-bold mb-4">Sign Up</Text>

                        {/* Progress Indicator */}
                        <View className="flex-row items-center">
                            {steps.map((_, idx) => (
                                <View key={idx} className="flex-row items-center">
                                    <View
                                        className={`w-10 h-10 rounded-full items-center justify-center ${
                                            idx === step
                                                ? "bg-emerald-400"
                                                : idx < step
                                                    ? "bg-emerald-400/30"
                                                    : "bg-neutral-800"
                                        }`}
                                    >
                                        <Text
                                            className={`font-bold ${
                                                idx === step ? "text-black" : "text-white"
                                            }`}
                                        >
                                            {idx + 1}
                                        </Text>
                                    </View>
                                    {idx < steps.length - 1 && (
                                        <View
                                            className={`w-8 h-1 mx-1 ${
                                                idx < step ? "bg-emerald-400/30" : "bg-neutral-800"
                                            }`}
                                        />
                                    )}
                                </View>
                            ))}
                        </View>

                        <Text className="text-neutral-400 text-base mt-3">
                            Step {step + 1} of {steps.length}
                        </Text>
                    </View>

                    {steps[step]}
                </ScrollView>

                {/* Enhanced Navigation buttons */}
                <View className="px-6 pb-8 bg-black border-t border-white/5">
                    <View className="flex-row justify-between items-center pt-6">
                        {step > 0 ? (
                            <TouchableOpacity
                                onPress={() => setStep(step - 1)}
                                className="flex-1 mr-3 px-6 py-5 bg-neutral-800 rounded-2xl border border-white/10"
                                activeOpacity={0.8}
                            >
                                <Text className="text-white font-bold text-center text-lg">← Previous</Text>
                            </TouchableOpacity>
                        ) : (
                            <View className="flex-1 mr-3" />
                        )}

                        {step < steps.length - 1 ? (
                            <TouchableOpacity
                                onPress={() => setStep(step + 1)}
                                className="flex-1 ml-3 px-6 py-5 bg-white rounded-2xl"
                                activeOpacity={0.8}
                                style={{
                                    shadowColor: "#fff",
                                    shadowOpacity: 0.3,
                                    shadowRadius: 12,
                                    shadowOffset: { width: 0, height: 6 },
                                    elevation: 8,
                                }}
                            >
                                <Text className="text-black font-bold text-center text-lg">Next →</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={onSubmit}
                                className="flex-1 ml-3 px-6 py-5 bg-emerald-400 rounded-2xl"
                                activeOpacity={0.8}
                                style={{
                                    shadowColor: "#10b981",
                                    shadowOpacity: 0.4,
                                    shadowRadius: 12,
                                    shadowOffset: { width: 0, height: 6 },
                                    elevation: 8,
                                }}
                            >
                                <Text className="text-black font-bold text-center text-lg">Submit ✓</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}