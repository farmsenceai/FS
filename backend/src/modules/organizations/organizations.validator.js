const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COUNTRY_CODE_PATTERN = /^[A-Za-z]{2}$/;
const ALLOWED_FIELDS = new Set([
  'legalName',
  'displayName',
  'slug',
  'legal',
  'contacts',
  'branding',
  'defaultCurrency',
  'timezone'
]);

class OrganizationValidationError extends Error {
  constructor(details) {
    super('Organization request validation failed');
    this.name = 'OrganizationValidationError';
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.details = details;
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validatePayload(payload, { partial }) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const errors = [];
  const fields = Object.keys(value);

  for (const field of fields) {
    if (!ALLOWED_FIELDS.has(field)) errors.push(`${field} is not an allowed field`);
  }

  if (partial && fields.length === 0) errors.push('At least one field must be provided');

  for (const field of ['legalName', 'displayName']) {
    if (!partial || Object.hasOwn(value, field)) {
      if (!isNonEmptyString(value[field])) errors.push(`${field} is required`);
    }
  }

  if (!partial || Object.hasOwn(value, 'slug')) {
    if (!isNonEmptyString(value.slug)) {
      errors.push('slug is required');
    } else if (!SLUG_PATTERN.test(value.slug)) {
      errors.push('slug must contain lowercase letters, numbers, and single hyphens only');
    }
  }

  if (!partial) {
    if (!value.contacts || typeof value.contacts !== 'object') {
      errors.push('contacts.billingEmail is required');
    } else if (!isNonEmptyString(value.contacts.billingEmail)) {
      errors.push('contacts.billingEmail is required');
    } else if (!EMAIL_PATTERN.test(value.contacts.billingEmail)) {
      errors.push('contacts.billingEmail must be a valid email address');
    }
  } else if (Object.hasOwn(value, 'contacts')) {
    if (!value.contacts || typeof value.contacts !== 'object' || Array.isArray(value.contacts)) {
      errors.push('contacts must be an object');
    } else if (
      Object.hasOwn(value.contacts, 'billingEmail') &&
      (!isNonEmptyString(value.contacts.billingEmail) ||
        !EMAIL_PATTERN.test(value.contacts.billingEmail))
    ) {
      errors.push('contacts.billingEmail must be a valid email address');
    }
  }

  if (!partial) {
    if (!value.legal || typeof value.legal !== 'object') {
      errors.push('legal.countryCode is required');
    } else if (!isNonEmptyString(value.legal.countryCode)) {
      errors.push('legal.countryCode is required');
    } else if (!COUNTRY_CODE_PATTERN.test(value.legal.countryCode)) {
      errors.push('legal.countryCode must be a 2-letter ISO country code');
    }
  } else if (Object.hasOwn(value, 'legal')) {
    if (!value.legal || typeof value.legal !== 'object' || Array.isArray(value.legal)) {
      errors.push('legal must be an object');
    } else if (
      Object.hasOwn(value.legal, 'countryCode') &&
      (!isNonEmptyString(value.legal.countryCode) ||
        !COUNTRY_CODE_PATTERN.test(value.legal.countryCode))
    ) {
      errors.push('legal.countryCode must be a 2-letter ISO country code');
    }
  }

  if (errors.length > 0) throw new OrganizationValidationError(errors);

  const sanitized = {};
  for (const field of fields) {
    if (ALLOWED_FIELDS.has(field)) sanitized[field] = value[field];
  }

  if (sanitized.legalName) sanitized.legalName = sanitized.legalName.trim();
  if (sanitized.displayName) sanitized.displayName = sanitized.displayName.trim();
  if (sanitized.slug) sanitized.slug = sanitized.slug.trim();
  if (sanitized.contacts?.billingEmail) {
    sanitized.contacts = {
      ...sanitized.contacts,
      billingEmail: sanitized.contacts.billingEmail.trim().toLowerCase()
    };
  }
  if (sanitized.legal?.countryCode) {
    sanitized.legal = {
      ...sanitized.legal,
      countryCode: sanitized.legal.countryCode.trim().toUpperCase()
    };
  }

  return sanitized;
}

function validateCreate(payload) {
  return validatePayload(payload, { partial: false });
}

function validateUpdate(payload) {
  return validatePayload(payload, { partial: true });
}

module.exports = {
  OrganizationValidationError,
  validateCreate,
  validateUpdate
};
