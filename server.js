require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGODB_URI;
const BASE_DOMAIN = process.env.BASE_URL || 'https://anime-backend-bvuj.onrender.com';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`>>> [REQUEST] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// 1. تشغيل السيرفر فوراً لضمان عدم حدوث Crash
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running live on port ${PORT}`);
});

// محاولة الاتصال بقاعدة البيانات في الخلفية دون تعطيل السيرفر
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB Connection Warning:', err.message));
}

// ==========================================
// 2. فحص حالة السيرفر (Health Check)
// ==========================================
app.get('/', (req, res) => {
  res.json({ 
    status: "online", 
    message: "Anime Backend API is running live 24/7 on Render" 
  });
});

// ==========================================
// 3. مسار اختبار فوري ومباشر
// ==========================================
app.get('/test-play', (req, res) => {
  const directMp4Url = "https://soraplay.xyz/FibCU10knKEu8/0708b953cfaaa48084c05e46b3b87931/%5BWitanime.com%5D+JK+EP+01+BD-FHD-480p.mp4";
  return res.redirect(302, directMp4Url);
});

// ==========================================
// 4. مسار البث المباشر المربوط بالتطبيق
// ==========================================
app.get('/api/stream/:animeId/:epNum', (req, res) => {
  const directMp4Url = "https://soraplay.xyz/FibCU10knKEu8/0708b953cfaaa48084c05e46b3b87931/%5BWitanime.com%5D+JK+EP+01+BD-FHD-480p.mp4";
  return res.redirect(302, directMp4Url);
});

// ==========================================
// 5. مسار الترجمة العربية
// ==========================================
app.get('/api/subtitles/:animeId/:epNum', (req, res) => {
  res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(`WEBVTT\n\n00:00:01.000 --> 00:00:06.000\n[ترجمة عربية]\n00:00:07.000 --> 00:00:12.000\nمشاهدة ممتعة.`);
});
