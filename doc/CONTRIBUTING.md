# Contributing to Wallet Tracker

## Development Setup

```bash
# 1. Fork and clone
git clone your-fork-url
cd Wallet-Tracker

# 2. Install dependencies
npm install

# 3. Create .env.local with Firebase config
cp .env.example .env.local
# Add your Firebase keys

# 4. Start development
npm run dev
```

## Code Standards

- **ESLint**: Run `npm run lint` before committing
- **Components**: Use functional components with hooks
- **Naming**: camelCase for variables, PascalCase for components
- **Imports**: Absolute imports from `src/`

## File Structure

```
src/
├── components/     # React components
├── services/       # API calls and business logic
├── hooks/          # Custom React hooks
├── context/        # State management
├── utils/          # Helper functions
└── config/         # Configuration files
```

## Making Changes

1. **Create branch**: `git checkout -b feature/your-feature`
2. **Make changes**: Follow the coding standards
3. **Test locally**: `npm run dev` and test your changes
4. **Lint code**: `npm run lint` 
5. **Commit**: Use clear commit messages
6. **Push**: `git push origin feature/your-feature`
7. **Pull Request**: Create PR with description

## Pull Request Guidelines

- **Title**: Clear, descriptive title
- **Description**: What changes were made and why
- **Testing**: Describe how you tested the changes
- **Screenshots**: Include for UI changes

## Important Notes

- **Security**: Never commit API keys or sensitive data
- **Encryption**: All sensitive user data must be encrypted client-side
- **Firebase Rules**: Test security rules before deploying
- **Dependencies**: Keep dependencies updated and lightweight

## Getting Help

- **Issues**: Check existing issues first
- **Questions**: Create a discussion
- **Bugs**: Create an issue with reproduction steps

## Development Commands

```bash
npm run dev         # Development server
npm run build       # Production build
npm run lint        # Code linting
npm run deploy      # Deploy to Firebase
```