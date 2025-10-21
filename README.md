
# SSI Cloud Wallet

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-Framework-red)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Language-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-teal)](https://www.prisma.io/)

> A full-stack Self-Sovereign Identity (SSI) wallet system with a NestJS backend and React frontend, enabling users to manage decentralized digital identities, issue and receive verifiable credentials, establish connections, and present proofs of claims.

## 🌟 What is SSI Cloud Wallet?

SSI Cloud Wallet is a complete digital identity management system that puts **you** in control of your personal data. Unlike traditional systems where companies store your information, SSI (Self-Sovereign Identity) lets you:

- **Own Your Identity**: Create and manage your digital identity without relying on any central authority
- **Control Your Data**: Decide what information to share and with whom
- **Receive Credentials**: Get verifiable digital credentials (like a digital driver's license or degree certificate)
- **Prove Claims**: Share proof of your credentials without revealing unnecessary information
- **Establish Trust**: Connect with other people and organizations securely

### 🎯 Real-World Example

Imagine you need to prove you're over 18 to access a service:
1. **Traditional Way**: Show your entire driver's license (revealing name, address, date of birth, license number, etc.)
2. **SSI Way**: Share a cryptographic proof that you're over 18, without revealing your exact age, name, or any other information

### Key Features

**🔐 Identity Management**
- Create and manage multiple digital wallets
- Generate unique DIDs (Decentralized Identifiers)
- Secure wallet authentication with JWT tokens

**🤝 Connection Management**
- Establish secure peer-to-peer connections
- Send and receive connection invitations
- Manage your network of trusted connections

**📜 Credential Lifecycle**
- Receive credential offers from issuers
- Accept and store verifiable credentials
- View all your stored credentials
- Real-time credential status updates

**✅ Proof Presentations**
- Receive proof requests from verifiers
- Automatically match credentials to proof requirements
- Send selective disclosure proofs
- Accept or decline proof requests
- Track proof verification status

**🎨 User-Friendly Interface**
- Modern React dashboard
- Real-time updates and notifications
- Intuitive navigation between wallets, connections, credentials, and proofs
- Detailed debugging and logging

### Architecture

This is a **full-stack application** with two main components:

#### Backend (NestJS + Prisma + PostgreSQL)
The backend handles all wallet operations and communicates with ACA-Py (Aries Cloud Agent Python):

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root application module
├── wallet/                          # Wallet management
│   ├── wallet.controller.ts         # Wallet API endpoints
│   ├── wallet.service.ts            # Create wallets, generate tokens
│   └── dto/createWallet.dto.ts      # Data validation
├── connection/                      # Connection management
│   ├── connection.controller.ts     # Connection API endpoints
│   ├── connection.service.ts        # Create invitations, accept connections
│   └── dto/acceptInvite.dto.ts      # Data validation
├── credential/                      # Credential management
│   ├── credential.controller.ts     # Credential API endpoints
│   ├── credential.service.ts        # Issue & receive credentials
│   └── dto/wallet.dto.ts            # Data validation
├── proof/                           # Proof presentation
│   ├── proof.controller.ts          # Proof API endpoints
│   ├── proof.service.ts             # Send & verify proofs
│   └── dto/*.dto.ts                 # Data validation
├── webhook/                         # Real-time event handling
│   ├── webhook.controller.ts        # Webhook endpoints
│   └── webhook.service.ts           # Process ACA-Py events
└── utils/
    └── axiosInstance.ts             # HTTP client configuration

prisma/
└── schema.prisma                    # Database schema definition
```

#### Frontend (React + TypeScript + TailwindCSS)
A modern, responsive web interface for interacting with your SSI wallet:

```
frontend/src/
├── main.tsx                         # Application entry point
├── App.tsx                          # Root component with routing
├── pages/                           # Main application pages
│   ├── WalletPage.tsx               # Wallet creation & management
│   ├── ConnectionPage.tsx           # Manage connections
│   ├── CredentialPage.tsx           # View & manage credentials
│   ├── ProofPage.tsx                # Handle proof requests
│   └── DashboardLayout.tsx          # Main layout wrapper
├── services/                        # API communication
│   ├── walletService.ts             # Wallet API calls
│   ├── connectionService.ts         # Connection API calls
│   ├── credentialService.ts         # Credential API calls
│   └── proofService.ts              # Proof API calls
└── components/                      # Reusable UI components
    ├── ui/Button.tsx
    ├── ui/Card.tsx
    ├── ui/Alert.tsx
    └── ui/Loading.tsx
```

#### How It All Works Together

1. **Frontend** → Makes API requests to the **Backend**
2. **Backend** → Communicates with **ACA-Py** (the SSI agent)
3. **ACA-Py** → Handles cryptographic operations and blockchain interactions
4. **ACA-Py** → Sends real-time updates back to the **Backend** via webhooks
5. **Backend** → Stores data in **PostgreSQL** via **Prisma**
6. **Frontend** → Polls or receives updates to show the latest state

## Prerequisites

Before you start, make sure you have these installed:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **npm**: Version 9.x or higher (comes with Node.js)
- **PostgreSQL**: Database server ([Download](https://www.postgresql.org/download/))
- **Docker & Docker Compose**: For running ACA-Py agent ([Download](https://www.docker.com/))
- **Git**: For cloning the repository

Verify your installations:

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
docker --version  # Should show Docker version
psql --version    # Should show PostgreSQL version
```

## 🚀 Quick Start Guide

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/SagarKarmoker/ssi-cloud-wallet.git
cd ssi-cloud-wallet

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Set Up the Database

1. Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ssi_wallet;
\q
```

2. Configure the database connection:

Create a `.env` file in the project root:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/ssi_wallet"

# Server Configuration
PORT=5001

# ACA-Py Agent Configuration
ACAPY_ADMIN_URL=http://localhost:8031

# Webhook Configuration (you'll set this up later with ngrok)
WALLET_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/api/webhooks
```

3. Run database migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

### Step 3: Start ACA-Py Agent with Docker

The ACA-Py agent is the core SSI engine. Start it using Docker Compose:

```bash
# Make sure Docker Desktop is running first

# Start ACA-Py in the background
docker-compose up -d

# Check if it's running
docker ps
```

You should see the ACA-Py container running on port 8031.

### Step 4: Set Up Webhook URL (for Development)

ACA-Py needs to send real-time events to your backend. Since you're running locally, use ngrok to expose your server:

```bash
# Install ngrok (if you haven't already)
# Download from https://ngrok.com/download

# Start ngrok on port 5001 (your backend port)
ngrok http 5001
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and update your `.env` file:

```bash
WALLET_WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks
```

### Step 5: Start the Backend Server

```bash
# Development mode with hot reload
npm run start:dev
```

The backend will be available at [http://localhost:5001](http://localhost:5001).

### Step 6: Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173).

### Step 7: Verify Everything is Working

1. **Backend Health Check**: Visit [http://localhost:5001/health](http://localhost:5001/health)
2. **Frontend**: Visit [http://localhost:5173](http://localhost:5173)
3. **ACA-Py Admin**: Visit [http://localhost:8031](http://localhost:8031)
4. **Database**: Run `npx prisma studio` to view your database

🎉 **You're all set!** You can now create wallets, establish connections, and manage credentials!

## 📖 How to Use the SSI Cloud Wallet

### Creating Your First Wallet

1. Open [http://localhost:5173](http://localhost:5173)
2. Navigate to **"Wallets"** in the sidebar
3. Click **"Create New Wallet"**
4. Enter a wallet name (e.g., "My Personal Wallet")
5. Click **"Create Wallet"**
6. Your wallet is created! You'll see:
   - Wallet ID
   - DID (Decentralized Identifier)
   - Verification Key

### Establishing a Connection

To receive credentials or proof requests, you need to connect with other agents:

1. Navigate to **"Connections"**
2. Click **"Create Invitation"**
3. Copy the invitation URL or QR code
4. Share it with another SSI agent
5. When they accept, you'll see the connection in "Active Connections"

**Or accept an invitation:**
1. Click **"Accept Invitation"**
2. Paste the invitation URL
3. The connection will be established automatically

### Receiving and Managing Credentials

When someone sends you a credential offer:

1. Navigate to **"Credentials"**
2. You'll see the credential offer in the "Offers" section
3. Click **"Accept"** to receive the credential
4. Once accepted, it will appear in "Stored Credentials"
5. Click **"View Details"** to see the credential attributes

### Handling Proof Requests

When a verifier requests proof of your credentials:

1. Navigate to **"Proof Requests"**
2. You'll see incoming proof requests in the "Received Requests" tab
3. Click **"Send Proof"** to automatically:
   - Match your stored credentials to the request
   - Build the proof presentation
   - Send it to the verifier
4. Or click **"Decline"** to reject the request
5. Track verification status in real-time

The system automatically:
- Finds matching credentials in your wallet
- Checks if you have the required attributes
- Builds the cryptographic proof
- Sends it securely to the verifier

## 🔌 API Endpoints

### Wallet Management

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `POST` | `/api/wallet/create` | Create a new wallet | `{ "walletName": "string" }` |
| `GET` | `/api/wallet` | Get all wallets | - |
| `GET` | `/api/wallet/:id` | Get wallet by ID | - |
| `GET` | `/api/wallet/:id/did` | Get wallet DID | - |
| `POST` | `/api/wallet/:id/token` | Generate auth token | - |

### Connection Management

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `POST` | `/api/connection/:walletId/create-invitation` | Create connection invitation | - |
| `POST` | `/api/connection/:walletId/accept-invitation` | Accept connection invitation | `{ "invitationUrl": "string" }` |
| `GET` | `/api/connection/:walletId/connections` | Get all connections | - |

### Credential Operations

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/credential/:walletId/exchanges` | Get credential exchanges | - |
| `GET` | `/api/credential/:walletId/credentials` | Get stored credentials | - |
| `POST` | `/api/credential/:walletId/exchange/:exchangeId/send-request` | Accept credential offer | - |
| `POST` | `/api/credential/:walletId/exchange/:exchangeId/store` | Store credential | - |

### Proof Presentations

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/proof/:walletId/presentation-exchanges` | Get all proof requests | - |
| `GET` | `/api/proof/:walletId/presentation-exchange/:presExId` | Get specific proof request | - |
| `GET` | `/api/proof/:walletId/presentation-exchange/:presExId/credentials` | Get matching credentials | - |
| `POST` | `/api/proof/:walletId/presentation-exchange/:presExId/send-presentation` | Send proof presentation | `{ "indy": {...} }` |
| `POST` | `/api/proof/:walletId/presentation-exchange/:presExId/problem-report` | Decline proof request | `{ "description": "string" }` |

## 🛠️ Development

### Available Scripts

#### Backend

| Command | Description |
|---------|-------------|
| `npm start` | Run production build |
| `npm run start:dev` | Start with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run test` | Execute unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Lint source code |

#### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint source code |

#### Database

| Command | Description |
|---------|-------------|
| `npx prisma migrate dev` | Create and apply migrations |
| `npx prisma studio` | Open database GUI |
| `npx prisma generate` | Generate Prisma Client |

### Project Structure Explained

**Backend (NestJS)**
- **Controllers**: Handle HTTP requests, validate input, return responses
- **Services**: Contain business logic, communicate with ACA-Py
- **DTOs**: Define data structures and validation rules
- **Modules**: Group related controllers and services

**Frontend (React)**
- **Pages**: Full-page components for each section
- **Services**: API communication layer
- **Components**: Reusable UI elements
- **Types**: TypeScript interfaces and types

### Understanding the SSI Flow

#### 1. Credential Issuance Flow
```
Issuer → Offers Credential → Holder Accepts → Credential Stored
```
1. Issuer creates a credential offer
2. Offer appears in holder's wallet
3. Holder accepts the offer
4. Credential is cryptographically signed and stored

#### 2. Proof Presentation Flow
```
Verifier → Requests Proof → Holder Sends Proof → Verifier Validates
```
1. Verifier sends a proof request (e.g., "Prove you're over 18")
2. Holder's wallet finds matching credentials
3. Wallet creates zero-knowledge proof
4. Verifier cryptographically validates the proof

#### 3. Connection Flow
```
Agent A → Creates Invitation → Agent B Accepts → Connection Established
```
1. One agent creates an invitation (URL or QR code)
2. Other agent scans/accepts the invitation
3. DIDComm protocol establishes secure connection
4. Agents can now exchange credentials and proofs

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root with these variables:

```bash
# ========================================
# Database Configuration
# ========================================
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/ssi_wallet"

# ========================================
# Server Configuration
# ========================================
PORT=5001
NODE_ENV=development

# ========================================
# ACA-Py Agent Configuration
# ========================================
ACAPY_ADMIN_URL=http://localhost:8031

# ========================================
# Webhook Configuration
# ========================================
# Use ngrok URL for local development
WALLET_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/api/webhooks

# For production, use your actual domain
# WALLET_WEBHOOK_URL=https://api.yourdomain.com/api/webhooks
```

### Frontend Configuration

Create `frontend/.env` file:

```bash
# Backend API URL
VITE_API_URL=http://localhost:5001
```

### Security Best Practices

⚠️ **Important Security Notes:**

- **Never commit** `.env` files to version control
- Use strong, unique passwords for PostgreSQL
- In production, use environment-specific secrets management (AWS Secrets Manager, Azure Key Vault, etc.)
- Enable HTTPS for all external communications
- Rotate authentication tokens regularly
- Validate and sanitize all webhook payloads
- Use rate limiting on API endpoints
- Keep ACA-Py and dependencies updated

## 🧪 Testing

### Running Tests

#### Backend Tests

```bash
# Unit tests
npm run test

# Watch mode for development
npm run test:watch

# Test coverage
npm run test:cov

# End-to-end tests
npm run test:e2e
```

#### Frontend Tests

```bash
cd frontend

# Run tests
npm run test
```

### Test Structure

**Backend Tests**
- **Unit Tests**: Located alongside source files (`*.spec.ts`)
- **E2E Tests**: Located in `test/` directory
- **Mock Data**: External services (ACA-Py) are mocked

**What We Test**
- Wallet creation and management
- Connection establishment flows
- Credential issuance and storage
- Proof request handling
- Webhook event processing
- API endpoint validation

## 🚀 Deployment

### Production Build

#### Backend

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

#### Frontend

```bash
cd frontend

# Build for production
npm run build

# The build output will be in frontend/dist
```

### Docker Deployment

Create a `Dockerfile` for the backend:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 5001

CMD ["npm", "run", "start:prod"]
```

Build and run:

```bash
# Build the image
docker build -t ssi-cloud-wallet-backend .

# Run the container
docker run -p 5001:5001 \
  -e DATABASE_URL="postgresql://user:pass@host/db" \
  -e ACAPY_ADMIN_URL="http://acapy:8031" \
  ssi-cloud-wallet-backend
```

### Environment-Specific Deployment

**Development**
- Use `npm run start:dev` with hot reload
- Enable detailed logging
- Use ngrok for webhook URLs

**Staging**
- Deploy with `NODE_ENV=staging`
- Use staging database
- Test with staging ACA-Py instance

**Production**
- Use compiled build with `NODE_ENV=production`
- Enable HTTPS
- Use production-grade database (managed PostgreSQL)
- Implement proper monitoring and logging
- Use secrets management service
- Set up load balancer
- Enable automatic backups

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

## 🐛 Troubleshooting

### Common Issues and Solutions

#### ❌ Port Already in Use

**Problem**: Backend fails to start with "Port 5001 already in use"

**Solution**:
```bash
# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess | Stop-Process

# macOS/Linux
lsof -ti:5001 | xargs kill -9
```

#### ❌ Database Connection Failed

**Problem**: "Cannot connect to database"

**Solutions**:
1. Verify PostgreSQL is running:
   ```bash
   # Check PostgreSQL status
   pg_isready
   
   # Start PostgreSQL (if stopped)
   # Windows: Start PostgreSQL service in Services app
   # macOS: brew services start postgresql
   # Linux: sudo systemctl start postgresql
   ```

2. Check your `DATABASE_URL` in `.env`
3. Verify database exists: `psql -U postgres -l`
4. Run migrations: `npx prisma migrate dev`

#### ❌ ACA-Py Connection Issues

**Problem**: Backend can't connect to ACA-Py

**Solutions**:
1. Verify Docker is running: `docker ps`
2. Check ACA-Py container status: `docker-compose ps`
3. Restart ACA-Py: `docker-compose restart`
4. Check ACA-Py logs: `docker-compose logs -f`
5. Verify `ACAPY_ADMIN_URL` in `.env` matches container port

#### ❌ Webhook Delivery Failures

**Problem**: Webhooks not being received

**Solutions**:
1. Check if ngrok is running: `ngrok http 5001`
2. Update `WALLET_WEBHOOK_URL` in `.env` with current ngrok URL
3. Restart backend after updating webhook URL
4. Test webhook endpoint: `curl https://your-ngrok-url.ngrok.io/api/webhooks/connections`

#### ❌ Frontend Can't Connect to Backend

**Problem**: API requests failing in frontend

**Solutions**:
1. Verify backend is running on port 5001
2. Check `VITE_API_URL` in `frontend/.env`
3. Check browser console for CORS errors
4. Verify backend health: `curl http://localhost:5001/health`

#### ❌ Prisma Migration Errors

**Problem**: Migration fails or database out of sync

**Solutions**:
```bash
# Reset database (⚠️ will delete all data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate dev
```

#### ❌ "No Matching Credentials" Error

**Problem**: Can't send proof even though you have credentials

**Possible Causes**:
1. Credential schema doesn't match proof request requirements
2. Credential definition ID mismatch
3. Required attributes not present in stored credentials

**Solution**:
- Check browser console for detailed matching logs
- Verify stored credentials have the required attributes
- Ensure credential was issued with the correct schema

### Debug Mode

Enable detailed logging:

**Backend**:
```bash
# In .env
NODE_ENV=development
LOG_LEVEL=debug
```

**Frontend**:
Open browser DevTools (F12) and check:
- Console tab for detailed logs
- Network tab for API requests
- Application tab for stored data

### Getting Help

If you're still stuck:

1. **Check Logs**:
   - Backend: Check terminal where `npm run start:dev` is running
   - ACA-Py: `docker-compose logs -f`
   - Frontend: Browser DevTools Console

2. **Verify Setup**:
   ```bash
   # Check all services
   node --version          # Should be v18+
   npm --version           # Should be v9+
   docker --version        # Docker installed
   psql --version          # PostgreSQL installed
   npx prisma studio       # Database accessible
   ```

3. **Common Checklist**:
   - [ ] PostgreSQL is running
   - [ ] Database migrations applied
   - [ ] Docker is running
   - [ ] ACA-Py container is up
   - [ ] ngrok is running (for webhooks)
   - [ ] `.env` file configured correctly
   - [ ] Backend running on port 5001
   - [ ] Frontend running on port 5173

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