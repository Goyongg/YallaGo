const fs = require("fs");
const path = require("path");

const gradlePath = path.join(__dirname, "android", "settings.gradle");
if (!fs.existsSync(gradlePath)) {
  console.error("❌ settings.gradle not found.");
  process.exit(1);
}

let content = fs.readFileSync(gradlePath, "utf8");

// Step 1: Clean invalid codegen lines
content = content
  .split("\n")
  .filter(line => !line.includes("build/generated/source/codegen/jni"))
  .join("\n");

// Step 2: Ensure required native module includes
const modules = [
  {
    name: "react-native-async-storage_async-storage",
    path: "../node_modules/@react-native-async-storage/async-storage/android",
  },
  {
    name: "react-native-community_datetimepicker",
    path: "../node_modules/@react-native-community/datetimepicker/android",
  },
  {
    name: "react-native-firebase_app",
    path: "../node_modules/@react-native-firebase/app/android",
  },
  {
    name: "react-native-firebase_auth",
    path: "../node_modules/@react-native-firebase/auth/android",
  },
  {
    name: "react-native-firebase_messaging",
    path: "../node_modules/@react-native-firebase/messaging/android",
  },
  {
    name: "react-native-picker_picker",
    path: "../node_modules/@react-native-picker/picker/android",
  },
  {
    name: "react-native-date-picker",
    path: "../node_modules/react-native-date-picker/android",
  },
  {
    name: "react-native-gesture-handler",
    path: "../node_modules/react-native-gesture-handler/android",
  },
  {
    name: "react-native-maps",
    path: "../node_modules/react-native-maps/android",
  },
  {
    name: "react-native-reanimated",
    path: "../node_modules/react-native-reanimated/android",
  },
  {
    name: "react-native-safe-area-context",
    path: "../node_modules/react-native-safe-area-context/android",
  },
  {
    name: "react-native-screens",
    path: "../node_modules/react-native-screens/android",
  },
  {
    name: "react-native-webview",
    path: "../node_modules/react-native-webview/android",
  },
  {
    name: "react-native-edge-to-edge",
    path: "../node_modules/react-native-edge-to-edge/android",
  },
];

for (const mod of modules) {
  const includeLine = `include ':${mod.name}'`;
  const projectLine = `project(':${mod.name}').projectDir = new File(rootProject.projectDir, '${mod.path}')`;

  if (!content.includes(includeLine)) {
    content += `\n${includeLine}`;
  }
  if (!content.includes(projectLine)) {
    content += `\n${projectLine}`;
  }
}

// Save back
fs.writeFileSync(gradlePath, content, "utf8");

console.log("✅ settings.gradle patched with all required modules.");
