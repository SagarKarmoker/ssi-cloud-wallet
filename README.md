
# ssi-cloud-wallet

A small, opinionated NestJS service that implements a server-side cloud wallet for SSI (Self-Sovereign Identity) workflows. This repository provides API endpoints to create and manage wallet actions and to receive webhooks related to credential issuance and verification.

This README gives an overview of the project, how to run it locally, available scripts, configuration notes, testing guidance, and pointers for contributors.

## Contents

- `src/` - application source code
	- `main.ts` - app entrypoint
	- `app.module.ts`, `app.controller.ts`, `app.service.ts` - core application scaffold
	- `wallet/` - wallet-related controller, module, and service
	- `webhook/` - webhook handling controller, module, and service
	- `utils/axiosIntance.ts` - shared axios instance for external HTTP calls
- `test/` - end-to-end tests
- `package.json`, `tsconfig.json` - project configuration

## Features

- Basic NestJS HTTP APIs for wallet operations
- Webhook endpoint(s) for receiving asynchronous events
- Structured project with unit and e2e test scaffolding

## Prerequisites

- Node.js 16+ (LTS recommended)
- npm or Yarn
- (Optional) Docker for running dependent services

Verify Node.js is available:

```bash
node -v
npm -v
```

## Quickstart

1. Install dependencies

```bash
npm install
```

2. Start the app in development mode

```bash
npm run start:dev
```

The server will start on the port configured in the application (default NestJS is 3000). Visit http://localhost:3000/ to verify it's running.

## Available npm scripts

These scripts are defined in `package.json` (common defaults for NestJS projects):

- `start` - Run compiled production build
- `start:dev` - Run in watch mode with ts-node (development)
- `build` - Compile TypeScript
- `test` - Run unit tests
- `test:e2e` - Run end-to-end tests
- `lint` - Lint the project

Run a script example:

```bash
npm run test:e2e
```

## Configuration and Environment

The application may read configuration from environment variables or a config file depending on how it's wired in `src/` (check `app.module.ts` and `main.ts`). Typical environment variables to consider adding in a `.env` file:

- PORT - HTTP server port
- NODE_ENV - development | production
- Any wallet/agent keys, external service URLs, or credentials used by `utils/axiosIntance.ts` or wallet/webhook services

Create a `.env` at the project root for local development and add it to `.gitignore` to avoid committing secrets.

## Project structure notes

- `wallet/` exposes the wallet API endpoints. See `wallet.controller.ts` and `wallet.service.ts` for implementation details.
- `webhook/` handles incoming webhooks. Review `webhook.controller.ts` for routes and payload handling.
- `utils/axiosIntance.ts` contains a preconfigured Axios instance used for outgoing HTTP calls — inspect it before providing production credentials or URLs.

## Testing

This repository includes unit and e2e test files (example: `test/app.e2e-spec.ts`, controller spec files under `src/`). To run tests:

```bash
npm test
npm run test:e2e
```

Tips:

- Run tests in watch mode during development where useful.
- If tests depend on external services (agents/ledger), consider mocking network calls or run test containers locally.

## Linting and Formatting

Run the project's linter to keep consistent code style:

```bash
npm run lint
```

Consider adding Prettier or Husky pre-commit hooks for consistent formatting and linting on commit.

## Deployment

Build the app for production and run the output with Node.js:

```bash
npm run build
npm start
```

Containerization: a small Dockerfile can be added to build a production image. Example steps:

- Build inside a Node image, copy compiled `dist/`, and run `node dist/main.js`.

## Security

- Never commit private keys, agent secrets, or sensitive environment files. Use a secrets manager in production.
- Validate and sanitize incoming webhook payloads.
- Use HTTPS and strong authentication for any external calls or admin APIs.

## Contributing

1. Fork the repository and create a feature branch.
2. Run tests and lint before submitting a pull request.
3. Provide clear PR descriptions and link related issues.

If you'd like help prioritizing work, open an issue describing the change and include reproducible steps and desired behavior.

## Troubleshooting

- If the server doesn't start, check that the configured `PORT` isn't in use.
- If tests fail due to network timeouts, ensure mocked services or local test fixtures are running.

## Contact / Authors

Maintainership and contact information aren't included in the repository. If this is your project, add the maintainer contact or organization details here.

---

If you'd like, I can:

- Add a simple `.env.example` with common variables
- Add a Dockerfile and docker-compose for local development
- Generate API documentation (OpenAPI/Swagger) wiring in `main.ts`

Tell me which of the above you'd like next and I'll implement it.
