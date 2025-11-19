# 🧪 Hướng Dẫn Testing DApp Features

Hướng dẫn chi tiết để test các tính năng mới đã được implement.

## 📋 Prerequisites

1. **MetaMask hoặc wallet tương thích** đã cài đặt
2. **Monad testnet tokens** - Lấy từ faucet
3. **NFT.Storage API key** (optional, cho IPFS upload) - Lấy tại https://nft.storage

## 🔧 Setup

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Setup Environment Variables (Optional - cho IPFS)

Tạo file `.env` trong thư mục root:

```env
VITE_NFT_STORAGE_KEY=your_nft_storage_api_key_here
```

**Lưu ý**: Nếu không có API key, IPFS sẽ sử dụng placeholder. NFT vẫn có thể mint được nhưng metadata sẽ là placeholder.

### 3. Start Development Server

```bash
npm run dev
```

App sẽ chạy tại `http://localhost:5173` (hoặc port khác nếu 5173 đã được sử dụng)

## ✅ Testing Checklist

### Test 1: Network Switching

**Mục đích**: Kiểm tra tự động switch sang Monad testnet

**Steps**:
1. Mở app trong browser
2. Click "Connect Wallet"
3. Nếu wallet đang ở network khác (ví dụ: Ethereum Mainnet), app sẽ tự động:
   - Hiển thị toast notification yêu cầu switch network
   - Khi mint NFT, sẽ tự động switch sang Monad testnet

**Expected Results**:
- ✅ Toast hiển thị thông báo network
- ✅ Wallet tự động switch sang Monad testnet (Chain ID: 10143)
- ✅ Network được add vào wallet nếu chưa có

**Troubleshooting**:
- Nếu wallet không tự động switch, check console để xem error
- Đảm bảo wallet đã approve network switch request

---

### Test 2: Toast Notifications

**Mục đích**: Kiểm tra hệ thống thông báo

**Steps**:
1. Connect wallet
2. Thực hiện các actions khác nhau (mint NFT, visit dApp, etc.)
3. Quan sát toast notifications ở góc trên bên phải

**Expected Results**:
- ✅ Toast hiển thị khi có action
- ✅ Toast tự động biến mất sau 5-7 giây
- ✅ Có thể click X để đóng sớm
- ✅ Loading toast hiển thị khi đang process transaction

**Test Cases**:
- Success toast: Xanh lá (mint thành công)
- Error toast: Đỏ (transaction failed)
- Info toast: Xanh dương (network info)
- Loading toast: Xanh dương với spinner (đang process)

---

### Test 3: Collect NFT (Mint Badge)

**Mục đích**: Test tính năng mint NFT khi collect dApp

**Steps**:
1. Connect wallet (đảm bảo có testnet tokens)
2. Điều khiển thuyền đến một đảo (WASD)
3. Press **E** để dock vào đảo
4. Click vào một model trên đảo (Hot, Newcomers, hoặc Quest zone)
5. Trong danh sách dApps hiển thị, click nút **"Collect"** bên cạnh một dApp
6. Approve transaction trong wallet
7. Chờ transaction confirm

**Expected Results**:
- ✅ Nút "Collect" hiển thị khi wallet đã connect
- ✅ Click "Collect" → Loading toast hiển thị
- ✅ Wallet popup hiển thị transaction
- ✅ Sau khi approve → Transaction pending toast
- ✅ Sau khi confirm → Success toast với token ID
- ✅ Nút chuyển thành "✓ Collected" (disabled)
- ✅ Không thể collect lại dApp đã collect

**Transaction Flow**:
1. "Preparing to mint NFT..." (loading)
2. "Switching to Monad testnet..." (nếu cần)
3. "Preparing metadata..."
4. "Uploading metadata to IPFS..."
5. "Estimating gas..."
6. "Confirm transaction in your wallet..."
7. "Transaction sent: 0x... Waiting for confirmation..."
8. "NFT minted successfully! Token ID: X"

**Troubleshooting**:
- **"Insufficient funds"**: Cần thêm testnet tokens
- **"Transaction rejected"**: User đã reject trong wallet
- **"Network error"**: Check RPC connection
- **IPFS upload fails**: Sẽ dùng placeholder, NFT vẫn mint được

---

### Test 4: IPFS Integration

**Mục đích**: Kiểm tra upload metadata lên IPFS

**Prerequisites**: Cần có `VITE_NFT_STORAGE_KEY` trong `.env`

**Steps**:
1. Setup NFT.Storage API key trong `.env`
2. Mint một NFT (theo Test 3)
3. Check console logs để xem IPFS hash
4. Sau khi mint, check transaction trên explorer
5. Verify metadata URI trong contract

**Expected Results**:
- ✅ Metadata được upload lên IPFS
- ✅ IPFS hash được lưu vào contract
- ✅ Có thể access metadata qua IPFS gateway

**Without API Key**:
- ✅ App vẫn hoạt động bình thường
- ✅ Sử dụng placeholder URI
- ✅ NFT vẫn mint được

**Check IPFS Hash**:
```javascript
// Trong console sau khi mint
// IPFS hash sẽ có format: ipfs://Qm...
// Có thể view tại: https://ipfs.io/ipfs/Qm...
```

---

### Test 5: On-Chain Data Fetching

**Mục đích**: Kiểm tra fetch data từ blockchain

**Steps**:
1. Connect wallet
2. Check console logs khi app load
3. Quan sát TVL và user count (nếu có trong dApp data)

**Expected Results**:
- ✅ App không crash khi fetch data
- ✅ Fallback về 0 nếu không fetch được
- ✅ Console logs hiển thị warnings nếu có lỗi

**Note**: 
- Nhiều dApps có thể không có `getTVL()` function
- User count được tính từ Transfer events
- Nếu contract không có events, sẽ return 0

---

### Test 6: Error Handling

**Mục đích**: Kiểm tra xử lý lỗi

**Test Cases**:

#### 6.1. Wallet Not Connected
- Click "Collect" khi chưa connect wallet
- **Expected**: Error toast "Please connect your wallet first"

#### 6.2. Wrong Network
- Connect wallet nhưng ở network khác
- **Expected**: Info toast yêu cầu switch network

#### 6.3. Insufficient Funds
- Mint NFT khi không đủ gas
- **Expected**: Error toast "Insufficient funds for gas"

#### 6.4. Transaction Rejected
- Click "Collect" → Reject trong wallet
- **Expected**: Error toast "Transaction rejected by user"

#### 6.5. Already Collected
- Click "Collect" trên dApp đã collect
- **Expected**: Info toast "You have already collected this dApp!"

---

### Test 7: Network Detection

**Mục đích**: Kiểm tra tự động detect network

**Steps**:
1. Connect wallet ở network khác (ví dụ: Ethereum Mainnet)
2. Quan sát toast notification
3. Switch network trong wallet
4. Quan sát app behavior

**Expected Results**:
- ✅ App detect network khi wallet connect
- ✅ Toast hiển thị nếu network sai
- ✅ Tự động switch khi mint NFT (nếu cần)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to mint NFT"
**Solution**:
- Check wallet có đủ testnet tokens
- Check network đúng (Monad testnet)
- Check console để xem error chi tiết

### Issue 2: "Network error"
**Solution**:
- Check RPC endpoint: `https://testnet-rpc.monad.xyz`
- Thử refresh page
- Check internet connection

### Issue 3: Toast không hiển thị
**Solution**:
- Check `ToastContainer` đã được thêm vào `App.jsx`
- Check console có errors không
- Thử refresh page

### Issue 4: IPFS upload fails
**Solution**:
- Check `VITE_NFT_STORAGE_KEY` trong `.env`
- Check API key có valid không
- App sẽ dùng placeholder nếu IPFS fails

### Issue 5: "Collect" button không hiển thị
**Solution**:
- Đảm bảo wallet đã connect
- Check `walletConnected` prop được pass vào `IslandEntities`
- Check console có errors không

---

## 📊 Test Results Template

Sử dụng template này để track test results:

```
Test Date: ___________
Tester: ___________

[ ] Test 1: Network Switching - PASS / FAIL
[ ] Test 2: Toast Notifications - PASS / FAIL
[ ] Test 3: Collect NFT - PASS / FAIL
[ ] Test 4: IPFS Integration - PASS / FAIL (Optional)
[ ] Test 5: On-Chain Data Fetching - PASS / FAIL
[ ] Test 6: Error Handling - PASS / FAIL
[ ] Test 7: Network Detection - PASS / FAIL

Notes:
_________________________________________________
_________________________________________________
```

---

## 🎯 Quick Test Script

Chạy script này để test nhanh:

```bash
# 1. Start dev server
npm run dev

# 2. Mở browser console và chạy:
# - Connect wallet
# - Navigate to island
# - Click entity
# - Click Collect button
# - Approve transaction
# - Check toast notifications
```

---

## 📝 Notes

- **Testnet tokens**: Cần để test mint NFT
- **IPFS API key**: Optional, nhưng recommended cho production
- **Network**: Phải là Monad testnet (Chain ID: 10143)
- **Contract**: Đã deploy tại `0x2B79C2676E631C40519503F75D116249cb08b02B`

---

**Happy Testing! 🚀**

