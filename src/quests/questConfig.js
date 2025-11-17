export const questDefinitions = [
  {
    id: 'first-steps',
    title: 'First Landing',
    description: 'Visit 3 unique dApps on the islands during your voyage.',
    type: 'uniqueVisits',
    target: 3,
    xpReward: 80,
    autoUnlock: true,
  },
  {
    id: 'curator-tour',
    title: 'Island Explorer',
    description: 'Explore 8 unique dApps across the islands to chart your journey.',
    type: 'uniqueVisits',
    target: 8,
    xpReward: 120,
    unlockRequires: ['first-steps'],
  },
  {
    id: 'defi-discovery',
    title: 'DeFi Discovery',
    description: 'Visit 4 DeFi dApps on your ocean adventure.',
    type: 'category',
    category: 'DeFi',
    target: 4,
    xpReward: 140,
    unlockRequires: ['first-steps'],
  },
  {
    id: 'monad-ambassador',
    title: 'Monad Ambassador',
    description: 'Discover 5 projects that are only on Monad during your voyage.',
    type: 'onlyOnMonad',
    target: 5,
    xpReward: 180,
    unlockRequires: ['curator-tour'],
  },
]

export const LEVEL_XP_STEP = 150

export const calculateLevelFromXp = (xp) => Math.floor(xp / LEVEL_XP_STEP) + 1
export const xpForLevel = (level) => LEVEL_XP_STEP * (level - 1)
export const xpToNextLevel = (xp) => {
  const level = calculateLevelFromXp(xp)
  const nextLevelXp = LEVEL_XP_STEP * level
  return nextLevelXp - xp
}

export const evaluateQuestProgress = (quest, state) => {
  switch (quest.type) {
    case 'uniqueVisits':
      return Math.min(state.visitedDapps.length, quest.target)
    case 'category': {
      const categoryKey = quest.category || ''
      const visited = state.categoryVisits?.[categoryKey] ?? []
      return Math.min(visited.length, quest.target)
    }
    case 'onlyOnMonad':
      return Math.min(state.onlyOnMonadVisited.length, quest.target)
    default:
      return 0
  }
}

export const isQuestUnlocked = (quest, state) => {
  if (quest.autoUnlock) return true
  const dependencies = quest.unlockRequires ?? []
  if (!dependencies.length) return true
  return dependencies.every((id) => state.completedQuests?.[id])
}

