# Coding Standard

Dokumen ini menjadi standar penulisan kode pada aplikasi MAKSI.

Seluruh developer maupun AI wajib mengikuti standar ini.

---

# Prinsip Umum

Seluruh kode harus memenuhi prinsip berikut:

- Clean Code
- Readable Code
- Reusable Code
- Maintainable Code
- Modular
- Konsisten

Kode yang mudah dipahami lebih diutamakan dibanding kode yang terlalu kompleks.

---

# Bahasa

Seluruh kode menggunakan Bahasa Inggris.

Seluruh tampilan kepada pengguna menggunakan Bahasa Indonesia.

Contoh

Benar

```javascript
const customerName = "";
const phoneNumber = "";
const quotationNumber = "";
```

Salah

```javascript
const namaPelanggan = "";
const nomorTelepon = "";
```

---

# Penamaan File

Gunakan huruf kecil.

Gunakan tanda minus (-).

Contoh

```
lead-list.jsx

lead-form.jsx

customer-card.jsx

quotation-table.jsx
```

---

# Penamaan Folder

Gunakan huruf kecil.

Gunakan tanda minus (-).

Contoh

```
follow-up

master-data

user-management
```

---

# Penamaan Component

Gunakan PascalCase.

Benar

```javascript
LeadForm

CustomerCard

DashboardHeader

ReminderModal
```

Salah

```javascript
leadform

customer_card
```

---

# Penamaan Function

Gunakan camelCase.

Benar

```javascript
getCustomer()

createLead()

updateQuotation()

deleteReminder()
```

---

# Penamaan Variable

Gunakan camelCase.

Benar

```javascript
customerName

phoneNumber

leadStatus

quotationTotal
```

---

# Penamaan Constant

Gunakan UPPER_CASE.

Contoh

```javascript
DEFAULT_PAGE_SIZE

MAX_UPLOAD_SIZE

STATUS_OPEN
```

---

# Penamaan Hook

Selalu diawali dengan use.

Contoh

```javascript
useAuth()

useLead()

useCustomer()

useReminder()
```

---

# Penamaan Service

Gunakan akhiran Service.

Contoh

```
lead.service.js

customer.service.js

quotation.service.js
```

---

# Penamaan Store

Gunakan akhiran Store.

Contoh

```
auth.store.js

sidebar.store.js
```

---

# Penamaan Helper

Gunakan nama yang menjelaskan fungsi.

Contoh

```
format-date.js

format-currency.js

export-excel.js
```

---

# Import

Urutan import.

1. React
2. Next.js
3. Library
4. Components
5. Hooks
6. Services
7. Utils
8. CSS

---

# Component

Satu Component hanya memiliki satu tanggung jawab.

Component maksimal sekitar 300 baris.

Apabila terlalu besar, pecah menjadi beberapa Component.

---

# Page

Page hanya bertugas:

- Menampilkan UI
- Mengatur Layout
- Memanggil Hook

Jangan menulis logic bisnis di dalam Page.

---

# Business Logic

Business Logic tidak boleh berada di Component.

Business Logic berada pada:

- Service
- Hook
- Repository

---

# API

Component tidak boleh memanggil Route Handler secara langsung.

Gunakan Service.

Benar

```
Page

↓

useLead()

↓

lead.service.js

↓

Route Handler
```

---

# Database

Route Handler tidak boleh berisi query database yang panjang.

Gunakan Repository.

---

# Styling

Gunakan Tailwind CSS.

Dilarang menggunakan inline style.

Benar

```jsx
className="flex items-center gap-4"
```

Salah

```jsx
style={{ display: "flex" }}
```

---

# Warna

Gunakan warna dari Design System.

Jangan hardcode warna.

Benar

```
bg-primary

text-danger
```

Salah

```
bg-red-500

text-blue-600
```

Kecuali memang merupakan bagian dari Design System.

---

# Validasi

Frontend menggunakan validasi untuk membantu pengguna.

Backend tetap menjadi validasi utama.

---

# Error Handling

Gunakan try...catch.

Seluruh Error harus ditampilkan menggunakan pesan yang mudah dipahami.

Jangan menampilkan Error bawaan server kepada pengguna.

---

# Console

Dilarang menyisakan:

```
console.log()

console.table()

console.error()
```

pada Production.

---

# Komentar

Jangan membuat komentar yang tidak diperlukan.

Kode harus dapat menjelaskan dirinya sendiri.

Gunakan komentar hanya apabila diperlukan.

---

# Reusable Component

Sebelum membuat Component baru:

- Cari apakah Component sudah tersedia.
- Gunakan kembali apabila memungkinkan.

Jangan membuat Component yang memiliki fungsi sama.

---

# Hardcode

Dilarang hardcode.

Benar

```
STATUS_OPEN
```

Salah

```
"Open"
```

Benar

```
ROLE_ADMIN
```

Salah

```
"Administrator"
```

---

# Magic Number

Dilarang menggunakan angka tanpa penjelasan.

Benar

```javascript
const DEFAULT_PAGE_SIZE = 20;
```

Salah

```javascript
limit = 20;
```

---

# React Query

Seluruh request menggunakan React Query.

Jangan menggunakan fetch() langsung di Component.

---

# Axios

Seluruh request menggunakan Axios Instance.

Jangan membuat Axios baru.

---

# State

Global State menggunakan Zustand.

Local State menggunakan useState.

Jangan menyimpan data global menggunakan useState.

---

# Struktur Folder

Seluruh file wajib mengikuti struktur folder yang telah ditentukan pada:

folder-structure.md

---

# Mockup

Seluruh implementasi UI wajib mengikuti mockup.

AI tidak diperbolehkan membuat layout baru tanpa instruksi.

---

# Business Rules

Seluruh implementasi wajib mengikuti:

business-rules.md

Tidak boleh membuat asumsi sendiri.

---

# Dokumentasi

Sebelum membuat fitur baru:

1. Baca project-overview.md
2. Baca business-rules.md
3. Baca folder-structure.md
4. Baca ui-guidelines.md
5. Baca dokumen lain yang berkaitan.

---

# Larangan

Dilarang:

- Mengubah struktur project tanpa persetujuan.
- Membuat Component duplikat.
- Membuat Helper duplikat.
- Mengubah Business Rules.
- Mengubah mockup.
- Menambahkan library baru tanpa persetujuan.
- Menulis query database langsung di Component.
- Mengakses database langsung dari Frontend.

---

# Prinsip AI

Sebelum menghasilkan kode, AI wajib:

- Memahami konteks project.
- Mengikuti seluruh dokumentasi pada folder docs.
- Menggunakan Component yang sudah ada.
- Menggunakan Service yang sudah ada.
- Menggunakan Hook yang sudah ada.
- Menjaga konsistensi kode.
- Bertanya apabila kebutuhan belum jelas.

---

Dokumen ini menjadi standar utama penulisan kode pada aplikasi MAKSI.