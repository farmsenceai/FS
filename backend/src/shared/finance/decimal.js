const DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/;

function toText(value, field) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new TypeError(`${field} must be a decimal number`);
  }
  const text = String(value).trim();
  if (!DECIMAL_PATTERN.test(text)) throw new TypeError(`${field} must be a decimal number`);
  return text;
}

function toScaledInteger(value, scale, field) {
  const text = toText(value, field);
  const [whole, fraction = ''] = text.split('.');
  if (fraction.length > scale) {
    throw new TypeError(`${field} must have at most ${scale} decimal places`);
  }
  const padded = fraction.padEnd(scale, '0');
  return BigInt(whole) * (10n ** BigInt(scale)) + BigInt(padded || '0');
}

function fromScaledInteger(value, scale) {
  const divisor = 10n ** BigInt(scale);
  const whole = value / divisor;
  const fraction = String(value % divisor).padStart(scale, '0');
  return scale ? `${whole}.${fraction}` : String(whole);
}

function normalizeMoney(value, field = 'amount') {
  const paise = toScaledInteger(value, 2, field);
  if (paise <= 0n) throw new TypeError(`${field} must be greater than 0`);
  return fromScaledInteger(paise, 2);
}

function normalizeNonNegativeMoney(value, field) {
  const paise = toScaledInteger(value, 2, field);
  return fromScaledInteger(paise, 2);
}

function normalizeWeight(value, field = 'avgWeightKg') {
  const millikg = toScaledInteger(value, 3, field);
  if (millikg <= 0n) throw new TypeError(`${field} must be greater than 0`);
  return fromScaledInteger(millikg, 3);
}

function calculateRevenue(quantitySold, avgWeightKg, pricePerKg) {
  const weightMilliKg = toScaledInteger(avgWeightKg, 3, 'avgWeightKg');
  const pricePaise = toScaledInteger(pricePerKg, 2, 'pricePerKg');
  const numerator = BigInt(quantitySold) * weightMilliKg * pricePaise;
  const revenuePaise = (numerator + 500n) / 1000n;
  return fromScaledInteger(revenuePaise, 2);
}

module.exports = {
  toScaledInteger,
  normalizeMoney,
  normalizeNonNegativeMoney,
  normalizeWeight,
  calculateRevenue
};
