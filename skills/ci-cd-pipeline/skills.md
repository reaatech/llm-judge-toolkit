# CI/CD Pipeline Skill

## Description
Set up GitHub Actions CI/CD pipelines for automated testing, building, and deployment. This skill creates comprehensive workflows for continuous integration and delivery.

## Capabilities
- Create GitHub Actions workflows
- Set up automated testing on PR and push
- Configure build and publish pipelines
- Implement semantic versioning and changelogs
- Set up npm package publishing
- Configure deployment to various environments
- Implement quality gates and checks
- Set up automated dependency updates

## Invocation
```yaml
skill: ci-cd-pipeline
action: setup-workflow
parameters:
  name: ci
  triggers:
    - push
    - pull_request
  jobs:
    - test
    - lint
    - build
    - publish
```

## Examples

### Full CI/CD Pipeline
```yaml
skill: ci-cd-pipeline
action: create-pipeline
parameters:
  name: ci-cd
  triggers:
    push:
      branches: [main]
    pull_request:
      branches: [main]
  jobs:
    - name: test
      nodeVersions: [20.x, 22.x]
      steps:
        - checkout
        - setup-pnpm
        - install
        - typecheck
        - lint
        - test:coverage
        - build
    - name: publish
      needs: test
      if: github.ref == refs/heads/main
      steps:
        - semantic-release
```

### Create PR with Skill
```yaml
skill: ci-cd-pipeline
action: create-pr
parameters:
  title: "Implement Judgment Engine"
  base: main
  labels: [enhancement, core]
  reviewers: [reaatech]
```

## Generated Code Examples

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x, 22.x]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Type check
        run: pnpm typecheck
      
      - name: Lint
        run: pnpm lint
      
      - name: Format check
        run: pnpm format:check
      
      - name: Test with coverage
        run: pnpm test:coverage
      
      - name: Build
        run: pnpm build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: false

  publish:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm build
      
      - name: Publish to npm
        run: pnpm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Release Workflow
```yaml
# .github/workflows/release.yml
name: Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to release (major, minor, patch)'
        required: true
        default: 'patch'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      
      - name: Configure Git
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm build
      
      - name: Create Release
        run: |
          pnpm version ${{ github.event.inputs.version }}
          git push origin main --tags
          pnpm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Constraints
- Workflows must be efficient and parallelize where possible
- Tests must run on multiple Node.js versions
- Build artifacts must be cached appropriately
- Secrets must be handled securely
- Failed workflows must provide clear error messages

## Best Practices
1. **Matrix Testing**: Test on multiple Node.js versions
2. **Caching**: Cache dependencies to speed up builds
3. **Parallel Jobs**: Run independent jobs in parallel
4. **Quality Gates**: Require tests and linting to pass
5. **Semantic Versioning**: Use semantic versioning for releases
6. **Changelog**: Auto-generate changelogs from commits
7. **Branch Protection**: Protect main branch with required checks
8. **Security**: Scan for vulnerabilities in dependencies

## Related Skills
- `project-setup` - For initial CI/CD configuration
- `test-generation` - For test workflows
- `documentation` - For documenting deployment processes
