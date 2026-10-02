require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Scheme = require('./models/Scheme');
const { checkEligibility } = require('./services/eligibilityService');
const { explainRecommendation, pingLLM } = require('./services/llmService');
const { buildRecommendation } = require('./services/recommendationService');

const app = express();
const corsOptions = process.env.CLIENT_ORIGIN
  ? { origin: process.env.CLIENT_ORIGIN }
  : {};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/llm/test', async (_req, res) => {
  res.json(await pingLLM());
});

app.get('/api/schemes', async (_req, res) => {
  try {
    const schemes = await Scheme.find({ active: true })
      .select('_id name description')
      .lean();
    res.json({
      schemes: schemes.map(({ _id, name, description }) => ({
        id: _id,
        name,
        description,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/schemes/:id', async (req, res) => {
  try {
    const scheme = await Scheme.findOne({ _id: req.params.id, active: true }).lean();
    if (!scheme) return res.status(404).json({ error: 'Scheme not found' });
    return res.json({
      id: scheme._id,
      name: scheme.name,
      rules: scheme.rules,
      documents: scheme.documents,
      benefits: scheme.benefits,
      source: scheme.source,
      sourceUrl: scheme.sourceUrl,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/eligibility/check', async (req, res) => {
  if (!req.body || req.body.profile === undefined || req.body.profile === null) {
    return res.status(400).json({ error: 'profile is required' });
  }

  try {
    const schemes = await Scheme.find({ active: true }).lean();
    const results = await checkEligibility(req.body.profile, schemes);
    const statusOrder = { ELIGIBLE: 0, NEEDS_MORE_INFORMATION: 1, NOT_ELIGIBLE: 2 };
    results.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    const recommendation = buildRecommendation(req.body.profile, results, schemes);
    if (recommendation) {
      const llmReasoning = process.env.USE_LLM === 'false'
        ? null
        : await explainRecommendation(req.body.profile, recommendation, schemes);
      const runnerUp = recommendation.ranking[1];
      const template = `${recommendation.bestSchemeName} offers the highest estimated annual benefit (Rs. ${recommendation.estimatedAnnualValue}) among the schemes you are eligible for.${runnerUp ? ` The next best is ${runnerUp.schemeName} (Rs. ${runnerUp.estimatedAnnualValue}).` : ''}`;
      recommendation.reasoning = llmReasoning || template;
      recommendation.reasoningSource = llmReasoning ? 'llm' : 'template';
    }
    return res.json({ results, recommendation });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

async function start() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server listening on port ${port}.`));
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

start();
