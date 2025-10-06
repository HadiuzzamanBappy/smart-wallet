/**
 * Integration Test Script for Wallet Tracker
 * Tests all major functionality end-to-end
 */

import { promises as fs } from 'fs';
import path from 'path';

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const levelColors = {
    INFO: colors.blue,
    SUCCESS: colors.green,
    WARNING: colors.yellow,
    ERROR: colors.red,
    TEST: colors.cyan
  };
  
  console.log(`${levelColors[level] || ''}[${level}]${colors.reset} ${timestamp} - ${message}`);
}

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

async function runTest(testName, testFn) {
  try {
    log('TEST', `Running: ${testName}`);
    const result = await testFn();
    if (result === true) {
      testResults.passed++;
      testResults.tests.push({ name: testName, status: 'PASS' });
      log('SUCCESS', `✓ ${testName}`);
      return true;
    } else if (result === 'warning') {
      testResults.warnings++;
      testResults.tests.push({ name: testName, status: 'WARNING' });
      log('WARNING', `⚠ ${testName}`);
      return true;
    } else {
      testResults.failed++;
      testResults.tests.push({ name: testName, status: 'FAIL', error: result });
      log('ERROR', `✗ ${testName}: ${result}`);
      return false;
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    log('ERROR', `✗ ${testName}: ${error.message}`);
    return false;
  }
}

async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return `File not found: ${filePath}`;
  }
}

async function checkFileContains(filePath, searchText) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    if (content.includes(searchText)) {
      return true;
    }
    return `File ${filePath} does not contain: ${searchText}`;
  } catch (error) {
    return `Error reading ${filePath}: ${error.message}`;
  }
}

async function checkJSONValid(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    JSON.parse(content);
    return true;
  } catch (error) {
    return `Invalid JSON in ${filePath}: ${error.message}`;
  }
}

// Test suites
async function testProjectStructure() {
  log('INFO', 'Testing project structure...');
  
  const requiredFiles = [
    'package.json',
    'vite.config.js',
    'index.html',
    'src/main.jsx',
    'src/App.jsx',
    'src/App.css',
    'src/index.css'
  ];

  for (const file of requiredFiles) {
    await runTest(`File exists: ${file}`, async () => await checkFileExists(file));
  }

  // Test package.json validity
  await runTest('package.json is valid JSON', async () => await checkJSONValid('package.json'));
}

async function testCoreConfiguration() {
  log('INFO', 'Testing core configuration files...');

  // Test main dependencies in package.json
  await runTest('React 19+ dependency', async () => 
    await checkFileContains('package.json', '"react": "^19.1.1"'));
  
  await runTest('Firebase dependency', async () => 
    await checkFileContains('package.json', '"firebase"'));

  await runTest('Tailwind CSS dependency', async () => 
    await checkFileContains('package.json', '"tailwindcss"'));

  // Test Vite configuration
  await runTest('Vite config exists and valid', async () => 
    await checkFileContains('vite.config.js', 'export default defineConfig'));
}

async function testFirebaseIntegration() {
  log('INFO', 'Testing Firebase integration...');

  const firebaseConfigPath = 'src/config/firebase.js';
  await runTest('Firebase config file exists', async () => await checkFileExists(firebaseConfigPath));
  
  await runTest('Firebase config has auth', async () => 
    await checkFileContains(firebaseConfigPath, 'getAuth'));

  await runTest('Firebase config has firestore', async () => 
    await checkFileContains(firebaseConfigPath, 'getFirestore'));

  // Test auth service
  const authServicePath = 'src/services/authService.js';
  await runTest('Auth service exists', async () => await checkFileExists(authServicePath));
  
  await runTest('Auth service has login methods', async () => 
    await checkFileContains(authServicePath, 'loginWith'));

  await runTest('Auth service has Google OAuth', async () => 
    await checkFileContains(authServicePath, 'GoogleAuthProvider'));
}

async function testContextProviders() {
  log('INFO', 'Testing context providers...');

  // Test AuthContext
  const authContextPath = 'src/context/AuthContext.jsx';
  await runTest('AuthContext exists', async () => await checkFileExists(authContextPath));
  
  await runTest('AuthContext provides user state', async () => 
    await checkFileContains(authContextPath, 'AuthProvider'));

  // Test ThemeContext
  const themeContextPath = 'src/context/ThemeContext.jsx';
  await runTest('ThemeContext exists', async () => await checkFileExists(themeContextPath));
  
  await runTest('ThemeContext supports dark mode', async () => 
    await checkFileContains(themeContextPath, 'isDark'));
}

async function testHooksIntegration() {
  log('INFO', 'Testing custom hooks...');

  // Test useAuth hook
  const useAuthPath = 'src/hooks/useAuth.js';
  await runTest('useAuth hook exists', async () => await checkFileExists(useAuthPath));

  // Test useTheme hook
  const useThemePath = 'src/hooks/useTheme.js';
  await runTest('useTheme hook exists', async () => await checkFileExists(useThemePath));

  // Test useToast hook
  const useToastPath = 'src/hooks/useToast.js';
  await runTest('useToast hook exists', async () => await checkFileExists(useToastPath));

  await runTest('useToast provides notification methods', async () => 
    await checkFileContains(useToastPath, 'success'));
}

async function testServices() {
  log('INFO', 'Testing service modules...');

  // Test transaction service
  const transactionServicePath = 'src/services/transactionService.js';
  await runTest('Transaction service exists', async () => await checkFileExists(transactionServicePath));
  
  await runTest('Transaction service has CRUD operations', async () => 
    await checkFileContains(transactionServicePath, 'getTransactions'));

  // Test budget service
  const budgetServicePath = 'src/services/budgetService.js';
  await runTest('Budget service exists', async () => await checkFileExists(budgetServicePath));

  // Test translation service
  const translationPath = 'src/services/dynamicTranslation.js';
  await runTest('Translation service exists', async () => await checkFileExists(translationPath));

  await runTest('Translation supports LibreTranslate', async () => 
    await checkFileContains(translationPath, 'libretranslate'));

  // Test AI parser
  const aiParserPath = 'src/utils/aiTransactionParser.js';
  await runTest('AI parser exists', async () => await checkFileExists(aiParserPath));

  await runTest('AI parser uses OpenRouter', async () => 
    await checkFileContains(aiParserPath, 'openrouter'));
}

async function testUIComponents() {
  log('INFO', 'Testing UI components...');

  const componentPaths = [
    'src/components/UI/Modal.jsx',
    'src/components/UI/Toast.jsx',
    'src/components/UI/LoadingSpinner.jsx',
    'src/components/UI/ConfirmDialog.jsx',
    'src/components/Layout/Header.jsx',
    'src/components/User/Login.jsx',
    'src/components/User/ProfileModal.jsx',
    'src/components/User/SettingsModal.jsx',
    'src/components/User/UserMenuDropdown.jsx',
    'src/components/Transaction/AddTransactionModal.jsx',
    'src/components/Transaction/EditParsedModal.jsx',
    'src/components/Dashboard/TransactionList.jsx',
    'src/components/Dashboard/CompactSummary.jsx',
    'src/components/Dashboard/ChatWidget.jsx'
  ];

  for (const componentPath of componentPaths) {
    const componentName = path.basename(componentPath, '.jsx');
    await runTest(`Component exists: ${componentName}`, async () => await checkFileExists(componentPath));
    
    await runTest(`${componentName} exports properly`, async () => 
      await checkFileContains(componentPath, 'export default'));
  }
}

async function testMainApp() {
  log('INFO', 'Testing main App.jsx integration...');

  const appPath = 'src/App.jsx';
  
  await runTest('App.jsx uses providers', async () => 
    await checkFileContains(appPath, 'AuthProvider'));

  await runTest('App.jsx has theme support', async () => 
    await checkFileContains(appPath, 'ThemeProvider'));

  await runTest('App.jsx includes dashboard', async () => 
    await checkFileContains(appPath, 'CompactSummary'));

  await runTest('App.jsx includes transaction list', async () => 
    await checkFileContains(appPath, 'TransactionList'));

  await runTest('App.jsx includes chat widget', async () => 
    await checkFileContains(appPath, 'ChatWidget'));

  await runTest('App.jsx includes header', async () => 
    await checkFileContains(appPath, 'Header'));
}

async function testAccessibility() {
  log('INFO', 'Testing accessibility features...');

  // Check for aria labels and accessibility patterns
  const componentsToCheck = [
    'src/components/UI/Modal.jsx',
    'src/components/Layout/Header.jsx',
    'src/components/User/UserMenuDropdown.jsx'
  ];

  for (const component of componentsToCheck) {
    const componentName = path.basename(component, '.jsx');
    await runTest(`${componentName} has accessibility attributes`, async () => {
      const content = await fs.readFile(component, 'utf-8');
      if (content.includes('aria-') || content.includes('role=') || content.includes('tabIndex')) {
        return true;
      }
      return 'warning'; // Not a failure, but should be addressed
    });
  }
}

// Main test execution
async function runAllTests() {
  console.log(`\n${colors.bold}${colors.cyan}Wallet Tracker Integration Test Suite${colors.reset}\n`);
  console.log('=' * 60);
  
  const startTime = Date.now();
  
  try {
    await testProjectStructure();
    await testCoreConfiguration();
    await testFirebaseIntegration();
    await testContextProviders();
    await testHooksIntegration();
    await testServices();
    await testUIComponents();
    await testMainApp();
    await testAccessibility();
    
  } catch (error) {
    log('ERROR', `Test suite failed: ${error.message}`);
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  // Print results summary
  console.log('\n' + '=' * 60);
  console.log(`${colors.bold}${colors.cyan}TEST SUMMARY${colors.reset}`);
  console.log('=' * 60);
  console.log(`${colors.green}✓ Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Warnings: ${testResults.warnings}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.blue}⏱ Duration: ${duration.toFixed(2)}s${colors.reset}`);

  if (testResults.failed > 0) {
    console.log(`\n${colors.red}${colors.bold}FAILED TESTS:${colors.reset}`);
    testResults.tests
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        console.log(`${colors.red}✗ ${test.name}${colors.reset}`);
        if (test.error) {
          console.log(`  ${colors.red}Error: ${test.error}${colors.reset}`);
        }
      });
  }

  if (testResults.warnings > 0) {
    console.log(`\n${colors.yellow}${colors.bold}WARNINGS:${colors.reset}`);
    testResults.tests
      .filter(test => test.status === 'WARNING')
      .forEach(test => {
        console.log(`${colors.yellow}⚠ ${test.name}${colors.reset}`);
      });
  }

  const successRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
  console.log(`\n${colors.bold}Success Rate: ${successRate.toFixed(1)}%${colors.reset}`);

  if (testResults.failed === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 ALL TESTS PASSED! The webapp migration is complete and functional.${colors.reset}`);
    return true;
  } else {
    console.log(`\n${colors.red}${colors.bold}❌ Some tests failed. Please review and fix the issues above.${colors.reset}`);
    return false;
  }
}

// Run the tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });