# 💰 Wallet Tracker - Smart Personal Finance Manager

A comprehensive React-based personal finance application with intelligent transaction parsing and real-time balance tracking. Built with modern web technologies and Firebase backend.

## ✨ Features

- 🤖 **Smart Chat Interface** - Natural language transaction input with intelligent parsing
- � **Real-time Balance Updates** - Dynamic balance calculation with transaction edits
- 📊 **Interactive Dashboard** - Comprehensive spending analytics and transaction history
- 🏷️ **Intelligent Categorization** - Automatic expense/income detection with emoji icons
- ✏️ **Live Transaction Editing** - Edit transactions with automatic balance recalculation
- 🎨 **Modern UI/UX** - Beautiful gradient design with dark/light theme support
- 🔐 **Secure Authentication** - Email/Password and Google Sign-in with Firebase Auth
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- 🗂️ **User Management** - Complete profile management with settings and preferences
- 🔒 **Account Security** - Re-authentication for sensitive operations like account deletion
- 📤 **Data Export** - Export all your financial data in JSON format
- 🗃️ **Transaction Management** - Full CRUD operations with transaction history

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Firebase Account (free)

### Installation

1. **Clone and Install**

   ```bash
   git clone <your-repo>
   cd wallet-app
   npm install
   ```

2. **Firebase Setup**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password + Google)
   - Create Firestore Database
   - Copy your Firebase config

3. **Environment Setup**
   - Rename `.env.example` to `.env`
   - Add your Firebase configuration:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the App**

   ```bash
   npm run dev
   ```

## 🎯 How to Use

### Smart Chat Interface

The intelligent chat interface parses natural language for transaction entry. Simply describe your transaction in plain English:

**💸 Expense Examples:**

- "I bought groceries for 500 taka today"
- "Paid electricity bill 2000 BDT"
- "Movie tickets cost 350 last night"
- "Ordered pizza for 800"
- "Uber ride 200 BDT"

**💰 Income Examples:**

- "Received salary 50000"
- "Got paid 3000 for freelance work"
- "Earned bonus 5000"
- "Sold old phone for 15000"

### Key Features

- **Real-time Balance Updates**: Your balance updates instantly when you add, edit, or delete transactions
- **Transaction Editing**: Click any transaction to edit amount, category, or description
- **Smart Categorization**: Automatically detects and categorizes expenses (Food, Transport, Bills, etc.)
- **Account Management**: Complete user profile with settings, data export, and secure account deletion
- **Re-authentication Security**: Sensitive operations require password confirmation for security

### Categories

The app automatically categorizes transactions:

- 🍔 Food (groceries, restaurant, meals)
- 🚗 Transport (uber, taxi, fuel)
- 🎬 Entertainment (movies, games)
- 🛍️ Shopping (clothes, online purchases)
- 📄 Bills (electricity, internet, rent)
- 🏥 Health (doctor, medicine)
- 📚 Education (books, courses)
- 💼 Salary & 💻 Freelance (income)

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS with custom gradients
- **Icons:** Lucide React for modern iconography
- **Backend:** Firebase (Authentication + Firestore Database)
- **State Management:** React Context API with custom hooks
- **UI Components:** Custom modal system with toast notifications
- **Transaction Parsing:** Intelligent regex-based natural language processing
- **Security:** Firebase Auth with re-authentication for sensitive operations
- **Real-time Updates:** Firestore listeners with automatic balance calculation

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/           # Authentication components
│   │   └── Login.jsx
│   ├── Chat/           # Interactive chat interface
│   │   └── ChatWidget.jsx
│   ├── Dashboard/      # Main dashboard components
│   │   ├── Dashboard.jsx
│   │   └── TransactionList.jsx
│   └── User/           # User management components
│       └── SettingsModal.jsx
├── config/
│   └── firebase.js     # Firebase configuration
├── context/
│   └── AuthContext.jsx # Authentication context with user state
├── hooks/
│   └── useAuth.js      # Custom authentication hook
├── services/
│   ├── authService.js      # Authentication & user management
│   └── transactionService.js # Transaction CRUD operations
├── utils/
│   ├── transactionParser.js # Natural language transaction parsing
│   └── helpers.js           # Utility functions
├── App.jsx             # Main application component
└── main.jsx            # Application entry point
```

## 🔐 Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own profile and transactions
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to read/write their own transactions
      match /transactions/{transactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Alternative structure for transactions at root level
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## 🎨 Customization

### Adding New Categories

Edit `src/utils/transactionParser.js`:

```javascript
const categoryKeywords = {
  yourCategory: ['keyword1', 'keyword2', 'keyword3'],
  // ... existing categories
};
```

### Styling

The app uses Tailwind CSS. Customize colors and themes in `tailwind.config.js`.

## 🐛 Troubleshooting

1. **Firebase Authentication Issues**
   - Verify Firebase config in `src/config/firebase.js`
   - Check Firebase console for enabled auth providers
   - Ensure Firestore security rules are properly configured

2. **Balance Not Updating**
   - Check browser console for transaction service errors
   - Verify user profile refresh is working correctly
   - Ensure proper userId is passed to transaction operations

3. **Transaction Parsing Issues**
   - Check `transactionParser.js` for keyword matches
   - Verify regex patterns are working for your input format
   - Browser console will show parsing results for debugging

4. **Account Deletion Problems**
   - Recent login required for account deletion (Firebase security)
   - Use re-authentication dialog if prompted
   - Check Firebase Auth error messages in console

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📊 Current Status

✅ **Fully Functional Features:**

- User authentication (email/password, Google sign-in)
- Real-time transaction management with live balance updates
- Interactive chat interface for transaction entry
- Transaction editing with automatic balance recalculation
- Secure account management with re-authentication
- Data export functionality
- Responsive UI with modern design

## 🔗 Links

- **Repository**: [GitHub Repository](https://github.com/HadiuzzamanBappy/Wallet-Tracker)
- **Demo**: Deploy to see it in action!

## 💡 Future Enhancements

- [ ] Dark/Light theme toggle
- [ ] Transaction analytics and charts
- [ ] Budget planning and alerts
- [ ] Receipt photo uploads
- [ ] Multi-currency support
- [ ] Export to CSV/PDF formats

---

Made using React, Firebase, and intelligent transaction parsing
