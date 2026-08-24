async function getAnimeEpisodeStream(animeTitle, episodeNum = 1) {
  // رابط الفيديو المباشر المستخرج من SoraPlay
  const directMp4Url = "https://soraplay.xyz/FibCU10knKEu8/0708b953cfaaa48084c05e46b3b87931/%5BWitanime.com%5D+JK+EP+01+BD-FHD-480p.mp4";

  return {
    streamUrl: directMp4Url,
    isHLS: false
  };
}

module.exports = { getAnimeEpisodeStream };
