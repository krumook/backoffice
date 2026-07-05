# krumook-backoffice 🗂️

> เว็บหลังบ้านของครู (ฝากฟรีบน GitHub Pages) + โค้ด Google Apps Script ที่เป็น **API กลาง** อ่าน–เขียน Google Sheets
> repo นี้เป็น **Public** ได้ — ⚠️ ไม่มีค่าลับในโค้ดฝั่งเว็บ (API_SECRET อยู่ฝั่ง Apps Script เท่านั้น)

ระบบ "หนังสือ + วิดีโอเฉลย ผ่าน Discord" (เวอร์ชันทดลอง ฟรี 100%)
ออกแบบตาม `UI-BRIEF.md` + `DB-API-REFERENCE.md`

---

## โครงสร้างไฟล์

```
docs/                    ← GitHub Pages เสิร์ฟโฟลเดอร์นี้เป็นเว็บ (SPA)
  index.html             ← โครงหน้า + login + nav (sidebar จอใหญ่ / bottom-nav มือถือ)
  app.js                 ← routing, api() helper, 6 หน้า, demo mode
  style.css              ← ธีมสมุดกริดโทนน้ำเงิน · mobile-first
apps-script/
  Code.gs                ← API (6 แท็บ + ทุก endpoint + setupSheets)
  SCHEMA.md              ← โครงสร้าง Sheet + ตาราง endpoints ฉบับย่อ
README.md
```

## หน้าเว็บ (mobile-first — ครูใช้จากมือถือเป็นหลัก)

| หน้า | ทำอะไร | API |
|------|--------|-----|
| 🔓 Login | กรอกรหัสลับครั้งเดียว (เก็บใน sessionStorage) | `listProducts` (ทดสอบรหัส) |
| 🏠 คิวรออนุมัติ | การ์ดรายการ + auto-refresh 60 วิ + badge จำนวนค้าง | `listPending` |
| 📄 รายละเอียด `/?row=N` | **หน้าสำคัญสุด** (ปลายทางลิงก์จาก Discord) — copy อีเมล → เปิดวิดีโอ → อนุมัติ/ปฏิเสธ | `getRegistration`, `approve`, `reject` |
| 📚 สินค้า | เพิ่ม/แก้เล่ม + ใส่ลิงก์ YouTube (เตือนเล่มที่ยังไม่ใส่) | `listProducts`, `addProduct`, `updateProduct` |
| 🎟️ สร้างรหัส | เลือกเล่ม+จำนวน → ได้รหัส + ดาวน์โหลด CSV | `generateCodes` |
| 🔍 ค้นหารหัส | ค้นเดี่ยว (ใครใช้) + กรองรายการ + สรุปคงเหลือ + export | `getCodeInfo`, `listCodes` |
| 💳 สลิปรอตรวจ (เฟส C) | ดูสลิป + อนุมัติสิทธิ์ถามเพิ่ม | `listSlips`, `approveSlip` |

จุดเด่นตามบรีฟ: ปุ่มยิง API ทุกปุ่มมี **loading + กันกดซ้ำ**, action สำคัญมี **dialog ยืนยัน**, ผลลัพธ์เป็น **toast**, ลิงก์ `/?row=N` เข้าตรงได้ (ยังไม่ล็อกอิน → เด้งไป login แล้วกลับมาหน้าเดิม), CSV ครอบด้วย `"` กันรหัสเพี้ยนใน Excel

## เริ่มใช้งาน

### 1) ฝั่ง Apps Script (ทำก่อน)
1. สร้าง Google Sheet เปล่า → Extensions → Apps Script → วาง `apps-script/Code.gs`
2. Project Settings → Script Properties → เพิ่ม `API_SECRET` (ตั้งรหัสลับเอง)
3. รันฟังก์ชัน **`setupSheets()`** 1 ครั้ง (สร้าง 6 แท็บ + หัวคอลัมน์ให้อัตโนมัติ)
4. Deploy → New deployment → **Web app** · Execute as **Me** · Who has access **Anyone** → คัดลอก URL `/exec`

### 2) ฝั่งเว็บ
1. ใส่ URL `/exec` ลงใน `CONFIG.API_URL` ที่หัวไฟล์ `docs/app.js` (ไม่ลับ ใส่ได้) — ถ้าเว้นว่าง หน้า login จะมีช่องให้กรอก URL เอง
2. Push repo (public) → Settings → Pages → Branch `main` / folder `/docs`
3. เปิดลิงก์ `https://<user>.github.io/<repo>/` → กรอกรหัสลับ → ใช้งาน

> อยากลองหน้าตาก่อน deploy? เปิด `docs/index.html` แล้วกด **"ลองใช้ด้วยข้อมูลตัวอย่าง"** (มีข้อมูลจำลองครบทุกหน้า)

## ความปลอดภัย
- `API_SECRET` อยู่ใน Script Properties + ครูกรอกในหน้า login (อยู่แค่ใน browser) — **ไม่อยู่ในโค้ด**
- Apps Script เช็ค `key` ทุก request ไม่ตรง → `unauthorized`
- อย่า commit ไฟล์ที่มีอีเมล/ข้อมูลนักเรียนจริง

## Roadmap
- [x] เฟส B — หน้า 0–5 (login, คิว, รายละเอียด, สินค้า, สร้างรหัส, ค้นหารหัส)
- [x] Apps Script ครบทุก endpoint + `setupSheets()`
- [ ] เฟส C — วงจรสลิป/โควต้าฝั่งบอท (โครงหน้าเว็บ + endpoint พร้อมแล้ว)
- [ ] เฟส D — Firebase Hosting + โดเมน + Firestore
