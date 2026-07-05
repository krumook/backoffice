# โครงสร้าง Google Sheet + API (ฉบับย่อสำหรับ deploy)

> ฉบับเต็มอยู่ที่ `DB-API-REFERENCE.md` (root ของ repo) — ไฟล์นี้คือสรุปพอ deploy ได้
> Google Sheet ชื่อ `krumook-db` มี **6 แท็บ** · ชื่อแท็บ + หัวคอลัมน์ต้องตรงกับ `SCHEMA` ใน `Code.gs`

## วิธีสร้างเร็วสุด
1. สร้างสเปรดชีตเปล่า → Extensions → Apps Script → วาง `Code.gs`
2. ตั้ง Script Properties: `API_SECRET` (จำเป็น), `SHEET_ID` (ทางเลือก)
3. รันฟังก์ชัน **`setupSheets()`** 1 ครั้ง → สร้างครบทั้ง 6 แท็บ + หัวคอลัมน์ + จัด `discord_id` เป็น Plain text ให้อัตโนมัติ

---

## 6 แท็บ

### `codes` — คลังรหัสการ์ด
| code | product | status | used_by_discord | email | used_at | created_at |
- `status`: `unused` · `used`
- `unused → used` ตอนลงทะเบียนผ่าน · `used → unused` เมื่อครูกด reject (ระบบคืนให้)

### `registrations` — คิวลงทะเบียน (หัวใจ)
| timestamp | discord_id | name | nickname | age | school | email | code | product | status | link_sent | approved_at | note |
- `status`: `pending` · `approved` · `rejected`
- `link_sent`: `no` · `yes`

### `products` — ทะเบียนสินค้า 📌 ครูดูแลผ่านหน้าเว็บ
| product | product_name | youtube_link |
- `youtube_link` = URL วิดีโอที่ตั้ง **Private** แล้ว — ต้องเติมก่อนเปิดขายเล่มนั้น

### `qa_quota` — โควต้าถามรายวัน (เฟส C)
| discord_id | date | count | premium_until |

### `slips` — สลิปสมัครถามเพิ่ม (เฟส C)
| timestamp | discord_id | slip_url | amount | status | reviewed_at |

### `config` — ค่าตั้งระบบ (key/value)
| key | value | — เช่น `daily_quota=2`, `promptpay_number`, `premium_price`, `teacher_name`

> ⚠️ `discord_id` เก็บเป็น **Text** เสมอ (ID ยาว 17–19 หลัก ถ้าเป็น Number จะโดนปัดเป็น `1.12E+17`)
> `setupSheets()` จัด format ให้แล้ว

---

## กติกา API

- **POST เท่านั้น** ไปที่ URL เดียว (`/exec`) แยกงานด้วยฟิลด์ `action`
- Body เป็น JSON ต้องมี `key` (= API_SECRET) + `action` เสมอ · ไม่ตรง → `{"ok":false,"reason":"unauthorized"}`
- ฝั่งเว็บใช้ `Content-Type: text/plain` เพื่อเลี่ยง CORS preflight (Apps Script ไม่รองรับ OPTIONS)
- Response: สำเร็จ `{"ok":true, ...}` · ล้มเหลว `{"ok":false, "reason":"..."}`
- `row` = เลขแถวจริงใน Sheet (หัวตาราง = แถว 1, ข้อมูลเริ่มแถว 2) ใช้อ้างอิงตอน approve/reject/markSent

### endpoints (action) ที่ `Code.gs` รองรับ
| action | ใครเรียก | ทำอะไร |
|--------|----------|--------|
| `checkAndRegister` | บอท | ตรวจรหัส + สร้าง registration (pending) — มี Lock |
| `addCode` | บอท | ลูกค้าเดิมเพิ่มเล่ม (ดึงโปรไฟล์เดิม) |
| `pollApproved` | บอท | ดึง approved ที่ยังไม่ส่งลิงก์ (แนบ youtube_link) |
| `markSent` | บอท | ปิด `link_sent = yes` |
| `listPending` | เว็บ | คิวรออนุมัติ |
| `getRegistration` | เว็บ | รายละเอียด 1 รายการ (`row`) + product_name/youtube_link |
| `approve` / `reject` | เว็บ | อนุมัติ / ปฏิเสธ (reject คืนรหัส unused) |
| `listProducts` | เว็บ | รายการสินค้า (ใช้ทดสอบรหัสตอน login ด้วย) |
| `addProduct` / `updateProduct` | เว็บ | เพิ่ม/แก้สินค้า |
| `generateCodes` | เว็บ | สุ่มรหัสไม่ซ้ำ (amount 1–500) — มี Lock |
| `addCodesBatch` | สคริปต์ | เติมรหัสจากภายนอก (ข้ามตัวซ้ำ) |
| `listCodes` / `getCodeInfo` | เว็บ | กรองรายการ / เช็ครหัสนี้ใครใช้ |
| `checkQuota` / `useQuota` | บอท | โควต้าถาม (เฟส C) |
| `submitSlip` / `listSlips` / `approveSlip` | ฟอร์ม/เว็บ | วงจรสลิป (เฟส C) |

### reason ที่ต้องแปลไทยบนจอ
`unauthorized` · `unknown_action` · `notfound` · `used` · `no_profile` · `duplicate` · `product_notfound` · `bad_request` · `server_error`

## Script Properties
| Property | ค่า | จำเป็น |
|----------|-----|--------|
| `API_SECRET` | รหัสลับที่ครูจะกรอกในเว็บ | ✅ |
| `SHEET_ID` | id สเปรดชีต (ถ้าไม่ตั้ง ใช้ Active) | ทางเลือก |
