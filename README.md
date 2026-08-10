# OBE

Aplikasi OBE berbasis Express dan PostgreSQL.

## Deploy ke Vercel

### 1. Siapkan database

Buat database PostgreSQL terkelola, misalnya melalui integrasi Neon atau
Supabase di Vercel Marketplace. Salin connection string database tersebut.

Jalankan schema dan seed dari komputer lokal:

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
$env:DATABASE_SSL = "require"
npm run db:schema
npm run db:seed
```

### 2. Deploy

Pasang dan jalankan Vercel CLI dari folder proyek:

```powershell
npx vercel
```

Tambahkan environment variables berikut pada Vercel untuk environment
Production, Preview, dan Development:

- `DATABASE_URL`: connection string PostgreSQL.
- `DATABASE_SSL`: gunakan `require` untuk sebagian besar database cloud, atau
  `verify-full` jika penyedia memberi sertifikat CA yang dapat diverifikasi.
- `JWT_SECRET`: secret acak dengan panjang minimal 32 karakter.

Secret dapat dibuat dengan:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Setelah variables tersimpan, deploy ke production:

```powershell
npx vercel --prod
```

Cek `https://DOMAIN/api/health`; respons yang benar adalah
`{"status":"ok"}`.
