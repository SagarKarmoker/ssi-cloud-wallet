# SSI Cloud Wallet API Documentation

This is a comprehensive cloud wallet implementation built on top of ACA-Py (Aries Cloud Agent Python) using NestJS. The wallet provides multi-tenant support and complete SSI (Self-Sovereign Identity) functionality.

## Features

- ✅ **Multi-tenant Wallet Management** - Create and manage isolated wallets for different users
- ✅ **Connection Management** - Create invitations, accept connections, and manage DIDComm relationships  
- ✅ **Credential Operations** - Issue, receive, store, and manage verifiable credentials
- ✅ **Proof Presentation** - Request proofs and present credentials to verifiers
- ✅ **DID & Schema Management** - Create DIDs, schemas, and credential definitions
- ✅ **Webhook Processing** - Real-time event handling for wallet activities
- 🔄 **Authentication & User Management** - User registration and wallet association (TODO)
- 🔄 **Database Integration** - Persistent storage with Prisma (TODO)

## API Overview

### Wallet Management (`/api/wallet`)
- `POST /create` - Create a new multi-tenant wallet
- `GET /` - List all wallets (admin only)
- `GET /:id` - Get wallet details
- `PUT /:id` - Update wallet settings
- `DELETE /:id` - Remove wallet
- `POST /:id/token` - Get authentication token
- `GET /:id/status` - Get wallet statistics

### Connection Management (`/api/connection`)
- `POST /accept-invitation` - Accept connection invitation
- `POST /:walletId/create-invitation` - Create connection invitation
- `GET /:walletId/connections` - List all connections
- `GET /:walletId/connections/:connectionId` - Get connection details
- `POST /:walletId/connections/:connectionId/send-message` - Send basic message

### Credential Operations (`/api/credential`)
- `GET /:walletId/credentials` - List stored credentials
- `GET /:walletId/credentials/:credentialId` - Get credential details
- `GET /:walletId/credential-exchange` - List credential exchange records
- `GET /:walletId/credential-exchange/:credExId` - Get exchange record details
- `POST /:walletId/credential-exchange/:credExId/store` - Store received credential
- `POST /:walletId/credential-exchange/:credExId/problem-report` - Send problem report
- `DELETE /:walletId/credentials/:credentialId` - Remove credential

### Proof Presentation (`/api/proof`)
- `GET /:walletId/presentation-exchange` - List presentation exchange records
- `GET /:walletId/presentation-exchange/:presExId` - Get exchange record details
- `GET /:walletId/presentation-exchange/:presExId/credentials` - Get matching credentials
- `POST /:walletId/presentation-exchange/:presExId/send-presentation` - Send proof presentation
- `POST /:walletId/send-presentation-request` - Send proof request
- `POST /:walletId/presentation-exchange/:presExId/verify-presentation` - Verify presentation
- `POST /:walletId/presentation-exchange/:presExId/problem-report` - Send problem report

### DID & Schema Management (`/api/did`)
- `POST /:walletId/create` - Create new DID
- `GET /:walletId/list` - List DIDs in wallet
- `GET /:walletId/public` - Get public DID
- `POST /:walletId/public` - Set public DID
- `GET /:walletId/resolve/:did` - Resolve DID
- `POST /:walletId/schema` - Create schema
- `GET /:walletId/schemas` - List schemas
- `GET /:walletId/schema/:schemaId` - Get schema details
- `POST /:walletId/credential-definition` - Create credential definition
- `GET /:walletId/credential-definitions` - List credential definitions
- `GET /:walletId/credential-definition/:credDefId` - Get credential definition details

### Webhook Events (`/api/webhooks`)
- `POST /:topic` - Handle webhook events from ACA-Py
- `GET /events/:walletId` - Get webhook events for wallet
- `GET /events/:walletId/:eventId` - Get specific webhook event

## Configuration

### Environment Variables

```bash
# ACA-Py Configuration
ACAPY_ADMIN_URL=http://localhost:8031
WALLET_WEBHOOK_URL=https://your-domain.com/api/webhooks

# Application Configuration  
PORT=5001
```

### ACA-Py Multi-Tenancy Setup

Ensure your ACA-Py agent is running with multi-tenancy enabled:

```bash
aca-py start \
  --multitenant \
  --multitenant-admin \
  --jwt-secret your-secret-key \
  --wallet-type askar \
  --wallet-name base_wallet \
  --wallet-key base_wallet_key \
  --admin-api-key your-admin-key \
  --admin-host 0.0.0.0 \
  --admin-port 8031 \
  --webhook-url http://localhost:5001/api/webhooks
```

## Getting Started

1. **Start your ACA-Py agent** with multi-tenancy enabled
2. **Start the wallet API**:
   ```bash
   npm install
   npm run start:dev
   ```
3. **Access Swagger documentation** at `http://localhost:5001/api`

## Basic Workflow

### 1. Create a Wallet
```bash
curl -X POST http://localhost:5001/api/wallet/create \
  -H "Content-Type: application/json" \
  -d '{
    "walletName": "alice_wallet",
    "walletKey": "alice_key_123", 
    "walletLabel": "Alice Personal Wallet"
  }'
```

### 2. Create Connection Invitation
```bash
curl -X POST http://localhost:5001/api/connection/{walletId}/create-invitation
```

### 3. Accept Connection Invitation
```bash  
curl -X POST http://localhost:5001/api/connection/accept-invitation \
  -H "Content-Type: application/json" \
  -d '{
    "walletId": "your-wallet-id",
    "invitation": { ... }
  }'
```

### 4. List Connections
```bash
curl -X GET http://localhost:5001/api/connection/{walletId}/connections
```

### 5. List Credentials
```bash
curl -X GET http://localhost:5001/api/credential/{walletId}/credentials
```

## Webhook Events

The system processes the following webhook events from ACA-Py:

- **connections** - Connection state changes (invitation, request, active, etc.)
- **issue_credential_v2_0** - Credential issuance events (offer, request, issued, stored)
- **present_proof_v2_0** - Proof presentation events (request, presentation, verified)
- **basicmessages** - Basic message received
- **problem_report** - Protocol error notifications

Events are stored in memory (for now) and can be retrieved via the webhook events API.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │  Cloud Wallet   │    │    ACA-Py       │
│                 │◄──►│   (NestJS)      │◄──►│  Multi-Tenant   │
│  Mobile/Web     │    │                 │    │     Agent       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Database      │    │   Ledger        │
                       │  (Future: DB)   │    │   Network       │
                       └─────────────────┘    └─────────────────┘
```

## Next Steps

1. **Add Authentication** - JWT-based user authentication and authorization
2. **Database Integration** - Persistent storage with Prisma ORM
3. **User Management** - User registration and wallet association
4. **WebSocket Support** - Real-time notifications to client applications
5. **Mobile SDK** - React Native or Flutter SDK for mobile integration

## Contributing

This is a foundation for building production-ready SSI applications. Feel free to extend and customize based on your specific requirements.