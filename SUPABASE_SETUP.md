# Supabase Setup Guide

Hướng dẫn thiết lập Supabase database cho hệ thống Leaderboard và lưu trữ điểm số.

## 📋 Bước 1: Tạo Supabase Project

1. Truy cập [Supabase](https://supabase.com) và đăng nhập
2. Click "New Project"
3. Điền thông tin:
   - **Project Name**: `ocean-adventure-leaderboard` (hoặc tên bạn muốn)
   - **Database Password**: Tạo password mạnh (lưu lại)
   - **Region**: Chọn region gần nhất
4. Click "Create new project" và đợi project được tạo

## 📋 Bước 2: Tạo Database Table

1. Vào Supabase Dashboard → SQL Editor
2. Tạo file mới hoặc copy nội dung từ `supabase-migration.sql`
3. Chạy SQL script để tạo bảng `leaderboard`:

```sql
-- Xem file supabase-migration.sql để có script đầy đủ
```

Script sẽ tạo:
- Bảng `leaderboard` với các cột: wallet_address, points, xp, level, visited_dapps, completed_quests
- Indexes để tối ưu query
- Row Level Security (RLS) policies
- Trigger để tự động update `updated_at`

## 📋 Bước 3: Lấy API Credentials

1. Vào Supabase Dashboard → Settings → API
2. Copy các giá trị sau:
   - **Project URL** (ví dụ: `https://xxxxx.supabase.co`)
   - **anon public** key (API Key)

## 📋 Bước 4: Cấu hình Environment Variables

Tạo file `.env` trong thư mục `ocean-adventure` (nếu chưa có):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Lưu ý**: Thay `your-project-id` và `your-anon-key-here` bằng giá trị thực từ Supabase.

## 📋 Bước 5: Cấu hình Vercel (Khi Deploy)

Khi deploy lên Vercel, thêm environment variables:

1. Vào Vercel Dashboard → Project → Settings → Environment Variables
2. Thêm:
   - `VITE_SUPABASE_URL` = URL từ Supabase
   - `VITE_SUPABASE_ANON_KEY` = Anon key từ Supabase
3. Chọn environments: Production, Preview, Development
4. Click "Save"
5. Redeploy project

## 🔒 Security Notes

- **Row Level Security (RLS)**: Đã được bật, cho phép:
  - Public read access (ai cũng có thể xem leaderboard)
  - Insert/update own score (ai cũng có thể update điểm của mình)
  
- **API Key**: Sử dụng `anon` key (public key) là đủ vì RLS đã được cấu hình. Không cần `service_role` key.

## 🧪 Testing

Sau khi setup xong:

1. Chạy `npm run dev`
2. Kết nối ví (MetaMask, Rabby, etc.)
3. Thực hiện các hành động trong game (visit dApps, complete quests)
4. Mở Leaderboard để xem điểm số đã được lưu
5. Kiểm tra Supabase Dashboard → Table Editor → `leaderboard` để xem dữ liệu

## 📊 Database Schema

```sql
leaderboard
├── id (UUID, Primary Key)
├── wallet_address (TEXT, Unique, Not Null)
├── points (INTEGER, Default: 0)
├── xp (INTEGER, Default: 0)
├── level (INTEGER, Default: 1)
├── visited_dapps (INTEGER, Default: 0)
├── completed_quests (INTEGER, Default: 0)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🔧 Troubleshooting

### Lỗi: "Supabase URL or Anon Key not found"
- Kiểm tra file `.env` có tồn tại không
- Kiểm tra tên biến môi trường có đúng: `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`
- Restart dev server sau khi thêm `.env`

### Lỗi: "relation 'leaderboard' does not exist"
- Kiểm tra đã chạy SQL migration script chưa
- Vào Supabase Dashboard → Table Editor để xem bảng đã được tạo chưa

### Lỗi: "permission denied for table leaderboard"
- Kiểm tra RLS policies đã được tạo chưa
- Kiểm tra trong Supabase Dashboard → Authentication → Policies

### Không thấy điểm trong leaderboard
- Kiểm tra console browser có lỗi không
- Kiểm tra Network tab để xem API calls có thành công không
- Kiểm tra Supabase Dashboard → Logs để xem server errors

## 📝 Notes

- Điểm số sẽ được tự động sync sau 2 giây khi có thay đổi (debounce)
- Leaderboard hiển thị top 50 players
- Rank được tính dựa trên `points` (desc) rồi `xp` (desc)
- Wallet address được lưu ở dạng lowercase để tránh duplicate

