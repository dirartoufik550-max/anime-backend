const axios = require('axios');
const CryptoJS = require('crypto-js');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * فك تشفير مصادر MegaCloud عند تشفيرها بـ AES
 */
function decryptMegaCloudSource(encryptedData, secretKey) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, secretKey).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (err) {
    return null;
  }
}

/**
 * استخراج رابط m3u8 والترجمة من رابط embed الخاص بـ MegaCloud / VidCloud
 * @param {string} embedUrl رابط التضمين مثل: https://megacloud.tv/embed-2/e-1/xyz123
 */
async function extractFromMegaCloud(embedUrl) {
  try {
    const urlObj = new URL(embedUrl);
    const domain = urlObj.origin; // https://megacloud.tv
    const videoId = embedUrl.split('/').pop().split('?')[0];

    // 1. طلب مصادر البث من API الداخلي للسيرفر
    const getSourcesUrl = `${domain}/ajax/embed-6/getSources?id=${videoId}`;

    const response = await axios.get(getSourcesUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': embedUrl,
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 10000
    });

    const data = response.data;
    if (!data) throw new Error('No data received from MegaCloud');

    let sources = [];

    // 2. فحص هل البيانات مشفرة أم نص صريح
    if (data.encrypted && typeof data.sources === 'string') {
      // جلب مفتاح فك التشفير التلقائي لسيرفرات megacloud/rabbit
      const keyRes = await axios.get('https://raw.githubusercontent.com/cinemata/cinemata-sources/main/keys.json');
      const key = keyRes.data?.megacloud?.key || 'complex_secret_key';
      sources = decryptMegaCloudSource(data.sources, key) || [];
    } else {
      sources = Array.isArray(data.sources) ? data.sources : [];
    }

    // 3. استخراج رابط الـ m3u8 الرئيسي وملفات الترجمة
    const masterM3u8 = sources.find(s => s.type === 'hls' || s.file?.includes('.m3u8'))?.file || (sources[0] ? sources[0].file : null);
    const subtitles = data.tracks || [];

    return {
      success: !!masterM3u8,
      streamUrl: masterM3u8,
      tracks: subtitles,
      intro: data.intro || null,
      outro: data.outro || null
    };

  } catch (err) {
    console.error('MegaCloud Extraction Failed:', err.message);
    return { success: false, streamUrl: null, tracks: [] };
  }
}

module.exports = { extractFromMegaCloud };