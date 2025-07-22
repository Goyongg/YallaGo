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

export const isValidPassword = (password: string): boolean => {
  // Firebase requires minimum 6 characters
  return password.trim().length >= 6;
};

export const isValidDate = (date: string): boolean => {
  // Format: dd/mm/yyyy
  const dateRegex = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

  if (!dateRegex.test(date)) return false;

  const [day, month, year] = date.split('/').map(Number);
  const parsedDate = new Date(year, month - 1, day);

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );
};
