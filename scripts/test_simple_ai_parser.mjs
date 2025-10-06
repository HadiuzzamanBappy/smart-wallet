#!/usr/bin/env node
import 'dotenv/config';
import { parseTransaction } from '../src/utils/aiTransactionParser.js';

const tests = [
  'I bought lunch for 500 taka',
  'আজ ৫০০ টাকা খাবারে খরচ করেছি',
  'Received salary 50000 tk and Lent 2000 taka to my friend',
  'Borrowed 5000 from brother'
];

console.log('\n🧪 Testing AI Transaction Parser\n');

const run = async () => {
  for (const t of tests) {
    process.stdout.write(`Test: "${t}"\n`);
    try {
      const res = await parseTransaction(t);
      if (!res || !res.success) {
        console.log('❌ Failed:', res?.error || 'Unknown error');
      } else {
        const data = res.data;
        if (Array.isArray(data)) {
          console.log('✅ Parsed', data.length, 'transactions:');
          data.forEach((d, i) => console.log(`  ${i+1}) ${d.type} | ${d.amount} BDT | ${d.category} | ${d.description}`));
        } else {
          const d = data;
          console.log('✅ Parsed single transaction:', `${d.type} | ${d.amount} BDT | ${d.category} | ${d.description}`);
        }
      }
    } catch (err) {
      console.error('❌ Error running parser:', err?.message || String(err));
    }
    console.log('────────────────────────────────────────────────────────────');
  }
};

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
