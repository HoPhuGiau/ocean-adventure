export const worldConfig = {
  ocean: {
    size: 520,
    fogColor: '#093a70',
    fogDensity: 0.0075,
  },
  islands: [
    {
      id: 'defi',
      label: 'Đảo DeFi',
      position: [220, 0, -160],
      radius: 46,
      height: 16,
      detectionRadius: 66,
      panelRadius: 78,
      accent: '#38bdf8',
      baseColor: '#2f855a',
      topColor: '#14532d',
      beachColor: '#d9872d',
      treeCount: 28,
      treePalette: {
        trunk: '#5b3a29',
        foliage: ['#3fb982', '#2f855a', '#4ade80'],
      },
      hills: [
        { radius: 12, height: 9, offset: [0, 0] },
        { radius: 9, height: 7, offset: [-10, -6] },
        { radius: 8, height: 6, offset: [12, 5] },
      ],
      pedestals: [
        { offset: [14, 6], color: '#38bdf8' },
        { offset: [-10, 8], color: '#fbbf24' },
        { offset: [2, -14], color: '#f97316' },
      ],
      interactionPanel: {
        title: 'Khám phá DeFi Monad',
        description:
          'Staking, lending và yield đến từ những nhà xây dựng Monad. Kết nối ví để tham gia, so sánh APR và bắt đầu nhiệm vụ tài chính.',
        actions: [
          {
            label: 'Mở danh sách dApps DeFi',
            href: 'https://monad.xyz/ecosystem',
          },
        ],
      },
    },
    {
      id: 'gaming',
      label: 'Đảo Gaming',
      position: [-260, 0, 120],
      radius: 38,
      height: 14,
      detectionRadius: 58,
      panelRadius: 70,
      accent: '#fb7185',
      baseColor: '#9d6b53',
      topColor: '#7b341e',
      beachColor: '#c56a1c',
      treeCount: 18,
      treePalette: {
        trunk: '#4a2f1f',
        foliage: ['#ec4899', '#f97316', '#facc15'],
      },
      hills: [
        { radius: 11, height: 7.4, offset: [3, 2] },
        { radius: 8, height: 6, offset: [-10, -4] },
      ],
      pedestals: [
        { offset: [10, -8], color: '#22d3ee' },
        { offset: [-12, 6], color: '#fb7185' },
      ],
      interactionPanel: {
        title: 'Gaming & Metaverse',
        description:
          'Trải nghiệm các game đầu tiên trên Monad: PvP, co-op, metaverse. Tích điểm khi thử game mới hoặc tạo highlight chia sẻ với cộng đồng.',
        actions: [
          {
            label: 'Xem nhiệm vụ Gaming',
            href: 'https://warpcast.com/~/channel/monad',
          },
        ],
      },
    },
    {
      id: 'infra',
      label: 'Đảo Infra',
      position: [140, 0, 260],
      radius: 34,
      height: 13,
      detectionRadius: 54,
      panelRadius: 66,
      accent: '#38bdf8',
      baseColor: '#1f3d7a',
      topColor: '#243b6b',
      beachColor: '#d9a066',
      treeCount: 20,
      treePalette: {
        trunk: '#374151',
        foliage: ['#67e8f9', '#38bdf8'],
      },
      hills: [
        { radius: 9, height: 6.5, offset: [5, -4] },
        { radius: 7, height: 5.5, offset: [-8, 5] },
      ],
      pedestals: [
        { offset: [9, 9], color: '#a855f7' },
        { offset: [-8, -10], color: '#22c55e' },
      ],
      interactionPanel: {
        title: 'Hạ tầng & Tools',
        description:
          'Oracle, bridge, indexer và tooling đang mở testnet. Theo dõi roadmap và đăng ký alpha access ngay trên đảo này.',
        actions: [
          {
            label: 'Đăng ký early infra',
            href: 'https://monadswap.typeform.com/',
          },
        ],
      },
    },
    {
      id: 'wallet',
      label: 'Đảo Wallet',
      position: [-200, 0, -240],
      radius: 40,
      height: 15,
      detectionRadius: 60,
      panelRadius: 74,
      accent: '#c084fc',
      baseColor: '#6b21a8',
      topColor: '#4c1d95',
      beachColor: '#eab308',
      treeCount: 24,
      treePalette: {
        trunk: '#553c9a',
        foliage: ['#c084fc', '#a855f7', '#d8b4fe'],
      },
      hills: [
        { radius: 10, height: 7.5, offset: [8, -5] },
        { radius: 8, height: 6.2, offset: [-9, 4] },
      ],
      pedestals: [
        { offset: [0, 0], color: '#f0abfc' },
        { offset: [13, 10], color: '#34d399' },
        { offset: [-15, -9], color: '#fde68a' },
      ],
      interactionPanel: {
        title: 'Ví & Onboarding',
        description:
          'Dùng thử ví Monad, tạo tài khoản social recovery, trải nghiệm MPC. Nhận airdrop nội bộ khi hoàn thành onboarding quest.',
        actions: [
          {
            label: 'Kích hoạt quest Wallet',
            href: 'https://monad.xyz/wallets',
          },
        ],
      },
    },
    {
      id: 'art',
      label: 'Đảo Nghệ Thuật',
      position: [0, 0, 340],
      radius: 50,
      height: 17,
      detectionRadius: 74,
      panelRadius: 88,
      accent: '#f472b6',
      baseColor: '#b45309',
      topColor: '#92400e',
      beachColor: '#fbbf24',
      treeCount: 32,
      treePalette: {
        trunk: '#713f12',
        foliage: ['#fb7185', '#f472b6', '#facc15', '#34d399'],
      },
      hills: [
        { radius: 15, height: 9, offset: [0, 0] },
        { radius: 10, height: 7.5, offset: [-12, 6] },
        { radius: 9, height: 6.3, offset: [13, -8] },
      ],
      pedestals: [
        { offset: [16, 4], color: '#f472b6' },
        { offset: [-18, -6], color: '#fb7185' },
        { offset: [2, -18], color: '#facc15' },
        { offset: [0, 12], color: '#22d3ee' },
      ],
      interactionPanel: {
        title: 'Art & Collectibles',
        description:
          'Thưởng thức gallery, mint huy hiệu, xem glitch reveal và unlock tác phẩm bí ẩn khi hoàn thành quest nghệ thuật.',
        actions: [
          {
            label: 'Mở gallery nghệ thuật',
            href: 'https://chog.gallery/',
          },
        ],
      },
    },
  ],
  creatures: [
    {
      id: 'draken-scout',
      label: 'Draken Scout',
      type: 'guardian',
      position: [-90, 1.2, 40],
      motion: {
        orbitRadius: 24,
        orbitSpeed: 0.12,
        bobAmplitude: 1.2,
        bobSpeed: 0.8,
        rotationSpeed: 0.5,
      },
      detectionRadius: 26,
      panelRadius: 32,
      modelId: 'creature.draken.placeholder',
      modelScale: 1.6,
      interactionPanel: {
        title: 'Draken Scout',
        description:
          'Sinh vật canh gác những vùng nước sâu. Tiếp cận để mở quest DRKVRS và nhận tín hiệu vào thế giới tối.',
        actions: [
          {
            label: 'Mở DRKVRS',
            href: 'https://drkvrs.xyz/',
          },
        ],
      },
    },
    {
      id: 'lanternfish-patrol',
      label: 'Lanternfish Patrol',
      type: 'ally',
      position: [60, 0.8, -110],
      motion: {
        orbitRadius: 18,
        orbitSpeed: 0.16,
        bobAmplitude: 0.8,
        bobSpeed: 1.2,
        rotationSpeed: 0.9,
      },
      detectionRadius: 20,
      panelRadius: 26,
      modelId: 'creature.lanternfish.placeholder',
      modelScale: 1.8,
      interactionPanel: {
        title: 'Lanternfish Patrol',
        description: 'Đội tuần tra đèn lồng dẫn đường đến nhiệm vụ thu thập. Nhấp để mở logbook nhiệm vụ.',
        actions: [
          {
            label: 'Mở quest log',
            href: 'https://warpcast.com/~/channel/monad-mission',
          },
        ],
      },
    },
    {
      id: 'treasure-beacon',
      label: 'Beacon of Codes',
      type: 'poi',
      position: [10, 0.6, 80],
      motion: {
        orbitRadius: 0,
        bobAmplitude: 1.4,
        bobSpeed: 0.9,
        rotationSpeed: 0.6,
      },
      detectionRadius: 14,
      panelRadius: 18,
      modelId: 'poi.beacon.placeholder',
      modelScale: 2.2,
      interactionPanel: {
        title: 'Beacon of Codes',
        description:
          'Điểm phát tín hiệu chứa gợi ý quest. Kích hoạt để nhận mã tham gia airdrop và các cập nhật mới từ đội Monad.',
        actions: [
          {
            label: 'Nhận tín hiệu',
            href: 'https://t.me/monad',
          },
        ],
      },
    },
  ],
}

export default worldConfig


