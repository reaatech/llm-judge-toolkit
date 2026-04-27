# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do not** open a public issue
2. Email the maintainer at: security@reaatech.dev (or open a private security advisory on GitHub)
3. Include:
   - A description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond within 48 hours and will work with you to verify and address the issue before any public disclosure.

## Security Considerations

When using this library:

- **API Keys**: Store provider API keys securely (environment variables, secret managers). Never commit them to version control.
- **Prompt Injection**: Template prompts interpolate user-provided content. Validate and sanitize inputs when evaluating untrusted content.
- **Local Models**: The `LocalProvider` connects to local inference servers. Ensure these are not exposed to untrusted networks.
- **Caching**: Cache backends may store judgment results containing sensitive data. Use appropriate TTLs and access controls for Redis/file caches.
