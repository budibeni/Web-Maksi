# Dokumentasi MAKSI

Folder ini berisi seluruh dokumentasi proyek MAKSI yang menjadi acuan selama proses pengembangan.

Seluruh implementasi wajib mengikuti dokumen yang terdapat pada folder ini.

---

# Struktur Dokumentasi

```text
docs/
│
├── database/
│   ├── 01-role.md
│   ├── 02-cabang.md
│   ├── ...
│   └── 15-audit-log.md
│
├── reference/
│
├── project-overview.md
├── business-rules.md
├── folder-structure.md
├── database-design.md
├── document-numbering.md
├── api-standard.md
├── ui-guidelines.md
├── coding-standard.md
├── development-flow.md
├── deployment.md
└── roadmap.md
```

---

# Urutan Membaca

AI dan Developer wajib membaca dokumen berikut secara berurutan:

1. project-overview.md
2. business-rules.md
3. folder-structure.md
4. database-design.md
5. document-numbering.md
6. Seluruh dokumen pada folder `database/`
7. api-standard.md
8. ui-guidelines.md
9. coding-standard.md
10. development-flow.md
11. deployment.md
12. roadmap.md

Setelah seluruh dokumen dipahami, lanjutkan dengan membaca seluruh referensi UI pada folder:

```text
docs/reference/
```

---

# Dokumentasi Database

Folder `database/` berisi dokumentasi setiap tabel pada database MAKSI.

Setiap file menjelaskan satu tabel secara lengkap, meliputi:

- Fungsi Tabel
- Struktur Tabel
- Primary Key
- Foreign Key
- Index
- Snapshot Data
- Data Awal (Seed)
- Aturan Bisnis
- Catatan

Seluruh implementasi yang berkaitan dengan database wajib mengikuti dokumen pada folder `database/`.

Perubahan struktur tabel harus dilakukan dengan memperbarui dokumentasi terlebih dahulu sebelum melakukan implementasi pada kode.

AI maupun Developer tidak diperbolehkan membuat tabel, field, relasi, index, ataupun constraint yang tidak terdapat pada dokumentasi.

---

# Catatan

Apabila terdapat perbedaan informasi antar dokumen, maka urutan prioritas adalah:

1. Business Rules
2. Mockup UI (`docs/reference/`)
3. Database Design
4. Document Numbering
5. Dokumentasi Database (`docs/database/`)
6. Development Flow
7. API Standard
8. Folder Structure
9. Coding Standard
10. Roadmap

AI dan Developer tidak boleh membuat asumsi apabila aturan belum tersedia pada dokumentasi.

Apabila diperlukan perubahan proses bisnis, urutan perubahan dokumentasi adalah:

1. Business Rules
2. Database Design (apabila ada perubahan standar database)
3. Document Numbering (apabila ada perubahan format nomor dokumen)
4. Dokumentasi Database (`docs/database/`)
5. Mockup UI (`docs/reference/`) apabila memengaruhi antarmuka
6. Implementasi pada kode