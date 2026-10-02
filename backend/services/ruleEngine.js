function isMissing(value) {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (typeof value === 'string' && value.toLowerCase() === 'unknown')
  );
}

function evaluateRule(rule, profile) {
  if (!rule || !rule.field || !rule.operator || !profile) return 'UNKNOWN';

  const actual = profile[rule.field];
  if (isMissing(actual)) return 'UNKNOWN';

  const operator = String(rule.operator).toLowerCase();
  const expected = rule.value;

  switch (operator) {
    case '<=':
      if (typeof expected !== 'number') return 'UNKNOWN';
      if (!Number.isFinite(Number(actual))) return 'UNKNOWN';
      return Number(actual) <= expected ? 'PASS' : 'FAIL';
    case '>=':
      if (typeof expected !== 'number') return 'UNKNOWN';
      if (!Number.isFinite(Number(actual))) return 'UNKNOWN';
      return Number(actual) >= expected ? 'PASS' : 'FAIL';
    case '==':
      return String(actual).toLowerCase() === String(expected).toLowerCase()
        ? 'PASS'
        : 'FAIL';
    case 'in':
      if (!Array.isArray(expected)) return 'UNKNOWN';
      return expected.some(
        (value) => String(value).toLowerCase() === String(actual).toLowerCase()
      )
        ? 'PASS'
        : 'FAIL';
    default:
      return 'UNKNOWN';
  }
}

module.exports = { evaluateRule };
