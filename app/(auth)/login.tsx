// app/(auth)/login.tsx
import React, {
    useMemo,
    useState,
    useRef,
    useCallback,
} from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    StatusBar,
    Pressable,
    Keyboard,
    TouchableWithoutFeedback,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function Login() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [phoneNumber, setPhoneNumber] = useState(""); // 10-digit only
    const [loading, setLoading] = useState(false);

    const scrollRef = useRef<ScrollView | null>(null);

    // When this screen gains focus (e.g., after logout), reset scroll + keyboard
    useFocusEffect(
        useCallback(() => {
            scrollRef.current?.scrollTo({ y: 0, animated: false });
            Keyboard.dismiss();
        }, [])
    );

    const isValid = useMemo(
        () => /^\d{10}$/.test(phoneNumber.trim()),
        [phoneNumber]
    );

    const onLogin = async () => {
        try {
            if (!isValid) {
                Alert.alert("Invalid phone", "Enter a 10 digit mobile number.");
                return;
            }
            setLoading(true);

            const fullPhone = `+91${phoneNumber.trim()}`;

            const res = await fetch(
                "https://calorieboy.onrender.com/api/users/login",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phoneNumber: fullPhone }),
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login failed");

            Alert.alert("OTP Sent", "Please verify your phone number.");
            router.push({
                pathname: "/verify-otp",
                params: { phone: fullPhone, from: "login" },
            });
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

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
                    className="absolute top-0 left-0 h-56 w-56 rounded-full bg-emerald-500/10"
                    style={{ top: -80, left: -80 }}
                />
                <View
                    className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-500/5"
                    style={{ bottom: -100, right: -100 }}
                />
            </View>

            <TouchableWithoutFeedback
                onPress={Keyboard.dismiss}
                accessible={false}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        ref={scrollRef}
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className="flex-1 px-6 justify-center">
                            {/* Hero Section */}
                            <View className="items-center mb-12">
                                <View className="mb-4">
                                    <Text className="text-white text-6xl font-extrabold tracking-tight">
                                        CalorieBoy
                                    </Text>
                                    <View className="h-1.5 bg-emerald-400 rounded-full mt-3 w-24 self-center" />
                                </View>

                                <View className="flex-row items-center mb-3">
                                    <Text className="text-white text-3xl font-bold">
                                        Login
                                    </Text>
                                    <View className="ml-3 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/30">
                                        <Text className="text-emerald-400 text-xs font-bold tracking-wide">
                                            BETA
                                        </Text>
                                    </View>
                                </View>

                                <Text className="text-neutral-400 text-lg text-center leading-6 max-w-xs">
                                    Enter your phone number to continue
                                </Text>
                            </View>

                            {/* Premium Card */}
                            <View
                                className="rounded-3xl p-8 border border-white/10 bg-white/5 mb-10"
                                style={{
                                    shadowColor: "#000",
                                    shadowOpacity: 0.4,
                                    shadowRadius: 24,
                                    shadowOffset: { width: 0, height: 12 },
                                    elevation: 12,
                                }}
                            >
                                <Text className="text-neutral-300 mb-4 text-base font-medium tracking-wide">
                                    PHONE NUMBER
                                </Text>

                                {/* Phone Field */}
                                <View className="bg-neutral-900/80 rounded-2xl px-4 py-4 mb-3 border border-white/5">
                                    <View className="flex-row items-center">
                                        <View className="flex-row items-center bg-emerald-500/10 rounded-xl px-3 py-2 mr-3 border border-emerald-500/20">
                                            <Text className="text-2xl">🇮🇳</Text>
                                            <Text className="text-white ml-2 font-bold text-base">
                                                +91
                                            </Text>
                                        </View>

                                        <TextInput
                                            value={phoneNumber}
                                            onChangeText={(t) =>
                                                setPhoneNumber(t.replace(/\D/g, "").slice(0, 10))
                                            }
                                            placeholder="10-digit mobile"
                                            placeholderTextColor="#6B7280"
                                            keyboardType="phone-pad"
                                            returnKeyType="done"
                                            maxLength={10}
                                            className="flex-1 text-white text-lg font-medium py-1"
                                        />
                                    </View>
                                </View>

                                <View className="mb-6">
                                    <Text
                                        className={`text-sm font-medium ${
                                            isValid
                                                ? "text-emerald-400"
                                                : "text-neutral-400"
                                        }`}
                                    >
                                        {isValid
                                            ? "✓ Looks good — tap Send OTP"
                                            : "Enter a valid 10-digit mobile number"}
                                    </Text>
                                </View>

                                {/* Button */}
                                <TouchableOpacity
                                    onPress={onLogin}
                                    activeOpacity={0.8}
                                    disabled={loading || !isValid}
                                    className={`rounded-2xl px-6 py-5 items-center ${
                                        loading || !isValid
                                            ? "bg-neutral-800"
                                            : "bg-white"
                                    }`}
                                    style={
                                        loading || !isValid
                                            ? {}
                                            : {
                                                shadowColor: "#fff",
                                                shadowOpacity: 0.3,
                                                shadowRadius: 12,
                                                shadowOffset: { width: 0, height: 6 },
                                                elevation: 8,
                                            }
                                    }
                                >
                                    {loading ? (
                                        <ActivityIndicator
                                            color={
                                                loading || !isValid ? "#9CA3AF" : "#10b981"
                                            }
                                            size="small"
                                        />
                                    ) : (
                                        <Text
                                            className={`font-bold text-xl tracking-wide ${
                                                loading || !isValid
                                                    ? "text-neutral-400"
                                                    : "text-black"
                                            }`}
                                        >
                                            Send OTP
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {/* Divider */}
                                <View className="flex-row items-center my-6">
                                    <View className="flex-1 h-px bg-white/10" />
                                    <Text className="mx-4 text-neutral-500 text-sm font-medium">
                                        or
                                    </Text>
                                    <View className="flex-1 h-px bg-white/10" />
                                </View>

                                {/* Help Section */}
                                <View className="flex-row justify-between items-center">
                                    <Pressable
                                        onPress={() =>
                                            Alert.alert(
                                                "Help",
                                                "Contact support: support@calorieboy.app"
                                            )
                                        }
                                        hitSlop={8}
                                    >
                                        <Text className="text-emerald-400 font-semibold text-base">
                                            Need help?
                                        </Text>
                                    </Pressable>
                                    <Text className="text-neutral-500 text-xs max-w-[180px] text-right">
                                        OTP via SMS may take up to a minute
                                    </Text>
                                </View>
                            </View>

                            {/* Footer */}
                            <View className="items-center pb-4">
                                <View className="flex-row items-center mb-4">
                                    <Text className="text-neutral-300 text-base">
                                        Don't have an account?{" "}
                                    </Text>
                                    <Pressable
                                        onPress={() => router.push("/(auth)/register")}
                                    >
                                        <Text className="text-emerald-400 font-bold text-base">
                                            Sign Up
                                        </Text>
                                    </Pressable>
                                </View>

                                <Text className="text-neutral-500 text-sm text-center leading-5 max-w-sm px-4">
                                    By continuing you agree to our{" "}
                                    <Text className="text-neutral-400 font-medium">
                                        Terms
                                    </Text>{" "}
                                    &{" "}
                                    <Text className="text-neutral-400 font-medium">
                                        Privacy Policy
                                    </Text>
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}
