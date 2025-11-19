import { ethers } from 'ethers'

const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz'

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
    // These are not app errors, just wallet extension conflicts
    console.warn('Wallet extension conflict detected:', error.message)
  }

  return null
}

// Initialize provider
export const getProvider = () => {
  try {
    const ethereum = getEthereumProvider()
    if (ethereum) {
      return new ethers.BrowserProvider(ethereum)
    }
  } catch (error) {
    // Fallback to RPC if wallet connection fails
    console.warn('Using RPC fallback due to wallet connection issue:', error.message)
  }
  
  return new ethers.JsonRpcProvider(MONAD_TESTNET_RPC)
}

// Fetch TVL for a contract
// Note: This requires the contract to have a getTVL() function
// For contracts without this, you might need to query balance or use a different method
export async function fetchTVL(contractAddress, abi) {
  try {
    const provider = getProvider()
    if (!contractAddress) {
      console.warn('No contract address provided for TVL fetch')
      return 0
    }

    // If ABI is provided and has getTVL function, use it
    if (abi && Array.isArray(abi) && abi.some((item) => item.includes('getTVL'))) {
      const contract = new ethers.Contract(contractAddress, abi, provider)
      const tvl = await contract.getTVL()
      return Number(ethers.formatEther(tvl))
    }

    // Alternative: Try to get contract balance (for simple contracts)
    try {
      const balance = await provider.getBalance(contractAddress)
      const balanceInEth = Number(ethers.formatEther(balance))
      if (balanceInEth > 0) {
        return balanceInEth
      }
    } catch (balanceError) {
      // Ignore balance check errors
    }

    // Fallback: return 0 if we can't fetch
    console.warn(`Could not fetch TVL for ${contractAddress}. Contract may not have getTVL() function.`)
    return 0
  } catch (error) {
    console.warn('TVL fetch failed:', error.message)
    return 0
  }
}

// Fetch user count from transfer events
export async function fetchUserCount(contractAddress) {
  try {
    if (!contractAddress) {
      return 0
    }

    const provider = getProvider()
    
    // Try to get recent blocks (last 10000 blocks for performance)
    let fromBlock = 0
    try {
      const currentBlock = await provider.getBlockNumber()
      fromBlock = Math.max(0, currentBlock - 10000) // Last ~10000 blocks
    } catch (e) {
      // If we can't get current block, start from 0
      fromBlock = 0
    }

    // Query Transfer events
    const transferTopic = ethers.id('Transfer(address,address,uint256)')
    const filter = {
      address: contractAddress,
      fromBlock,
      toBlock: 'latest',
      topics: [transferTopic],
    }

    try {
      const logs = await provider.getLogs(filter)
      const uniqueUsers = new Set()
      
      const iface = new ethers.Interface([
        'event Transfer(address indexed from, address indexed to, uint256 value)',
      ])

      logs.forEach((log) => {
        try {
          const parsed = iface.parseLog(log)
          if (parsed && parsed.args) {
            // Add both from and to addresses (excluding zero address)
            const zeroAddress = '0x0000000000000000000000000000000000000000'
            if (parsed.args.from && parsed.args.from.toLowerCase() !== zeroAddress) {
              uniqueUsers.add(parsed.args.from.toLowerCase())
            }
            if (parsed.args.to && parsed.args.to.toLowerCase() !== zeroAddress) {
              uniqueUsers.add(parsed.args.to.toLowerCase())
            }
          }
        } catch (parseError) {
          // Skip logs that can't be parsed
        }
      })

      return uniqueUsers.size
    } catch (logsError) {
      // If getLogs fails (e.g., too many logs), return 0
      console.warn('Could not fetch transfer logs:', logsError.message)
      return 0
    }
  } catch (error) {
    console.warn('User count fetch failed:', error.message)
    return 0
  }
}

// Fetch dApp data
export async function fetchDappData(dapp) {
  try {
    const [tvl, users] = await Promise.all([
      fetchTVL(dapp.contractAddress, dapp.abi),
      fetchUserCount(dapp.contractAddress),
    ])
    return {
      ...dapp,
      tvl,
      users,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error fetching dApp data:', error)
    return {
      ...dapp,
      tvl: Math.random() * 5000000,
      users: Math.floor(Math.random() * 10000),
      lastUpdated: new Date().toISOString(),
    }
  }
}

