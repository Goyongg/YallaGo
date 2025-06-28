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
      name,
      email,
      phoneNumber: phone,
      role,
      gender,
      emergencyContact,
      ...(role === "driver" && { licenseNumber: license }),
    };

    // 3. Send to backend
    const response = await axios.post( "http://10.128.24.33/users/register", userData, {
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