# 🎯 Hệ Thống Tính Điểm và Xếp Hạng

Tài liệu này giải thích chi tiết về cơ chế lưu điểm, tính điểm và xếp hạng trong dự án Ocean Adventure.

## 📊 Tổng Quan

Hệ thống scoring dựa trên các hoạt động của người chơi trong game:
- **XP (Experience Points)**: Điểm kinh nghiệm từ các hành động
- **Level**: Cấp độ tính từ XP
- **Points**: Điểm tổng hợp để xếp hạng (tính từ XP + Level + các bonus)
- **Visited dApps**: Số dApp đã khám phá
- **Completed Quests**: Số quest đã hoàn thành

---

## 🔢 Công Thức Tính Điểm

### 1. **Tính XP (Experience Points)**

XP được tích lũy từ các hành động:

```javascript
// Khi visit dApp lần đầu:
XP_GAIN = {
  unique: 25,              // Base XP cho mỗi dApp mới
  onlyOnMonadBonus: 15,    // Bonus nếu dApp chỉ có trên Monad
  newCategoryBonus: 5,     // Bonus nếu là category đầu tiên
}

// Ví dụ:
// - Visit dApp "ABC" lần đầu → +25 XP
// - Visit dApp "XYZ" (onlyOnMonad) lần đầu → +40 XP (25 + 15)
// - Visit dApp "DEF" (category mới) lần đầu → +30 XP (25 + 5)
// - Visit dApp đã visit rồi → +0 XP
```

### 2. **Tính Level từ XP**

```javascript
LEVEL_XP_STEP = 150  // Mỗi level cần 150 XP

Level = Math.floor(XP / 150) + 1

// Ví dụ:
// XP = 0   → Level 1
// XP = 149 → Level 1
// XP = 150 → Level 2
// XP = 299 → Level 2
// XP = 300 → Level 3
```

### 3. **Tính Points (Điểm Tổng Hợp)**

Points là điểm dùng để xếp hạng, tính từ nhiều yếu tố:

```javascript
function calculatePoints(questState) {
  const { xp, level, visitedDapps, completedQuests } = questState
  
  // Base points = XP
  let points = xp || 0
  
  // Bonus: Level × 50
  points += (level || 1) * 50
  
  // Bonus: Mỗi dApp đã visit × 10
  points += (visitedDapps?.length || 0) * 10
  
  // Bonus: Mỗi quest đã hoàn thành × 100
  const completedCount = Object.values(completedQuests || {}).filter(Boolean).length
  points += completedCount * 100
  
  return Math.round(points)
}
```

**Ví dụ tính Points:**

```
Người chơi có:
- XP: 500
- Level: 4 (500/150 + 1)
- Visited dApps: 15 dApps
- Completed Quests: 3 quests

Tính Points:
= 500 (base XP)
+ 4 × 50 = 200 (level bonus)
+ 15 × 10 = 150 (dApp bonus)
+ 3 × 100 = 300 (quest bonus)
= 1,150 points
```

---

## 💾 Cơ Chế Lưu Điểm

### 1. **Lưu Local (Browser)**

Trạng thái game được lưu trong **localStorage** bằng Zustand persist:

```javascript
// File: src/store/questStore.jsx
export const useQuestStore = create(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      visitedDapps: [],
      completedQuests: {},
      // ... other state
    }),
    {
      name: 'chog-quest-storage-v2',  // Key trong localStorage
    }
  )
)
```

**Ưu điểm:**
- ✅ Hoạt động ngay lập tức, không cần internet
- ✅ Không tốn phí database
- ✅ Không bị mất khi refresh trang

**Nhược điểm:**
- ❌ Chỉ lưu trên browser hiện tại
- ❌ Không đồng bộ giữa các thiết bị
- ❌ Không thể xem leaderboard toàn cầu

### 2. **Lưu Cloud (Supabase)**

Khi người chơi kết nối ví, điểm số được sync lên Supabase:

```javascript
// File: src/pages/SailingScene.jsx
useEffect(() => {
  if (!walletAddress || !questState) return

  // Debounce: Chờ 2 giây sau khi có thay đổi mới sync
  const timeoutId = setTimeout(() => {
    syncPlayerScore(walletAddress, questState).catch((error) => {
      console.error('Failed to sync player score:', error)
    })
  }, 2000)

  return () => clearTimeout(timeoutId)
}, [walletAddress, questState.xp, questState.level, questState.visitedDapps, questState.completedQuests])
```

**Quy trình sync:**

1. **Trigger**: Khi có thay đổi trong:
   - `walletAddress` (kết nối ví)
   - `questState.xp`
   - `questState.level`
   - `questState.visitedDapps`
   - `questState.completedQuests`

2. **Debounce**: Chờ 2 giây để tránh quá nhiều API calls

3. **Tính Points**: Gọi `calculatePoints(questState)` để tính điểm

4. **Upsert vào Supabase**: 
   - Nếu wallet_address chưa có → Insert
   - Nếu wallet_address đã có → Update

**Ưu điểm:**
- ✅ Lưu trữ vĩnh viễn
- ✅ Đồng bộ giữa các thiết bị
- ✅ Leaderboard toàn cầu
- ✅ Không bị mất khi xóa localStorage

**Nhược điểm:**
- ❌ Cần internet
- ❌ Có thể có delay nhỏ (2 giây)
- ❌ Cần setup Supabase

---

## 🏆 Cơ Chế Xếp Hạng

### 1. **Tiêu Chí Sắp Xếp**

Leaderboard được sắp xếp theo:

1. **Points** (descending) - Ưu tiên cao nhất
2. **XP** (descending) - Nếu Points bằng nhau

```sql
SELECT * FROM leaderboard
ORDER BY points DESC, xp DESC
LIMIT 50
```

**Ví dụ:**

```
Rank | Wallet      | Points | XP  | Level
-----|-------------|--------|-----|------
1    | 0xAAA...    | 1500   | 600 | 5
2    | 0xBBB...    | 1200   | 500 | 4
3    | 0xCCC...    | 1200   | 450 | 4  ← Cùng Points nhưng XP thấp hơn
```

### 2. **Tính Rank của Player**

Rank = Số lượng players có điểm cao hơn + 1

```javascript
// Tìm số players có:
// - points > player.points HOẶC
// - points = player.points VÀ xp > player.xp
const count = await supabase
  .from('leaderboard')
  .select('*', { count: 'exact', head: true })
  .or(`points.gt.${playerScore.points},and(points.eq.${playerScore.points},xp.gt.${playerScore.xp})`)

rank = count + 1
```

---

## 🗄️ Cấu Trúc Database (Supabase)

### Bảng: `leaderboard`

```sql
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,        -- Địa chỉ ví (indexed)
  points INTEGER DEFAULT 0 NOT NULL,          -- Điểm tổng hợp
  xp INTEGER DEFAULT 0 NOT NULL,              -- Experience points
  level INTEGER DEFAULT 1 NOT NULL,           -- Level
  visited_dapps INTEGER DEFAULT 0 NOT NULL,   -- Số dApp đã visit
  completed_quests INTEGER DEFAULT 0 NOT NULL, -- Số quest đã hoàn thành
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
-- Index để tìm nhanh theo wallet
CREATE INDEX idx_leaderboard_wallet_address ON leaderboard(wallet_address);

-- Index để query leaderboard nhanh
CREATE INDEX idx_leaderboard_points ON leaderboard(points DESC, xp DESC);
```

### Row Level Security (RLS)

```sql
-- Cho phép public đọc leaderboard
CREATE POLICY "Allow public read access"
  ON leaderboard FOR SELECT
  USING (true);

-- Cho phép ai cũng insert/update (vì cần wallet để verify)
CREATE POLICY "Allow insert/update own score"
  ON leaderboard FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## 🔧 Thiết Lập Supabase

### Bước 1: Tạo Supabase Project

1. Vào [supabase.com](https://supabase.com)
2. Đăng nhập/Create account
3. Click "New Project"
4. Điền thông tin:
   - **Name**: `ocean-adventure-leaderboard`
   - **Database Password**: (Lưu lại password này)
   - **Region**: Chọn gần nhất (VD: Southeast Asia)

### Bước 2: Chạy SQL Migration

1. Vào Supabase Dashboard → **SQL Editor**
2. Tạo **New Query**
3. Copy toàn bộ nội dung từ file `supabase-migration.sql`
4. Click **Run** để chạy SQL
5. Kiểm tra kết quả:
   - Vào **Table Editor** → Kiểm tra bảng `leaderboard` đã được tạo
   - Vào **Database** → **Indexes** → Kiểm tra indexes đã được tạo

### Bước 3: Lấy API Credentials

1. Vào **Settings** → **API**
2. Copy các giá trị:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: (Dài khoảng 200 ký tự)

### Bước 4: Cấu Hình Environment Variables

#### Cho Local Development:

Tạo file `.env` trong thư mục `ocean-adventure`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Restart dev server** sau khi tạo `.env`:

```bash
npm run dev
```

#### Cho Vercel Deployment:

1. Vào Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. Thêm 2 biến:
   - `VITE_SUPABASE_URL` = URL từ Supabase
   - `VITE_SUPABASE_ANON_KEY` = Anon key từ Supabase
3. Chọn environments: **Production**, **Preview**, **Development**
4. Click **Save**
5. **Redeploy** project

### Bước 5: Test

1. Chạy app: `npm run dev`
2. Kết nối ví (MetaMask, Rabby, etc.)
3. Thực hiện các hành động:
   - Visit dApps trên island
   - Complete quests
4. Chờ 2 giây → Điểm sẽ tự động sync lên Supabase
5. Mở **Leaderboard** → Kiểm tra điểm đã hiển thị
6. Vào Supabase Dashboard → **Table Editor** → `leaderboard` → Xem dữ liệu

---

## 🔄 Flow Hoàn Chỉnh

```
┌─────────────────┐
│  Player Action  │
│  (Visit dApp,   │
│   Complete Quest)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  questStore     │
│  (Zustand)      │
│  - Update XP    │
│  - Update Level │
│  - Update State │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│  localStorage   │  │  useEffect      │
│  (Persist)      │  │  (Auto-sync)    │
└─────────────────┘  └────────┬────────┘
                              │
                              │ (Debounce 2s)
                              ▼
                       ┌─────────────────┐
                       │  calculatePoints│
                       │  (scoreService) │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  syncPlayerScore│
                       │  (Supabase API) │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Supabase DB    │
                       │  (leaderboard)  │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Leaderboard  │
                       │  Component    │
                       └───────────────┘
```

---

## 🎮 Ví Dụ Thực Tế

### Scenario 1: Player mới bắt đầu

```
1. Connect wallet: 0xABC...
2. Visit dApp "DeFi Island" → +25 XP
3. Visit dApp "Gaming Island" → +25 XP
4. Complete quest "First Footsteps" → +80 XP (quest reward)

Tổng:
- XP: 130
- Level: 1 (130 < 150)
- Visited dApps: 2
- Completed Quests: 1
- Points: 130 + (1×50) + (2×10) + (1×100) = 300 points
```

### Scenario 2: Player chuyên nghiệp

```
Player đã:
- XP: 2000
- Level: 14 (2000/150 + 1)
- Visited dApps: 45
- Completed Quests: 8

Tính Points:
= 2000 (base XP)
+ 14 × 50 = 700 (level bonus)
+ 45 × 10 = 450 (dApp bonus)
+ 8 × 100 = 800 (quest bonus)
= 3,950 points

→ Có thể vào top 10 leaderboard!
```

---

## 🐛 Troubleshooting

### Lỗi: "Supabase not configured"

**Nguyên nhân**: Chưa set environment variables

**Giải pháp**:
1. Tạo file `.env` với `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`
2. Restart dev server

### Điểm không sync lên Supabase

**Kiểm tra**:
1. Console có lỗi không?
2. Wallet đã connect chưa?
3. Đã chờ đủ 2 giây sau khi có thay đổi chưa?
4. Supabase URL và Key có đúng không?

**Debug**:
```javascript
// Thêm vào console để debug
console.log('Syncing score:', { walletAddress, questState })
```

### Leaderboard trống

**Nguyên nhân**: 
- Chưa có ai sync điểm lên
- RLS policy chưa đúng

**Kiểm tra**:
1. Vào Supabase Dashboard → Table Editor → `leaderboard`
2. Xem có data không
3. Kiểm tra RLS policies trong Authentication → Policies

---

## 📝 Notes

- **Debounce 2 giây**: Tránh quá nhiều API calls khi có nhiều thay đổi nhanh
- **Wallet address**: Được lưu ở dạng lowercase để tránh duplicate
- **Points vs XP**: Points dùng để xếp hạng, XP là điểm gốc từ hành động
- **Level calculation**: `Level = floor(XP / 150) + 1`

---

## 🔮 Future Enhancements

Có thể mở rộng thêm:

1. **Seasonal Leaderboards**: Reset mỗi tháng/quý
2. **Rewards**: Phần thưởng cho top players
3. **Achievements**: Badge/medal khi đạt milestones
4. **Statistics**: Graph hiển thị progress theo thời gian
5. **Team Leaderboards**: Xếp hạng theo team/guild

---

**Tài liệu này được cập nhật:** `2024-01-XX`

