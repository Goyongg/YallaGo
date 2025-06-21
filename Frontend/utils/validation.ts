export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

// Need to be redone to be more flexible (to take international numbers with '+' sign)
export const isValidPhone = (phone: string): boolean => {
  // Basic pattern: digits only, 7 to 15 characters (adjust as needed)
  const phoneRegex = /^\d{7,15}$/;
  return phoneRegex.test(phone.trim());
};