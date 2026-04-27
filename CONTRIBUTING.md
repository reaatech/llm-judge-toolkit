# Contributing to LLM Judge Toolkit

Thank you for your interest in contributing to the LLM Judge Toolkit! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 20.x or later
- pnpm 8.x or later
- Git

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub (user: `reaatech`)

2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/reaatech/llm-judge-toolkit.git
   cd llm-judge-toolkit
   ```

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Run the development server**:
   ```bash
   pnpm dev
   ```

## Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions or modifications

### Making Changes

1. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards:
   - Write clean, readable TypeScript
   - Add comprehensive tests
   - Update documentation as needed
   - Follow the existing code structure

3. **Run tests** before committing:
   ```bash
   pnpm test
   pnpm test:coverage
   ```

4. **Check code quality**:
   ```bash
   pnpm lint
   pnpm format:check
   pnpm typecheck
   ```

5. **Commit your changes** using conventional commits:
   ```bash
   git commit -m "feat: add new calibration metric"
   ```

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or modifications
- `chore:` - Maintenance tasks

## Pull Request Process

1. **Ensure all tests pass** and coverage meets our standards (≥90%)

2. **Update documentation** if your changes affect the API or behavior

3. **Add a changelog entry** if your changes are user-facing

4. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub:
   - Base branch: `main`
   - Title: Clear and descriptive
   - Description: Explain your changes and why they're needed
   - Link any related issues

6. **Request review** from maintainers (especially `@reaatech`)

7. **Address feedback** and update your PR as needed

## Code Standards

### TypeScript

- Use strict mode (`"strict": true` in tsconfig.json)
- Prefer interfaces over type aliases for object shapes
- Use proper type annotations (avoid `any`)
- Export only public API surface

### Testing

- Write tests for all new features and bug fixes
- Maintain ≥90% code coverage
- Use descriptive test names
- Test both happy paths and error cases
- Mock external dependencies

### Documentation

- Document all public APIs with JSDoc comments
- Include examples for complex functionality
- Keep README and documentation up to date
- Add inline comments for non-obvious code

### Code Style

- Use Prettier for formatting
- Follow ESLint rules
- Use 2-space indentation
- Prefer single quotes for strings
- Use trailing commas in multi-line objects

## Types of Contributions We Welcome

### New Features

- New evaluation criteria templates
- Additional LLM provider integrations
- Calibration metrics and analysis tools
- Bias detection and mitigation strategies
- Cost optimization features

### Bug Fixes

- Any bugs you encounter while using the library
- Issues with documentation or examples
- Performance improvements

### Documentation

- Improving existing documentation
- Adding new examples and tutorials
- Translating documentation to other languages

### Testing

- Adding new test cases
- Improving test coverage
- Adding integration tests

## Reporting Issues

### Bug Reports

When reporting a bug, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Environment details (Node.js version, OS, etc.)
- Code snippets or error messages
- Any relevant logs

### Feature Requests

When requesting a feature, please include:

- A clear description of the feature
- Use case and motivation
- Proposed implementation (if you have ideas)
- Any relevant examples or references

## Code of Conduct

Please be respectful and constructive in all interactions. We are committed to providing a welcoming and inclusive experience for everyone.

## Questions?

If you have questions, please:

- Check the [documentation](../README.md)
- Search existing [issues](https://github.com/reaatech/llm-judge-toolkit/issues)
- Open a new [discussion](https://github.com/reaatech/llm-judge-toolkit/discussions)

## Legal

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

---

Thank you for contributing to the LLM Judge Toolkit! 🎉
