// Suppress console errors from wallet extensions
// These errors are from wallet extensions conflicting with each other,
// not from our app code. App functionality is not affected.

if (typeof window !== 'undefined') {
  // Store original console methods
  const originalError = console.error
  const originalWarn = console.warn

  // List of known wallet extension error patterns to suppress
  const suppressPatterns = [
    /Cannot redefine property: ethereum/i,
    /Cannot set property ethereum/i,
    /MetaMask encountered an error setting the global Ethereum provider/i,
    /evmAsk\.js/i,
    /inpage\.js/i,
    /contentScript\.js/i,
    /Unchecked runtime\.lastError/i,
    /Could not establish connection/i,
    /Receiving end does not exist/i,
    /TypeError: Cannot set property ethereum/i,
    /which has only a getter/i,
    /Object\.defineProperty/i,
    /r\.inject/i,
    /window\.addEventListener\.once/i,
  ]

  // Override console.error to filter wallet extension errors
  console.error = function (...args) {
    const message = args.join(' ')
    const shouldSuppress = suppressPatterns.some((pattern) => pattern.test(message))
    
    if (!shouldSuppress) {
      originalError.apply(console, args)
    } else {
      // Optionally log as debug (uncomment if you want to see them)
      // console.debug('[Suppressed wallet extension error]', ...args)
    }
  }

  // Override console.warn to filter wallet extension warnings
  console.warn = function (...args) {
    const message = args.join(' ')
    const shouldSuppress = suppressPatterns.some((pattern) => pattern.test(message))
    
    if (!shouldSuppress) {
      originalWarn.apply(console, args)
    } else {
      // Optionally log as debug (uncomment if you want to see them)
      // console.debug('[Suppressed wallet extension warning]', ...args)
    }
  }
}

