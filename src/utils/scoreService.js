import { upsertPlayerScore, getPlayerScore, getLeaderboard, getPlayerRank } from './supabase'

// Calculate total points from game state
export function calculatePoints(questState) {
  if (!questState) return 0

  const { xp, level, visitedDapps, completedQuests } = questState
  
  // Base points from XP
  let points = xp || 0

  // Bonus points for level
  points += (level || 1) * 50

  // Bonus points for unique visits
  points += (visitedDapps?.length || 0) * 10

  // Bonus points for completed quests
  const completedCount = Object.values(completedQuests || {}).filter(Boolean).length
  points += completedCount * 100

  return Math.round(points)
}

// Sync player score to Supabase
export async function syncPlayerScore(walletAddress, questState) {
  if (!walletAddress || !questState) {
    return null
  }

  try {
    const points = calculatePoints(questState)
    const xp = questState.xp || 0
    const level = questState.level || 1
    const visitedDapps = questState.visitedDapps?.length || 0
    const completedQuests = Object.values(questState.completedQuests || {}).filter(Boolean).length

    const result = await upsertPlayerScore({
      walletAddress,
      points,
      xp,
      level,
      visitedDapps,
      completedQuests,
    })

    return result
  } catch (error) {
    console.error('Error syncing player score:', error)
    return null
  }
}

// Get player score from Supabase
export async function fetchPlayerScore(walletAddress) {
  if (!walletAddress) {
    return null
  }

  try {
    const score = await getPlayerScore(walletAddress)
    return score
  } catch (error) {
    console.error('Error fetching player score:', error)
    return null
  }
}

// Get leaderboard from Supabase
export async function fetchLeaderboard(limit = 100) {
  try {
    const leaderboard = await getLeaderboard(limit)
    return leaderboard
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
}

// Get player rank
export async function fetchPlayerRank(walletAddress) {
  if (!walletAddress) {
    return null
  }

  try {
    const rank = await getPlayerRank(walletAddress)
    return rank
  } catch (error) {
    console.error('Error fetching player rank:', error)
    return null
  }
}

