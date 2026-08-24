require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGODB_URI;
const BASE_DOMAIN = process.env.BASE_URL || 'https://anime-backend-bvuj.onrender.com';

// رابط الفيديو التجريبي المباشر
const STATIC_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

app.use(cors());
app.use(express.json());

// تسجيل الطلبات لمتابعة المشغل من لوحة Render
app.use((req, res, next) => {
  console.log(`>>> [REQUEST] ${req.method} ${req.url}`);
  next();
});

// تشغيل خادم الويب فوراً لضمان عدم حدوث Crash
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running live on port ${PORT}`);
});

// محاولة الاتصال بقاعدة البيانات في الخلفية
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB Warning:', err.message));
}

// دالة تنسيق بيانات الأنمي
const formatAnimeForMovieModel = (item) => {
  const animeId = item._id ? item._id.toString() : "6a8a5cab235e1b9d3849ebd7";
  return {
    _id: animeId,
    title: item.title || "One Piece",
    japaneseTitle: item.japaneseTitle || "ワンピース",
    synopsis: item.synopsis || "مغامرات لوفي وطاقمه للبحث عن كنز الوان بيس الأسطوري.",
    posterUrl: item.posterUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600",
    bannerUrl: item.bannerUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200",
    score: item.score || 9.0,
    status: item.status || "Currently Airing",
    category: item.category || "TV",
    genres: ["Action", "Adventure", "Fantasy"],
    servers: [
      {
        server_name: "سيرفر البث السحابي (FHD)",
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
// مسار جلب تفاصيل الأنمي وتوليد 24 حلقة كاملة
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
          quality: "1080p (Direct)",
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
      ...formatAnimeForMovieModel({ _id: targetId, title: "Jujutsu Kaisen / One Piece" }),
      episodes: episodesList
    }
  });
});

// ==========================================
// مسار البث المباشر (يشغل أي رقم حلقة يتم الضغط عليه)
// ==========================================
app.get('/api/stream/:animeId/:epNum', (req, res) => {
  const { animeId, epNum } = req.params;
  console.log(`>>> تشغيل البث للأنمي: ${animeId} - الحلقة: ${epNum}`);
  
  // إعادة التوجيه إلى رابط الفيديو المباشر لجميع الحلقات
  return res.redirect(302, STATIC_VIDEO_URL);
});

// ==========================================
// مسار فحص الحالة
// ==========================================
app.get('/', (req, res) => {
  res.json({ 
    status: "online", 
    message: "Anime Backend API is running live 24/7 on Render" 
  });
});
