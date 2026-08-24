const axios = require('axios');

async function testMegaPlayStream(malId = 52299, epNum = 1) {
  const targetUrl = `https://megaplay.buzz/stream/mal/${malId}/${epNum}/sub`;
  console.log(`>>> [TEST] Fetching embed player from: ${targetUrl}`);

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://megaplay.buzz/'
      },
      timeout: 10000
    });

    console.log(`>>> [TEST SUCCESS] Status Code: ${response.status}`);
    // سنقوم بطباعة جزء من كود الصفحة لمعاينة وسوم مشغل الفيديو ومصادر البث
    console.log(`>>> [HTML PREVIEW]:\n`, response.data.substring(0, 500));
    return response.data;
  } catch (error) {
    console.error(`>>> [TEST FAILED]:`, error.message);
    return null;
  }
}

module.exports = { testMegaPlayStream };
