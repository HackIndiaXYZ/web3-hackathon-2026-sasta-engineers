# ChainCred Smart Contracts

Solidity smart contracts for the ChainCred blockchain credential verification platform.

## Overview

The `CredentialRegistry` contract manages the issuance, verification, and revocation of credentials on the Polygon blockchain.

## Features

- ✅ Role-based access control (Admin, Issuer)
- ✅ Credential issuance with metadata
- ✅ Credential revocation
- ✅ Public verification
- ✅ Batch issuance (gas optimization)
- ✅ Pausable functionality
- ✅ Reentrancy protection
- ✅ Event emission for transparency

## Prerequisites

- Node.js 20.x or higher
- npm or yarn

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your environment variables:
```env
PRIVATE_KEY=your-private-key-without-0x
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGONSCAN_API_KEY=your-api-key
```

## Compilation

```bash
npm run compile
```

## Testing

Run all tests:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

Run with gas reporting:
```bash
REPORT_GAS=true npm test
```

## Deployment

### Deploy to Polygon Amoy Testnet

```bash
npm run deploy:testnet
```

### Deploy to Polygon Mainnet

```bash
npm run deploy:mainnet
```

### Verify Contract

After deployment, verify on PolygonScan:

```bash
npx hardhat verify --network amoy <CONTRACT_ADDRESS>
```

## Contract Functions

### Admin Functions

- `addIssuer(address)` - Grant issuer role to an address
- `removeIssuer(address)` - Revoke issuer role from an address
- `pause()` - Pause contract operations
- `unpause()` - Resume contract operations

### Issuer Functions

- `issueCredential(bytes32, address, string)` - Issue a new credential
- `revokeCredential(bytes32)` - Revoke a credential
- `batchIssueCredentials(bytes32[], address[], string[])` - Issue multiple credentials

### Public Functions

- `verifyCredential(bytes32)` - Verify a credential (returns exists, isRevoked, issuer, student)
- `getCredential(bytes32)` - Get full credential details
- `isIssuer(address)` - Check if address has issuer role
- `getIssuerStats(address)` - Get issuer statistics
- `getStudentStats(address)` - Get student statistics

## Security Features

### Access Control
- OpenZeppelin AccessControl for role management
- ADMIN_ROLE for administrative functions
- ISSUER_ROLE for credential operations

### Protection Mechanisms
- ReentrancyGuard on state-changing functions
- Pausable for emergency stops
- Input validation on all functions
- Duplicate prevention

### Best Practices
- Events for all state changes
- Comprehensive error messages
- Gas-optimized batch operations
- Immutable credential hashes

## Gas Costs (Estimated)

- Issue Credential: ~100,000 gas (~$0.01 on Polygon)
- Revoke Credential: ~50,000 gas (~$0.005)
- Verify Credential: Free (view function)
- Batch Issue (10): ~600,000 gas (~$0.06)

## Testing Coverage

Target: 100% coverage for all functions

Test categories:
- ✅ Deployment
- ✅ Issuer management
- ✅ Credential issuance
- ✅ Credential verification
- ✅ Credential revocation
- ✅ Batch operations
- ✅ Pause functionality
- ✅ Access control
- ✅ Edge cases

## Architecture

```
CredentialRegistry
├── AccessControl (OpenZeppelin)
├── ReentrancyGuard (OpenZeppelin)
└── Pausable (OpenZeppelin)
```

### Data Structures

```solidity
struct Credential {
    bytes32 credentialHash;
    address issuer;
    address student;
    uint256 issuedAt;
    bool revoked;
    string metadataURI;
}
```

## Events

```solidity
event CredentialIssued(bytes32 indexed credentialHash, address indexed issuer, address indexed student, uint256 issuedAt, string metadataURI);
event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer, uint256 revokedAt);
event IssuerAdded(address indexed issuer, address indexed admin);
event IssuerRemoved(address indexed issuer, address indexed admin);
```

## Integration with Backend

After deployment, update backend `.env`:

```env
CONTRACT_ADDRESS=0x...
ALCHEMY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
CHAIN_ID=80002
```

The backend already has the ABI in:
`backend/src/modules/blockchain/contracts/CredentialRegistry.json`

## Security Audit

Before mainnet deployment:
- [ ] Run Slither static analysis
- [ ] Run Mythril security scanner
- [ ] Manual code review
- [ ] Professional audit (recommended)

## License

MIT
