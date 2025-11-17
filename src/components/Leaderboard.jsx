import { useState, useEffect } from 'react'
import { getLeaderboard, getPlayerRank, isSupabaseAvailable } from '../utils/supabase'
import { calculatePoints } from '../utils/scoreService'
import { useQuestStore } from '../store/questStore'

const HUB_PANEL_CLASS =
  'pointer-events-auto rounded-[28px] border border-lime-300/75 bg-gradient-to-r from-emerald-600/60 via-emerald-500/50 to-lime-400/55 shadow-[0_0_60px_rgba(34,197,94,0.6)] backdrop-blur'
const HUB_HEADING_CLASS =
  'text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-100 drop-shadow-[0_0_12px_rgba(34,197,94,0.85)]'
const HUB_TITLE_CLASS = 'text-lg font-semibold text-white drop-shadow-[0_0_16px_rgba(34,197,94,0.65)]'

export default function Leaderboard({ walletAddress, onClose }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [playerRank, setPlayerRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState(null)
  const questState = useQuestStore()

  useEffect(() => {
    loadLeaderboard()
  }, [walletAddress])

  const loadLeaderboard = async () => {
    setLoading(true)
    setSyncStatus(null)
    try {
      const data = await getLeaderboard(50)
      console.log('📊 Leaderboard loaded:', data?.length || 0, 'players')
      setLeaderboard(data || [])

      if (walletAddress) {
        const rank = await getPlayerRank(walletAddress)
        setPlayerRank(rank)
        console.log('🏆 Player rank:', rank)
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
      setSyncStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSync = async () => {
    if (!walletAddress) {
      setSyncStatus('no-wallet')
      return
    }

    setSyncStatus('syncing')
    try {
      const { syncPlayerScore } = await import('../utils/scoreService')
      const result = await syncPlayerScore(walletAddress, questState)
      if (result) {
        setSyncStatus('success')
        // Reload leaderboard after sync
        setTimeout(() => {
          loadLeaderboard()
        }, 500)
      } else {
        setSyncStatus('failed')
      }
    } catch (error) {
      console.error('Manual sync error:', error)
      setSyncStatus('error')
    }
  }

  const formatAddress = (address) => {
    if (!address) return 'N/A'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const playerPoints = walletAddress ? calculatePoints(questState) : 0

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-50">
      <div className="pointer-events-auto w-[min(900px,90vw)] max-w-[90vw] rounded-[34px] border border-emerald-200/60 bg-emerald-950/92 px-10 py-8 text-emerald-50 shadow-[0_0_80px_rgba(14,116,144,0.65)] backdrop-blur-xl max-h-[85vh] overflow-y-auto">
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <div>
              <p className={HUB_HEADING_CLASS}>Competitive Rankings</p>
              <h3 className={HUB_TITLE_CLASS + ' mt-1'}>Leaderboard</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadLeaderboard}
                disabled={loading}
                className="rounded-full border border-emerald-100/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100 hover:bg-emerald-100/20 transition-colors disabled:opacity-50"
              >
                🔄 Refresh
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-emerald-100/50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-100 hover:bg-emerald-100/20 transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>

          {walletAddress && (
            <div className="rounded-[20px] border border-emerald-300/50 bg-emerald-900/40 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-emerald-100/90">Your Score</p>
                  <p className="text-2xl font-bold text-white mt-1">{playerPoints.toLocaleString()} pts</p>
                  <p className="text-xs text-emerald-200/70 mt-1">
                    Level {questState.level} • {questState.visitedDapps?.length || 0} dApps •{' '}
                    {Object.values(questState.completedQuests || {}).filter(Boolean).length} Quests
                  </p>
                  {syncStatus === 'syncing' && (
                    <p className="text-xs text-blue-300 mt-2">⏳ Syncing to leaderboard...</p>
                  )}
                  {syncStatus === 'success' && (
                    <p className="text-xs text-green-300 mt-2">✅ Synced successfully!</p>
                  )}
                  {syncStatus === 'failed' && (
                    <p className="text-xs text-red-300 mt-2">❌ Sync failed. Check console.</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {playerRank && (
                    <div className="text-right">
                      <p className="text-sm text-emerald-100/90">Rank</p>
                      <p className="text-3xl font-bold text-lime-300 mt-1">{getRankBadge(playerRank)}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={syncStatus === 'syncing'}
                    className="rounded-full border border-emerald-200/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100 hover:bg-emerald-800/50 transition-colors disabled:opacity-50"
                  >
                    {syncStatus === 'syncing' ? 'Syncing...' : '🔄 Sync Now'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isSupabaseAvailable ? (
            <div className="rounded-[20px] border border-amber-300/50 bg-amber-900/40 px-6 py-4">
              <p className="text-sm font-semibold text-amber-200 mb-2">⚠️ Supabase Not Configured</p>
              <p className="text-xs text-amber-100/80 leading-relaxed">
                Leaderboard features are disabled. To enable:
                <br />
                1. Create a Supabase project at supabase.com
                <br />
                2. Run the SQL migration script (see supabase-migration.sql)
                <br />
                3. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file
                <br />
                4. Restart the dev server
                <br />
                <span className="text-amber-200/70 mt-2 block">See SUPABASE_SETUP.md for detailed instructions.</span>
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-emerald-100/70">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-emerald-100/70">No scores yet. Be the first!</p>
              {walletAddress && (
                <p className="text-xs text-emerald-200/60 text-center">
                  Click &quot;🔄 Sync Now&quot; button above to save your score to the leaderboard.
                  <br />
                  Check the browser console (F12) for sync status.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/70 border-b border-emerald-200/20">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5">Wallet</div>
                <div className="col-span-2 text-right">Points</div>
                <div className="col-span-2 text-right">Level</div>
                <div className="col-span-2 text-right">dApps</div>
              </div>
              {leaderboard.map((entry, index) => {
                const rank = index + 1
                const isPlayer = walletAddress && entry.wallet_address?.toLowerCase() === walletAddress.toLowerCase()
                return (
                  <div
                    key={entry.id || entry.wallet_address}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg transition-colors ${
                      isPlayer
                        ? 'bg-emerald-700/40 border border-emerald-300/50'
                        : 'bg-emerald-900/20 hover:bg-emerald-800/30'
                    }`}
                  >
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm font-bold text-white">{getRankBadge(rank)}</span>
                    </div>
                    <div className="col-span-5 flex items-center">
                      <span className={`text-sm ${isPlayer ? 'text-lime-300 font-semibold' : 'text-emerald-100'}`}>
                        {formatAddress(entry.wallet_address)}
                        {isPlayer && <span className="ml-2 text-xs">(You)</span>}
                      </span>
                    </div>
                    <div className="col-span-2 text-right flex items-center justify-end">
                      <span className="text-sm font-semibold text-white">{entry.points?.toLocaleString() || 0}</span>
                    </div>
                    <div className="col-span-2 text-right flex items-center justify-end">
                      <span className="text-sm text-emerald-200">{entry.level || 1}</span>
                    </div>
                    <div className="col-span-2 text-right flex items-center justify-end">
                      <span className="text-sm text-emerald-200">{entry.visited_dapps || 0}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <div className="pointer-events-auto absolute inset-0 bg-black/40 backdrop-blur-sm -z-10" onClick={onClose} />
    </div>
  )
}

