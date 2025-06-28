// services/login.ts
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";

export const loginUser = async (email: string, password: string) => {
  try {
    // 1. Firebase login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();

    console.log("Firebase login successful");
    console.log("Firebase ID Token:", idToken);

    // 2. Get user profile from backend
    const response = await axios.get("http://10.128.24.33/users/me", {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    console.log("User profile from backend:", response.data);

    return {
      token: idToken,
      user: response.data,
    };
  } catch (err: any) {
    console.error("Login failed:", err);
    throw err;
  }
};