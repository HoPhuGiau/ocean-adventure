import { useState } from 'react'
import { ethers } from 'ethers'
import { getProvider } from '../utils/monadRPC'

// Detect available wallets
const detectWallets = () => {
  const wallets = []
  
  if (typeof window === 'undefined') return wallets

  // MetaMask
  if (window.ethereum?.isMetaMask) {
    wallets.push({ id: 'metamask', name: 'MetaMask', icon: '🦊' })
  }

  // Rabby
  if (window.ethereum?.isRabby) {
    wallets.push({ id: 'rabby', name: 'Rabby', icon: '🐰' })
  }

  // Coinbase Wallet
  if (window.ethereum?.isCoinbaseWallet) {
    wallets.push({ id: 'coinbase', name: 'Coinbase Wallet', icon: '🔷' })
  }

  // Trust Wallet
  if (window.ethereum?.isTrust) {
    wallets.push({ id: 'trust', name: 'Trust Wallet', icon: '🔒' })
  }

  // Generic EIP-1193 provider (fallback)
  if (window.ethereum && wallets.length === 0) {
    wallets.push({ id: 'generic', name: 'Wallet', icon: '👛' })
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
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask, Rabby, or another Web3 wallet!')
      return
    }

    setConnecting(true)
    setShowWalletList(false)
    try {
      let provider
      
      if (walletId === 'rabby' && window.rabby && window.rabby.ethereum) {
        provider = new ethers.BrowserProvider(window.rabby.ethereum)
      } else if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum)
      } else {
        throw new Error('No wallet provider found')
      }

      const accounts = await provider.send('eth_requestAccounts', [])
      if (accounts.length > 0) {
        onConnect(accounts[0])
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      if (error.code === 4001) {
        alert('Please approve the connection request in your wallet')
      } else {
        alert('Failed to connect wallet. Please try again.')
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

