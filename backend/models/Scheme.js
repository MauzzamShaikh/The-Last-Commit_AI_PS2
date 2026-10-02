const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema(
  {
    ruleId: String,
    field: String,
    operator: String,
    value: mongoose.Schema.Types.Mixed,
    text: String,
    section: String,
    priority: Number,
  },
  { _id: false }
);

const benefitsSchema = new mongoose.Schema(
  {
    estimatedAnnualValue: Number,
    benefitType: String,
    summary: String,
    frequency: { type: String, enum: ['annual', 'one-time'] },
    isIllustrative: { type: Boolean, default: true },
  },
  { _id: false }
);

const schemeSchema = new mongoose.Schema({
  _id: String,
  name: { type: String, required: true },
  description: String,
  rules: { type: [ruleSchema], default: [] },
  documents: { type: [String], default: [] },
  benefits: { type: benefitsSchema, required: false },
  source: String,
  sourceUrl: String,
  active: { type: Boolean, default: true },
});

module.exports = mongoose.model('Scheme', schemeSchema);
