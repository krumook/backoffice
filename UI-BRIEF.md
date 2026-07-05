# 🗂️ UI Brief — เว็บหลังบ้านครู (krumook-backoffice)

> บรีฟสำหรับพัฒนาเว็บหลังบ้าน วางไว้ที่ root ของ repo `krumook-backoffice`
> อ่านคู่กับ `DB-API-REFERENCE.md` (spec request/response ละเอียดอยู่ที่นั่น)

## ข้อกำหนดพื้นฐาน

- เว็บ **static ล้วน** (HTML/CSS/JS) เสิร์ฟผ่าน GitHub Pages จากโฟลเดอร์ `/docs`
- ทุกการอ่าน–เขียนข้อมูล = `fetch POST` ไปที่ Apps Script API เส้นเดียว (`SHEETS_API_URL`)
- **ผู้ใช้มีคนเดียวคือครู** และส่วนใหญ่**เปิดจากมือถือ** (กดลิงก์จากแจ้งเตือน Discord)
  → ออกแบบ mobile-first, ปุ่มใหญ่, ตัวหนังสือไทยอ่านง่าย, ทำงานจบได้ในมือเดียว
- ภาษาไทยทั้งระบบ
- ห้ามฝัง API_SECRET ในโค้ด (repo เป็น public) — ครูกรอกเองครั้งเดียวที่หน้า Login

## กติกากลางทุกหน้า

| เรื่อง | ข้อกำหนด |
|---|---|
| Auth | เช็ค `sessionStorage.secret` — ไม่มี → redirect ไปหน้า Login (พก query เดิมไปด้วย เช่น `?row=7`) |
| เรียก API | helper กลางตัวเดียว `api(action, payload)` แนบ `key` อัตโนมัติ + follow redirect |
| Loading | ทุกปุ่มที่ยิง API ต้องขึ้นสถานะกำลังทำงาน + กดซ้ำไม่ได้ (Apps Script ตอบช้า 1–3 วิ เป็นปกติ) |
| Error | `ok:false` → toast สีแดงพร้อมข้อความจากตาราง reason · `unauthorized` → เด้งกลับหน้า Login |
| สำเร็จ | toast สีเขียว + refresh ข้อมูลบนจอทันที |
| ยืนยัน | Approve / Reject / Generate ต้องมี dialog ยืนยันก่อนเสมอ (กันนิ้วลั่นบนมือถือ) |

## แผนผังหน้า (6 หน้า)

```
Login ──▶ 🏠 คิวรออนุมัติ (หน้าแรก)
              ├─▶ 📄 รายละเอียดรายการ  /?row=N   ← ปลายทางลิงก์จาก Discord
              ├─▶ 📚 สินค้า
              ├─▶ 🎟️ สร้างรหัส
              ├─▶ 🔍 ค้นหารหัส
              └─▶ 💳 สลิปรอตรวจ (เฟส C)
```
Navigation: แถบเมนูล่างจอ (มือถือ) / แถบข้าง (จอใหญ่)

---

## หน้า 0 — Login

**หน้าที่:** รับ API_SECRET ครั้งเดียวต่อ session

| ส่วนประกอบ | รายละเอียด |
|---|---|
| ช่องกรอกรหัสลับ (type=password) + ปุ่ม "เข้าใช้งาน" | |
| ตรวจรหัสถูกไหม | ยิง `listProducts` 1 ครั้ง — `ok:true` = ผ่าน เก็บลง sessionStorage แล้วไปหน้าที่ตั้งใจจะไป · `unauthorized` = แจ้ง "รหัสไม่ถูกต้อง" |

**API ที่เรียก:** `listProducts` (ใช้เป็นตัวทดสอบรหัส)

---

## หน้า 1 — 🏠 คิวรออนุมัติ (หน้าแรก)

**หน้าที่:** เห็นทุกรายการที่รอครูจัดการ เข้าไปทำงานต่อได้ใน 1 แตะ

```
┌──────────────────────────────┐
│ รออนุมัติ (3)        [รีเฟรช] │
├──────────────────────────────┤
│ 🧑 มุก · สาธิตฯ               │
│ 📕 MATH1 · mook@gmail.com    │
│ 🕐 5 นาทีที่แล้ว    [จัดการ ▸] │
├──────────────────────────────┤
│ ... การ์ดถัดไป ...            │
└──────────────────────────────┘
```

| ส่วนประกอบ | รายละเอียด |
|---|---|
| การ์ดรายการละใบ | ชื่อเล่น+ชื่อ, โรงเรียน, product, **อีเมล**, เวลาส่ง (แปลงเป็น "x นาทีที่แล้ว") |
| ปุ่ม [จัดการ ▸] | ลิงก์ไป `/?row=N` |
| Empty state | "🎉 ไม่มีรายการค้าง" |
| Auto-refresh | ทุก 60 วิ ตอนหน้าเปิดอยู่ |

**API ที่เรียก:** `listPending` (ตอนเปิดหน้า + กดรีเฟรช + auto ทุก 60 วิ)

---

## หน้า 2 — 📄 รายละเอียดรายการ `/?row=N` ★ หน้าสำคัญที่สุด

**หน้าที่:** ครูกดจากแจ้งเตือน Discord แล้ว "จบงานอนุมัติได้ในหน้าเดียว"
งานจริงของครูคือ 3 จังหวะ: copy อีเมล → ไปเชิญใน YouTube → กลับมากด Approve
→ ทุก element ต้องรับใช้ 3 จังหวะนี้

```
┌──────────────────────────────┐
│ ◀ กลับ        รายการ #7       │
│ สถานะ: 🟡 รออนุมัติ            │
├──────────────────────────────┤
│ มุก (สมหญิง ใจดี) · 16 · สาธิตฯ│
│ 📕 เฉลยคณิต ม.4 เล่ม 1 (MATH1)│
│ 🎟️ MATH1-X7K2-9PQR           │
├──────────────────────────────┤
│ ✉️ mook@gmail.com   [📋 Copy] │  ← ปุ่ม copy ใหญ่ๆ ตัวเดียวจบ
│ [▶ เปิดวิดีโอเล่มนี้ใน YouTube] │  ← จาก youtube_link
├──────────────────────────────┤
│ ทำ 2 ขั้นให้ครบก่อนกดอนุมัติ:   │
│ ① copy อีเมล → เชิญใน YouTube │
│ ② กลับมากดปุ่มด้านล่าง          │
│                              │
│ [ ✅ อนุมัติ ]   [ ❌ ปฏิเสธ ]   │
└──────────────────────────────┘
```

| ส่วนประกอบ | รายละเอียด |
|---|---|
| ปุ่ม 📋 Copy อีเมล | copy ลง clipboard + toast "คัดลอกแล้ว" |
| ปุ่มเปิดวิดีโอ | เปิด `youtube_link` แท็บใหม่ · ถ้าลิงก์ว่าง → แสดงคำเตือนแดง "เล่มนี้ยังไม่ใส่ลิงก์วิดีโอ ไปที่หน้าสินค้าก่อน" + ลิงก์ไปหน้าสินค้า |
| ปุ่ม ✅ อนุมัติ | dialog ยืนยัน "เพิ่มอีเมลใน YouTube แล้วใช่ไหม?" → เรียก `approve` → สถานะบนจอเปลี่ยนเป็น 🟢 อนุมัติแล้ว + ข้อความ "บอทจะส่งลิงก์ให้นักเรียนภายใน ~1 นาที" |
| ปุ่ม ❌ ปฏิเสธ | dialog มีช่องกรอกเหตุผล → เรียก `reject` → แจ้งว่า "รหัสถูกคืนสถานะ ใช้ลงทะเบียนใหม่ได้" |
| กรณี status ไม่ใช่ pending | ซ่อนปุ่มทั้งสอง แสดง badge สถานะจริง (approved/rejected + link_sent) — กันกดซ้ำจากลิงก์เก่า |

**API ที่เรียก:** `getRegistration` (ตอนเปิดหน้า) → `approve` หรือ `reject` (ตอนกดปุ่ม)

---

## หน้า 3 — 📚 สินค้า

**หน้าที่:** สร้าง/แก้ทะเบียนหนังสือ และเป็นที่เดียวที่ใส่ลิงก์ YouTube

| ส่วนประกอบ | รายละเอียด |
|---|---|
| ตารางสินค้า | product, ชื่อเล่ม, สถานะลิงก์ (✅ มี / ⚠️ ยังไม่ใส่ — ตัวเตือนสำคัญ), ปุ่มแก้ไข |
| ฟอร์มเพิ่มสินค้า | ช่อง product (บังคับ, ระบบแปลงพิมพ์ใหญ่), ชื่อเล่ม, ลิงก์ YouTube (ไม่บังคับ) |
| กรณีชื่อซ้ำ | reason `duplicate` → แจ้ง "มีรหัสสินค้านี้แล้ว" |
| แก้ไข | เปิดฟอร์มเดิม แก้ได้เฉพาะชื่อเล่ม+ลิงก์ → `updateProduct` |

**API ที่เรียก:** `listProducts` (เปิดหน้า) · `addProduct` (เพิ่ม) · `updateProduct` (แก้)

---

## หน้า 4 — 🎟️ สร้างรหัส

**หน้าที่:** เลือกเล่ม + จำนวน → ได้รหัสไปทำการ์ด

```
เลือกสินค้า: [MATH1 ▾]   จำนวน: [100]   [🎲 สร้างรหัส]
──────────────────────────────────────────
✅ สร้างสำเร็จ 100 รหัส (MATH1)
[⬇️ ดาวน์โหลด CSV]  [📋 Copy ทั้งหมด]
MATH1-X7K2-9PQR
MATH1-A3BC-7XYZ
...
```

| ส่วนประกอบ | รายละเอียด |
|---|---|
| Dropdown สินค้า | จาก `listProducts` · ถ้ายังไม่มีสินค้า → แสดงลิงก์ "ไปสร้างสินค้าก่อน" |
| ช่องจำนวน | 1–500 (validate ฝั่งหน้าเว็บด้วย) |
| dialog ยืนยัน | "สร้าง 100 รหัสของ MATH1 ใช่ไหม? รหัสจะถูกบันทึกเข้าระบบทันที" |
| ผลลัพธ์ | โชว์รายการรหัส + ปุ่มดาวน์โหลด **CSV** (`code,product` — format ที่ส่งโรงพิมพ์) + ปุ่ม Copy |
| คำเตือนบนจอ | "ดาวน์โหลดเก็บไว้เลย — แต่ถ้าหาย ดึงซ้ำได้ที่หน้าค้นหารหัส" |

**API ที่เรียก:** `listProducts` (เติม dropdown) · `generateCodes` (ปุ่มสร้าง)

---

## หน้า 5 — 🔍 ค้นหารหัส

**หน้าที่:** ตอบคำถาม "รหัสนี้ใครใช้" + ดูสถิติคงเหลือ + export ซ้ำ

| ส่วนประกอบ | รายละเอียด |
|---|---|
| ช่องค้นหารหัสเดี่ยว | วางรหัส → `getCodeInfo` → การ์ดผลลัพธ์: สถานะ, ใครใช้ (ชื่อ/โรงเรียน/อีเมล), สถานะอนุมัติ, ส่งลิงก์แล้วหรือยัง + ลิงก์ไป `/?row=N` ของรายการนั้น |
| ตัวกรองรายการ | dropdown product + dropdown สถานะ (ทั้งหมด/unused/used) → `listCodes` |
| แถบสรุปบนตาราง | "MATH1: เหลือ 87 / ใช้ไป 13" (นับจากผล listCodes) |
| ปุ่ม export CSV | จากผลการกรองปัจจุบัน (ไว้พิมพ์การ์ดซ้ำ/ตรวจสต๊อก) |

**API ที่เรียก:** `getCodeInfo` (ค้นเดี่ยว) · `listCodes` (กรอง/ตาราง) · `listProducts` (dropdown)

---

## หน้า 6 — 💳 สลิปรอตรวจ *(เฟส C — วางโครงเมนูไว้ก่อน ยังไม่ต้องทำ)*

| ส่วนประกอบ | รายละเอียด |
|---|---|
| การ์ดสลิปละใบ | รูปสลิป (เปิดดูเต็มได้), ยอดเงิน, discord_id, เวลา |
| ปุ่มอนุมัติ | dialog ยืนยัน → `approveSlip` → แจ้ง "เปิดสิทธิ์ถามเพิ่มถึงสิ้นเดือนแล้ว" |

**API ที่เรียก:** `listSlips` · `approveSlip`

---

## สรุปตาราง หน้า × API

| หน้า | API ที่ใช้ |
|---|---|
| 0 Login | listProducts (ทดสอบรหัส) |
| 1 คิวรออนุมัติ | listPending |
| 2 รายละเอียด `/?row=N` | getRegistration → approve / reject |
| 3 สินค้า | listProducts, addProduct, updateProduct |
| 4 สร้างรหัส | listProducts, generateCodes |
| 5 ค้นหารหัส | getCodeInfo, listCodes, listProducts |
| 6 สลิป (เฟส C) | listSlips, approveSlip |

## ภาคผนวก A — API Spec ฉบับใช้งานฝั่งเว็บ (ครบทุกเส้นที่บรีฟนี้อ้างถึง)

> ฉบับเต็มพร้อมผลข้างเคียงทุก endpoint อยู่ที่ `DB-API-REFERENCE.md` — ส่วนนี้คือฉบับย่อที่พอเขียนโค้ดได้เลย

### A.1 กติกาการเรียก

- ทุกเส้น = `POST` ไปที่ **URL เดียว** (Apps Script Web App ลงท้าย `/exec`) แยกงานด้วยฟิลด์ `action`
- Body เป็น JSON ต้องมี `key` (= API_SECRET ที่ครูกรอกหน้า Login) และ `action` เสมอ
- Response เสมอ: สำเร็จ `{"ok":true, ...}` / ล้มเหลว `{"ok":false, "reason":"..."}`
- Apps Script ตอบผ่าน redirect — `fetch` ของเบราว์เซอร์ตามให้อัตโนมัติ ไม่ต้องทำอะไรเพิ่ม

**Helper กลางที่ควรมีตัวเดียวใน `app.js`:**
```js
const API_URL = 'https://script.google.com/macros/s/XXXX/exec'; // ไม่ลับ ใส่ในโค้ดได้

async function api(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // กัน CORS preflight ของ Apps Script
    body: JSON.stringify({ key: sessionStorage.getItem('secret'), action, ...payload }),
  });
  const data = await res.json();
  if (!data.ok && data.reason === 'unauthorized') location.href = './login.html';
  return data;
}
```
> ⚠️ ใช้ `Content-Type: text/plain` ตามตัวอย่าง — ถ้าใช้ `application/json` เบราว์เซอร์จะยิง
> preflight (OPTIONS) ซึ่ง Apps Script ไม่รองรับ แล้วจะเจอ CORS error

### A.2 ตาราง reason ที่ต้องแปลเป็นข้อความไทยบนจอ

| reason | ข้อความที่ควรแสดง |
|---|---|
| unauthorized | "รหัสลับไม่ถูกต้อง" → เด้งกลับหน้า Login |
| notfound | "ไม่พบข้อมูลนี้ในระบบ" |
| used | "รหัสนี้ถูกใช้ไปแล้ว" |
| duplicate | "มีรหัสสินค้านี้อยู่แล้ว" |
| product_notfound | "ยังไม่มีสินค้านี้ — สร้างที่หน้าสินค้าก่อน" |
| bad_request | "ข้อมูลไม่ครบ ลองตรวจอีกครั้ง" |
| server_error | "ระบบขัดข้อง ลองใหม่อีกครั้ง" |

### A.3 Spec รายเส้น (request → response)

**`listPending`** — คิวรออนุมัติ *(หน้า 1)*
```jsonc
{ "action": "listPending" }
→ { "ok": true, "items": [ { "row": 7, "timestamp": "2026-07-04T15:00:00.000Z",
    "name": "สมหญิง ใจดี", "nickname": "มุก", "school": "สาธิตฯ",
    "email": "mook@gmail.com", "code": "MATH1-X7K2-9PQR", "product": "MATH1" } ] }
```

**`getRegistration`** — รายละเอียด 1 รายการ *(หน้า 2 ตอนเปิด)*
```jsonc
{ "action": "getRegistration", "row": 7 }
→ { "ok": true, "item": { "row": 7, "timestamp": "...", "discord_id": "1122...",
    "name": "สมหญิง ใจดี", "nickname": "มุก", "age": "16", "school": "สาธิตฯ",
    "email": "mook@gmail.com", "code": "MATH1-X7K2-9PQR",
    "product": "MATH1", "product_name": "เฉลยคณิต ม.4 เล่ม 1",
    "youtube_link": "https://youtu.be/AbCdEf",      // "" = ยังไม่ใส่ → ต้องเตือน
    "status": "pending",                            // pending | approved | rejected
    "link_sent": "no", "approved_at": "", "note": "" } }
→ { "ok": false, "reason": "notfound" }
```

**`approve`** — อนุมัติ *(หน้า 2)*
```jsonc
{ "action": "approve", "row": 7 }
→ { "ok": true, "status": "approved", "approved_at": "2026-07-04T15:05:00.000Z" }
```

**`reject`** — ปฏิเสธ + ระบบคืนรหัสให้ใช้ใหม่ *(หน้า 2)*
```jsonc
{ "action": "reject", "row": 7, "reason": "อีเมลผิด" }
→ { "ok": true }
```

**`listProducts`** — รายการสินค้า *(หน้า 0 ทดสอบรหัส, หน้า 3, dropdown หน้า 4–5)*
```jsonc
{ "action": "listProducts" }
→ { "ok": true, "items": [ { "row": 2, "product": "MATH1",
    "product_name": "เฉลยคณิต ม.4 เล่ม 1", "youtube_link": "https://youtu.be/AbCdEf" } ] }
```

**`addProduct`** — สร้างสินค้า *(หน้า 3)*
```jsonc
{ "action": "addProduct", "product": "MATH1",
  "product_name": "เฉลยคณิต ม.4 เล่ม 1", "youtube_link": "" }
→ { "ok": true, "product": "MATH1" }
→ { "ok": false, "reason": "duplicate" }
```

**`updateProduct`** — แก้ชื่อ/ลิงก์ *(หน้า 3 — ส่งเฉพาะฟิลด์ที่จะแก้)*
```jsonc
{ "action": "updateProduct", "row": 2, "youtube_link": "https://youtu.be/AbCdEf" }
→ { "ok": true }
```

**`generateCodes`** — สั่งสุ่มรหัส (API การันตีไม่ซ้ำ, สถานะเริ่ม unused) *(หน้า 4)*
```jsonc
{ "action": "generateCodes", "product": "MATH1", "amount": 100 }   // amount 1–500
→ { "ok": true, "product": "MATH1", "amount": 100,
    "codes": ["MATH1-X7K2-9PQR", "MATH1-A3BC-7XYZ", "..."] }
→ { "ok": false, "reason": "product_notfound" }
```

**`listCodes`** — กรองรายการรหัส *(หน้า 5 — filter ใส่หรือไม่ใส่ก็ได้)*
```jsonc
{ "action": "listCodes", "product": "MATH1", "status": "unused" }
→ { "ok": true, "count": 87, "items": [ { "code": "MATH1-X7K2-9PQR",
    "product": "MATH1", "status": "unused", "used_by_discord": "", "used_at": "" } ] }
```

**`getCodeInfo`** — รหัสนี้ใครใช้ *(หน้า 5 ช่องค้นเดี่ยว)*
```jsonc
{ "action": "getCodeInfo", "code": "MATH1-X7K2-9PQR" }
→ { "ok": true, "item": { "code": "MATH1-X7K2-9PQR", "product": "MATH1",
    "status": "used", "used_by_discord": "1122...", "email": "mook@gmail.com",
    "used_at": "2026-07-04T15:00:00.000Z",
    "user": { "row": 7, "name": "สมหญิง ใจดี", "nickname": "มุก", "school": "สาธิตฯ",
              "registration_status": "approved", "link_sent": "yes" } } }
// รหัสยังไม่ถูกใช้: "status": "unused" และ "user": null
```

**`listSlips`** / **`approveSlip`** — เฟส C *(หน้า 6)*
```jsonc
{ "action": "listSlips" }
→ { "ok": true, "items": [ { "row": 3, "timestamp": "...", "discord_id": "1122...",
    "slip_url": "https://drive.google.com/...", "amount": 99 } ] }

{ "action": "approveSlip", "row": 3 }
→ { "ok": true }    // ระบบเปิดสิทธิ์ถามเพิ่มถึงสิ้นเดือนให้เอง
```

---

## Definition of Done (เฟสแรก = หน้า 0–4)

- [ ] เปิดจากมือถือแล้วทำงานอนุมัติจบได้จริงตั้งแต่กดลิงก์ใน Discord จนกด Approve
- [ ] ลิงก์ `/?row=N` เข้าตรงได้แม้ยังไม่ login (login เสร็จเด้งกลับมาหน้าเดิม)
- [ ] ทุกปุ่มมี loading + dialog ยืนยัน + toast ผลลัพธ์
- [ ] เคสลิงก์วิดีโอว่าง แสดงคำเตือนก่อนอนุมัติได้
- [ ] รายการที่ไม่ใช่ pending แล้ว กด approve ซ้ำไม่ได้
- [ ] CSV ที่ดาวน์โหลดเปิดใน Excel/Sheets แล้วรหัสไม่เพี้ยน (ครอบด้วย text)
