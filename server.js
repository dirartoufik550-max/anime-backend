require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGODB_URI;
const BASE_DOMAIN = process.env.BASE_URL || 'https://anime-backend-bvuj.onrender.com';

// رابط الفيديو التجريبي المباشر والثابت (One Piece / Big Buck Bunny)
const STATIC_VIDEO_URL = "https://files.vid3rb.com/files/0020250290/a293fcab-a7fe-4ed0-8de0-76be114bc6bb/480p.mp4?e=1787620282&speed=149&t=mu7_LszHHa2gB-iR1vRVMA&noip=yes";

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`>>> [REQUEST] ${req.method} ${req.url}`);
  next();
});

// تشغيل السيرفر فوراً
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running live on port ${PORT}`);
});

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB Connection Warning:', err.message));
}

// دالة تنسيق الكتالوج
const formatAnimeForMovieModel = (item) => {
  return {
    _id: item._id ? item._id.toString() : "6a8a5cab235e1b9d3849ebd7",
    title: item.title || "One Piece",
    japaneseTitle: item.japaneseTitle || "ワンピース",
    synopsis: item.synopsis || "مغامرات لوفي وطاقمه للبحث عن كنز الوان بيس.",
    posterUrl: item.posterUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600",
    bannerUrl: item.bannerUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200",
    score: item.score || 9.0,
    status: item.status || "Currently Airing",
    category: item.category || "TV",
    genres: ["Action", "Adventure", "Fantasy"],
    servers: [
      {
        server_name: "سيرفر البث المباشر (1080p)",
        stream_url: `${BASE_DOMAIN}/api/stream/${item._id ? item._id.toString() : "6a8a5cab235e1b9d3849ebd7"}/1`
      }
    ]
  };
};

// ==========================================
// مسارات الكتالوج
// ==========================================
app.get('/api/anime/trending', (req, res) => {
  res.json({
    success: true,
    count: 1,
    data: [formatAnimeForMovieModel({ title: "One Piece" })]
  });
});

app.get('/api/anime/latest', (req, res) => {
  res.json({
    success: true,
    count: 1,
    data: [formatAnimeForMovieModel({ title: "One Piece" })]
  });
});

app.get('/api/anime/top-rated', (req, res) => {
  res.json({
    success: true,
    count: 1,
    data: [formatAnimeForMovieModel({ title: "One Piece" })]
  });
});

// ==========================================
// مسار تفاصيل الأنمي وقائمة الحلقات
// ==========================================
app.get('/api/anime/:id', (req, res) => {
  const animeId = req.params.id || "6a8a5cab235e1b9d3849ebd7";
  
  const episodesList = [];
  for (let i = 1; i <= 12; i++) {
    episodesList.push({
      episodeNumber: i,
      title: `الحلقة ${i}`,
      sources: [
        {
          quality: "1080p (Direct MP4)",
          url: `${BASE_DOMAIN}/api/stream/${animeId}/${i}`,
          isHLS: false
        }
      ],
      subtitles: [
        {
          lang: "Arabic",
          url: `${BASE_DOMAIN}/api/subtitles/${animeId}/${i}`
        }
      ]
    });
  }

  res.json({
    success: true,
    data: {
      ...formatAnimeForMovieModel({ _id: animeId, title: "One Piece" }),
      episodes: episodesList
    }
  });
});

// ==========================================
// مسار البث المباشر (Direct Stream Redirect)
// ==========================================
app.get('/api/stream/:animeId/:epNum', (req, res) => {
  return res.redirect(302, STATIC_VIDEO_URL);
});

// ==========================================
// مسار الترجمة العربية
// ==========================================
app.get('/api/subtitles/:animeId/:epNum', (req, res) => {
  res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(`WEBVTT\n\n00:00:01.000 --> 00:00:06.000\n[ترجمة عربية - ون بيس]\n00:00:07.000 --> 00:00:12.000\nمشاهدة ممتعة.`);
});

// ==========================================
// فحص حالة السيرفر
// ==========================================
app.get('/', (req, res) => {
  res.json({ status: "online", message: "Anime Backend API is running live 24/7 on Render" });
});
