/**
 * Validates email format.
 */
export const validateEmail = (email) => {
  if (!email) return "Email is required";
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email)) {
    return "Please enter a valid email address";
  }
  return null;
};

/**
 * Validates full name length (3 to 100 characters).
 */
export const validateFullName = (name) => {
  if (!name || !name.trim()) return "Full Name is required";
  const trimLen = name.trim().length;
  if (trimLen < 3 || trimLen > 100) {
    return "Full Name must be between 3 and 100 characters";
  }
  return null;
};

/**
 * Checks password against strong password rules:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const checkPasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      hasMinLength: false,
      hasUpper: false,
      hasLower: false,
      hasDigit: false,
      hasSpecial: false,
    };
  }

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  // Special characters include any non-alphanumeric character
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasUpper) score++;
  if (hasLower) score++;
  if (hasDigit) score++;
  if (hasSpecial) score++;

  return {
    score, // Max score of 5
    hasMinLength,
    hasUpper,
    hasLower,
    hasDigit,
    hasSpecial,
  };
};
