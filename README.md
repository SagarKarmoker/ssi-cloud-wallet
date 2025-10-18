
# SSI Cloud Wallet

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-Framework-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Language-blue)](https://www.typescriptlang.org/)

> A production-ready NestJS microservice implementing a server-side cloud wallet for Self-Sovereign Identity (SSI) workflows, providing secure wallet management and credential lifecycle operations.

## Overview

The SSI Cloud Wallet is an enterprise-grade microservice designed to facilitate Self-Sovereign Identity operations through a RESTful API. Built on the robust NestJS framework, it provides secure wallet creation, management, and webhook-based event handling for credential issuance and verification workflows.

### Key Features

- **Wallet Management**: Complete CRUD operations for SSI wallets
- **Credential Operations**: Support for credential issuance and verification
- **Webhook Integration**: Real-time event processing for asynchronous operations
- **Enterprise Security**: Production-ready security practices and error handling
- **Scalable Architecture**: Modular design following NestJS best practices
- **Comprehensive Testing**: Unit and end-to-end test coverage

### Architecture

```
src/
├── main.ts                    # Application entry point
├── app.module.ts             # Root application module
├── app.controller.ts         # Health check endpoints
├── app.service.ts           # Core application services
├── wallet/                  # Wallet management module
│   ├── wallet.controller.ts # Wallet API endpoints
│   ├── wallet.service.ts    # Business logic layer
│   ├── wallet.module.ts     # Module configuration
│   └── *.spec.ts           # Unit tests
├── webhook/                 # Webhook handling module
│   ├── webhook.controller.ts # Webhook endpoints
│   ├── webhook.service.ts   # Event processing logic
│   └── webhook.module.ts    # Module configuration
└── utils/
    └── axiosInstance.ts     # HTTP client configuration
```

## Prerequisites

- **Node.js**: Version 16.x or higher (LTS recommended)
- **npm**: Version 8.x or higher (or Yarn 1.22+)
- **ACA-Py Agent**: Compatible Aries Cloud Agent Python instance
- **Docker**: Optional, for containerized deployment

Verify your environment:

```bash
node --version
npm --version
```

## Quick Start

### Installation

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/SagarKarmoker/ssi-cloud-wallet.git
cd ssi-cloud-wallet
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:

```bash
npm run start:dev
```

The service will be available at [http://localhost:3000](http://localhost:3000).

### Verification

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

## API Endpoints

### Wallet Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/wallet/create` | Create a new wallet |
| `GET` | `/api/wallet/:id` | Retrieve wallet details |
| `POST` | `/api/wallet/:id/token` | Generate authentication token |

### Webhook Handlers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhooks/*` | Process SSI event notifications |

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run production build |
| `npm run start:dev` | Start with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run test` | Execute unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Generate test coverage |
| `npm run lint` | Lint source code |

### Project Structure

The application follows NestJS architectural patterns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic and external integrations
- **Modules**: Organize related functionality
- **Utils**: Shared utilities and configurations

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# ACA-Py Agent Configuration
ACAPY_ADMIN_URL=http://localhost:8021

# Webhook Configuration
WALLET_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/api/webhooks

# Optional: Database and External Services
DATABASE_URL=postgresql://user:pass@localhost:5432/ssi_wallet
REDIS_URL=redis://localhost:6379
```

### Security Considerations

- **Never commit** `.env` files or sensitive credentials to version control
- Use environment-specific configuration files for different deployment stages
- Implement proper secret management in production environments
- Enable HTTPS for all external communications
- Validate and sanitize all webhook payloads

## Testing

### Running Tests

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode for development
npm run test:watch
```

### Test Structure

- **Unit Tests**: Located alongside source files (`*.spec.ts`)
- **E2E Tests**: Located in the `test/` directory
- **Mocking**: External services should be mocked for isolated testing

## Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
EXPOSE 3000

CMD ["node", "dist/main"]
```

### Environment-Specific Deployment

- **Development**: Use `npm run start:dev` with hot reload
- **Staging**: Deploy with `NODE_ENV=staging` and staging configurations
- **Production**: Use compiled build with `NODE_ENV=production`

## Monitoring and Observability

### Health Checks

The service exposes health check endpoints for monitoring:

```bash
GET /health        # Application health status
GET /health/ready  # Readiness probe
GET /health/live   # Liveness probe
```

### Logging

- Structured logging using NestJS Logger
- Configurable log levels per environment
- Request/response logging for debugging
- Error tracking with stack traces

## Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow project linting rules
- **Prettier**: Code formatting consistency
- **Testing**: Maintain >80% test coverage
- **Documentation**: Update README and inline docs

### Pull Request Guidelines

- Provide clear description of changes
- Include test coverage for new features
- Ensure all CI checks pass
- Link related issues or documentation
- Request review from maintainers

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9
```

#### ACA-Py Connection Issues

- Verify `ACAPY_ADMIN_URL` is correct
- Ensure ACA-Py agent is running and accessible
- Check network connectivity and firewall settings

#### Webhook Delivery Failures

- Validate `WALLET_WEBHOOK_URL` is publicly accessible
- Check webhook endpoint availability
- Review webhook payload format and authentication

### Debug Mode

Enable debug logging:

```bash
DEBUG=* npm run start:dev
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- **Email**: [sagarkarmoker.official@gmail.com](mailto:sagarkarmoker.official@gmail.com)
- **Issues**: [GitHub Issues](https://github.com/SagarKarmoker/ssi-cloud-wallet/issues)
- **Documentation**: [Project Wiki](https://github.com/SagarKarmoker/ssi-cloud-wallet/wiki)

---

**Maintainer**: Sagar Karmoker  
**Last Updated**: October 2025