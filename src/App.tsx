import { useState, useEffect, useCallback, useRef } from 'react'
import { ethers } from "ethers";
import { abi as contractABI } from "./abi";
import './App.css'

const contractAddress = "0xC12F1c378580e22ab3491E055de000FED075E24c";

// --- 工具函数 ---

// 1. 缩略地址
const shortenAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 2. 格式化日期
const formatDate = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).format(date);
};

// 3. 根据地址生成唯一渐变色头像
const generateAvatarGradient = (address) => {
  if (!address) return 'linear-gradient(135deg, #ccc, #999)';
  const hash = parseInt(address.slice(2, 10), 16);
  const r = (hash >> 16) & 255;
  const g = (hash >> 8) & 255;
  const b = hash & 255;
  return `linear-gradient(135deg, rgb(${r},${g},${b}), rgb(${255 - r},${255 - g},${255 - b}))`;
};

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [owner, setOwner] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [allMessages, setAllMessages] = useState([]);

  // 新增状态：过滤器 ('all' | 'mine')
  const [filterType, setFilterType] = useState('all');

  // 新增状态：Toast 通知
  const [toast, setToast] = useState({ show: false, type: '', msg: '' });
  const toastTimeoutRef = useRef(null);

  // 显示 Toast 的辅助函数
  const showToast = (type, msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, type, msg });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // 复制地址功能
  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    showToast('success', 'Address copied to clipboard!');
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
        showToast('success', 'Wallet connected successfully!');
      } catch (error) {
        showToast('error', 'Connection refused');
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
      } catch (error) { console.error("Failed to acquire Owner:", error); }
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
        // 限制一下，防止数据过多卡死，实际项目应该分页，这里取最近50条
        const limit = Math.max(0, count - 50);
        for (let i = count - 1; i >= limit; i--) {
          promises.push(contract.Messages(i));
        }

        const results = await Promise.all(promises);
        const formattedMessages = results.map(msg => ({
          sender: msg.sender,
          text: msg.text,
          timestamp: new Date(Number(msg.timestamp) * 1000)
        }));

        setAllMessages(formattedMessages);
      } catch (error) {
        showToast('error', 'Failed to fetch messages');
      } finally {
        setIsLoadingMessages(false);
      }
    }
  }, []);

  const postMessage = async () => {
    if (!message.trim()) return showToast('error', 'The content cannot be empty.');

    const provider = getProvider();
    if (provider) {
      try {
        setIsSubmitting(true);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        const tx = await contract.postMessage(message);
        showToast('loading', 'The transaction has been submitted and is awaiting on-chain processing...');

        await tx.wait();

        setMessage("");
        await getAllMessages();
        showToast('success', 'Message posted successfully!');
      } catch (error) {
        console.error(error);
        showToast('error', 'Publish failed, please check the console.');
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        setCurrentAccount(accounts.length > 0 ? accounts[0] : null);
      });
    }
  }, []);

  useEffect(() => {
    checkIfWalletIsConnected();
    getOwner();
    getAllMessages();
  }, [checkIfWalletIsConnected, getOwner, getAllMessages]);

  // 过滤逻辑
  const displayedMessages = filterType === 'mine'
    ? allMessages.filter(m => m.sender.toLowerCase() === currentAccount?.toLowerCase())
    : allMessages;

  // App.jsx 
  // 逻辑部分(JS)保持不变，只需要修改 return 部分的 JSX 结构

  return (
    <div className="app-wrapper">
      {/* Toast 组件保持不变 */}
      <div className={`toast-container ${toast.show ? 'show' : ''} ${toast.type}`}>
        <div className="toast-icon">
          {toast.type === 'success' && '✅'}
          {toast.type === 'error' && '❌'}
          {toast.type === 'loading' && '⏳'}
        </div>
        <div className="toast-msg">{toast.msg}</div>
      </div>

      {/* 导航栏：增加 .nav-content 限制宽度 */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo">
            <span style={{ fontSize: '24px', marginRight: '5px' }}>⛓️</span>
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
              <button className="btn-connect" onClick={connectWallet}>Connect wallet</button>
            )}
          </div>
        </div>
      </nav>

      {/* 主容器：限制最大宽度并居中 */}
      <div className="layout-container">

        {/* 左侧栏：固定宽度 + 粘性定位 */}
        <aside className="sidebar">
          <div className="card post-card">
            <h3>👋 Drop a Message</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={currentAccount ? "What's up? Share your thoughts!" : "Please connect your wallet first"}
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
              <span>Contract Address</span>
              <a href={`https://sepolia.etherscan.io/address/${contractAddress}`} target="_blank" rel="noreferrer">Check ↗</a>
            </div>
            <div className="info-row">
              <span>Owner</span>
              <span title={owner}>{shortenAddress(owner)}</span>
            </div>
            <div className="info-footer">
              Built on Sepolia Testnet
            </div>
          </div>
        </aside>

        {/* 右侧栏：消息流 */}
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
                My Messages
              </button>
            </div>
            <button
              className={`btn-refresh ${isLoadingMessages ? 'spinning' : ''}`}
              onClick={getAllMessages}
              disabled={isLoadingMessages}
            >
              {/* 图标和文字 */}
              <span className="icon">🔄</span>
              {isLoadingMessages ? 'loading...' : 'Refresh List'}
            </button>
          </div>

          <div className="messages-list">
            {isLoadingMessages && allMessages.length === 0 ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading data from the blockchain...</p>
              </div>
            ) : displayedMessages.length > 0 ? (
              displayedMessages.map((msg, index) => (
                <div key={index} className="message-card fade-in">
                  <div className="card-header">
                    {/* 头像 */}
                    <div
                      className="avatar-circle"
                      style={{ background: generateAvatarGradient(msg.sender) }}
                    />

                    {/* 名字、标签、时间的组合容器 */}
                    <div className="header-info">
                      <div className="info-top">
                        <span className="sender-addr" onClick={() => copyAddress(msg.sender)}>
                          {shortenAddress(msg.sender)}
                        </span>

                        {/* 标签紧跟名字 */}
                        {msg.sender.toLowerCase() === owner?.toLowerCase() && (
                          <span className="badge badge-admin">Admin</span>
                        )}
                        {msg.sender.toLowerCase() === currentAccount?.toLowerCase() && (
                          <span className="badge badge-me">Me</span>
                        )}

                        {/* 时间推到最右边，或者紧跟其后，这里推到最右边比较整洁 */}
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
                <div className="empty-icon">📭</div>
                <p>No messages yet! Be the first to drop a note.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App