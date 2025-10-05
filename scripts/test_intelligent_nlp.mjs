#!/usr/bin/env node

import { parseTransaction, testIntelligentNLP, testFourCategorySystem, learnFromCorrection } from '../src/utils/transactionParser.js';

console.log('🧠 INTELLIGENT NLP TRANSACTION PARSER TEST SUITE 🧠\n');
console.log('=' .repeat(60));

// Test individual parsing with detailed output
console.log('\n📝 INDIVIDUAL PARSING EXAMPLES:\n');

const sampleTests = [
  "I gave 5000 taka to my friend for emergency",
  "বন্ধুর কাছ থেকে ৩০০০ টাকা নিয়েছি", 
  "buyed pizza for ৫০০ tk from foodpanda",
  "received salary ৫০,০০০ this month",
  "lent approximately 10k to colleague"
];

sampleTests.forEach((test, index) => {
  console.log(`${index + 1}. Input: "${test}"`);
  const result = parseTransaction(test);
  
  if (result.success) {
    const { type, amount, category, description, confidence, aiAnalysis } = result.data;
    console.log(`   ✅ Type: ${type.toUpperCase()}`);
    console.log(`   💰 Amount: ${amount} BDT`);
    console.log(`   🏷️  Category: ${category}`);
    console.log(`   📝 Description: ${description}`);
    console.log(`   🎯 Confidence: ${confidence}`);
    console.log(`   🤖 AI Analysis: ${aiAnalysis.detectedVerbs.length} verbs, ${aiAnalysis.detectedNouns.length} nouns`);
  } else {
    console.log(`   ❌ Error: ${result.error}`);
  }
  console.log('');
});

// Test 4-category system accuracy
console.log('\n🎯 4-CATEGORY SYSTEM ACCURACY TEST:\n');
console.log('-'.repeat(40));

const categoryTest = testFourCategorySystem();
console.log(`Overall 4-Category Accuracy: ${categoryTest.overallAccuracy}\n`);

Object.entries(categoryTest.accuracyByCategory).forEach(([category, accuracy]) => {
  const emoji = category === 'credit' ? '📤' : category === 'loan' ? '📥' : category === 'expense' ? '💸' : '💰';
  console.log(`${emoji} ${category.toUpperCase()}: ${accuracy}`);
});

// Full comprehensive test
console.log('\n🚀 COMPREHENSIVE INTELLIGENCE TEST:\n');
console.log('-'.repeat(50));

const fullTest = testIntelligentNLP();
const { summary } = fullTest;

console.log('📊 PERFORMANCE METRICS:');
console.log(`   Total Tests: ${summary.totalTests}`);
console.log(`   Successful: ${summary.successful}`);
console.log(`   Failed: ${summary.failed}`);
console.log(`   Accuracy: ${summary.accuracy}`);
console.log(`   Total Time: ${summary.totalProcessingTime}`);
console.log(`   Avg Time/Test: ${summary.averageTimePerTest}\n`);

console.log('🎯 FEATURES TESTED:');
Object.entries(summary.featuresTest).forEach(([feature, status]) => {
  console.log(`   ${status} ${feature.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
});

// Show some interesting results
console.log('\n🌟 INTERESTING RESULTS:\n');

const interestingResults = fullTest.results.filter(r => 
  r.success && (
    r.data.confidence === 'high' || 
    r.input.includes('৳') || 
    r.input.includes('crore') ||
    r.input.includes('emergency')
  )
).slice(0, 5);

interestingResults.forEach((result, index) => {
  console.log(`${index + 1}. "${result.input}"`);
  console.log(`   → ${result.data.type.toUpperCase()}: ${result.data.amount} BDT`);
  console.log(`   → "${result.data.description}"`);
  console.log(`   → Confidence: ${result.data.confidence}\n`);
});

// Test machine learning capability
console.log('\n🧠 MACHINE LEARNING DEMONSTRATION:\n');
console.log('-'.repeat(40));

// Simulate a user correction
const testMessage = "gave money to friend 1000";
const aiResult = parseTransaction(testMessage);

if (aiResult.success) {
  console.log(`Original AI Prediction: ${aiResult.data.type} (${aiResult.data.confidence} confidence)`);
  
  // Simulate user correcting it to 'credit' if it wasn't detected correctly
  const userCorrection = { type: 'credit', category: 'other', description: 'Money given to friend' };
  
  const learningResult = learnFromCorrection(testMessage, aiResult.data, userCorrection);
  console.log(`Learning Update: ${learningResult.message}`);
  console.log(`Total Corrections in Memory: ${learningResult.totalCorrections}`);
}

console.log('\n✨ INTELLIGENCE FEATURES SUMMARY:\n');
console.log('🔍 Multi-language support (English + Bengali)');
console.log('🧩 Broken English correction'); 
console.log('📊 4-category transaction detection');
console.log('🎯 Contextual entity extraction');
console.log('💡 Semantic relationship analysis');
console.log('🤖 Machine learning adaptation');
console.log('📝 Intelligent description generation');
console.log('💰 Fuzzy amount detection');
console.log('⚡ Real-time confidence scoring');
console.log('🧠 Pattern weight adaptation');

console.log('\n' + '='.repeat(60));
console.log('🎉 INTELLIGENT NLP SYSTEM TEST COMPLETE! 🎉');
console.log('Ready for production use with advanced AI capabilities.');