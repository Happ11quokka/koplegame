import { PIIViolation, ValidationResult } from '@/types';

// Regular expressions for PII detection
const PII_PATTERNS = {
  // Email patterns
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Phone number patterns (various formats)
  phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  phoneKorea: /(\+82|82)?[-.\s]?(\d{2,3})[-.\s]?(\d{3,4})[-.\s]?(\d{4})/g,
  phoneInternational: /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,

  // Social media handles
  socialHandle: /@[a-zA-Z0-9_]{1,15}/g,
  instagramHandle: /(?:instagram\.com\/|@)([a-zA-Z0-9_\.]{1,30})/g,
  twitterHandle: /(?:twitter\.com\/|@)([a-zA-Z0-9_]{1,15})/g,

  // Full name patterns (common structures)
  fullNameEnglish: /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
  fullNameKorean: /[가-힣]{2,4}\s+[가-힣]{2,4}/g,

  // Address patterns
  address: /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)/gi,

  // ID numbers (simplified patterns)
  studentId: /\b\d{6,10}\b/g,
  employeeId: /\b[A-Z]{2,3}\d{3,6}\b/g,

  // URLs and domains
  url: /https?:\/\/[^\s]+/g,
  domain: /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/g,
};

// Common PII keywords to flag
const PII_KEYWORDS = {
  contact: ['phone', 'email', 'contact', 'call', 'text', 'whatsapp', 'telegram'],
  identification: ['name', 'id', 'student id', 'employee id', 'ssn', 'passport'],
  location: ['address', 'street', 'apartment', 'home', 'live at', 'room number'],
  social: ['instagram', 'twitter', 'facebook', 'linkedin', 'snapchat', 'tiktok'],
};

export function validateForPII(text: string, field: string): ValidationResult {
  if (!text || typeof text !== 'string') {
    return { isValid: true, violations: [] };
  }

  const violations: PIIViolation[] = [];
  const lowerText = text.toLowerCase();

  // Check for email patterns
  const emailMatches = text.match(PII_PATTERNS.email);
  if (emailMatches) {
    emailMatches.forEach(match => {
      violations.push({
        field,
        value: match,
        type: 'email',
        confidence: 0.95
      });
    });
  }

  // Check for phone patterns
  const phonePatterns = [
    PII_PATTERNS.phone,
    PII_PATTERNS.phoneKorea,
    PII_PATTERNS.phoneInternational
  ];

  phonePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Skip if it's just a year or other non-phone number
        if (match.replace(/\D/g, '').length >= 7) {
          violations.push({
            field,
            value: match,
            type: 'phone',
            confidence: 0.9
          });
        }
      });
    }
  });

  // Check for social media handles
  const socialPatterns = [
    PII_PATTERNS.socialHandle,
    PII_PATTERNS.instagramHandle,
    PII_PATTERNS.twitterHandle
  ];

  socialPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        violations.push({
          field,
          value: match,
          type: 'social_handle',
          confidence: 0.85
        });
      });
    }
  });

  // Check for full name patterns
  const namePatterns = [PII_PATTERNS.fullNameEnglish, PII_PATTERNS.fullNameKorean];

  namePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Additional validation: skip common phrases
        if (!isCommonPhrase(match)) {
          violations.push({
            field,
            value: match,
            type: 'full_name',
            confidence: 0.7
          });
        }
      });
    }
  });

  // Check for address patterns
  const addressMatches = text.match(PII_PATTERNS.address);
  if (addressMatches) {
    addressMatches.forEach(match => {
      violations.push({
        field,
        value: match,
        type: 'address',
        confidence: 0.8
      });
    });
  }

  // Check for PII keywords
  Object.entries(PII_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        // Check if it's not just a casual mention
        if (containsDirectReference(lowerText, keyword)) {
          violations.push({
            field,
            value: keyword,
            type: category as any,
            confidence: 0.6
          });
        }
      }
    });
  });

  // Check for URLs
  const urlMatches = text.match(PII_PATTERNS.url);
  if (urlMatches) {
    urlMatches.forEach(match => {
      violations.push({
        field,
        value: match,
        type: 'social_handle',
        confidence: 0.85
      });
    });
  }

  const isValid = violations.length === 0;

  return {
    isValid,
    violations,
    sanitizedValue: isValid ? text : sanitizeText(text, violations)
  };
}

function isCommonPhrase(text: string): boolean {
  const commonPhrases = [
    'New York', 'Los Angeles', 'San Francisco', 'South Korea', 'North America',
    'United States', 'European Union', 'Middle East', 'Southeast Asia',
    'Machine Learning', 'Computer Science', 'Business Administration',
    'Social Media', 'Video Games', 'Pop Music', 'Rock Music'
  ];

  return commonPhrases.some(phrase =>
    text.toLowerCase().includes(phrase.toLowerCase())
  );
}

function containsDirectReference(text: string, keyword: string): boolean {
  // Look for patterns that suggest direct sharing of PII
  const directPatterns = [
    `my ${keyword}`,
    `${keyword} is`,
    `${keyword}:`,
    `here's my ${keyword}`,
    `contact me at`,
    `reach me on`
  ];

  return directPatterns.some(pattern => text.includes(pattern));
}

function sanitizeText(text: string, violations: PIIViolation[]): string {
  let sanitized = text;

  violations.forEach(violation => {
    // Replace with placeholder based on violation type
    const placeholder = getPlaceholder(violation.type);
    sanitized = sanitized.replace(violation.value, placeholder);
  });

  return sanitized;
}

function getPlaceholder(type: string): string {
  switch (type) {
    case 'email':
      return '[EMAIL REMOVED]';
    case 'phone':
      return '[PHONE REMOVED]';
    case 'social_handle':
      return '[HANDLE REMOVED]';
    case 'full_name':
      return '[NAME REMOVED]';
    case 'address':
      return '[ADDRESS REMOVED]';
    default:
      return '[SENSITIVE INFO REMOVED]';
  }
}

// Validate entire hint payload
export function validateHintPayload(payload: any, level: string): ValidationResult {
  const allViolations: PIIViolation[] = [];

  // Recursively check all string values in the payload
  function checkValue(value: any, path: string) {
    if (typeof value === 'string') {
      const result = validateForPII(value, path);
      allViolations.push(...result.violations);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        checkValue(item, `${path}[${index}]`);
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        checkValue(val, `${path}.${key}`);
      });
    }
  }

  checkValue(payload, level);

  return {
    isValid: allViolations.length === 0,
    violations: allViolations
  };
}

// Quick validation for real-time feedback
export function quickPIICheck(text: string): boolean {
  if (!text) return true;

  // Quick checks for obvious PII
  const quickPatterns = [
    /@\w+/,  // @ handles
    /\b\w+@\w+\.\w+/,  // emails
    /\+?\d[\d\s\-\(\)]{7,}/,  // phone numbers
    /https?:\/\//  // URLs
  ];

  return !quickPatterns.some(pattern => pattern.test(text));
}