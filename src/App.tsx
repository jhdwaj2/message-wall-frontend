import { useState, useEffect, useCallback, useRef } from 'react'
import { ethers } from "ethers";
import { abi as contractABI } from "./abi";
import './App.css'

const contractAddress = "0xC12F1c378580e22ab3491E055de000FED075E24c";

// --- TypeScript Definitions ---

declare global {
  interface Window {
    ethereum: any;
  }
}

interface MessageItem {
  sender: string;
  text: string;
  timestamp: Date;
}

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'loading' | '';
  msg: string;
}

// --- Utility Functions ---

const shortenAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Changed to en-US for international date formatting
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', // e.g. Nov 20
    hour: '2-digit', minute: '2-digit', // e.g. 02:30 PM
    hour12: false // or true if you prefer AM/PM
  }).format(date);
};

const generateAvatarGradient = (address: string) => {
  if (!address) return 'linear-gradient(135deg, #ccc, #999)';
  const hash = parseInt(address.slice(2, 10), 16);
  const r = (hash >> 16) & 255;
  const g = (hash >> 8) & 255;
  const b = hash & 255;
  return `linear-gradient(135deg, rgb(${r},${g},${b}), rgb(${255 - r},${255 - g},${255 - b}))`;
};

function App() {
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [allMessages, setAllMessages] = useState<MessageItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'mine'>('all');

  const [toast, setToast] = useState<ToastState>({ show: false, type: '', msg: '' });
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (type: ToastState['type'], msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, type, msg });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    showToast('success', 'Address copied to clipboard');
  };

  const getProvider = () => {
    if (typeof window.ethereum !== 'undefined') {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
  };

  const connectWallet = async () => {
    const provider = getProvider();
    if (provider) {
      try {
        const accounts = await provider.send("eth_requestAccounts", []);
        setCurrentAccount(accounts[0]);
        showToast('success', 'Wallet connected successfully');
      } catch (error) {
        console.error(error);
        showToast('error', 'Connection rejected');
      }
    } else {
      showToast('error', 'Please install MetaMask');
    }
  }

  const checkIfWalletIsConnected = useCallback(async () => {
    const provider = getProvider();
    if (provider) {
      try {
        const accounts = await provider.send("eth_accounts", []);
        if (accounts.length > 0) setCurrentAccount(accounts[0]);
      } catch (error) { console.error(error); }
    }
  }, []);

  const getOwner = useCallback(async () => {
    const provider = getProvider();
    if (provider) {
      try {
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const ownerAddress = await contract.owner();
        setOwner(ownerAddress);
      } catch (error) { console.error("Failed to get owner:", error); }
    }
  }, []);

  const getAllMessages = useCallback(async () => {
    const provider = getProvider();
    if (provider) {
      try {
        setIsLoadingMessages(true);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const count = Number(await contract.getMessagesCount());

        const promises = [];
        const limit = Math.max(0, count - 50);
        for (let i = count - 1; i >= limit; i--) {
          promises.push(contract.Messages(i));
        }

        const results = await Promise.all(promises);
        const formattedMessages: MessageItem[] = results.map(msg => ({
          sender: msg.sender,
          text: msg.text,
          timestamp: new Date(Number(msg.timestamp) * 1000)
        }));

        setAllMessages(formattedMessages);
      } catch (error) {
        console.error(error);
        showToast('error', 'Failed to fetch messages');
      } finally {
        setIsLoadingMessages(false);
      }
    }
  }, []);

  const postMessage = async () => {
    if (!message.trim()) return showToast('error', 'Message cannot be empty');

    const provider = getProvider();
    if (provider) {
      try {
        setIsSubmitting(true);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        const tx = await contract.postMessage(message);
        showToast('loading', 'Transaction submitted. Waiting for confirmation...');

        await tx.wait();

        setMessage("");
        await getAllMessages();
        showToast('success', 'Message posted successfully!');
      } catch (error) {
        console.error(error);
        showToast('error', 'Transaction failed. Check console.');
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: any[]) => {
        setCurrentAccount(accounts.length > 0 ? accounts[0] : null);
      });
    }
  }, []);

  useEffect(() => {
    checkIfWalletIsConnected();
    getOwner();
    getAllMessages();
  }, [checkIfWalletIsConnected, getOwner, getAllMessages]);

  const displayedMessages = filterType === 'mine'
    ? allMessages.filter(m => m.sender.toLowerCase() === currentAccount?.toLowerCase())
    : allMessages;

  return (
    <div className="app-wrapper">
      <div className={`toast-container ${toast.show ? 'show' : ''} ${toast.type}`}>
        <div className="toast-icon">
          {toast.type === 'success' && '✅'}
          {toast.type === 'error' && '❌'}
          {toast.type === 'loading' && '⏳'}
        </div>
        <div className="toast-msg">{toast.msg}</div>
      </div>

      <nav className="navbar">
        <div className="nav-content">
          <div className="logo">
            <span style={{ fontSize: '24px' }}>⛓️</span>
            BlockBoard
          </div>
          <div className="wallet-status">
            {currentAccount ? (
              <div className="user-badge" onClick={() => copyAddress(currentAccount)}>
                <div
                  className="avatar-small"
                  style={{ background: generateAvatarGradient(currentAccount) }}
                />
                <span>{shortenAddress(currentAccount)}</span>
              </div>
            ) : (
              <button className="btn-connect" onClick={connectWallet}>Connect Wallet</button>
            )}
          </div>
        </div>
      </nav>

      <div className="layout-container">
        <aside className="sidebar">
          <div className="card post-card">
            <h3>👋 Write a Message</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={currentAccount ? "What's on your mind?" : "Please connect wallet first..."}
              disabled={!currentAccount || isSubmitting}
            />
            <div className="post-actions">
              <span className="char-count">{message.length}/140</span>
              <button
                className={`btn-submit ${isSubmitting ? 'loading' : ''}`}
                onClick={postMessage}
                disabled={!currentAccount || isSubmitting || !message.trim()}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>

          <div className="card info-card">
            <div className="info-row">
              <span>Contract</span>
              <a href={`https://sepolia.etherscan.io/address/${contractAddress}`} target="_blank" rel="noreferrer">View ↗</a>
            </div>
            <div className="info-row">
              <span>Owner</span>
              <span title={owner || ''}>{shortenAddress(owner || '')}</span>
            </div>
            <div className="info-footer">
              Powered by Sepolia Testnet
            </div>
          </div>
        </aside>

        <main className="feed-section">
          <div className="feed-header card">
            <div className="tabs">
              <button
                className={filterType === 'all' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setFilterType('all')}
              >
                All Messages
              </button>
              <button
                className={filterType === 'mine' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setFilterType('mine')}
                disabled={!currentAccount}
              >
                My Posts
              </button>
            </div>
            <button
              className={`btn-refresh ${isLoadingMessages ? 'spinning' : ''}`}
              onClick={getAllMessages}
              disabled={isLoadingMessages}
            >
              <span className="icon">🔄</span>
              {isLoadingMessages ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div className="messages-list">
            {isLoadingMessages && allMessages.length === 0 ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading data from blockchain...</p>
              </div>
            ) : displayedMessages.length > 0 ? (
              displayedMessages.map((msg, index) => (
                <div key={index} className="message-card fade-in">
                  <div className="card-header">
                    <div
                      className="avatar-circle"
                      style={{ background: generateAvatarGradient(msg.sender) }}
                    />
                    <div className="header-info">
                      <div className="info-top">
                        <span className="sender-addr" onClick={() => copyAddress(msg.sender)}>
                          {shortenAddress(msg.sender)}
                        </span>
                        {msg.sender.toLowerCase() === owner?.toLowerCase() && (
                          <span className="badge badge-admin">Admin</span>
                        )}
                        {msg.sender.toLowerCase() === currentAccount?.toLowerCase() && (
                          <span className="badge badge-me">You</span>
                        )}
                        <span className="msg-time">{formatDate(msg.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-content">
                    {msg.text}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                <p>No messages yet. Be the first!</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App