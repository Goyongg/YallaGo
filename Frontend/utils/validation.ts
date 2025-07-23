// validation.ts - Phone validation utilities that match your backend
import { COUNTRY_CODES, CountryCode } from '../utils/countrycodes';

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
}

// Re-export types and data for convenience
export { COUNTRY_CODES, CountryCode };

export const validatePhoneNumber = (phone: string): PhoneValidationResult => {
  const cleanPhone = phone.trim();

  // Check if empty
  if (!cleanPhone) {
    return {
      isValid: false,
      error: 'Phone number is required'
    };
  }

  // Your backend accepts very flexible formats, so we'll be permissive
  // Remove any spaces, dashes, parentheses for validation
  const normalizedPhone = cleanPhone.replace(/[\s\-\(\)]/g, '');

  // Check if it contains only digits and optional leading +
  const phoneRegex = /^\+?\d+$/;
  if (!phoneRegex.test(normalizedPhone)) {
    return {
      isValid: false,
      error: 'Phone number can only contain digits and optional + prefix'
    };
  }

  // Check minimum length (accounting for various formats your backend accepts)
  const digitsOnly = normalizedPhone.replace(/^\+/, '');
  if (digitsOnly.length < 7) {
    return {
      isValid: false,
      error: 'Phone number is too short'
    };
  }

  // Check maximum length (reasonable upper bound)
  if (digitsOnly.length > 15) {
    return {
      isValid: false,
      error: 'Phone number is too long'
    };
  }

  return { isValid: true };
};

// Helper function to format phone with country code
export const formatPhoneWithCountryCode = (countryCode: string, localNumber: string): string => {
  const selectedCountry = COUNTRY_CODES.find(c => c.dialCode === countryCode);
  if (!selectedCountry) return localNumber;
  
  // If local number already starts with country code, don't duplicate
  if (localNumber.startsWith(selectedCountry.dialCode)) {
    return localNumber;
  }
  
  // If local number starts with +, replace it
  if (localNumber.startsWith('+')) {
    return selectedCountry.dialCode + localNumber.substring(1);
  }
  
  // If local number starts with 0, remove it for international format
  if (localNumber.startsWith('0')) {
    return selectedCountry.dialCode + localNumber.substring(1);
  }
  
  return selectedCountry.dialCode + localNumber;
};

// Utility function to format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.trim();
  
  if (cleanPhone.startsWith('+')) {
    return cleanPhone;
  }
  
  // For local numbers, you can add formatting logic here
  // Example: format as (xxx) xxx-xxxx for US numbers
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
  }
  
  return cleanPhone;
};

// Utility function to clean phone number (remove formatting)
export const cleanPhoneNumber = (phone: string): string => {
  if (phone.startsWith('+')) {
    // Keep the + for international numbers, remove other non-digits
    return '+' + phone.slice(1).replace(/\D/g, '');
  }
  
  // Remove all non-digits for local numbers
  return phone.replace(/\D/g, '');
};

// Legacy function for backward compatibility
export const isValidPhone = (phone: string): boolean => {
  return validatePhoneNumber(phone).isValid;
};

// Keep existing email and other validations
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
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