const DEFAULT_MAX_ATTEMPTS = 50;

function farmCodePrefix(farmCode) {
  return String(farmCode || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3)
    .padEnd(3, 'X');
}

function formatBatchCode(farmCode, suffix) {
  if (!Number.isInteger(suffix) || suffix < 0 || suffix > 999) {
    throw new TypeError('Batch code suffix must be an integer from 0 to 999');
  }
  return `${farmCodePrefix(farmCode)}${String(suffix).padStart(3, '0')}`;
}

async function generateUniqueBatchCode({
  farmCode,
  isTaken,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  random = Math.random
}) {
  if (typeof isTaken !== 'function') throw new TypeError('isTaken must be a function');

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = formatBatchCode(farmCode, Math.floor(random() * 1000));
    if (!(await isTaken(code))) return code;
  }

  throw new Error(
    `Unable to generate a unique batch code for farm prefix '${farmCodePrefix(farmCode)}' after ${maxAttempts} attempts`
  );
}

module.exports = {
  DEFAULT_MAX_ATTEMPTS,
  farmCodePrefix,
  formatBatchCode,
  generateUniqueBatchCode
};
