/**
 * Form Utilities - helper functions for form handling
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export function validateField(
  value: any,
  rule: ValidationRule
): string | null {
  if (rule.required && (!value || (typeof value === "string" && !value.trim()))) {
    return "This field is required";
  }

  if (value && typeof value === "string") {
    if (rule.minLength && value.length < rule.minLength) {
      return `Minimum length is ${rule.minLength}`;
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      return `Maximum length is ${rule.maxLength}`;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      return "Invalid format";
    }
  }

  if (rule.custom) {
    return rule.custom(value);
  }

  return null;
}

export function validateForm(
  data: Record<string, any>,
  schema: ValidationSchema
): Record<string, string> {
  const errors: Record<string, string> = {};

  Object.keys(schema).forEach((key) => {
    const error = validateField(data[key], schema[key]);
    if (error) {
      errors[key] = error;
    }
  });

  return errors;
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[0-9]{10}$/,
  phoneFlexible: /^[0-9\-\s()]{10,}$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  thaiText: /^[\u0E00-\u0E7Fa-zA-Z\s]+$/,
};

/**
 * Sanitize form data - remove empty values and trim strings
 */
export function sanitizeFormData(data: Record<string, any>) {
  const sanitized: Record<string, any> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        sanitized[key] = trimmed;
      }
    } else if (value !== null && value !== undefined && value !== "") {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

/**
 * Merge form data with defaults
 */
export function mergeFormData(
  data: Record<string, any>,
  defaults: Record<string, any>
) {
  return {
    ...defaults,
    ...Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>),
  };
}
