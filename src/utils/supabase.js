import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// These should be set as environment variables in production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
                              supabaseUrl !== '' && 
                              supabaseAnonKey !== '' &&
                              !supabaseUrl.includes('your-project-id') &&
                              !supabaseAnonKey.includes('your-anon-key')

// Create a mock client if Supabase is not configured to prevent errors
const mockSupabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
  }),
}

// Only show warning once
if (!isSupabaseConfigured && typeof window !== 'undefined') {
  const warningShown = sessionStorage.getItem('supabase-warning-shown')
  if (!warningShown) {
    console.warn(
      '⚠️ Supabase not configured. Leaderboard features will be disabled.\n' +
      'To enable: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file\n' +
      'See SUPABASE_SETUP.md for instructions.'
    )
    sessionStorage.setItem('supabase-warning-shown', 'true')
  }
}

// Export configured client or mock client
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase

// Export flag to check if Supabase is available
export const isSupabaseAvailable = isSupabaseConfigured

// Leaderboard table structure:
// id: uuid (primary key)
// wallet_address: text (indexed)
// points: integer
// xp: integer
// level: integer
// visited_dapps: integer
// completed_quests: integer
// updated_at: timestamp
// created_at: timestamp

export async function upsertPlayerScore({ walletAddress, points, xp, level, visitedDapps, completedQuests }) {
  if (!walletAddress) {
    throw new Error('Wallet address is required')
  }

  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase not configured. Score will not be saved to leaderboard.')
    return null
  }

  try {
    console.log('📤 Syncing score to Supabase:', {
      walletAddress: walletAddress.slice(0, 10) + '...',
      points,
      xp,
      level,
      visitedDapps,
      completedQuests,
    })

    const { data, error } = await supabase
      .from('leaderboard')
      .upsert(
        {
          wallet_address: walletAddress.toLowerCase(),
          points: points || 0,
          xp: xp || 0,
          level: level || 1,
          visited_dapps: visitedDapps || 0,
          completed_quests: completedQuests || 0,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'wallet_address',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase upsert error:', error)
      throw error
    }

    console.log('✅ Score synced successfully:', data)
    return data
  } catch (error) {
    console.error('❌ Error upserting player score:', error)
    return null
  }
}

export async function getPlayerScore(walletAddress) {
  if (!walletAddress) {
    return null
  }

  if (!isSupabaseConfigured) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is okay
      throw error
    }

    return data
  } catch (error) {
    console.error('Error getting player score:', error)
    return null
  }
}

export async function getLeaderboard(limit = 100) {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase not configured. Cannot fetch leaderboard.')
    return []
  }

  try {
    console.log('📥 Fetching leaderboard from Supabase...')
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('points', { ascending: false })
      .order('xp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Supabase query error:', error)
      throw error
    }

    console.log('✅ Leaderboard fetched:', data?.length || 0, 'entries')
    return data || []
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error)
    return []
  }
}

export async function getPlayerRank(walletAddress) {
  if (!walletAddress) {
    return null
  }

  if (!isSupabaseConfigured) {
    return null
  }

  try {
    // Get player's score
    const playerScore = await getPlayerScore(walletAddress)
    if (!playerScore) {
      return null
    }

    // Count players with higher scores
    const { count, error } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .or(`points.gt.${playerScore.points},and(points.eq.${playerScore.points},xp.gt.${playerScore.xp})`)

    if (error) throw error
    return (count || 0) + 1 // Rank is position (1-based)
  } catch (error) {
    console.error('Error getting player rank:', error)
    return null
  }
}

