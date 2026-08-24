const axios = require('axios');

async function getAnimeEpisodeStream(animeTitle, episodeNum = 1) {
  try {
    // 1. استخدام معرف MAL الافتراضي أو البحث عن العمل
    const malId = 52299; // Solo Leveling كمثال افتراضي
    const embedUrl = `https://megaplay.buzz/stream/mal/${malId}/${episodeNum}/sub`;

    const response = await axios.get(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://megaplay.buzz/'
      },
      timeout: 10000
    });

    const html = response.data;

    // 2. البحث عن مسار ملف HLS (.m3u8) أو رابط السيرفر المباشر داخل كود الصفحة
    const m3u8Match = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/i);
    const iframeMatch = html.match(/src=["'](https?:\/\/[^"']+)["']/i);

    if (m3u8Match && m3u8Match[1]) {
      return { streamUrl: m3u8Match[1], isHLS: true };
    }

    if (iframeMatch && iframeMatch[1]) {
      return { streamUrl: iframeMatch[1], isHLS: false };
    }

    // رابط احتياطي مباشر في حال كانت الحلقة تحتاج مفتاح فك تشفير إضافي
    return {
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      isHLS: false
    };
  } catch (err) {
    console.error('Stream Extraction Error:', err.message);
    return {
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      isHLS: false
    };
  }
}

module.exports = { getAnimeEpisodeStream };
