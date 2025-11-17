# 🚀 Hướng Dẫn Thiết Lập Supabase - Từng Bước Chi Tiết

Hướng dẫn chi tiết từng bước để thiết lập Supabase database cho leaderboard.

---

## 📋 Bước 1: Tạo Supabase Account & Project

1. **Truy cập**: https://supabase.com
2. **Đăng nhập/Create Account**:
   - Nếu chưa có account → Click "Start your project" → Sign up với GitHub/Email
   - Nếu đã có account → Click "Sign in"

3. **Tạo New Project**:
   - Click nút **"New Project"** (góc trên bên phải)
   - Điền thông tin:
     - **Organization**: Chọn organization của bạn (hoặc tạo mới)
     - **Name**: `ocean-adventure-leaderboard` (hoặc tên bạn muốn)
     - **Database Password**: Tạo password mạnh **VÀ LƯU LẠI** (sẽ cần sau này)
     - **Region**: Chọn region gần nhất (ví dụ: Southeast Asia - Singapore)
     - **Pricing Plan**: Chọn Free (đủ dùng cho leaderboard)
   - Click **"Create new project"**
   - Đợi 2-3 phút để project được tạo xong

---

## 📋 Bước 2: Mở SQL Editor

Sau khi project được tạo:

1. **Vào SQL Editor**:
   - Nhìn sidebar bên trái → Click **"SQL Editor"** (icon: `</>` hoặc "SQL Editor")
   - Hoặc vào URL: `https://app.supabase.com/project/[project-id]/sql`

2. **Tạo New Query**:
   - Click nút **"New Query"** (màu xanh, góc trên bên trái)
   - Hoặc click **"+"** để tạo query mới

---

## 📋 Bước 3: Copy SQL Script

### Cách 1: Copy từ file local

1. **Mở file SQL**:
   - Mở file `supabase-migration.sql` trong thư mục `ocean-adventure`
   - File này chứa toàn bộ SQL code cần thiết

2. **Copy toàn bộ nội dung**:
   - Mở file bằng text editor (VS Code, Notepad, etc.)
   - Select All (Ctrl+A / Cmd+A)
   - Copy (Ctrl+C / Cmd+C)

### Cách 2: Copy từ đây (nếu không tìm thấy file)

Copy đoạn SQL code sau:

```sql
-- Create leaderboard table for storing player scores
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  points INTEGER DEFAULT 0 NOT NULL,
  xp INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  visited_dapps INTEGER DEFAULT 0 NOT NULL,
  completed_quests INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_leaderboard_wallet_address ON leaderboard(wallet_address);

-- Create index on points and xp for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(points DESC, xp DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_leaderboard_updated_at 
  BEFORE UPDATE ON leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read leaderboard (for public leaderboard)
CREATE POLICY "Allow public read access to leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert/update their own score
CREATE POLICY "Allow insert/update own score"
  ON leaderboard FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## 📋 Bước 4: Paste và Run SQL Script

1. **Paste vào SQL Editor**:
   - Click vào text area trong SQL Editor
   - Paste SQL code đã copy (Ctrl+V / Cmd+V)
   - SQL Editor sẽ highlight syntax (màu sắc các keywords)

2. **Chạy SQL Script**:
   - Click nút **"Run"** (góc dưới bên phải, màu xanh)
   - Hoặc nhấn `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

3. **Kiểm tra kết quả**:
   - Bạn sẽ thấy message: **"Success. No rows returned"** hoặc **"Success"**
   - Nếu có lỗi → Sẽ hiển thị error message (đọc kỹ và sửa)

---

## 📋 Bước 5: Verify - Kiểm Tra Bảng Đã Tạo

1. **Vào Table Editor**:
   - Nhìn sidebar bên trái → Click **"Table Editor"**
   - Hoặc vào URL: `https://app.supabase.com/project/[project-id]/editor`

2. **Kiểm tra bảng `leaderboard`**:
   - Bạn sẽ thấy bảng **"leaderboard"** trong danh sách bảng
   - Click vào bảng **"leaderboard"** để xem cấu trúc:
     - Các cột: `id`, `wallet_address`, `points`, `xp`, `level`, `visited_dapps`, `completed_quests`, `created_at`, `updated_at`
   - Bảng sẽ trống (chưa có data) - Đây là bình thường

3. **Kiểm tra Indexes**:
   - Vào **Database** → **Indexes** (sidebar)
   - Kiểm tra có 2 indexes:
     - `idx_leaderboard_wallet_address`
     - `idx_leaderboard_points`

---

## 📋 Bước 6: Lấy API Credentials

1. **Vào Settings → API**:
   - Nhìn sidebar → Click **"Settings"** (icon: ⚙️)
   - Click **"API"** trong menu Settings

2. **Copy Project URL**:
   - Tìm section **"Project URL"**
   - Copy URL (ví dụ: `https://abcdefghijklmnop.supabase.co`)
   - Lưu vào file `.env` với key `VITE_SUPABASE_URL`

3. **Copy Anon Key**:
   - Tìm section **"Project API keys"**
   - Tìm key **"anon"** hoặc **"public"** (không phải `service_role`)
   - Click nút **"Copy"** (icon: 📋) để copy key
   - Key sẽ dài khoảng 200 ký tự (ví dụ: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - Lưu vào file `.env` với key `VITE_SUPABASE_ANON_KEY`

---

## 📋 Bước 7: Cấu Hình Environment Variables

### Tạo file `.env`:

1. **Tạo file `.env`**:
   - Trong thư mục `ocean-adventure` (root project)
   - Tạo file mới tên `.env` (không có tên khác, chỉ `.env`)

2. **Thêm nội dung**:

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

**Lưu ý**: 
- Thay `https://abcdefghijklmnop.supabase.co` bằng URL thực từ Supabase
- Thay `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` bằng Anon Key thực từ Supabase
- Không có khoảng trắng xung quanh dấu `=`

3. **Lưu file**:
   - Save file `.env`
   - File này sẽ không được commit vào git (đã có trong `.gitignore`)

---

## 📋 Bước 8: Restart Dev Server

1. **Stop dev server** (nếu đang chạy):
   - Nhấn `Ctrl+C` trong terminal

2. **Start lại dev server**:
   ```bash
   npm run dev
   ```

3. **Kiểm tra console**:
   - Mở browser console (F12)
   - Nếu thấy warning "⚠️ Supabase not configured" → Kiểm tra lại `.env` file
   - Nếu không có warning → Supabase đã được cấu hình thành công!

---

## 📋 Bước 9: Test Leaderboard

1. **Connect wallet**:
   - Mở app trong browser
   - Click "Connect Wallet"
   - Chọn ví (MetaMask, Rabby, etc.)

2. **Thực hiện hành động**:
   - Visit dApps trên island
   - Complete quests
   - Điểm sẽ tự động tích lũy

3. **Chờ 2 giây**:
   - Sau khi có hành động, đợi 2 giây
   - Điểm sẽ tự động sync lên Supabase

4. **Mở Leaderboard**:
   - Click nút **"🏆 Leaderboard"** (góc dưới bên trái)
   - Kiểm tra điểm đã hiển thị

5. **Verify trong Supabase**:
   - Vào Supabase Dashboard → **Table Editor** → **leaderboard**
   - Bạn sẽ thấy 1 row với wallet address của bạn và các điểm số

---

## ✅ Checklist - Tổng Kết

Đánh dấu khi hoàn thành:

- [ ] Tạo Supabase account
- [ ] Tạo project mới
- [ ] Mở SQL Editor
- [ ] Copy SQL script
- [ ] Paste và Run SQL script
- [ ] Verify bảng `leaderboard` đã được tạo
- [ ] Copy Project URL
- [ ] Copy Anon Key
- [ ] Tạo file `.env` với credentials
- [ ] Restart dev server
- [ ] Test connect wallet
- [ ] Test leaderboard hiển thị điểm
- [ ] Verify data trong Supabase Table Editor

---

## 🐛 Troubleshooting

### Lỗi khi Run SQL: "relation already exists"

**Nguyên nhân**: Bảng đã tồn tại từ trước

**Giải pháp**:
- Xóa bảng cũ: `DROP TABLE IF EXISTS leaderboard CASCADE;`
- Hoặc bỏ qua lỗi (bảng đã được tạo rồi)

### Không tìm thấy file `supabase-migration.sql`

**Giải pháp**:
- Copy SQL code từ Bước 3 ở trên
- Paste trực tiếp vào SQL Editor

### File `.env` không hoạt động

**Kiểm tra**:
1. File tên đúng là `.env` (không phải `.env.txt`)
2. File ở đúng thư mục `ocean-adventure/` (root project)
3. Đã restart dev server
4. Không có khoảng trắng xung quanh dấu `=`

### Console vẫn hiển thị "Supabase not configured"

**Kiểm tra**:
1. File `.env` có tồn tại không?
2. Tên biến đúng: `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`
3. Giá trị không có dấu ngoặc kép: `VITE_SUPABASE_URL=https://...` (không phải `VITE_SUPABASE_URL="https://..."`)
4. Đã restart dev server chưa?

### Không thấy điểm trong leaderboard

**Kiểm tra**:
1. Wallet đã connect chưa?
2. Đã thực hiện hành động (visit dApp, complete quest) chưa?
3. Đã chờ đủ 2 giây sau khi có hành động chưa?
4. Console có lỗi không?
5. Supabase Table Editor có data không?

---

## 📸 Screenshot Guide (Nếu cần)

**SQL Editor trông như thế nào:**

```
┌─────────────────────────────────────┐
│ SQL Editor              [+ New]     │
├─────────────────────────────────────┤
│                                     │
│ [Text area - Paste SQL code here]  │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                              [Run]  │
└─────────────────────────────────────┘
```

**Table Editor trông như thế nào:**

```
┌─────────────────────────────────────┐
│ Table Editor          [+ New Table] │
├─────────────────────────────────────┤
│ leaderboard                         │
│   - id (uuid)                       │
│   - wallet_address (text)           │
│   - points (integer)                │
│   - xp (integer)                    │
│   - level (integer)                 │
│   ...                               │
└─────────────────────────────────────┘
```

---

**Chúc bạn thành công! 🎉**

Nếu gặp vấn đề, hãy kiểm tra lại từng bước hoặc xem Troubleshooting section ở trên.

