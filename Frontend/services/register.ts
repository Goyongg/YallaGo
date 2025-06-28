import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";
import { RegistrationData } from "@/context/RegistrationContext";

export const registerUser = async (data: RegistrationData) => {
  const { email, password, name, phone, gender, role, emergencyContact, license } = data;

  try {
    // 1. Register on Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
    const response = await axios.post( "http://10.128.24.33:3000/users/register", userData, {
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