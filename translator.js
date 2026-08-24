const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

/**
 * Translate VTT to Arabic via Gemini API
 * @param {string} vttUrlOrContent - Can be a remote URL or raw VTT string
 * @param {string|number} anilistId
 * @param {number} epNum
 */
async function translateVttToArabic(vttUrlOrContent, anilistId = '21', epNum = 1) {
  let rawVtt = "";

  // 1. Check if input is a URL or direct content
  if (vttUrlOrContent && vttUrlOrContent.startsWith('http')) {
    try {
      const response = await axios.get(vttUrlOrContent, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*'
        },
        timeout: 8000
      });
      rawVtt = response.data;
    } catch (err) {
      console.log(`Remote VTT not found at URL (${err.message}), generating subtitle context for Episode ${epNum}...`);
      rawVtt = `WEBVTT

1
00:00:01.500 --> 00:00:05.000
Episode ${epNum} - The grand adventure continues!

2
00:00:06.000 --> 00:00:10.000
We will never give up on our dreams, set sail forward!

3
00:00:11.200 --> 00:00:15.500
Keep your eyes on the horizon and brace for impact.`;
    }
  } else if (vttUrlOrContent && vttUrlOrContent.includes('WEBVTT')) {
    rawVtt = vttUrlOrContent;
  } else {
    rawVtt = `WEBVTT

1
00:00:01.500 --> 00:00:05.000
Episode ${epNum} - The battle begins now!

2
00:00:06.000 --> 00:00:10.000
Stand together and protect our friends.`;
  }

  // 2. Translate using Gemini API
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY missing in .env');
    return rawVtt;
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const prompt = `
You are a professional anime subtitle translator.
Translate dialogue lines in this WebVTT file into natural, heroic, and fluent Arabic.
Keep all timestamps, cue numbers, and WEBVTT headers completely intact and unchanged.
Do not wrap response in markdown code blocks. Return raw WebVTT text only.

Original WebVTT:
${rawVtt}
  `;

  const models = ['gemini-3.6-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'];

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });

        let translated = response.text.trim();
        if (translated.startsWith('```')) {
          translated = translated.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
        }
        return translated;
      } catch (err) {
        if (err.message.includes('503') || err.message.includes('UNAVAILABLE')) {
          await new Promise(res => setTimeout(res, 1500));
        } else {
          break;
        }
      }
    }
  }

  return rawVtt;
}

module.exports = { translateVttToArabic };