# Deployment Guide

Simple steps to deploy Smart Wallet to production.

## Firebase Hosting (Recommended)

### 1. Setup Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable these services:
   - **Authentication** (Email/Password + Google)
   - **Firestore Database**
   - **Hosting**

### 2. Install Firebase CLI

```powershell
npm install -g firebase-tools
firebase login
```

### 3. Initialize Firebase (if needed)

```powershell
# In your project directory
firebase init

# Choose:
# - Hosting
# - Use existing project
# - Public directory: dist
# - Single-page app: Yes
```

### 4. Configure environment variables

Create `.env.local` (local development) or set env vars in your hosting provider for production:

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

```powershell
# Build and deploy
npm run build
firebase deploy

# Or use the repo shortcut which runs the build first
npm run deploy
```

Your app will be live at `https://<your-project>.web.app` or your configured custom domain.

## Firestore Security Rules

Rules are stored in `firestore.rules` in this repo. To publish them, run:

```powershell
firebase deploy --only firestore:rules
```

If you prefer to edit rules in the Console, you can, but storing rules in the repo enables versioning and CI.

## Other hosting options

### Vercel

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Netlify

1. Connect GitHub repo to Netlify
2. Configure build command: `npm run build` and publish directory `dist`
3. Add environment variables in settings

### Manual static hosting

1. Run `npm run build`
2. Upload `dist/` folder contents to any web server
3. Configure server for single-page app routing (redirect all routes to index.html)

## Environment variables

### Required variables (local & production)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSyC...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID | `smart-wallet-123` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket | `project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | App ID | `1:123:web:abc123` |

### Optional variables

| Variable | Description |
|----------|-------------|
| `VITE_OPENROUTER_API_KEY` | For AI transaction parsing |

## Security checklist

- [ ] Firebase security rules published
- [ ] API keys restricted to your domain
- [ ] HTTPS enforced
- [ ] Authentication properly configured
- [ ] Environment variables secure

## Troubleshooting

### Build fails

```powershell
# Clear cache and rebuild
rimraf node_modules dist
npm install
npm run build
```

### Firebase deploy issues

```powershell
# Check Firebase project and active project
firebase projects:list
firebase use <your-project-id>

# Re-initialize hosting if needed
firebase init hosting
```

### Authentication not working

- Check Firebase Auth is enabled
- Verify environment variables
- Check browser console for errors

### Firestore permission denied

- Verify security rules are published
- Check the user is authenticated
- Ensure rules match your user document structure

## Monitoring

After deployment, monitor:

- **Firebase Console**: Authentication, database usage, hosting analytics
- **Browser Console**: JavaScript errors
- **Network Tab**: Failed API calls

## Updates

To update your deployed app:

```powershell
# Make your changes
git add .
git commit -m "Update feature"

# Deploy
npm run build
firebase deploy
```

For automatic deployment, set up GitHub Actions or connect your Git repo to your hosting platform.
