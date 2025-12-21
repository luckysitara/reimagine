# Contributing to Reimagine

Thank you for considering contributing to Reimagine! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

1. **Check existing issues** to see if the bug has already been reported
2. **Create a new issue** with a descriptive title
3. **Include details**:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Browser/environment info

### Suggesting Features

1. **Check existing issues** for similar feature requests
2. **Create a new issue** with `[Feature Request]` in the title
3. **Describe the feature**:
   - Use case and benefits
   - Proposed implementation
   - Mockups or examples (if applicable)

### Pull Requests

#### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/reimagine.git
cd reimagine

# Install dependencies
npm install

# Create .env.local with API keys
cp .env.example .env.local

# Start development server
npm run dev
```

#### Making Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write clean, documented code
   - Follow existing code style
   - Add tests if applicable

3. **Test your changes**:
   ```bash
   npm run build
   npm run lint
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```
   
   Use conventional commit messages:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**:
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template
   - Link related issues

#### PR Guidelines

- Keep PRs focused on a single feature or fix
- Write clear PR descriptions
- Update documentation if needed
- Ensure all tests pass
- Respond to review feedback promptly

## Code Style

### TypeScript

- Use TypeScript strict mode
- Add types for all function parameters and returns
- Avoid `any` type unless absolutely necessary

```typescript
// Good
function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

// Bad
function formatPrice(price: any) {
  return `$${price.toFixed(2)}`
}
```

### React Components

- Use functional components with hooks
- Use descriptive component names
- Add JSDoc comments for complex components

```typescript
/**
 * Token search dialog component
 * @param onSelect - Callback when token is selected
 * @param tokens - Available tokens to search
 */
export function TokenSearchDialog({ onSelect, tokens }: Props) {
  // ...
}
```

### Styling

- Use Tailwind CSS utility classes
- Follow existing design patterns
- Use semantic design tokens from `globals.css`

```typescript
// Good
<div className="flex items-center gap-2 rounded-lg bg-background p-4">

// Bad
<div style={{ display: 'flex', padding: '16px' }}>
```

## Project Structure

```
reimagine/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── panels/           # Feature panels
│   └── trading/          # Trading components
├── context/              # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Core utilities
│   ├── services/        # External API services
│   ├── tools/           # AI agent tools
│   └── utils/           # Helper functions
└── public/              # Static assets
```

## Testing

### Unit Tests

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### E2E Tests (Coming Soon)

```bash
# Run Playwright tests
npm run test:e2e
```

## Documentation

- Update README.md for user-facing changes
- Update code comments for implementation details
- Add JSDoc comments for exported functions
- Update API documentation for endpoint changes

## Getting Help

- 💬 **GitHub Discussions** - Ask questions
- 🐛 **GitHub Issues** - Report bugs
- 📧 **Email** - your.email@example.com

## Recognition

Contributors will be:
- Listed in the README.md
- Acknowledged in release notes
- Featured in project documentation

Thank you for contributing to Reimagine! 🚀
