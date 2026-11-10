// Click-to-play for the video guides. Nothing from YouTube or Vimeo is loaded until a visitor presses play
// (YouTube uses the privacy-friendly youtube-nocookie.com player). Without JavaScript, or with a modified
// click such as ctrl/cmd-click, the thumbnail is just a link that opens the video in a new tab.

function playerFor(card) {
  const title = card.dataset.videoTitle || 'Video guide';
  if (card.dataset.videoEmbed) {
    const frame = document.createElement('iframe');
    frame.src = card.dataset.videoEmbed;
    frame.title = title;
    frame.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.className = 'video-card__frame';
    return frame;
  }
  if (card.dataset.videoSrc) {
    const video = document.createElement('video');
    video.src = card.dataset.videoSrc;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-label', title);
    video.className = 'video-card__frame';
    return video;
  }
  return null;
}

export function enhanceVideos(root) {
  root.querySelectorAll('a.video-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      const player = playerFor(card);
      if (!player) return;
      event.preventDefault();
      const holder = document.createElement('div');
      holder.className = 'video-card video-card--playing';
      const title = document.createElement('p');
      title.className = 'video-card__title';
      title.textContent = card.dataset.videoTitle || 'Video guide';
      holder.append(player, title);
      card.replaceWith(holder);
      player.focus();
    });
  });
}
