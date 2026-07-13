# Folder Structure

Dokumen ini menjelaskan struktur folder yang digunakan pada aplikasi MAKSI.

Seluruh pengembangan wajib mengikuti struktur ini untuk menjaga konsistensi, kemudahan maintenance, dan skalabilitas aplikasi.

---

# Root Folder

```
/
├── docs/
├── public/
├── src/
├── .env.local
├── .gitignore
├── jsconfig.json
├── next.config.js
├── package.json
└── README.md
```

---

# Folder docs

Berisi seluruh dokumentasi proyek.

```
docs/
├── README.md
├── project-overview.md
├── business-rules.md
├── database-design.md
├── folder-structure.md
├── api-standard.md
├── ui-guidelines.md
├── coding-standard.md
├── deployment.md
├── roadmap.md
└── prompt-rules.md
```

---

# Folder public

Digunakan untuk file statis.

Contoh:

- logo
- favicon
- icon
- gambar
- file upload

```
public/
├── logo/
├── images/
├── icons/
└── uploads/
```

---

# Folder src

Seluruh source code berada di dalam folder src.

```
src/
├── app/
├── assets/
├── components/
├── config/
├── constants/
├── features/
├── hooks/
├── layouts/
├── lib/
├── services/
├── store/
├── styles/
├── types/
└── utils/
```

---

# app

Menggunakan App Router Next.js.

```
app/
├── (auth)/
├── (dashboard)/
├── api/
├── login/
├── layout.jsx
├── loading.jsx
├── error.jsx
├── not-found.jsx
└── page.jsx
```

---

# assets

Berisi asset internal project.

```
assets/
├── images/
├── icons/
└── fonts/
```

---

# components

Berisi Component yang dapat digunakan kembali.

```
components/
├── common/
├── form/
├── layout/
├── table/
├── modal/
├── chart/
└── ui/
```

Contoh:

- Button
- Input
- Card
- Modal
- Table
- Pagination
- Breadcrumb

---

# config

Berisi konfigurasi aplikasi.

Contoh:

```
config/
├── axios.js
├── auth.js
├── menu.js
└── app.js
```

---

# constants

Berisi data konstan.

Contoh:

```
constants/
├── role.js
├── status.js
├── color.js
└── permission.js
```

---

# features

Setiap fitur memiliki folder sendiri.

```
features/
├── auth/
├── dashboard/
├── user/
├── customer/
├── lead/
├── follow-up/
├── quotation/
├── reminder/
├── report/
├── master/
└── setting/
```

Setiap fitur memiliki struktur yang sama.

Contoh:

```
lead/
├── components/
├── hooks/
├── pages/
├── services/
└── utils/
```

---

# hooks

Berisi Custom Hook.

Contoh:

```
hooks/
├── useAuth.js
├── useDebounce.js
├── usePermission.js
└── usePagination.js
```

---

# layouts

Berisi Layout aplikasi.

```
layouts/
├── MainLayout.jsx
├── AuthLayout.jsx
└── BlankLayout.jsx
```

---

# lib

Berisi helper pihak ketiga.

Contoh:

```
lib/
├── dayjs.js
├── query-client.js
└── jwt.js
```

---

# services

Berisi komunikasi dengan API.

```
services/
├── auth.service.js
├── dashboard.service.js
├── lead.service.js
├── customer.service.js
├── quotation.service.js
├── reminder.service.js
└── report.service.js
```

Seluruh komunikasi API wajib melalui folder ini.

Dilarang melakukan request API langsung dari Component.

---

# store

Berisi Global State.

```
store/
├── auth.store.js
├── app.store.js
└── sidebar.store.js
```

---

# styles

Berisi style global.

```
styles/
├── globals.css
├── variables.css
└── utilities.css
```

---

# types

Disiapkan apabila di masa depan project menggunakan TypeScript.

Saat ini folder ini boleh kosong.

---

# utils

Berisi fungsi umum.

```
utils/
├── format-currency.js
├── format-date.js
├── export-excel.js
├── export-pdf.js
├── validator.js
└── helper.js
```

---

# Aturan Struktur Folder

Seluruh developer dan AI wajib mengikuti aturan berikut:

- Jangan membuat folder baru tanpa alasan yang jelas.
- Gunakan Component yang sudah ada apabila memungkinkan.
- Pisahkan logic dan tampilan.
- Jangan melakukan request API langsung di halaman.
- Jangan membuat helper yang sama di beberapa tempat.
- Setiap fitur harus berada pada folder `features`.
- Semua komunikasi API berada di folder `services`.
- Semua Global State berada di folder `store`.
- Semua helper berada di folder `utils`.
- Semua konfigurasi berada di folder `config`.

---

Dokumen ini menjadi acuan utama dalam menentukan struktur project MAKSI.