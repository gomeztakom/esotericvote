# EsotericVote - FHEVM Encrypted Voting System

EsotericVote is a fully homomorphic encryption (FHE) powered voting dApp built on FHEVM, enabling privacy-preserving elections. Leveraging Zama's FHEVM technology, votes are encrypted on-chain using euint32 types, ensuring that neither the blockchain nor any intermediary can access plaintext vote choices. Users select options through encrypted inputs, with results homomorphically aggregated and only decryptable by authorized users via wallet signatures. The system supports multi-option polls with real-time status tracking, preventing double voting while maintaining voter anonymity. Deployable on both local Hardhat networks and Sepolia testnet, EsotericVote demonstrates practical FHE applications in secure digital democracy.

## Features

- **Privacy-First Voting**: Fully homomorphic encryption ensures vote privacy
- **Multi-Option Polls**: Support for 2-10 voting options per poll
- **Real-Time Results**: Encrypted result aggregation with authorized decryption
- **Anti-Double Voting**: Smart contract level duplicate vote prevention
- **Creator Controls**: Poll creators can end votes prematurely
- **Dual Environment Support**: Local development (Mock) and testnet (Relayer) modes
- **Wallet Integration**: MetaMask and EIP-6963 compatible wallets
- **Responsive UI**: Glassmorphism design system with dark/light themes

## Technology Stack

### Smart Contracts
- **Solidity**: Smart contract development
- **FHEVM**: Fully Homomorphic Encryption Virtual Machine
- **Hardhat**: Development environment and testing framework
- **@fhevm/hardhat-plugin**: FHEVM integration for Hardhat

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Ethers.js**: Ethereum blockchain interaction
- **EIP-6963**: Modern wallet connection standard

### FHE Integration
- **@zama-fhe/relayer-sdk**: Production FHE operations
- **@fhevm/mock-utils**: Local development simulation

## Architecture

### Smart Contract Layer
- **VotingContract.sol**: Main voting logic with FHE operations
- **FHE Types**: euint32 for encrypted vote counts, ebool for voting status
- **Access Control**: Creator permissions and user authorization
- **Event Logging**: Vote creation, casting, and completion events

### Frontend Application Layer
- **Dual Mode Scripts**: `dev:mock` for local, `dev` for testnet
- **Context Providers**: Wallet, FHEVM instance, and voting state management
- **Component Architecture**: Modular voting UI components
- **Real-time Updates**: Live poll status and result monitoring

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask wallet
- Git

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/gomeztakom/esotericvote.git
cd esotericvote
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd esotericvote-frontend
npm install

# Install Hardhat dependencies
cd ../fhevm-hardhat-template
npm install
```

3. **Start local blockchain**
```bash
cd fhevm-hardhat-template
npx hardhat node
```

4. **Deploy contracts locally**
```bash
npx hardhat deploy --network localhost
```

5. **Generate ABI files**
```bash
cd ../esotericvote-frontend
npm run genabi
```

6. **Start development server**
```bash
npm run dev:mock
```

7. **Open browser**
Navigate to `http://localhost:3000` and connect your MetaMask to Localhost network.

### Testnet Deployment

1. **Configure environment**
```bash
cd fhevm-hardhat-template
# Set your INFURA_API_KEY
npx hardhat vars set INFURA_API_KEY
```

2. **Deploy to Sepolia**
```bash
npx hardhat deploy --network sepolia
```

3. **Update frontend ABI**
```bash
cd ../esotericvote-frontend
npm run genabi
npm run dev
```

4. **Connect to Sepolia**
Switch MetaMask to Sepolia testnet and start voting!

## Project Structure

```
esotericvote/
├── esotericvote-frontend/          # Next.js frontend application
│   ├── app/                       # Next.js App Router pages
│   ├── components/                # React components
│   │   ├── ui/                    # Reusable UI components
│   │   ├── voting/                # Voting-specific components
│   │   └── wallet/                # Wallet connection components
│   ├── fhevm/                     # FHEVM integration logic
│   ├── hooks/                     # Custom React hooks
│   ├── abi/                       # Generated ABI files
│   ├── scripts/                   # Build and utility scripts
│   └── design-tokens.ts           # Design system tokens
├── fhevm-hardhat-template/        # Hardhat project for contracts
│   ├── contracts/                 # Solidity smart contracts
│   ├── deploy/                    # Deployment scripts
│   ├── test/                      # Contract tests
│   ├── tasks/                     # Hardhat tasks
│   └── deployments/               # Deployment artifacts
├── frontend/                      # Reference implementation (read-only)
├── Fhevm0.8_Reference.md          # FHEVM technical reference
└── EsotericVote_Requirements.md   # Project requirements
```

## Smart Contract Functions

### Core Functions
- `createVote()`: Create a new voting poll
- `castVote()`: Submit encrypted vote
- `getVoteResults()`: Retrieve encrypted results (authorized access only)
- `endVote()`: Creator can end poll prematurely
- `hasUserVoted()`: Check if user has voted

### FHE Operations
- Vote counts stored as `euint32` arrays
- User voting status as `ebool` mapping
- Homomorphic addition for result aggregation
- Access control via `FHE.allow()` and `FHE.allowThis()`

## Security Features

- **Vote Privacy**: FHE ensures votes remain encrypted on-chain
- **Double Vote Prevention**: Smart contract level validation
- **Access Control**: Creator-only result viewing during active polls
- **Time Locks**: Configurable voting periods
- **Wallet Signatures**: Required for result decryption

## Development Scripts

### Frontend
```bash
npm run dev:mock    # Local development with Mock FHEVM
npm run dev         # Testnet development with Relayer SDK
npm run build       # Production build
npm run genabi      # Generate ABI files from deployments
```

### Smart Contracts
```bash
npx hardhat compile     # Compile contracts
npx hardhat test        # Run tests
npx hardhat deploy      # Deploy to configured network
npx hardhat node        # Start local Hardhat node
```

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111
```

### Hardhat (.env)
```bash
INFURA_API_KEY=your_infura_key
# MNEMONIC=your_wallet_mnemonic (optional)
```

## Testing

```bash
cd fhevm-hardhat-template
npx hardhat test
```

Tests cover:
- Vote creation and validation
- Encrypted vote casting
- Result aggregation
- Access control
- Edge cases and error handling

## Deployment

### Local Deployment
```bash
cd fhevm-hardhat-template
npx hardhat node
npx hardhat deploy --network localhost
```

### Testnet Deployment
```bash
cd fhevm-hardhat-template
npx hardhat deploy --network sepolia
```

### Production Deployment
Update network configurations and deploy to mainnet with proper security audits.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Live Demo

🚀 **Production Deployment**: [https://esotericvote-frontend-m4z3lopg6-galaxys-projects-639e1fd2.vercel.app](https://esotericvote-frontend-m4z3lopg6-galaxys-projects-639e1fd2.vercel.app)

**Note**: The live demo is configured for Sepolia testnet. Make sure your MetaMask wallet is connected to Sepolia network.

## Acknowledgments

- [Zama](https://www.zama.ai/) for FHEVM technology
- [Hardhat](https://hardhat.org/) for development framework
- [Next.js](https://nextjs.org/) for React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vercel](https://vercel.com/) for hosting and deployment

## Contact

For questions or support, please open an issue on GitHub.

---

**Current Deployed Contract (Sepolia)**: `0x1b54F0F8A3875918396f918b96B3B706080Ab784`

