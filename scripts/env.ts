import { config } from "dotenv";

// Script'ler Next dışında çalışır: .env.local → .env sırasıyla yüklenir (mevcut değerler ezilmez).
config({ path: ".env.local", quiet: true });
config({ quiet: true });
