import React, { useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { saveTokens } from "../../utils/secureStore";

export default function VerifyOtp() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    const onVerify = async () => {
        try {
            if (!phone) {
                Alert.alert("Error", "Missing phone number");
                return;
            }
            if (!otp) {
                Alert.alert("Error", "Please enter OTP");
                return;
            }

            setLoading(true);

            const res = await fetch(
                "https://calorieboy.onrender.com/api/users/verify-otp",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phoneNumber: phone, otp }),
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "OTP verification failed");

            // Save tokens securely
            await saveTokens(data.accessToken, data.refreshToken);

            Alert.alert("Success", "You are now logged in!");
            router.replace("/(tabs)");
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1"
            >
                <View className="flex-1 px-6 items-center justify-center">
                    <Text className="text-white text-3xl font-bold mb-2">Verify OTP</Text>
                    <Text className="text-neutral-400 mb-6">
                        Enter the OTP sent to {phone}
                    </Text>

                    <TextInput
                        value={otp}
                        onChangeText={setOtp}
                        placeholder="Enter OTP"
                        placeholderTextColor="#6B7280"
                        keyboardType="numeric"
                        maxLength={6}
                        className="bg-neutral-900 text-white px-4 py-3 rounded-xl w-full mb-4 text-center text-lg tracking-widest"
                    />

                    <TouchableOpacity
                        onPress={onVerify}
                        disabled={loading}
                        className={`rounded-2xl px-6 py-4 w-full items-center ${
                            loading ? "bg-neutral-800" : "bg-white"
                        }`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text className="text-black font-semibold text-lg">Verify</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
