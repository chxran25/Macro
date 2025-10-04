import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useLogout } from "../../utils/auth";

export default function Profile() {
    const logout = useLogout();

    const onLogoutPress = () => {
        Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: logout },
        ]);
    };

    return (
        <View className="flex-1 bg-black items-center justify-center">
            <Text className="text-white text-2xl mb-6">Profile</Text>

            <TouchableOpacity
                onPress={onLogoutPress}
                className="bg-red-500 px-6 py-3 rounded-xl"
            >
                <Text className="text-white font-bold">Logout</Text>
            </TouchableOpacity>
        </View>
    );
}
