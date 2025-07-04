import auth from '@react-native-firebase/auth';
import axios from "axios";
import { Platform } from 'react-native';
import { RegistrationData } from "@/context/RegistrationContext";

// This should be checked to match the current IP address
// Uni: 10.45.49.69
// Home: 10.128.24.33
const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://10.128.24.33:3000';

export const registerUser = async (data: RegistrationData) => {
  const { email, password, name, phone, gender, role, emergencyContact, license } = data;

  try {
    // 1. Register on Firebase Auth
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const idToken = await userCredential.user.getIdToken();

    // 2. Prepare user data for NestJS
    const userData: any = {
      name: name,
      email: email,
      phoneNumber: phone,
      role: role,
      ...(role === "driver" && { licenseNumber: Number(license) }),
    };

    // Add gender only if it's provided
    if (gender?.trim()) {
      userData.gender = gender.trim().toLowerCase(); // 'Male' -> 'male' to match enum
    }

    // Add emergencyContact only if both fields are non-empty
    if (emergencyContact?.name.trim() && emergencyContact?.phone.trim()) {
      userData.emergencyContactName = emergencyContact.name.trim();
      userData.emergencyContactPhone = emergencyContact.phone.trim();
    }

    // 3. Send to backend
    // check the IP address before running
    const response = await axios.post(`${BASE_URL}/users/register`, userData, {
      headers: { Authorization: `Bearer ${idToken}` }
    });

    console.log("Registration Successful:", response.data);
    console.log("Sent to backend:", userData);

    return response.data;
  } catch (err: any) {
    console.error("Registration Failed:", err);
    throw err;
  }
};