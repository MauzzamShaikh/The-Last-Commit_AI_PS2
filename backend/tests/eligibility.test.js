process.env.USE_LLM = 'false';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { checkEligibility } = require('../services/eligibilityService');
const { buildRecommendation } = require('../services/recommendationService');

const schemes = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../seed/schemes.json'), 'utf8')
);
const baseProfile = {
  course: 'B.Tech',
  year: 2,
  state: 'Maharashtra',
  category: 'OBC',
  familyIncome: 450000,
  academicPercentage: 78,
  domicileStatus: 'Yes',
};

async function getResults(profile = baseProfile) {
  return checkEligibility(profile, schemes);
}

async function getResult(schemeId, profile = baseProfile) {
  const results = await getResults(profile);
  const result = results.find((item) => item.schemeId === schemeId);
  assert.ok(result, `Expected result for ${schemeId}`);
  return result;
}

test('base profile has the expected results across the 51-scheme dataset', async () => {
  const results = await getResults();
  const statuses = new Map(results.map(({ schemeId, status }) => [schemeId, status]));

  const eligibleIds = [...statuses]
    .filter(([, status]) => status === 'ELIGIBLE')
    .map(([schemeId]) => schemeId)
    .sort();
  assert.deepEqual(eligibleIds, ['SCH002', 'SCH003', 'SCH010', 'SCH012', 'SCH018', 'SCH043', 'SCH051']);
  assert.equal(statuses.size, 51);
  for (const [schemeId, status] of statuses) {
    if (!eligibleIds.includes(schemeId)) assert.equal(status, 'NOT_ELIGIBLE', schemeId);
  }
});

test('unknown domicile needs information while an existing failure remains not eligible', async () => {
  const profile = { ...baseProfile, domicileStatus: 'Unknown' };
  const baseResults = await getResults();
  const unknownResults = await getResults(profile);
  const baseStatuses = new Map(baseResults.map(({ schemeId, status }) => [schemeId, status]));
  const unknownStatuses = new Map(unknownResults.map(({ schemeId, status }) => [schemeId, status]));
  assert.equal(unknownStatuses.get('SCH003'), 'NEEDS_MORE_INFORMATION');
  for (const [schemeId, status] of baseStatuses) {
    assert.equal(
      unknownStatuses.get(schemeId),
      schemeId === 'SCH003' ? 'NEEDS_MORE_INFORMATION' : status,
      schemeId
    );
  }
});

test('income boundary passes at 450000 and fails at 450001', async () => {
  const pass = await getResult('SCH004', { ...baseProfile, familyIncome: 450000 });
  const fail = await getResult('SCH004', { ...baseProfile, familyIncome: 450001 });
  assert.ok(pass.matchedRules.some(({ ruleId }) => ruleId === 'SCH004-R01'));
  assert.ok(fail.failedRules.some(({ ruleId }) => ruleId === 'SCH004-R01'));
});

test('wrong state fails SCH002-R01', async () => {
  const result = await getResult('SCH002', { ...baseProfile, state: 'Gujarat' });
  assert.equal(result.status, 'NOT_ELIGIBLE');
  assert.ok(result.failedRules.some(({ ruleId }) => ruleId === 'SCH002-R01'));
});

test('wrong course fails SCH002 but passes the SCH008 course rule', async () => {
  const profile = { ...baseProfile, course: 'Diploma' };
  const sch002 = await getResult('SCH002', profile);
  const sch008 = await getResult('SCH008', profile);
  const sch002CourseRule = schemes.find(({ _id }) => _id === 'SCH002').rules.find(({ field }) => field === 'course');
  const sch008CourseRule = schemes.find(({ _id }) => _id === 'SCH008').rules.find(({ field }) => field === 'course');
  assert.equal(sch002.status, 'NOT_ELIGIBLE');
  assert.ok(sch002.failedRules.some(({ ruleId }) => ruleId === sch002CourseRule.ruleId));
  assert.ok(sch008.matchedRules.some(({ ruleId }) => ruleId === sch008CourseRule.ruleId));
});

test('wrong category fails SCH001-R01', async () => {
  const result = await getResult('SCH001', { ...baseProfile, category: 'General' });
  assert.equal(result.status, 'NOT_ELIGIBLE');
  assert.ok(result.failedRules.some(({ ruleId }) => ruleId === 'SCH001-R01'));
});

test('missing academic percentage needs more information for SCH010', async () => {
  const profile = { ...baseProfile };
  delete profile.academicPercentage;
  const result = await getResult('SCH010', profile);
  assert.equal(result.status, 'NEEDS_MORE_INFORMATION');
  assert.ok(result.missingInformation.some((item) => item.includes('academicPercentage')));
});

test('missing income never becomes a failure when no other rule fails', async () => {
  const results = await getResults({ ...baseProfile, familyIncome: '' });
  const incomeSchemes = schemes.filter((scheme) =>
    (scheme.rules || []).some((rule) => rule.field === 'familyIncome')
  );
  for (const scheme of incomeSchemes) {
    const result = results.find((item) => item.schemeId === scheme._id);
    assert.ok(result, `Expected result for ${scheme._id}`);
    if (result.failedRules.length === 0) {
      assert.equal(result.status, 'NEEDS_MORE_INFORMATION', scheme._id);
      assert.notEqual(result.status, 'NOT_ELIGIBLE', scheme._id);
    }
  }
});

test('category and state comparisons are case-insensitive', async () => {
  const profile = { ...baseProfile, category: 'obc', state: 'maharashtra' };
  assert.equal((await getResult('SCH002', profile)).status, 'ELIGIBLE');
  assert.equal((await getResult('SCH003', profile)).status, 'ELIGIBLE');
});

test('numeric income rules accept an income supplied as a string', async () => {
  const result = await getResult('SCH004', { ...baseProfile, familyIncome: '450000' });
  assert.ok(result.matchedRules.some(({ ruleId }) => ruleId === 'SCH004-R01'));
});

test('evidence exactly matches each stored rule clause, section, and scheme source', async () => {
  const results = await getResults();
  const schemesById = new Map(schemes.map((scheme) => [scheme._id, scheme]));
  for (const result of results) {
    const scheme = schemesById.get(result.schemeId);
    const rulesById = new Map(scheme.rules.map((rule) => [rule.ruleId, rule]));
    for (const item of result.evidence) {
      const rule = rulesById.get(item.ruleId);
      assert.ok(rule, `Missing stored rule ${item.ruleId}`);
      assert.strictEqual(item.clause, rule.text);
      assert.strictEqual(item.section, rule.section);
      assert.strictEqual(item.source, scheme.source);
    }
  }
});

test('status, failure, missing-information, and shortlisted invariants hold', async () => {
  const results = await getResults();
  for (const result of results) {
    if (result.failedRules.length > 0) assert.equal(result.status, 'NOT_ELIGIBLE', result.schemeId);
    if (result.status === 'ELIGIBLE') {
      assert.equal(result.failedRules.length, 0, result.schemeId);
      assert.equal(result.missingInformation.length, 0, result.schemeId);
    }
    assert.equal(result.shortlisted, result.status !== 'NOT_ELIGIBLE', result.schemeId);
  }
});

test('LLM HTTP failure falls back to templates without changing statuses', async () => {
  const baseline = await getResults();
  const originalFetch = global.fetch;
  const originalUseLlm = process.env.USE_LLM;
  const originalApiKey = process.env.LLM_API_KEY;
  process.env.USE_LLM = 'true';
  process.env.LLM_API_KEY = 'invalid';
  global.fetch = async () => ({ status: 401, ok: false });

  try {
    const results = await getResults();
    assert.deepEqual(
      results.map(({ schemeId, status }) => [schemeId, status]),
      baseline.map(({ schemeId, status }) => [schemeId, status])
    );
    assert.equal(results.length, schemes.length);
    assert.ok(results.every(({ explanationSource }) => explanationSource === 'template'));
  } finally {
    global.fetch = originalFetch;
    process.env.USE_LLM = originalUseLlm;
    if (originalApiKey === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = originalApiKey;
  }
});

test('base profile recommends SCH002 and ranks eligible schemes by annual value', async () => {
  const results = await getResults();
  const recommendation = buildRecommendation(baseProfile, results, schemes);
  assert.ok(recommendation);
  assert.equal(recommendation.bestSchemeId, 'SCH002');
  assert.equal(recommendation.estimatedAnnualValue, 60000);
  assert.deepEqual(
    recommendation.ranking.map(({ schemeId }) => schemeId),
    ['SCH002', 'SCH003', 'SCH012', 'SCH051', 'SCH010', 'SCH043', 'SCH018']
  );
});

test('unknown domicile excludes SCH003 from ranking and only flags higher-value unlocks', async () => {
  const profile = { ...baseProfile, domicileStatus: 'Unknown' };
  const results = await getResults(profile);
  const recommendation = buildRecommendation(profile, results, schemes);
  assert.ok(recommendation);
  assert.equal(recommendation.bestSchemeId, 'SCH002');
  assert.ok(!recommendation.ranking.some(({ schemeId }) => schemeId === 'SCH003'));
  assert.ok(recommendation.couldBeBetter.every(
    ({ estimatedAnnualValue }) => estimatedAnnualValue > recommendation.estimatedAnnualValue
  ));
  assert.ok(!recommendation.couldBeBetter.some(({ schemeId }) => schemeId === 'SCH003'));
});

test('returns no recommendation when no schemes are eligible', async () => {
  const profile = {
    course: 'Unknown course',
    year: 99,
    state: 'Unknown state',
    category: 'Unknown category',
    familyIncome: 999999999,
    academicPercentage: 0,
    domicileStatus: 'No',
  };
  const results = await getResults(profile);
  assert.ok(results.every(({ status }) => status !== 'ELIGIBLE'));
  assert.equal(buildRecommendation(profile, results, schemes), null);
});
