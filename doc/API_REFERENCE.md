# API Reference

Quick reference for developers working with Smart Wallet's services and hooks.

## Services

### Authentication Service (`authService.js`)

```javascript
import { authService } from 'src/services/authService';

// Sign up new user
await authService.signUp(email, password, displayName);

// Sign in existing user  
await authService.signIn(email, password);

// Sign out current user
await authService.signOut();

// Update user profile
await authService.updateProfile(updates);
```

### Transaction Service (`transactionService.js`)

```javascript
import { transactionService } from 'src/services/transactionService';

// Add new transaction
await transactionService.addTransaction(userId, transactionData);

// Get user transactions
const transactions = await transactionService.getTransactions(userId);

// Update transaction
await transactionService.updateTransaction(userId, transactionId, updates);

// Delete transaction
await transactionService.deleteTransaction(userId, transactionId);
```

### Budget Service (`budgetService.js`)

```javascript
import { budgetService } from 'src/services/budgetService';
# API Reference

This document is a quick reference for developers working with Smart Wallet's services, hooks, and utilities.

> Note: file paths in examples are relative to `src/` (e.g. `src/services/transactionService.js`).

## Services

### Authentication Service (`src/services/authService.js`)

```javascript
import * as authService from 'src/services/authService';

// Sign up new user
await authService.signUp(email, password, displayName);

// Sign in existing user
await authService.signIn(email, password);

// Sign out current user
await authService.signOut();

// Update user profile
await authService.updateProfile(updates);
```

### Transaction Service (`src/services/transactionService.js`)

```javascript
import * as transactionService from 'src/services/transactionService';

// Add new transaction
await transactionService.addTransaction(userId, transactionData);

// Get user transactions
const transactions = await transactionService.getTransactions(userId);

// Update transaction
await transactionService.updateTransaction(userId, transactionId, updates);

// Delete transaction
await transactionService.deleteTransaction(userId, transactionId);
```

### Budget Service (`src/services/budgetService.js`)

```javascript
import * as budgetService from 'src/services/budgetService';

// Set budget for category
await budgetService.setBudget(userId, category, amount);

// Get budget status
const status = await budgetService.getBudgetStatus(userId);
```

## Custom Hooks

### useAuth

```javascript
import { useAuth } from 'src/hooks/useAuth';

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginForm onSignIn={signIn} />;

  return <Dashboard user={user} onSignOut={signOut} />;
}
```

### useTransactions

```javascript
import { useTransactions } from 'src/hooks/useTransactions';

function TransactionList() {
  const {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  return (
    <div>
      {transactions.map((t) => (
        <TransactionItem
          key={t.id}
          transaction={t}
          onUpdate={updateTransaction}
          onDelete={deleteTransaction}
        />
      ))}
    </div>
  );
}
```

### useToast

```javascript
import { useToast } from 'src/hooks/useToast';

function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('Transaction saved!', 'success');
  };

  const handleError = () => {
    showToast('Something went wrong', 'error');
  };
}
```

## Context Providers

### AuthContext

```jsx
import { AuthProvider } from 'src/context/AuthContext';

// Wrap your app
<AuthProvider>
  <App />
</AuthProvider>
```

### TransactionContext

```jsx
import { TransactionProvider } from 'src/context/TransactionContext';

// Provides transaction state
<TransactionProvider>
  <Dashboard />
</TransactionProvider>
```

## Utilities

### Encryption (`src/utils/encryption.js`)

```javascript
import * as enc from 'src/utils/encryption';

// Encrypt sensitive data
const encrypted = await enc.encryptData(someValue);

// Decrypt data
const decrypted = await enc.decryptData(encrypted);
```

### AI Parser (`src/utils/aiTransactionParser.js`)

```javascript
import { parseTransaction } from 'src/utils/aiTransactionParser';

// Parse natural language
const result = await parseTransaction('Spent $50 on groceries');
// Example result: { type: 'expense', amount: 50, category: 'food', description: 'groceries' }
```

### Helpers (`src/utils/helpers.js`)

```javascript
import { formatCurrency, validateEmail } from 'src/utils/helpers';

// Format money
const formatted = formatCurrency(1234.56); // "$1,234.56"

// Validate email
const isValid = validateEmail('user@example.com'); // true
```

## Events

The app uses CustomEvents for cross-component updates:

```javascript
// Listen for transaction events
document.addEventListener('wallet:transaction-added', (event) => {
  console.log('New transaction:', event.detail);
});

document.addEventListener('wallet:balance-updated', (event) => {
  console.log('Balance changed:', event.detail);
});
```

## Firebase Configuration

```javascript
// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Populate from environment (Vite) variables
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

## Common Patterns

### Error Handling

```javascript
try {
  await transactionService.addTransaction(userId, data);
  showToast('Transaction added!', 'success');
} catch (error) {
  console.error('Error:', error);
  showToast('Failed to add transaction', 'error');
}
```

### Loading States

```javascript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await someAsyncOperation();
  } finally {
    setLoading(false);
  }
};
```

### Real-time Subscriptions

```javascript
useEffect(() => {
  if (!user) return;

  const unsubscribe = transactionService.subscribeToTransactions(
    user.uid,
    (transactions) => {
      setTransactions(transactions);
    }
  );

  return unsubscribe;
}, [user]);
```
