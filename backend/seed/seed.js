require('dotenv').config();
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');
const schemes = require('./schemes.json');

async function seed() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
    await mongoose.connect(process.env.MONGODB_URI);
    await Scheme.deleteMany({});
    const inserted = schemes.length ? await Scheme.insertMany(schemes) : [];
    console.log(`Seeded ${inserted.length} schemes.`);
  } catch (error) {
    console.error('Failed to seed schemes:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();