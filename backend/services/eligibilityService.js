const { evaluateRule } = require('./ruleEngine');
const { explainScheme } = require('./llmService');

function describeRule(rule, profile, outcome) {
  const field = rule.field || 'required information';
  const actual = profile?.[field];
  const op = String(rule.operator || '').toLowerCase();
  const value = rule.value;
  const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

  if (outcome === 'UNKNOWN') return `Please provide ${field}`;
  if (op === '<=') {
    return outcome === 'PASS'
      ? `${label} ${actual} is within the limit of ${value}.`
      : `${label} ${actual} exceeds the limit of ${value}.`;
  }
  if (op === '>=') {
    return outcome === 'PASS'
      ? `${label} ${actual} meets the minimum of ${value}.`
      : `${label} ${actual} is below the minimum of ${value}.`;
  }
  if (op === 'in') {
    return outcome === 'PASS'
      ? `${label} ${actual} is an accepted value.`
      : `${label} ${actual} is not one of the accepted values (${value.join(', ')}).`;
  }
  if (op === '==') {
    return outcome === 'PASS'
      ? `${label} ${actual} matches the requirement.`
      : `${label} ${actual} does not match the required value ${value}.`;
  }
  return `${label} could not be evaluated.`;
}

function evaluateScheme(profile, scheme) {
  const matchedRules = [];
  const failedRules = [];
  const missingInformation = [];
  const evidence = [];

  for (const rule of scheme.rules || []) {
    const outcome = evaluateRule(rule, profile);
    const reason = describeRule(rule, profile, outcome);
    const ruleId = rule.ruleId;

    if (outcome === 'PASS') matchedRules.push({ ruleId, reason });
    if (outcome === 'FAIL') failedRules.push({ ruleId, reason });
    if (outcome === 'UNKNOWN') missingInformation.push(reason);
    evidence.push({ ruleId, clause: rule.text, section: rule.section, source: scheme.source });
  }

  const status = failedRules.length
    ? 'NOT_ELIGIBLE'
    : missingInformation.length
      ? 'NEEDS_MORE_INFORMATION'
      : 'ELIGIBLE';

  return {
    schemeId: scheme._id ?? scheme.id,
    schemeName: scheme.name,
    status,
    matchedRules,
    failedRules,
    missingInformation,
    requiredDocuments: scheme.documents || [],
    evidence,
    shortlisted: status !== 'NOT_ELIGIBLE',
  };
}

function templateExplanation(scheme, result) {
  if (result.status === 'NOT_ELIGIBLE') {
    const firstFailedId = result.failedRules[0]?.ruleId;
    const clause = (scheme.rules || []).find((rule) => rule.ruleId === firstFailedId)?.text || '';
    return `You do not meet this condition: ${clause}`;
  }
  if (result.status === 'NEEDS_MORE_INFORMATION') {
    return `We need more information to decide: ${result.missingInformation.join(', ')}`;
  }
  return 'Your profile meets all listed conditions.';
}

async function checkEligibility(profile, schemes) {
  const evaluated = schemes.map((scheme) => ({ scheme, result: evaluateScheme(profile, scheme) }));

  if (process.env.USE_LLM === 'false') {
    return evaluated.map(({ scheme, result }) => ({
      ...result,
      explanation: templateExplanation(scheme, result),
      explanationSource: 'template',
    }));
  }

  const explainable = evaluated
    .map((entry, index) => ({ ...entry, index }))
    .filter(({ result }) => result.status === 'ELIGIBLE' || result.status === 'NEEDS_MORE_INFORMATION');
  const explanationsByIndex = new Map();
  for (let index = 0; index < explainable.length; index += 4) {
    const batch = explainable.slice(index, index + 4);
    const explanations = await Promise.all(
      batch.map(({ scheme, result }) => explainScheme(profile, scheme, result))
    );
    batch.forEach(({ index: resultIndex }, batchIndex) => {
      explanationsByIndex.set(resultIndex, explanations[batchIndex]);
    });
  }
  return evaluated.map(({ scheme, result }, index) => {
    const llmResult = explanationsByIndex.get(index);
    return {
      ...result,
      explanation: llmResult?.explanation || templateExplanation(scheme, result),
      explanationSource: llmResult?.explanation ? 'llm' : 'template',
    };
  });
}

module.exports = { checkEligibility };
