# ⛓️ BlockBoard - Decentralized Message Wall

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)
![Ethers.js](https://img.shields.io/badge/ethers.js-v6-blue)

**BlockBoard** is a decentralized application (DApp) running on the **Sepolia Testnet**. It allows users to post messages permanently on the blockchain, creating an immutable and censorship-resistant public message board.

The project features a modern, responsive UI built with **React & TypeScript**, providing a seamless Web3 experience.

---

## 📸 Screenshot

![App Screenshot](https://public/screenshot.png/1000x500?text=BlockBoard+Screenshot)

---

## ✨ Features

- **🔗 Wallet Connection**: Seamless integration with **MetaMask** to authenticate users.
- **📝 Write to Blockchain**: Users can post messages that are stored directly on the Ethereum Sepolia network.
- **📖 Read from Blockchain**: Fetches and displays messages in real-time.
- **👤 Identity Visualization**:
  - **Unique Avatars**: Generated deterministically based on wallet addresses.
  - **Admin Badge**: Special identification for the contract owner.
  - **"You" Badge**: Highlights the current user's posts.
- **🔍 Filtering**: Toggle between "All Messages" and "My Posts".
- **📱 Fully Responsive**: Optimized layout for both Desktop (Sticky Sidebar) and Mobile devices.
- **⚡ Real-time Feedback**: Toast notifications for transaction status (Mining, Success, Error).

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Blockchain Interaction**: ethers.js (v6)
- **Styling**: Custom CSS3 (Grid & Flexbox)
- **Network**: Ethereum Sepolia Testnet

---

## 📜 Smart Contract

The smart contract for this DApp is deployed on the **Sepolia Testnet**.

| Network | Address | Explorer |
| :--- | :--- | :--- |
| **Sepolia** | `0xC12F1c378580e22ab3491E055de000FED075E24c` | [View on Etherscan ↗](https://sepolia.etherscan.io/address/0xC12F1c378580e22ab3491E055de000FED075E24c) |

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MetaMask](https://metamask.io/) browser extension installed.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jhdwaj2/message-wall-frontend.git
   cd blockboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Visit `http://localhost:5173` (or the port shown in your terminal).

---

## 📦 Deployment

You can deploy this project easily using Vercel, Netlify, or Cloudflare Pages.

### Vercel (Recommended)

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and import the project.
3. Vercel will detect **Vite** automatically.
4. Click **Deploy**.

### Netlify (Manual)

1. Run `npm run build` locally.
2. Drag and drop the `dist` folder to [Netlify Drop](https://app.netlify.com/drop).

---

## ⚠️ Important Note

This DApp runs on the **Sepolia Testnet**.
To interact with it:
1. Open MetaMask.
2. Switch network to **Sepolia**.
3. Ensure you have some **Sepolia ETH** (Testnet tokens) to pay for gas fees. You can get them from a [Sepolia Faucet](https://sepoliafaucet.com/).

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).