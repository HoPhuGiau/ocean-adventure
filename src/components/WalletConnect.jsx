import { useState } from 'react'
import { ethers } from 'ethers'
import { getProvider } from '../utils/monadRPC'

// Safely get ethereum provider (handle multiple wallet conflicts)
const getEthereumProvider = () => {
  if (typeof window === 'undefined') return null

  try {
    // MetaMask v10+ uses providers array
    if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
      // Find MetaMask first, then fallback to first provider
      const metamask = window.ethereum.providers.find((p) => p.isMetaMask)
      return metamask || window.ethereum.providers[0] || window.ethereum
    }

    // Single provider
    if (window.ethereum) {
      return window.ethereum
    }
  } catch (error) {
    // Suppress errors from wallet extension conflicts
    console.warn('Wallet extension conflict detected, trying to use available provider:', error.message)
  }

  return null
}

// Detect available wallets
const detectWallets = () => {
  const wallets = []
  
  if (typeof window === 'undefined') return wallets

  try {
    const ethereum = getEthereumProvider()

    if (!ethereum) return wallets

    // MetaMask
    if (ethereum.isMetaMask) {
      wallets.push({ id: 'metamask', name: 'MetaMask', icon: '🦊' })
    }

    // Rabby
    if (ethereum.isRabby) {
      wallets.push({ id: 'rabby', name: 'Rabby', icon: '🐰' })
    }

    // Coinbase Wallet
    if (ethereum.isCoinbaseWallet) {
      wallets.push({ id: 'coinbase', name: 'Coinbase Wallet', icon: '🔷' })
    }

    // Trust Wallet
    if (ethereum.isTrust) {
      wallets.push({ id: 'trust', name: 'Trust Wallet', icon: '🔒' })
    }

    // Generic EIP-1193 provider (fallback)
    if (wallets.length === 0) {
      wallets.push({ id: 'generic', name: 'Wallet', icon: '👛' })
    }
  } catch (error) {
    // Suppress detection errors (wallet extension conflicts)
    console.warn('Error detecting wallets:', error.message)
    // Still try to add generic wallet if ethereum exists
    if (window.ethereum) {
      wallets.push({ id: 'generic', name: 'Wallet', icon: '👛' })
    }
  }

  return wallets
}

export default function WalletConnect({
  walletConnected,
  walletAddress,
  onConnect,
  onDisconnect,
  variant = 'default',
}) {
  const [connecting, setConnecting] = useState(false)
  const [showWalletList, setShowWalletList] = useState(false)
  const availableWallets = detectWallets()

  const pillButtonBase =
    'rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-60 disabled:cursor-not-allowed'
  const pillPrimary = `${pillButtonBase} bg-sky-500 hover:bg-sky-400 text-white focus-visible:ring-sky-200`
  const pillSecondary = `${pillButtonBase} bg-white/10 hover:bg-white/20 text-white focus-visible:ring-white/40`

  const connectWallet = async (walletId = null) => {
    setConnecting(true)
    setShowWalletList(false)
    
    try {
      const ethereum = getEthereumProvider()
      
      if (!ethereum) {
        alert('Please install MetaMask, Rabby, or another Web3 wallet!')
        return
      }

      let provider
      
      // Try Rabby first if specified
      if (walletId === 'rabby' && window.rabby?.ethereum) {
        provider = new ethers.BrowserProvider(window.rabby.ethereum)
      } else {
        // Use the detected ethereum provider
        provider = new ethers.BrowserProvider(ethereum)
      }

      const accounts = await provider.send('eth_requestAccounts', [])
      if (accounts.length > 0) {
        onConnect(accounts[0])
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      
      // User-friendly error messages
      if (error.code === 4001) {
        alert('Connection request was rejected. Please try again and approve the request.')
      } else if (error.message?.includes('ethereum') || error.message?.includes('provider')) {
        // Wallet extension conflict - still try to connect
        console.warn('Wallet extension conflict detected, but connection may still work')
        alert('Multiple wallet extensions detected. Please ensure only one wallet extension is active, or try refreshing the page.')
      } else {
        alert(`Failed to connect wallet: ${error.message || 'Unknown error'}. Please try again.`)
      }
    } finally {
      setConnecting(false)
    }
  }

  const disconnectWallet = () => {
    onDisconnect()
  }

  return (
    <div className={`relative flex items-center gap-2 ${variant === 'overlay' ? 'text-white text-xs' : ''}`}>
      {walletConnected ? (
        <>
          <span
            className={`rounded-full px-3 py-1 font-semibold ${
              variant === 'overlay'
                ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/40 text-[11px]'
                : 'text-white text-sm bg-green-500/30'
            }`}
          >
            {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
          </span>
          <button onClick={disconnectWallet} className={variant === 'overlay' ? pillSecondary : 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm'}>
            Disconnect
          </button>
        </>
      ) : (
        <>
          <div className="relative">
            <button
              onClick={() => availableWallets.length > 1 ? setShowWalletList(!showWalletList) : connectWallet()}
              disabled={connecting}
              className={variant === 'overlay' ? pillPrimary : 'px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50'}
            >
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>

            {showWalletList && availableWallets.length > 1 && (
              <div className="absolute top-full left-0 mt-2 bg-emerald-950/95 border border-emerald-200/40 rounded-lg shadow-lg backdrop-blur-xl z-[9999] min-w-[200px]">
                <div className="py-2">
                  {availableWallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => connectWallet(wallet.id)}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-emerald-800/50 transition-colors flex items-center gap-2"
                    >
                      <span>{wallet.icon}</span>
                      <span>{wallet.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

