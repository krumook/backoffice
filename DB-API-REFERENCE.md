# 📘 DB & API Reference — krumook (เวอร์ชันทดลอง)

> เอกสารอ้างอิงกลางของทั้ง 2 repos (`krumook-discord-bot` และ `krumook-backoffice`)
> **วางสำเนาไฟล์นี้ไว้ใน root ของทั้งสอง repo** — ถ้าแก้ schema/API ต้องอัปเดตทั้งสองที่เสมอ
>
> DB = Google Sheet ชื่อ `krumook-db` (6 แท็บ) · API = Apps Script Web App (POST เท่านั้น)

---

## ส่วนที่ 1 — กติกากลางของข้อมูล (อ่านก่อน)

| เรื่อง | กติกา |
|---|---|
| `discord_id` | เก็บเป็น **ข้อความ (Text)** เสมอ — ห้ามปล่อยเป็นตัวเลข เพราะ ID ยาว 17–19 หลัก Sheets จะปัดเป็น `1.12233E+17` แล้วข้อมูลพัง → จัด format คอลัมน์เป็น Plain text |
| เวลา (timestamp) | รูปแบบ **ISO 8601 UTC** เช่น `2026-07-04T15:00:00.000Z` (Apps Script สร้างให้ ไม่ต้องพิมพ์มือ) |
| วันที่ (date) | รูปแบบ `yyyy-MM-dd` ตามเวลาไทย (Asia/Bangkok) เช่น `2026-07-04` |
| `code` | ตัวพิมพ์ใหญ่เสมอ รูปแบบ `PRODUCT-XXXX-XXXX` เช่น `MATH1-X7K2-9PQR` — ฝั่ง API แปลงเป็นพิมพ์ใหญ่ให้ก่อนเทียบ |
| `row` | เลขแถวจริงใน Sheet (แถวหัวตาราง = แถว 1, ข้อมูลเริ่มแถว 2) — API ส่งค่านี้กลับมาให้ใช้อ้างอิงตอน approve/reject/markSent |
| ค่าว่าง | ช่องที่ยังไม่มีข้อมูล = string ว่าง `""` ไม่ใช้ null |
| ใครแตะ Sheet ได้ | **Apps Script ตัวเดียวเท่านั้น** ที่อ่าน–เขียนผ่านโค้ด · ครูแก้มือได้เฉพาะแท็บ `products` และ `config` |

---

## ส่วนที่ 2 — Data Dictionary (6 แท็บ)

### 2.1 แท็บ `codes` — คลังรหัสการ์ดทุกใบ
1 แถว = การ์ด 1 ใบ · เพิ่มแถวโดย `addCodesBatch` · อัปเดตโดย `checkAndRegister`/`reject`

| คอลัมน์ | รูปแบบ | ค่าที่เป็นไปได้ | ตัวอย่าง |
|---|---|---|---|
| code | Text พิมพ์ใหญ่ | `PRODUCT-XXXX-XXXX` | `MATH1-X7K2-9PQR` |
| product | Text | ต้องมีคู่ในแท็บ `products` | `MATH1` |
| status | **enum 2 ค่า** | `unused` · `used` | `unused` |
| used_by_discord | Text | Discord ID หรือ `""` | `112233445566778899` |
| email | Text | อีเมล YouTube ของผู้ใช้รหัส หรือ `""` | `mook@gmail.com` |
| used_at | ISO 8601 หรือ `""` | | `2026-07-04T15:00:00.000Z` |
| created_at | ISO 8601 | | |

การเปลี่ยนสถานะ: `unused → used` (ตอนลงทะเบียนผ่าน) และ `used → unused` (เฉพาะกรณีครูกด reject — ระบบคืนรหัสให้อัตโนมัติ)

### 2.2 แท็บ `registrations` — คิวลงทะเบียน (หัวใจของระบบ)
1 แถว = การใช้รหัส 1 ครั้ง (คนเดียวซื้อ 3 เล่ม = 3 แถว) · เพิ่มโดยบอท · เปลี่ยนสถานะโดยครู/บอท

| คอลัมน์ | รูปแบบ | ค่าที่เป็นไปได้ | หมายเหตุ |
|---|---|---|---|
| timestamp | ISO 8601 | | เวลาส่งฟอร์ม |
| discord_id | Text | | |
| name / nickname / age / school | Text | | age เก็บเป็น Text (เช่น `16`) |
| email | Text | | อีเมลที่ครูจะเอาไปเชิญใน YouTube |
| code / product | Text | | รหัสที่ใช้ + เล่มที่ได้ |
| status | **enum 3 ค่า** | `pending` · `approved` · `rejected` | ดู state machine ด้านล่าง |
| link_sent | **enum 2 ค่า** | `no` · `yes` | `yes` = บอทส่งลิงก์แล้ว |
| approved_at | ISO 8601 หรือ `""` | | |
| note | Text | | เหตุผลตอน reject |
| reviewed_by / reviewed_at | Text / ISO | | ใครกดอนุมัติ–ปฏิเสธ เมื่อไหร่ |
| discord_username | Text | | ชื่อบัญชี Discord เช่น `mook_sy` (บอทส่งมาให้) |
| discord_avatar | URL | | รูปโปรไฟล์ Discord — บอทอัปเดตค่าล่าสุดทุกครั้งที่นักเรียนลงทะเบียน/เพิ่มเล่ม |

**State machine ของ 1 รายการขาย:**
```
บอทสร้างแถว ──▶ pending + no ──ครูกดอนุมัติ──▶ approved + no ──poller ส่งลิงก์──▶ approved + yes ✅ ปิดการขาย
                     │
                     └──ครูกดปฏิเสธ──▶ rejected (+ note) และรหัสในแท็บ codes ถูกคืนเป็น unused
```

### 2.3 แท็บ `products` — ทะเบียนสินค้า 📌 ครูดูแลเองด้วยมือ
1 แถว = หนังสือ 1 เล่ม · **ต้องกรอกให้ครบก่อนเปิดขายเล่มนั้น** ไม่งั้น poller จะได้ลิงก์ว่าง

| คอลัมน์ | รูปแบบ | ตัวอย่าง |
|---|---|---|
| product | Text — ตัวเดียวกับที่ใช้ gen code | `MATH1` |
| product_name | Text อ่านง่าย | `เฉลยคณิต ม.4 เล่ม 1` |
| youtube_link | URL ของวิดีโอที่ตั้งเป็น **ส่วนตัว (Private)** แล้ว | `https://youtu.be/AbCdEf` |

### 2.4 แท็บ `qa_quota` — โควต้าถามรายวัน (เฟสถาม–ตอบ)
1 แถว = คน 1 คนใน 1 วัน (แถวใหม่ทุกวันที่มีการถาม)

| คอลัมน์ | รูปแบบ | หมายเหตุ |
|---|---|---|
| discord_id | Text | |
| date | `yyyy-MM-dd` (เวลาไทย) | `2026-07-04` |
| count | Number 0–99 | จำนวนคำถามที่ใช้ไปในวันนั้น (เพดานปกติ = 2) |
| premium_until | ISO 8601 หรือ `""` | มีค่าและยังไม่เลยวันนี้ = ถามได้ไม่จำกัด |

### 2.5 แท็บ `slips` — สลิปสมัครถามเพิ่ม
| คอลัมน์ | รูปแบบ | ค่าที่เป็นไปได้ |
|---|---|---|
| timestamp | ISO 8601 | |
| discord_id | Text | |
| slip_url | URL รูปสลิป (ลิงก์ไฟล์ใน Google Drive) | |
| amount | Number (บาท) | |
| status | **enum 3 ค่า** | `pending` · `approved` · `rejected` |
| reviewed_at | ISO 8601 หรือ `""` | |

อนุมัติแล้วระบบเพิ่มแถวใน `qa_quota` ให้ premium_until = สิ้นเดือนปัจจุบัน 23:59:59

### 2.6 แท็บ `config` — ค่าตั้งระบบ (key / value)
| key ที่แนะนำ | value ตัวอย่าง |
|---|---|
| promptpay_number | `08x-xxx-xxxx` |
| premium_price | `99` |
| teacher_name | `ครูมุก` |

---

## ส่วนที่ 3 — API Contract

### 🔁 Flow ชีวิตของรหัส 1 ใบ (มุมมองหลังบ้าน)
```
ครูสร้างสินค้า (addProduct: MATH1)
   → ครูสั่งสุ่มรหัส (generateCodes: MATH1 × 100)
      → API สุ่มแบบไม่ซ้ำทั้งระบบ บันทึกสถานะ unused คืนรายการรหัสกลับมา
         → หน้าเว็บแสดงรหัส / ดาวน์โหลด → เอาไปพิมพ์บนการ์ด
            → นักเรียนกรอกรหัส (checkAndRegister) → สถานะเปลี่ยนเป็น used ใช้ซ้ำไม่ได้อีก
               (ยกเว้นครูกด reject → คืนเป็น unused ให้ลงทะเบียนใหม่)
```

### กติการ่วมทุก endpoint
- Method: **POST เท่านั้น** ไปที่ `SHEETS_API_URL` (ลงท้าย `/exec`)
- Header: `Content-Type: application/json`
- Body ต้องมีเสมอ: `"key"` (= API_SECRET) และ `"action"` (ชื่อ endpoint)
- ฝั่งเรียกต้อง **follow redirect** (curl ใส่ `-L`, fetch ของ Node ตามให้อยู่แล้ว) — Apps Script ตอบผ่าน redirect 302 เสมอ
- Response envelope: สำเร็จ = `{"ok": true, ...}` · ล้มเหลว = `{"ok": false, "reason": "..."}`

**ตาราง reason ที่เป็นไปได้ทั้งหมด:**

| reason | ความหมาย | ฝั่งเรียกควรทำอะไร |
|---|---|---|
| `unauthorized` | key ไม่ตรง | เช็ค API_SECRET สองฝั่ง |
| `unknown_action` | action สะกดผิด | เช็คชื่อ endpoint |
| `notfound` | รหัสไม่มีในระบบ | บอกนักเรียน "ตรวจตัวสะกดบนการ์ด" |
| `used` | รหัสถูกใช้ไปแล้ว | บอกนักเรียน "รหัสนี้ถูกใช้แล้ว ติดต่อแอดมิน" |
| `no_profile` | เพิ่มเล่มแต่ไม่เคยลงทะเบียน | ให้ไปกดลงทะเบียนก่อน |
| `bad_request` | ข้อมูลที่ส่งมาไม่ครบ/ผิดรูปแบบ | เช็ค body ที่ส่ง |
| `duplicate` | สร้าง product ชื่อซ้ำของเดิม | ใช้ชื่ออื่น หรือใช้ตัวเดิมที่มีอยู่ |
| `product_notfound` | สั่ง generate code ของ product ที่ยังไม่ได้สร้าง | สร้าง product ก่อนด้วย addProduct |
| `server_error` | error อื่นๆ (มี `message` แนบ) | log ไว้ + แจ้งลองใหม่ |

### 3.1 `checkAndRegister` — ลูกค้าใหม่ลงทะเบียน *(บอทเรียก)*
```jsonc
// Request
{ "key": "...", "action": "checkAndRegister",
  "discord_id": "112233445566778899",
  "name": "สมหญิง ใจดี", "nickname": "มุก", "age": "16",
  "school": "สาธิตฯ", "email": "mook@gmail.com",
  "code": "MATH1-X7K2-9PQR" }

// Response (ผ่าน)
{ "ok": true, "product": "MATH1", "row": 7 }
// Response (ไม่ผ่าน)
{ "ok": false, "reason": "used" }        // หรือ "notfound"
```
ผลข้างเคียง: codes → `used` + registrations เพิ่มแถว `pending,no` · มี Lock กัน 2 คนใช้รหัสเดียวกันพร้อมกัน

**การใช้ `row` ต่อ:** บอทเอาไปประกอบลิงก์หน้ารายละเอียดแล้วแปะในแจ้งเตือนครู เช่น
`{BACKOFFICE_URL}/?row=7` (เก็บ BACKOFFICE_URL ไว้ใน .env ของบอท) — ครูกดลิงก์
→ หน้าเว็บเรียก `getRegistration` แสดงข้อมูลครบ + ปุ่มไป YouTube Studio + ปุ่ม Approve

### 3.2 `addCode` — ลูกค้าเดิมเพิ่มเล่ม *(บอทเรียก)*
```jsonc
// Request
{ "key": "...", "action": "addCode",
  "discord_id": "112233445566778899", "code": "MATH2-A3BC-7XYZ" }
// Response: เหมือน checkAndRegister ทุกกรณี (มี row ด้วย) + เพิ่ม "no_profile" ได้
```
ระบบดึง ชื่อ/อีเมล จากการลงทะเบียนล่าสุดของ discord_id นี้ให้เอง

### 3.3 `pollApproved` — ดึงรายการที่ครูอนุมัติแล้วรอส่งลิงก์ *(บอทเรียกทุก 30–60 วิ)*
```jsonc
// Request
{ "key": "...", "action": "pollApproved" }
// Response
{ "ok": true, "items": [
  { "row": 7, "discord_id": "1122...", "nickname": "มุก",
    "product": "MATH1", "youtube_link": "https://youtu.be/AbCdEf" }
]}
```
⚠️ ถ้า `youtube_link` เป็น `""` = ครูยังไม่กรอกแท็บ products — บอทควรแจ้งเตือนครูแทนการส่งลิงก์ว่าง

### 3.4 `markSent` — ติ๊กว่าส่งลิงก์แล้ว *(บอทเรียก หลังส่งลิงก์สำเร็จ)*
```jsonc
{ "key": "...", "action": "markSent", "row": 7 }   →   { "ok": true }
```

### 3.5 `listPending` — คิวรออนุมัติ *(เว็บครูเรียก)*
```jsonc
{ "key": "...", "action": "listPending" }
// Response
{ "ok": true, "items": [
  { "row": 7, "timestamp": "2026-07-04T15:00:00.000Z",
    "name": "สมหญิง ใจดี", "nickname": "มุก", "school": "สาธิตฯ",
    "email": "mook@gmail.com", "code": "MATH1-X7K2-9PQR", "product": "MATH1" }
]}
```

### 3.6 `getRegistration` — รายละเอียด 1 รายการ *(เว็บครูเรียก — ปลายทางลิงก์จากแจ้งเตือน Discord)*
```jsonc
{ "key": "...", "action": "getRegistration", "row": 7 }
// Response
{ "ok": true, "item": {
  "row": 7, "timestamp": "2026-07-04T15:00:00.000Z",
  "name": "สมหญิง ใจดี", "nickname": "มุก", "age": "16", "school": "สาธิตฯ",
  "email": "mook@gmail.com", "code": "MATH1-X7K2-9PQR",
  "product": "MATH1", "product_name": "เฉลยคณิต ม.4 เล่ม 1",
  "youtube_link": "https://youtu.be/AbCdEf",   // ไว้ทำปุ่ม "เปิดวิดีโอใน Studio"
  "status": "pending", "link_sent": "no", "approved_at": "", "note": "" } }
```
หน้าเว็บใช้ endpoint นี้กับ URL แบบ `/?row=7` — ครูเห็นอีเมลที่ต้อง copy ไปเชิญใน YouTube
ทำเสร็จแล้วกด Approve ในหน้าเดียวกัน

### 3.7 `approve` / 3.8 `reject` *(เว็บครูเรียก)*
```jsonc
{ "key": "...", "action": "approve", "row": 7 }
→ { "ok": true, "status": "approved", "approved_at": "2026-07-04T15:05:00.000Z" }
{ "key": "...", "action": "reject", "row": 7, "reason": "อีเมลผิด" }     → { "ok": true }
```
หลัง approve: สถานะเปลี่ยนทันทีทั้งใน Sheets และทุกหน้าจอที่ query ใหม่ —
poller ของบอทจะเจอรายการนี้ในรอบถัดไป (≤ 45 วิ) แล้วส่งลิงก์ให้นักเรียน
reject มีผลข้างเคียงสำคัญ: **คืนรหัสในแท็บ codes กลับเป็น `unused`** ให้ลงทะเบียนใหม่ได้

### 3.9 `addProduct` — สร้างสินค้าใหม่ *(เว็บครูเรียก — ต้องทำก่อน generate code เสมอ)*
```jsonc
{ "key": "...", "action": "addProduct",
  "product": "MATH1", "product_name": "เฉลยคณิต ม.4 เล่ม 1", "youtube_link": "" }
→ { "ok": true, "product": "MATH1" }
→ { "ok": false, "reason": "duplicate" }     // ชื่อ product ซ้ำของเดิม
```
`youtube_link` เว้นว่างตอนสร้างได้ แล้วค่อยเติมทีหลังด้วย `updateProduct` — แต่ต้องเติมก่อนเปิดขาย

### 3.10 `listProducts` — รายการสินค้า + ค้นหา/กรองวันที่สร้าง *(เว็บครูเรียก)*
```jsonc
// ตัวกรองทุกตัว optional: search (ชื่อ/รหัสสินค้า), created_from, created_to
// วันที่รับได้ 2 แบบ: "2026-07-01" (= ทั้งวันตามเวลาไทย) หรือ ISO เต็ม
{ "key": "...", "action": "listProducts",
  "search": "คณิต", "created_from": "2026-07-01", "created_to": "2026-07-31" }
→ { "ok": true, "items": [
    { "row": 2, "product": "MATH1", "product_name": "เฉลยคณิต ม.4 เล่ม 1",
      "youtube_link": "https://youtu.be/AbCdEf" } ] }
```

### 3.11 `updateProduct` — แก้ชื่อ/ลิงก์วิดีโอ *(เว็บครูเรียก)*
```jsonc
{ "key": "...", "action": "updateProduct", "row": 2,
  "youtube_link": "https://youtu.be/AbCdEf" }
→ { "ok": true }
```

### 3.12 `generateCodes` ★ — สั่งสุ่มรหัสฝั่ง API *(เว็บครูเรียก)*
เลือก product + จำนวน → API สุ่มให้เอง **การันตีไม่ซ้ำกับทุกรหัสในระบบและไม่ซ้ำกันเองในล็อต**
(มี Lock กันสั่งซ้อนกัน) → บันทึกลงแท็บ codes สถานะเริ่มต้น `unused` → คืนรายการรหัสกลับไปแสดง/ดาวน์โหลดไปทำการ์ด
```jsonc
{ "key": "...", "action": "generateCodes", "product": "MATH1", "amount": 100 }
→ { "ok": true, "product": "MATH1", "amount": 100,
    "codes": ["MATH1-X7K2-9PQR", "MATH1-A3BC-7XYZ", "..."] }
→ { "ok": false, "reason": "product_notfound" }   // ยังไม่ได้ addProduct
```
ข้อจำกัด: `amount` 1–500 ต่อครั้ง (ล็อตใหญ่กว่านั้นให้สั่งหลายรอบ)

### 3.13 `listCodes` — ค้นหา/กรองรายการรหัส *(เว็บครูเรียก)*
```jsonc
// ตัวกรองทุกตัว optional: product, status, search (ค้นบางส่วนของรหัส),
// created_from, created_to (ช่วงวันที่สร้างรหัส — รับ "2026-07-01" หรือ ISO)
{ "key": "...", "action": "listCodes", "product": "MATH1", "status": "unused",
  "search": "X7K2", "created_from": "2026-07-01", "created_to": "2026-07-31" }
→ { "ok": true, "count": 3, "items": [ { "code": "MATH1-X7K2-9PQR",
    "product": "MATH1", "status": "unused", "used_by_discord": "", "used_at": "",
    "created_at": "2026-07-05T10:15:00.000Z", "created_by": "ครูมุก" } ] }
```

### 3.14 `getCodeInfo` — เช็คว่ารหัสนี้ใครใช้ *(เว็บครูเรียก)*
```jsonc
{ "key": "...", "action": "getCodeInfo", "code": "MATH1-X7K2-9PQR" }
// Response
{ "ok": true, "item": {
  "code": "MATH1-X7K2-9PQR", "product": "MATH1", "status": "used",
  "used_by_discord": "112233445566778899", "email": "mook@gmail.com",
  "used_at": "2026-07-04T15:00:00.000Z",
  "user": { "row": 7, "name": "สมหญิง ใจดี", "nickname": "มุก",
            "school": "สาธิตฯ", "registration_status": "approved", "link_sent": "yes" } } }
// รหัสที่ยังไม่ถูกใช้: status = "unused" และ user = null
```

### 3.15 `addCodesBatch` — เติมรหัสจากภายนอก *(ตัวเลือกสำรอง — ทางหลักคือ generateCodes)*
```jsonc
{ "key": "...", "action": "addCodesBatch",
  "product": "MATH1", "codes": ["MATH1-AAAA-1111", "MATH1-BBBB-2222"] }
→ { "ok": true, "added": 2 }     // รหัสที่ซ้ำของเดิมจะถูกข้าม ไม่นับใน added
```

### 3.16 `checkQuota` / 3.17 `useQuota` — โควต้าถาม *(บอทเรียก เฟส C)*
```jsonc
{ "key": "...", "action": "checkQuota", "discord_id": "1122..." }
→ { "ok": true, "count": 1, "limit": 2, "premium": false }
// บอทตัดสินใจ: premium=true หรือ count<limit → เปิดคำถามได้ แล้วค่อยเรียก useQuota

{ "key": "...", "action": "useQuota", "discord_id": "1122..." }   → { "ok": true }
```

### 3.18 `submitSlip` / 3.19 `listSlips` / 3.20 `approveSlip` — วงจรสลิป *(เฟส C)*
```jsonc
{ "key": "...", "action": "submitSlip",
  "discord_id": "1122...", "slip_url": "https://drive.google.com/...", "amount": 99 }
→ { "ok": true }

{ "key": "...", "action": "listSlips" }
→ { "ok": true, "items": [ { "row": 3, "timestamp": "...", "discord_id": "1122...",
                             "slip_url": "...", "amount": 99 } ] }

{ "key": "...", "action": "approveSlip", "row": 3 }
→ { "ok": true }   // ผลข้างเคียง: qa_quota เพิ่มแถว premium_until = สิ้นเดือนนี้ 23:59:59
```

### 3.21 `listRegistrations` — ค้นหารายชื่อนักเรียน + กรองช่วงเวลาอนุมัติ *(เว็บครูเรียก)*
```jsonc
// ตัวกรองทุกตัว optional:
//   search       — ค้นบางส่วนจาก ชื่อ/ชื่อเล่น/โรงเรียน/อีเมล/รหัส/discord_id
//   status       — pending | approved | rejected
//   approved_from, approved_to — ช่วงเวลาที่กดอนุมัติ (ใส่แล้วผลลัพธ์เหลือเฉพาะ approved)
{ "key": "...", "action": "listRegistrations",
  "search": "มุก", "approved_from": "2026-07-01", "approved_to": "2026-07-31" }
→ { "ok": true, "count": 2, "items": [
    { "row": 7, "timestamp": "...", "discord_id": "1122...",
      "name": "สมหญิง ใจดี", "nickname": "มุก", "school": "สาธิตฯ",
      "email": "mook@gmail.com", "code": "MATH1-X7K2-9PQR", "product": "MATH1",
      "status": "approved", "link_sent": "yes",
      "approved_at": "2026-07-05T11:20:00.000Z", "reviewed_by": "ครูมุก" } ] }
// ผลลัพธ์ตัดที่ 500 แถวแรก (count = จำนวนจริงทั้งหมดก่อนตัด)
```

### 3.22 `listStudents` — รายชื่อนักเรียนแบบรวมคนละแถว *(เว็บครูเรียก)*
มุมมอง "ตัวคนเป็นหลัก": นักเรียน 1 คน = 1 แถว ไม่ว่าถือกี่เล่ม พร้อมตัวนับสรุป
```jsonc
{ "key": "...", "action": "listStudents", "search": "Mook" }   // search optional
→ { "ok": true, "count": 1, "items": [
    { "discord_id": "111111111111111111",
      "name": "Somying Jaidee", "nickname": "Mook",
      "school": "Satit School", "email": "mook@gmail.com",
      "first_registered": "2026-07-04T15:00:00.000Z",   // เริ่มสมัครครั้งแรก
      "last_activity": "2026-07-05T09:10:00.000Z",
      "products_total": 2, "approved": 2, "pending": 0, "rejected": 0 } ] }
// เรียงตามความเคลื่อนไหวล่าสุดก่อน · ตัดที่ 500 แถว
```

### 3.23 `getStudent` — โปรไฟล์เต็มของนักเรียน 1 คน *(เว็บครูเรียก)*
ทุกเล่มที่ถือ + สถานะอนุมัติรายเล่ม + วันสมัคร/วันอนุมัติ + สถานะโควต้าถาม–ตอบ
```jsonc
{ "key": "...", "action": "getStudent", "discord_id": "111111111111111111" }
→ { "ok": true, "student": {
    "discord_id": "111111111111111111",
    "name": "Somying Jaidee", "nickname": "Mook", "age": "16",
    "school": "Satit School", "email": "mook@gmail.com",
    "first_registered": "2026-07-04T15:00:00.000Z",
    "products_total": 2,
    "products": [
      { "row": 2, "code": "MATH1-X7K2-9PQR", "product": "MATH1",
        "status": "approved", "link_sent": "yes",
        "registered_at": "2026-07-04T15:00:00.000Z",
        "approved_at": "2026-07-04T16:05:00.000Z",
        "reviewed_by": "Teacher Mook", "note": "" },
      { "row": 5, "code": "MATH2-B7CD-3EFG", "product": "MATH2",
        "status": "approved", "link_sent": "no",
        "registered_at": "2026-07-05T09:10:00.000Z",
        "approved_at": "2026-07-05T09:40:00.000Z",
        "reviewed_by": "Teacher Mook", "note": "" }
    ],
    "quota_today": 2, "quota_limit": 2,
    "premium": false, "premium_until": "" } }
→ { "ok": false, "reason": "notfound" }      // ไม่เคยลงทะเบียน
→ { "ok": false, "reason": "bad_request" }   // ไม่ส่ง discord_id
```

---

## ส่วนที่ 4 — เช็คลิสต์เวลาแก้ schema/API

- [ ] แก้ `SCHEMA` ใน Code.gs + รัน setupSheets (แท็บใหม่) หรือเพิ่มคอลัมน์ท้ายตารางเท่านั้น (ห้ามแทรกกลาง — เลข row/ลำดับคอลัมน์ที่โค้ดอ้างจะเพี้ยน)
- [ ] Deploy → Manage deployments → **New version** (แค่ Save ยังไม่ขึ้น production)
- [ ] อัปเดตไฟล์นี้ทั้งใน repo bot และ repo backoffice ให้ตรงกัน
- [ ] แจ้งอีกฝั่ง (บอท/เว็บ) ให้ปรับตาม
