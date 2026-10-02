const fs = require('node:fs');
const path = require('node:path');

const seedDir = __dirname;
const inputPath = path.join(seedDir, 'new_schemes.txt');
const outputPath = path.join(seedDir, 'schemes.json');

const courseGroups = {
  ENG: ['B.Tech', 'B.E.'],
  PRO: ['B.Tech', 'B.E.', 'B.Pharm', 'MBBS', 'BDS', 'MBA'],
  MED: ['MBBS', 'BDS'],
  PHARM: ['B.Pharm', 'M.Pharm'],
  UG: ['B.Tech', 'B.E.', 'B.Pharm', 'B.Sc', 'B.Com', 'BA', 'BDS', 'MBBS'],
  PG: ['M.Tech', 'MBA', 'M.Sc', 'MA', 'M.Com', 'M.Pharm'],
  SCI: ['B.Sc', 'M.Sc'],
  ARTS: ['BA', 'MA'],
  COMM: ['B.Com', 'MBA', 'M.Com'],
  DIP: ['Diploma', 'ITI'],
  TECH: ['B.Tech', 'B.E.', 'Diploma'],
  ALL: ['B.Tech', 'B.E.', 'B.Pharm', 'MBBS', 'BDS', 'MBA', 'M.Tech', 'M.Sc', 'MA', 'M.Com', 'M.Pharm', 'B.Sc', 'B.Com', 'BA', 'Diploma', 'ITI'],
};

function parseCourses(input) {
  const groups = input.split(',').map((item) => item.trim());
  if (groups.length === 1 && Object.hasOwn(courseGroups, groups[0])) {
    return [...courseGroups[groups[0]]];
  }
  return groups;
}

function makeRule(id, index, field, operator, value, text, section) {
  return {
    ruleId: `${id}-R${String(index).padStart(2, '0')}`,
    field,
    operator,
    value,
    text,
    section,
    priority: index,
  };
}

function generateScheme(line, lineNumber) {
  const columns = line.split('|');
  if (columns.length !== 11) {
    throw new Error(`Line ${lineNumber}: expected 11 pipe-separated fields, found ${columns.length}.`);
  }
  const [id, name, categoryText, state, maxIncomeText, minPctText, coursesText, year, domicile, annualValueText, benefitType] = columns.map((value) => value.trim());
  if (!id || !name || !categoryText || !maxIncomeText || !minPctText || !coursesText || !annualValueText || !benefitType) {
    throw new Error(`Line ${lineNumber}: required fields cannot be empty.`);
  }

  const maxIncome = Number(maxIncomeText);
  const minPercentage = Number(minPctText);
  const annualValue = Number(annualValueText);
  if (![maxIncome, minPercentage, annualValue].every(Number.isFinite)) {
    throw new Error(`Line ${lineNumber}: MaxIncome, MinPct, and AnnualValue must be numbers.`);
  }

  const categories = categoryText.split(',').map((item) => item.trim());
  const courses = parseCourses(coursesText);
  const rules = [];
  const addRule = (...args) => rules.push(makeRule(id, rules.length + 1, ...args));

  if (state !== '-') {
    addRule('state', '==', state, `The applicant must be a resident of ${state}.`, 'Eligibility Criteria');
  }
  if (categoryText !== 'ANY') {
    addRule('category', 'in', categories, `The applicant must belong to one of these categories: ${categories.join(', ')}.`, 'Eligibility Criteria');
  }
  addRule('familyIncome', '<=', maxIncome, `Annual family income must not exceed Rs. ${maxIncome / 100000} lakh.`, 'Income Ceiling');
  addRule('academicPercentage', '>=', minPercentage, `The applicant must have scored at least ${minPercentage}% in the previous qualifying examination.`, 'Academic Criteria');
  addRule('course', 'in', courses, `The applicant must be enrolled in one of these courses: ${courses.join(', ')}.`, 'Eligible Courses');

  if (year !== '-') {
    if (year === '1' || year === '2') {
      addRule('yearOfStudy', '==', Number(year), `The applicant must be in year ${year} of study.`, 'Eligibility Criteria');
    } else if (year === '2+') {
      addRule('yearOfStudy', '>=', 2, 'The applicant must be in the second year of study or above.', 'Eligibility Criteria');
    } else if (year === '3+') {
      addRule('yearOfStudy', '>=', 3, 'The applicant must be in the third year of study or above.', 'Eligibility Criteria');
    } else {
      throw new Error(`Line ${lineNumber}: unsupported Year value "${year}".`);
    }
  }
  if (domicile === 'Y') {
    addRule('domicileStatus', '==', 'Yes', 'The applicant must hold a valid domicile certificate.', 'Documents Required');
  }

  const documents = ['Income Certificate', 'Previous Year Marksheet', 'Bonafide Certificate'];
  if (categories.some((category) => ['OBC', 'SC', 'ST', 'VJNT', 'SBC', 'Minority'].includes(category))) {
    documents.push('Category Certificate');
  }
  if (state !== '-' || domicile === 'Y') documents.push('Domicile Certificate');

  const isMaharashtra = state === 'Maharashtra';
  return {
    _id: id,
    name,
    description: `Demo scheme: ${benefitType} for students who meet the listed criteria.`,
    rules,
    documents,
    benefits: {
      estimatedAnnualValue: annualValue,
      benefitType,
      summary: `${benefitType} for eligible students under ${name}.`,
      frequency: id === 'SCH048' ? 'one-time' : 'annual',
      isIllustrative: true,
    },
    source: isMaharashtra
      ? 'MahaDBT (demo summary)'
      : state === '-'
        ? 'National Scholarship Portal (demo summary)'
        : 'State Scholarship Portal (demo summary)',
    sourceUrl: isMaharashtra
      ? 'https://mahadbt2.maharashtra.gov.in'
      : 'https://scholarships.gov.in',
    active: true,
  };
}

function validate(schemes) {
  if (schemes.length !== 51) {
    throw new Error(`Expected exactly 51 schemes after generation, found ${schemes.length}.`);
  }
  const schemeIds = new Set();
  const ruleIds = new Set();
  const allIds = new Set();
  for (const scheme of schemes) {
    if (schemeIds.has(scheme._id)) throw new Error(`Duplicate scheme ID: ${scheme._id}`);
    schemeIds.add(scheme._id);
    if (allIds.has(scheme._id)) throw new Error(`Duplicate ID: ${scheme._id}`);
    allIds.add(scheme._id);
    for (const rule of scheme.rules || []) {
      if (ruleIds.has(rule.ruleId)) throw new Error(`Duplicate rule ID: ${rule.ruleId}`);
      ruleIds.add(rule.ruleId);
      if (allIds.has(rule.ruleId)) throw new Error(`Duplicate ID: ${rule.ruleId}`);
      allIds.add(rule.ruleId);
      if (typeof rule.text !== 'string' || !rule.text.trim()) {
        throw new Error(`Rule ${rule.ruleId} has empty or invalid text.`);
      }
    }
  }
}

function main() {
  const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  if (!Array.isArray(existing)) throw new Error('schemes.json must contain a JSON array.');
  const existingIds = new Set(existing.map((scheme) => scheme._id));
  const input = fs.readFileSync(inputPath, 'utf8');
  const additions = input
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => line.length > 0)
    .filter(({ line }) => !existingIds.has(line.split('|', 1)[0].trim()))
    .map(({ line, lineNumber }) => generateScheme(line, lineNumber));

  const combined = [...existing, ...additions];
  validate(combined);
  fs.writeFileSync(outputPath, `${JSON.stringify(combined, null, 2)}\n`, 'utf8');
  console.log(`Total schemes: ${combined.length}`);
}

try {
  main();
} catch (error) {
  console.error(`Scheme generation failed: ${error.message}`);
  process.exitCode = 1;
}
