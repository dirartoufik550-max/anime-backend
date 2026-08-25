require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGODB_URI;
const BASE_DOMAIN = process.env.BASE_URL || 'https://anime-backend-bvuj.onrender.com';

// رابط بث الفيديو المباشر HLS (m3u8 متعدد الجودات)
const MASTER_STREAM_URL = "https://repackager.wixmp.com/video.wixstatic.com/video/5f9688_44eeb4663afb47b48c751b8d381c549c/,1080p,720p,480p,/mp4/file.mp4.urlset/master.m3u8";

app.use(cors());
app.use(express.json());

// مراقبة وتسجيل الطلبات المباشرة
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
    title: item.title || "Jujutsu Kaisen",
    japaneseTitle: item.japaneseTitle || "呪術廻戦",
    synopsis: item.synopsis || "مغامرات وأحداث مشوقة بجودة بث عالية متعددة الجودات.",
    posterUrl: item.posterUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600",
    bannerUrl: item.bannerUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200",
    score: item.score || 9.2,
    status: item.status || "Currently Airing",
    category: item.category || "TV",
    genres: ["Action", "Supernatural", "Fantasy"],
    servers: [
      {
        server_name: "سيرفر البث التكيفي (HLS Master)",
        stream_url: `${BASE_DOMAIN}/api/stream/${animeId}/1`
      }
    ]
  };
};

// ==========================================
// مسارات الكتالوج الرئيسي (Trending / Latest / Top-Rated)
// ==========================================
app.get('/api/anime/trending', (req, res) => {
  res.json({ success: true, count: 1, data: [formatAnimeForMovieModel({ title: "Jujutsu Kaisen" })] });
});

app.get('/api/anime/latest', (req, res) => {
  res.json({ success: true, count: 1, data: [formatAnimeForMovieModel({ title: "Jujutsu Kaisen" })] });
});

app.get('/api/anime/top-rated', (req, res) => {
  res.json({ success: true, count: 1, data: [formatAnimeForMovieModel({ title: "Jujutsu Kaisen" })] });
});

// ==========================================
// مسار جلب تفاصيل الأنمي وتوليد الحلقات بصيغة HLS
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
          quality: "Auto (1080p/720p/480p HLS)",
          url: `${BASE_DOMAIN}/api/stream/${targetId}/${i}`,
          isHLS: true
        }
      ],
      subtitles: []
    });
  }

  res.json({
    success: true,
    data: {
      ...formatAnimeForMovieModel({ _id: targetId, title: "Jujutsu Kaisen" }),
      episodes: episodesList
    }
  });
});

// ==========================================
// مسار البث المباشر لأي أنمي وأي حلقة
// ==========================================
app.get('/api/stream/:animeId/:epNum', (req, res) => {
  const { animeId, epNum } = req.params;
  console.log(`>>> توجيه البث المباشر HLS للأنمي: ${animeId} - الحلقة: ${epNum}`);
  
  // التحويل المباشر إلى رابط الـ master.m3u8
  return res.redirect(302, MASTER_STREAM_URL);
});

// ==========================================
// فحص حالة السيرفر
// ==========================================
app.get('/', (req, res) => {
  res.json({ 
    status: "online", 
    message: "Anime Backend API is streaming master.m3u8 successfully" 
  });
});
