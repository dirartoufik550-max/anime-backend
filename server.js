require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const Anime = require('./models/Anime');
const { runAutoIngest } = require('./services/autoIngest');
const { getDirectAnimeStream } = require('./services/streamProvider');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`>>> [REQUEST] ${req.method} ${req.url}`);
  next();
});

const formatAnimeForMovieModel = (doc) => {
  const item = doc.toObject ? doc.toObject() : doc;
  return {
    ...item,
    _id: item._id ? item._id.toString() : "",
    title: item.title || "No Title",
    japaneseTitle: item.japaneseTitle || item.title || "",
    synopsis: item.synopsis || "No synopsis available.",
    posterUrl: item.posterUrl || "",
    bannerUrl: item.bannerUrl || item.posterUrl || "",
    score: item.score || 8.5,
    status: item.status || "Currently Airing",
    category: item.category || "TV",
    genres: Array.isArray(item.genres) && item.genres.length > 0 ? item.genres : ["Action", "Adventure"],
    servers: [
      {
        server_name: "سيرفر رئيسي (1080p)",
        stream_url: "https://ia800300.us.archive.org/24/items/one-piece-ep-1_202303/One%20Piece%20Episode%201.mp4"
      }
    ]
  };
};

const generateFullEpisodesList = (doc) => {
  const eps = [];
  const count = doc.totalEpisodesCount || 24;
  const animeId = doc._id.toString();

  for (let i = 1; i <= count; i++) {
    eps.push({
      episodeNumber: i,
      title: `الحلقة ${i}`,
      sources: [
        {
          quality: "1080p (Auto)",
          url: `http://192.168.1.3:3000/api/stream/${animeId}/${i}`,
          isHLS: false
        }
      ],
      subtitles: [
        {
          lang: "Arabic",
          url: `http://192.168.1.3:3000/api/subtitles/${animeId}/${i}`
        }
      ]
    });
  }
  return eps;
};

// ==========================================
// مسارات الكتالوج (AnimeCatalog)
// ==========================================
app.get('/api/anime/trending', async (req, res) => {
  try {
    const list = await Anime.find().sort({ score: -1 });
    res.json({ success: true, count: list.length, data: list.map(formatAnimeForMovieModel) });
  } catch (err) {
    res.status(500).json({ success: false, count: 0, data: [] });
  }
});

app.get('/api/anime/latest', async (req, res) => {
  try {
    const list = await Anime.find().sort({ updatedAt: -1 });
    res.json({ success: true, count: list.length, data: list.map(formatAnimeForMovieModel) });
  } catch (err) {
    res.status(500).json({ success: false, count: 0, data: [] });
  }
});

app.get('/api/anime/top-rated', async (req, res) => {
  try {
    const list = await Anime.find().sort({ score: -1 });
    res.json({ success: true, count: list.length, data: list.map(formatAnimeForMovieModel) });
  } catch (err) {
    res.status(500).json({ success: false, count: 0, data: [] });
  }
});

app.get('/api/anime/genre/:genreName', async (req, res) => {
  try {
    const genre = req.params.genreName;
    const list = await Anime.find({
      $or: [
        { genres: { $regex: new RegExp(genre, "i") } },
        { title: { $regex: new RegExp(genre, "i") } }
      ]
    });
    res.json({ success: true, count: list.length, data: list.map(formatAnimeForMovieModel) });
  } catch (err) {
    res.status(500).json({ success: false, count: 0, data: [] });
  }
});

// ==========================================
// مسار تفاصيل الأنمي وقائمة الحلقات
// ==========================================
app.get('/api/anime/:id', async (req, res) => {
  try {
    let anime = null;
    const reqId = req.params.id;

    if (mongoose.Types.ObjectId.isValid(reqId)) {
      anime = await Anime.findById(reqId);
    } else {
      anime = await Anime.findOne({
        $or: [{ _id: reqId }, { title: { $regex: new RegExp(reqId, "i") } }]
      });
    }

    if (!anime) anime = await Anime.findOne();

    const doc = anime.toObject ? anime.toObject() : anime;
    res.json({
      success: true,
      data: {
        ...doc,
        episodes: generateFullEpisodesList(doc)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// مسار البث المباشر (Direct Stream Engine)
// ==========================================
app.get('/api/stream/:animeId/:epNum', async (req, res) => {
  try {
    const { animeId, epNum } = req.params;
    let animeTitle = "one-piece";

    // 1. فحص قاعدة البيانات أولاً
    if (mongoose.Types.ObjectId.isValid(animeId)) {
      const anime = await Anime.findById(animeId);
      if (anime) {
        animeTitle = anime.title || "one-piece";

        if (anime.episodes && anime.episodes.length > 0) {
          const ep = anime.episodes.find(e => Number(e.episodeNumber) === Number(epNum));
          if (ep && ep.streamUrl) {
            return res.redirect(302, ep.streamUrl);
          }
        }
      }
    }

    // 2. استخدام محرك البث المباشر إذا لم تكن الحلقة مخزنة مسبقاً
    const streamData = await getDirectAnimeStream(animeTitle, epNum);
    return res.redirect(302, streamData.streamUrl);

  } catch (err) {
    console.error('Stream Route Error:', err.message);
    res.redirect(302, "https://ia800300.us.archive.org/24/items/one-piece-ep-1_202303/One%20Piece%20Episode%201.mp4");
  }
});

// ==========================================
// مسار الترجمة العربية المتزامنة (Gemini Subtitles)
// ==========================================
app.get('/api/subtitles/:animeId/:epNum', async (req, res) => {
  try {
    const { animeId, epNum } = req.params;
    let anime = null;

    if (mongoose.Types.ObjectId.isValid(animeId)) {
      anime = await Anime.findById(animeId);
    }

    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (anime && anime.episodes && anime.episodes.length > 0) {
      const ep = anime.episodes.find(e => Number(e.episodeNumber) === Number(epNum));
      if (ep && ep.arabicVtt) {
        return res.send(ep.arabicVtt);
      }
    }

    res.send(`WEBVTT\n\n00:00:01.000 --> 00:00:06.000\n[ترجمة عربية متزامنة - الحلقة ${epNum}]\n00:00:07.000 --> 00:00:12.000\nمشاهدة ممتعة.`);
  } catch (err) {
    res.status(500).send("WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nحدث خطأ في جلب الترجمة");
  }
});

// ==========================================
// تشغيل السيرفر والجدولة الآلية
// ==========================================
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected Successfully from .env');

    runAutoIngest();

    cron.schedule('0 */2 * * *', () => {
      runAutoIngest();
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on: http://192.168.1.3:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
  });