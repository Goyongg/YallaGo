import { useRegistration } from "@/context/RegistrationContext";
import { registerUser } from "@/services/register";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";

const Role = () => {
  const router = useRouter();
  const { registrationData, setRegistrationData } = useRegistration();
  const [selectedRole, setSelectedRole] = useState<"passenger" | "driver">(
    registrationData.role
  );
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setRegistrationData((prev) => ({
      ...prev,
      role: selectedRole,
    }));

    if (selectedRole === "driver") {
      router.push("/onboarding/driver-license");
    } 
    else {
      setLoading(true);
      try {
        await registerUser({
          ...registrationData,
          role: selectedRole,
        });
        router.replace("/(tabs)/home");
      } catch (err: any) {
        Alert.alert(
          "Registration Failed",
          err.message || "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white justify-around p-8"
    >
      {/* Back Arrow */}
      <Pressable
        onPress={() => router.back()}
        className="absolute top-20 left-6 z-10"
      >
        <Text>
          <Ionicons name="arrow-back" size={38} color="#00BD5F" />
        </Text>
      </Pressable>

      {/* Top Section */}
      <View>
        <Text className="text-5xl font-bold leading-[60px] tracking-wide mb-6">
          Choose your
          <Text className="text-brand italic"> role</Text>
        </Text>

        <View className="flex-row space-x-4 mb-4 gap-3">
          {["passenger", "driver"].map((role) => (
            <Pressable
              key={role}
              className={`flex-1 h-20 justify-center items-center rounded-xl border ${
                selectedRole === role
                  ? "bg-brand border-brand"
                  : "border-gray-300"
              }`}
              onPress={() => setSelectedRole(role as "passenger" | "driver")}
            >
              <Text
                className={`text-center font-semibold text-lg ${
                  selectedRole === role ? "text-white" : "text-black"
                }`}
              >
                {role === "passenger" ? "Passenger" : "Driver"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* <Text className="text-sm text-gray-500 pl-1">
          You can become a driver later through account settings.
        </Text> */}
      </View>

      {/* Bottom Button */}
      <Pressable
        className={`py-5 rounded-xl w-full flex items-center ${
          !loading ? "bg-brand" : "bg-gray-300"
        }`}
        disabled={loading}
        onPress={handleNext}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white font-semibold text-2xl">Next</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
};

export default Role;
