# Deployment Guide

Simple steps to deploy Wallet Tracker to production.

## Firebase Hosting (Recommended)

### 1. Setup Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project (or use existing)
3. Enable these services:
   - **Authentication** (Email/Password + Google)
   - **Firestore Database** 
   - **Hosting**

### 2. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 3. Initialize Firebase

```bash
# In your project directory
firebase init

# Select:
# - Hosting
# - Use existing project
# - Public directory: dist
# - Single-page app: Yes
# - GitHub deploys: No (for now)
```

### 4. Configure Environment

Create `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
VITE_OPENROUTER_API_KEY=your_openrouter_key
```

### 5. Deploy

```bash
# Build and deploy
npm run build
firebase deploy

# Or use the shortcut
npm run deploy
```

Your app will be live at `https://your-project.web.app`

## Firestore Security Rules

Add these rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /transactions/{transactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Other Hosting Options

### Vercel

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Netlify  

1. Drag `dist/` folder to Netlify
2. Or connect GitHub for auto-deploy
3. Add environment variables in settings

### Manual Static Hosting

1. Run `npm run build`
2. Upload `dist/` folder contents to any web server
3. Configure server for single-page app (redirect all routes to index.html)

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSyC...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID | `wallet-tracker-123` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket | `project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | App ID | `1:123:web:abc123` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `VITE_OPENROUTER_API_KEY` | For AI transaction parsing |

## Security Checklist

- [ ] Firebase security rules enabled
- [ ] API keys restricted to your domain
- [ ] HTTPS enforced
- [ ] Authentication properly configured
- [ ] Environment variables secure

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Firebase Deploy Issues
```bash
# Check Firebase project
firebase projects:list
firebase use your-project-id

# Re-initialize if needed
firebase init hosting
```

### Authentication Not Working
- Check Firebase Auth is enabled
- Verify environment variables
- Check browser console for errors

### Firestore Permission Denied
- Verify security rules are published
- Check user is authenticated
- Ensure rules match your user structure

## Monitoring

After deployment, monitor:

- **Firebase Console**: Authentication, database usage, hosting analytics
- **Browser Console**: JavaScript errors
- **Network Tab**: Failed API calls

## Updates

To update your deployed app:

```bash
# Make your changes
git add .
git commit -m "Update feature"

# Deploy
npm run build
firebase deploy
```

For automatic deployment, set up GitHub Actions or connect your Git repo to your hosting platform.