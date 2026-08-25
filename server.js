require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGODB_URI;
const BASE_DOMAIN = process.env.BASE_URL || 'https://anime-backend-bvuj.onrender.com';

// رابط الفيديو المباشر لحلقة ون بيس (MP4 مباشر وشغال 100%)
const ONE_PIECE_DIRECT_URL = "https://my.1anime.site/videos/One_Piece_Episode_1175_1787506105.mp4";

app.use(cors());
app.use(express.json());

// تسجيل الطلبات لمتابعة المشغل
app.use((req, res, next) => {
  console.log(`>>> [REQUEST] ${req.method} ${req.url}`);
  next();
});

// تشغيل خادم الويب فوراً لضمان الجاهزية 24/7
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running live on port ${PORT}`);
});

// اتصال هادئ بقاعدة البيانات إن وجدت
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB Warning:', err.message));
}

// دالة تنسيق بيانات الأنمي للكتالوج
const formatAnimeForMovieModel = (item) => {
  const animeId = item._id ? item._id.toString() : "6a8a5cab235e1b9d3849ebd7";
  return {
    _id: animeId,
    title: item.title || "One Piece",
    japaneseTitle: item.japaneseTitle || "ワンピース",
    synopsis: item.synopsis || "مغامرات لوفي وطاقم قبعة القش - الحلقة 1175 بجودة عالية.",
    posterUrl: item.posterUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600",
    bannerUrl: item.bannerUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200",
    score: item.score || 9.5,
    status: item.status || "Currently Airing",
    category: item.category || "TV",
    genres: ["Action", "Adventure", "Fantasy"],
    servers: [
      {
        server_name: "سيرفر البث المباشر (1080p MP4)",
        stream_url: `${BASE_DOMAIN}/api/stream/${animeId}/1`
      }
    ]
  };
};

// ==========================================
// مسارات الكتالوج الرئيسي
// ==========================================
app.get('/api/anime/trending', (req, res) => {
  res.json({ success: true, count: 1, data: [formatAnimeForMovieModel({ title: "One Piece" })] });
});

app.get('/api/anime/latest', (req, res) => {
  res.json({ success: true, count: 1, data: [formatAnimeForMovieModel({ title: "One Piece" })] });
});

app.get('/api/anime/top-rated', (req, res) => {
  res.json({ success: true, count: 1, data: [formatAnimeForMovieModel({ title: "One Piece" })] });
});

// ==========================================
// مسار تفاصيل الأنمي وتوليد 24 حلقة
// ==========================================
app.get('/api/anime/:id', (req, res) => {
  const targetId = req.params.id || "6a8a5cab235e1b9d3849ebd7";
  
  const episodesList = [];
  for (let i = 1; i <= 24; i++) {
    episodesList.push({
      episodeNumber: i,
      title: `الحلقة ${i}`,
      sources: [
        {
          quality: "1080p (Direct MP4)",
          url: `${BASE_DOMAIN}/api/stream/${targetId}/${i}`,
          isHLS: false
        }
      ],
      subtitles: []
    });
  }

  res.json({
    success: true,
    data: {
      ...formatAnimeForMovieModel({ _id: targetId, title: "One Piece" }),
      episodes: episodesList
    }
  });
});

// ==========================================
// مسار البث المباشر لجميع الحلقات (Redirect 302)
// ==========================================
app.get('/api/stream/:animeId/:epNum', (req, res) => {
  const { animeId, epNum } = req.params;
  console.log(`>>> تشغيل بث ون بيس للأنمي: ${animeId} - الحلقة: ${epNum}`);
  
  // التحويل المباشر إلى رابط الـ MP4 المباشر
  return res.redirect(302, ONE_PIECE_DIRECT_URL);
});

// ==========================================
// فحص حالة السيرفر
// ==========================================
app.get('/', (req, res) => {
  res.json({ 
    status: "online", 
    message: "Anime Backend API is streaming One Piece Direct MP4" 
  });
});
