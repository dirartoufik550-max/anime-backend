const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  episodeNumber: { type: Number, required: true },
  title: { type: String, default: '' },
  streamUrl: { type: String, required: true },
  isHLS: { type: Boolean, default: false },
  originalSubUrl: { type: String, default: '' },
  arabicVtt: { type: String, default: '' }
});

const animeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  japaneseTitle: { type: String, default: '' },
  synopsis: { type: String, default: '' },
  posterUrl: { type: String, default: '' },
  bannerUrl: { type: String, default: '' },
  score: { type: Number, default: 8.5 },
  status: { type: String, default: 'Currently Airing' },
  category: { type: String, default: 'TV' },
  genres: [{ type: String }],
  totalEpisodesCount: { type: Number, default: 24 },
  episodes: [episodeSchema]
}, { timestamps: true, strict: false });

// منع إعادة تعريف الموديل إذا كان موجوداً مسبقاً
module.exports = mongoose.models.Anime || mongoose.model('Anime', animeSchema);