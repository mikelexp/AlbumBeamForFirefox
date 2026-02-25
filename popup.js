// popup.js

const statusEl  = document.getElementById("status");
const infoEl    = document.getElementById("info");
const buttonsEl = document.getElementById("buttons");
const headerSub = document.querySelector(".header-text p");

const DEFAULTS = {
  services: {
    spotifyWeb:     true,
    spotifyDesktop: true,
    tidalWeb:       true,
    tidalDesktop:   true,
    ytmusicWeb:     true,
  },
  newTab: false
};

function mergeDefaults(stored) {
  const s = stored || {};
  return {
    services: Object.assign({}, DEFAULTS.services, s.services || {}),
    newTab: s.newTab !== undefined ? s.newTab : DEFAULTS.newTab,
  };
}

function showError(msg) {
  statusEl.className     = "error";
  statusEl.innerHTML     = msg;
  statusEl.style.display = "block";
  const spinner = document.querySelector(".spinner");
  if (spinner) spinner.style.display = "none";
  headerSub.textContent = "Could not detect";
}

function toTitleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

// Navigate respecting the newTab setting.
// Protocol URLs (spotify:, tidal://) always use current tab.
function openUrl(url, tabId, newTab) {
  const isProtocol = !url.startsWith("http");
  if (newTab && !isProtocol) {
    browser.tabs.create({ url });
  } else {
    browser.tabs.update(tabId, { url });
  }
  window.close();
}

function showResult(data, tabId, settings) {
  headerSub.textContent = "Album found";

  document.getElementById("artist-name").textContent = toTitleCase(data.artist);
  document.getElementById("album-name").textContent  = toTitleCase(data.album);
  document.getElementById("site-name").textContent   = data.site;

  infoEl.style.display    = "block";
  buttonsEl.style.display = "flex";
  statusEl.style.display  = "none";

  const onSpotify = data.source === "spotify";
  const onTidal   = data.source === "tidal";
  const onYTMusic = data.source === "youtube_music";
  const svc       = settings.services;

  const visibility = {
    "btn-web":       svc.spotifyWeb     && !onSpotify,
    "btn-app":       svc.spotifyDesktop && !onSpotify,
    "btn-tidal":     svc.tidalWeb       && !onTidal,
    "btn-tidal-app": svc.tidalDesktop   && !onTidal,
    "btn-ytmusic":   svc.ytmusicWeb     && !onYTMusic,
  };

  for (const [id, visible] of Object.entries(visibility)) {
    document.getElementById(id).style.display = visible ? "flex" : "none";
  }

  if (!Object.values(visibility).some(Boolean)) {
    infoEl.style.display    = "none";
    buttonsEl.style.display = "none";
    showError("No services enabled.<br><small>Enable some in <a href='#' id='err-settings'>Settings</a>.</small>");
    document.getElementById("err-settings")?.addEventListener("click", e => {
      e.preventDefault();
      browser.runtime.openOptionsPage();
    });
    return;
  }

  const query = encodeURIComponent([data.artist, data.album].filter(Boolean).join(" "));
  const nt    = settings.newTab;

  document.getElementById("btn-web").onclick       = () => openUrl("https://open.spotify.com/search/" + query + "/albums", tabId, nt);
  document.getElementById("btn-app").onclick       = () => openUrl("spotify:search:" + query, tabId, nt);
  document.getElementById("btn-tidal").onclick     = () => openUrl("https://listen.tidal.com/search?q=" + query, tabId, nt);
  document.getElementById("btn-tidal-app").onclick = () => openUrl("tidal://search?q=" + query, tabId, nt);
  document.getElementById("btn-ytmusic").onclick   = () => openUrl("https://music.youtube.com/search?q=" + query, tabId, nt);
}

// ── Settings button ──
document.getElementById("btn-settings").addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

// ── Init: load settings and inject content.js in parallel ──
browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
  const tab = tabs[0];
  statusEl.style.display = "block";

  Promise.all([
    browser.tabs.executeScript(tab.id, { file: "content.js" }),
    browser.storage.local.get("settings"),
  ]).then(([results, stored]) => {
    const data     = results && results[0];
    const settings = mergeDefaults(stored.settings);
    if (data && data.album) {
      showResult(data, tab.id, settings);
    } else {
      showError("No album detected on this page.<br><small>Try on Metal Archives, RYM, Bandcamp, Discogs…</small>");
    }
  }).catch(err => {
    showError("Cannot access this page.<br><small>" + err.message + "</small>");
  });
});
