import React, { createContext, useContext, useState } from "react";

// 1. Define the data shape
export type RegistrationData = {
  name: string;
  gender: string;
  email: string;
  phone: string;
  password: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
  role: "passenger" | "driver";
  license: string;
};

// 2. Default/initial state
const defaultRegistrationData: RegistrationData = {
  name: "",
  gender: "",
  email: "",
  phone: "",
  password: "",
  emergencyContact: {
    name: "",
    phone: "",
  },
  role: "passenger",
  license: "",
};

// 3. Define context type
type RegistrationContextType = {
  registrationData: RegistrationData;
  setRegistrationData: React.Dispatch<React.SetStateAction<RegistrationData>>;
};

// 4. Create context
const RegistrationContext = createContext<RegistrationContextType | null>(null);

// 5. Provider component
export const RegistrationProvider = ({ children }: { children: React.ReactNode }) => {
  const [registrationData, setRegistrationData] = useState<RegistrationData>(defaultRegistrationData);

  return (
    <RegistrationContext.Provider value={{ registrationData, setRegistrationData }}>
      {children}
    </RegistrationContext.Provider>
  );
};

// 6. Hook to use in components
export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error("useRegistration must be used within a RegistrationProvider");
  }
  return context;
};
