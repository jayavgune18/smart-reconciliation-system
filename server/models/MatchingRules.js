const mongoose = require('mongoose');

const matchingRulesSchema = new mongoose.Schema({
  ruleType: { type: String, enum: ['Exact', 'Partial', 'Duplicate'], required: true },
  criteria: { type: Object, required: true }
});

module.exports = mongoose.model('MatchingRules', matchingRulesSchema);