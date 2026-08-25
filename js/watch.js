(function () {
  const CHANNEL_ID = 'UCzBSLVhkfYqJWyA1KG4qa8A';
  const HANDLE = 'https://www.youtube.com/@gatewaycitychurchlasvegas';
  const FEED = 'https://jtifhcvbgxqwlywugvjv.supabase.co/functions/v1/gcc-youtube-feed';
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aWZoY3ZiZ3hxd2x5d3Vndmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDc5NTgsImV4cCI6MjA4ODA4Mzk1OH0.UfRVLuvM8_HPvKXUEDXb0cxR50znv16L5Tf99AnSc7g';

  const FALLBACK = [
    { videoId: 'lGhAh8hFsKE', title: 'Sunday Morning Service', published: '2026-08-24' },
    { videoId: 'nhpFttYFpwI', title: 'Servicios Dominicales', published: '2026-08-24' },
    { videoId: 'JYZ-yyJ_ly8', title: 'Midweek Fuel-Up', published: '2026-08-20' },
    { videoId: 'f14pAvCA93g', title: 'Tuesday AM Devo', published: '2026-08-19' },
    { videoId: 'ql21RdgiPX4', title: 'Sunday Morning Service', published: '2026-08-17' }
  ];

  function isSundayVegas() {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: 'America/Los_Angeles'
    }) === 'Sunday';
  }

  function age(iso) {
    if (!iso) return '';
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days < 1) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return days + ' days ago';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  const liveBox = document.getElementById('watchLive');
  const liveFrame = document.getElementById('watchLiveFrame');
  const liveNote = document.getElementById('watchLiveNote');
  const nextBox = document.getElementById('watchNext');
  const reel = document.getElementById('watchReel');
  if (!reel) return;

  const force = new URLSearchParams(location.search).get('live');
  const sunday = force === '1' || (force !== '0' && isSundayVegas());
  if (sunday) {
    liveBox.classList.add('on');
    liveNote.hidden = false;
    liveFrame.src = 'https://www.youtube.com/embed/live_stream?channel=' + CHANNEL_ID;
  } else {
    nextBox.classList.add('on');
  }

  function paint(videos) {
    reel.innerHTML = videos.slice(0, 5).map((v) => `
      <a class="watch-card" href="${esc(v.videoUrl || ('https://www.youtube.com/watch?v=' + v.videoId))}" target="_blank" rel="noopener">
        <img src="${esc(v.thumbnailUrl || ('https://i.ytimg.com/vi/' + v.videoId + '/hqdefault.jpg'))}" alt="">
        <div class="t">${esc(v.title)}</div>
        <div class="m">${esc(age(v.published))}</div>
      </a>`).join('');
  }

  paint(FALLBACK);

  fetch(FEED, { headers: { apikey: ANON, authorization: 'Bearer ' + ANON } })
    .then((r) => { if (!r.ok) throw new Error('feed ' + r.status); return r.json(); })
    .then((body) => {
      const videos = Array.isArray(body.videos) ? body.videos : [];
      if (videos.length) paint(videos);
    })
    .catch(() => {});
})();
