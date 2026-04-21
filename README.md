# Belajar Vibe Coding (Bun + Elysia API)

Aplikasi ini adalah sistem backend RESTful API sederhana yang menyediakan fitur Autentikasi User (Register, Login, Session Management, Profile, dan Logout). Proyek ini dibangun dengan fokus pada performa dan modern web tooling menggunakan ekosistem **Bun**.

## 🚀 Technology Stack & Libraries

Proyek ini menggunakan teknologi dan pustaka modern berikut:
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Web Framework**: [ElysiaJS](https://elysiajs.com/) (Framework web super cepat untuk Bun)
- **ORM (Object-Relational Mapping)**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: MySQL (via `mysql2` driver)
- **Security**: `bcrypt` untuk enkripsi hashing password
- **Testing**: `bun:test` (Framework unit testing bawaan dari Bun)

## 🏗️ Arsitektur & Struktur Folder

Aplikasi ini menggunakan pola arsitektur *Controller-Service* standar yang memisahkan antara layer *routing/http* dengan layer *business logic*.

```text
belajar-vibe-coding/
├── src/
│   ├── db/
│   │   ├── index.ts        # Inisialisasi koneksi Drizzle ke MySQL
│   │   └── schema.ts       # Definisi skema tabel database (Users & Sessions)
│   ├── routes/
│   │   └── users-routes.ts # Definisi endpoint API Elysia (Controllers)
│   ├── services/
│   │   └── users-services.ts # Logika bisnis (Registrasi, verifikasi password, manipulasi session)
│   ├── utils/
│   │   └── auth-helper.ts  # Fungsi bantuan utilitas murni (contoh: ekstrak token dari header)
│   └── index.ts            # Entry point aplikasi utama
├── tests/
│   └── api.test.ts         # File pengujian unit test menyeluruh
├── drizzle.config.ts       # Konfigurasi Drizzle Kit untuk manajemen migrasi database
└── package.json            # Daftar dependensi dan scripts eksekusi
```

### Konvensi Penamaan (Naming Conventions)
- **Folder**: Menggunakan huruf kecil (kebab-case)
- **File Routes**: Berakhiran `-routes.ts` (misal: `users-routes.ts`)
- **File Services**: Berakhiran `-services.ts` (misal: `users-services.ts`)
- **File Utils**: Berakhiran `-helper.ts` (misal: `auth-helper.ts`)
- **File Test**: Disimpan di dalam folder `tests/` dengan ekstensi `.test.ts`.

## 🗄️ Skema Database (Schema)

Aplikasi memiliki dua tabel relasional yang didefinisikan di `src/db/schema.ts`:

1. **Table `users`**: Menyimpan data profil utama pengguna.
   - `id`: `INT` (Primary Key, Auto Increment)
   - `name`: `VARCHAR(255)` (Not Null)
   - `email`: `VARCHAR(255)` (Not Null, Unique)
   - `password`: `VARCHAR(255)` (Not Null, Hashed)
   - `createdAt`: `TIMESTAMP` (Default Current Timestamp)

2. **Table `sessions`**: Menyimpan token autentikasi login yang sedang aktif.
   - `id`: `INT` (Primary Key, Auto Increment)
   - `token`: `VARCHAR(255)` (Not Null, UUID)
   - `userId`: `INT` (Foreign Key -> `users.id`, Not Null)
   - `createdAt`: `TIMESTAMP` (Default Current Timestamp)

## 📡 Daftar Endpoint API

Semua endpoint dilayani dengan prefix `/api/users`.

| HTTP Method | Endpoint | Kegunaan | Header Spesifik | Body Reqeust |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users` | Pendaftaran user baru | - | `name`, `email`, `password` |
| `POST` | `/api/users/login` | Autentikasi dan pembuatan token sesi | - | `email`, `password` |
| `GET` | `/api/users/me` | Mengambil data profil user | `Authorization: Bearer <token>` | - |
| `GET` | `/api/users/token/validate` | Cek status keaktifan sebuah token | - | `?token=<token_uuid>` (di URL / Body) |
| `DELETE` | `/api/users/logout` | Menghapus sesi / Logout | `Authorization: Bearer <token>` | - |

*(Detail validasi: Endpoint registrasi membatasi panjang input nama, email, dan password maksimum 255 karakter sesuai skema DB).*

---

## 🛠️ Cara Setup & Run Aplikasi

### 1. Prasyarat Sistem
- Instal [Bun](https://bun.sh/)
- Instal MySQL server lokal dan jalankan port `3306`

### 2. Instalasi Dependensi
Jalankan perintah ini di direktori proyek:
```bash
bun install
```

### 3. Konfigurasi Database
Secara default, `drizzle.config.ts` dikonfigurasi untuk terhubung ke MySQL lokal dengan user `root`, tanpa password, dan nama database `vibe_coding_db`. Pastikan Anda sudah membuat database tersebut di MySQL lokal Anda:
```sql
CREATE DATABASE vibe_coding_db;
```

Dorong (push) struktur tabel ke dalam database:
```bash
bun run db:push
```

### 4. Menjalankan Server Aplikasi
Jalankan server dalam mode development (dengan *hot-reloading*):
```bash
bun run dev
```
Server akan berjalan dan bisa diakses di `http://localhost:3000`.

### 5. Membuka Drizzle Studio (Database GUI)
Untuk melihat dan mengelola isi database melalui browser web:
```bash
bun run db:studio
```

## 🧪 Cara Menjalankan Unit Test

Aplikasi ini sudah dilindungi oleh Unit Test yang mencakup 18 skenario validasi penuh di semua endpoints-nya. Tes ini juga akan melakukan pembersihan (clear) data di tabel database setiap kali pengujian selesai untuk menghindari konflik.

Jalankan test suite menggunakan perintah:
```bash
bun test
```