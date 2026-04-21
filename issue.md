# Panduan Implementasi Fitur Login, Logout, dan Validasi Token (Session)

Dokumen ini berisi panduan langkah-demi-langkah yang sangat rinci untuk mengimplementasikan fitur autentikasi sederhana menggunakan session database (token UUID). Harap ikuti instruksi ini secara berurutan dengan teliti.

## 1. Pembuatan Skema Database (Drizzle ORM)

File yang diedit: `src/db/schema.ts`

- Tambahkan definisi tabel `sessions` baru di bawah tabel `users` yang sudah ada. 
- Pastikan Anda melakukan import relasi jika diperlukan, atau cukup simpan `user_id` sebagai integer biasa dengan konfigurasi foreign key.
- Spesifikasi tabel `sessions`:
  - `id`: integer, auto increment, primary key
  - `token`: varchar dengan panjang 255, not null (kolom ini akan menyimpan string UUID sebagai token)
  - `userId`: integer, sebagai referensi foreign key ke kolom `id` di tabel `users`.
  - `createdAt`: timestamp, default nilai menggunakan waktu sekarang

Contoh kodenya:
```typescript
import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";

// ... (tabel users yang sudah ada di biarkan saja)

export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  userId: int("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## 2. Melakukan Migrasi Database

Setelah menambahkan skema `sessions`, terapkan perubahan tersebut ke database fisik.
- Buka terminal dan jalankan perintah:
  ```bash
  bun run db:push
  ```
- Pastikan perintah berhasil dieksekusi tanpa error sehingga tabel `sessions` terbuat di database.

## 3. Implementasi Business Logic (Services)

File yang diedit: `src/services/users-services.ts`

Tambahkan 3 fungsi baru di dalam file service ini: `loginUser`, `logoutUser`, dan `validateToken`.

**A. Logika Fungsi `loginUser`**
1. Import tabel `sessions` dari `../db/schema`.
2. Buat fungsi async `loginUser(email, password)`:
   - Query ke tabel `users` menggunakan Drizzle untuk mencari baris di mana email sama dengan parameter.
   - Jika hasil query kosong (user tidak ada), kembalikan response: `return { error: "email atau password salah" }`.
   - Jika ada, komparasi password dari input dengan password hash dari database menggunakan `bcrypt.compare(password, user.password)`. (Gunakan `await`).
   - Jika hasil komparasi adalah `false`, kembalikan response error: `return { error: "email atau password salah" }`.
   - Jika password benar (true), buat token unik baru menggunakan UUID. Karena menggunakan Bun, Anda bisa memanfaatkan `crypto.randomUUID()`.
   - Insert token baru tersebut ke tabel `sessions` bersama dengan `user.id`.
   - Jika insert berhasil, kembalikan response: `return { token: token_uuid_tersebut }`.

**B. Logika Fungsi `logoutUser`**
1. Buat fungsi async `logoutUser(token)`:
   - Query ke tabel `sessions` untuk mencari data berdasarkan token.
   - Jika token tidak ditemukan, kembalikan: `return { error: "token tidak ditemukan" }`.
   - Jika token ditemukan, hapus (delete) record sesi tersebut dari database.
   - Kembalikan response: `return { data: "OK" }`.

**C. Logika Fungsi `validateToken`**
1. Buat fungsi async `validateToken(token)`:
   - Query ke tabel `sessions` untuk mencari baris berdasarkan token.
   - Jika hasil query kosong (token tidak valid/sudah dihapus), kembalikan: `return { error: "token tidak ditemukan" }`.
   - Jika ditemukan, ambil nilai `userId` dari baris sesi tersebut.
   - Kembalikan response sukses beserta user_id-nya: `return { data: "OK", user_id: session.userId }`.

## 4. Implementasi API Endpoint (Routes)

File yang diedit: `src/routes/users-routes.ts`

Tambahkan 3 endpoint API baru ke dalam instance Elysia `usersRoutes` (di bawah endpoint POST `/users` yang sudah ada).

1. Import fungsi `loginUser`, `logoutUser`, dan `validateToken` di bagian atas file.
2. Tambahkan route POST `/login`:
   ```typescript
   .post('/login', async ({ body, set }) => {
     const { email, password } = body as any;
     const result = await loginUser(email, password);
     
     if (result.error) {
       set.status = 401; // Unauthorized
       return result;
     }
     return result;
   })
   ```
3. Tambahkan route POST `/logout`:
   ```typescript
   .post('/logout', async ({ body, set }) => {
     const { token } = body as any;
     const result = await logoutUser(token);
     
     if (result.error) {
       set.status = 404;
       return result;
     }
     return result;
   })
   ```
4. Tambahkan route GET `/token/validate`:
   *(Meskipun ini adalah request GET, framework Elysia tetap bisa membaca request body jika client mengirimkannya. Namun sebagai praktik yang baik, sediakan juga pembacaan dari query params).*
   ```typescript
   .get('/token/validate', async ({ body, query, set }) => {
     // Mencari token dari Request Body atau dari Query String (?token=...)
     const token = (body as any)?.token || query.token;
     
     if (!token) {
       set.status = 400;
       return { error: "token tidak ditemukan" };
     }

     const result = await validateToken(token);
     
     if (result.error) {
       set.status = 401;
       return result;
     }
     return result;
   })
   ```

## 5. Tahap Verifikasi dan Pengujian

Setelah koding selesai, jalankan server (`bun run dev`) dan lakukan uji coba melalui cURL, Postman, atau Insomnia.

1. **Uji Login:** 
   - HTTP Method: `POST` URL: `http://localhost:3000/api/users/login`
   - Kirim body JSON `{ "email": "contact@dani.com", "password": "rahasia" }`
   - Pastikan response yang diterima adalah object JSON yang mengandung key `"token"` (berisi string random).
   - Uji dengan password salah, pastikan keluar pesan error "email atau password salah".
   
2. **Uji Validasi Token:**
   - HTTP Method: `GET` URL: `http://localhost:3000/api/users/token/validate`
   - Kirim body JSON `{ "token": "<token_dari_login>" }`
   - Pastikan response bernilai `{"data": "OK", "user_id": 1}`.

3. **Uji Logout:**
   - HTTP Method: `POST` URL: `http://localhost:3000/api/users/logout`
   - Kirim body JSON `{ "token": "<token_dari_login>" }`
   - Pastikan response bernilai `{"data": "OK"}`.

4. **Uji Validasi Token Kembali (Setelah Logout):**
   - Lakukan request yang sama dengan langkah ke-2.
   - Karena token sudah dihapus di database saat logout, pastikan kali ini mendapat error `{"error": "token tidak ditemukan"}`.

Jika seluruh pengujian ini lolos, berarti implementasi berjalan dengan sempurna!
