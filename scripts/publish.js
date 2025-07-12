#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('🚀 Building react-forms package...');
execSync('npx nx build react-forms', { stdio: 'inherit' });

console.log('\n✅ Build completed!');
console.log('📱 Please get a fresh OTP from your authenticator app...');

rl.question('Enter your OTP: ', (otp) => {
  try {
    console.log('📦 Publishing package...');
    execSync(`npx nx release --projects=react-forms patch -- --otp=${otp}`, {
      stdio: 'inherit',
    });
    console.log('✅ Published successfully!');
  } catch (error) {
    console.error('❌ Publishing failed:', error.message);
  } finally {
    rl.close();
  }
});
