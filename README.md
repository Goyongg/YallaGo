# YallaGo 🚗🌱
A sustainable carpooling platform designed for the UAE, connecting passengers and drivers to reduce carbon emissions, cut costs, and promote eco-friendly transportation.

---

## Table of Contents
- [Description](#description)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Tech Stack](#tech-stack)

---

## Description
YallaGo is a mobile and web-based platform that enables people in the UAE to share rides in an eco-conscious, cost-effective way.  
Passengers can quickly find nearby drivers heading in the same direction, while drivers can monetize their empty seats.  
The app integrates **real-time location tracking**, **secure payments**, and **ride scheduling** to ensure a smooth, reliable, and safe experience.

**Key goals:**
- Reduce road congestion and CO₂ emissions
- Build a trusted community of verified drivers and passengers
- Make commuting more affordable and efficient

---

## Features
- 📍 **Real-time location tracking** for passengers and drivers
- 🔒 **Secure payments** via Stripe
- 📅 **Ride scheduling** and instant booking
- 🚗 **Driver verification system**
- 🌱 **Eco-impact tracker** showing CO₂ savings
- 🛡️ **SOS emergency feature** for safety

---

## Installation

### Backend Setup

**Prerequisites**
- Node.js & npm
- Firebase account
- Stripe API keys
- Google Maps API key

**Steps**
1. Clone the repository:
   ```bash
   git clone https://github.com/Goyongg/YallaGo
   ```
2. Navigate into the backend folder:
   ```bash
   cd yallago/backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up your `.env` file with API keys:
   ```env
   FIREBASE_API_KEY=your_key_here
   STRIPE_SECRET_KEY=your_key_here
   GOOGLE_MAPS_API_KEY=your_key_here
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```

---

### Frontend Setup (Expo)

**Prerequisites**
- Node.js (already installed in backend setup)
- Java JDK 21
- Android Studio (Meerkat 2024.3.1)

**Steps**

1. **Install Java JDK 21**  
   - Download from: https://www.oracle.com/java/technologies/javase/jdk21-archive-downloads.html  
   - Install and verify:
     ```bash
     java --version
     ```

2. **Install Android Studio**
   - Download from: https://developer.android.com/studio  
   - Install with default components (Android SDK, AVD Manager, Emulator).

3. **Create Android Emulator**
   - In Android Studio: `More Actions > Virtual Device Manager`
   - Create a Pixel 8 (or similar) device with API 36 x86_64 image.

4. **Open Frontend Project**
   - In VS Code, open `YallaGo-main/Frontend`.
   - Install dependencies:
     ```bash
     npm install
     ```

5. **Run the Frontend**
   - Ensure backend is running (`npm run start:dev` in backend folder).
   - From frontend root:
     ```bash
     npx expo prebuild
     ```
   - Place `google-services.json` in `Frontend/`.
   - In `/android`, create `local.properties` and add:
     ```
     sdk.dir=YOUR_SDK_PATH
     ```
   - Run prebuild again and start the app:
     ```bash
     npx expo run:android
     ```

You should now see the YallaGo app running on your Android emulator.

---

## Usage
- **Passenger**:  
  1. Sign up or log in.  
  2. Enter your pickup and drop-off location.  
  3. Select a ride from available drivers.  
  4. Confirm booking and pay securely.

- **Driver**:  
  1. Sign up and complete verification.  
  2. List your ride with departure time and available seats.  
  3. Accept passenger bookings and start the trip.

---

## Tech Stack
- **Frontend**: React Native (Expo)
- **Backend**: Nest.js
- **Database**: Firebase Firestore
- **Payment**: Stripe API
- **Maps & Routing**: Google Maps API
- **Authentication**: Firebase Auth
