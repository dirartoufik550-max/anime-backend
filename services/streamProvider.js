const axios = require('axios');
const cheerio = require('cheerio');

async function getAnimeEpisodeStream(animeTitle, episodeNum = 1) {
  try {
    // رابط الحلقة المباشر من WitAnime
    // ملاحظة: يمكنك بناء الرابط ديناميكياً بحسب اسم الأنمي ورقم الحلقة
    const targetUrl = `https://witanime.you/episode/jujutsu-kaisen-%d8%a7%d9%84%d8%ad%d9%84%d9%82%d8%a9-${episodeNum}/`;

    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://witanime.you/'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // 1. البحث عن روابط سيرفرات المشاهدة المضمنة داخل الصفحة
    let videoStreamUrl = null;

    // استخراج أول سيرفر مشاهدة متاح (سيرفرات الـ Iframe أو روابط التحميل المباشرة)
    $('ul#episode-servers li a').each((i, el) => {
      const serverUrl = $(el).attr('data-ep-url') || $(el).attr('href');
      if (serverUrl && !videoStreamUrl) {
        videoStreamUrl = serverUrl;
      }
    });

    // 2. إذا لم تكن في قائمة السيرفرات، نفحص روابط أزرار التحميل المباشرة (الجودة العالية HD)
    if (!videoStreamUrl) {
      $('a.download-button').each((i, el) => {
        const downloadUrl = $(el).attr('href');
        if (downloadUrl && downloadUrl.includes('.mp4')) {
          videoStreamUrl = downloadUrl;
        }
      });
    }

    if (videoStreamUrl) {
      return { streamUrl: videoStreamUrl, isHLS: videoStreamUrl.includes('.m3u8') };
    }

    // رابط احتياطي
    return {
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      isHLS: false
    };
  } catch (error) {
    console.error('WitAnime Extraction Error:', error.message);
    return {
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      isHLS: false
    };
  }
}

module.exports = { getAnimeEpisodeStream };
