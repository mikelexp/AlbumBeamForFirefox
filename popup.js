// popup.js

const statusEl  = document.getElementById("status");
const infoEl    = document.getElementById("info");
const buttonsEl = document.getElementById("buttons");
const headerSub = document.querySelector(".header-text p");

function showError(msg) {
  statusEl.className   = "error";
  statusEl.innerHTML   = msg;
  statusEl.style.display = "block";
  document.querySelector(".spinner") && (document.querySelector(".spinner").style.display = "none");
  headerSub.textContent = "Could not detect";
}

function toTitleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function showResult(data, tabId) {
  headerSub.textContent = "Album found";

  document.getElementById("artist-name").textContent = toTitleCase(data.artist);
  document.getElementById("album-name").textContent  = toTitleCase(data.album);
  document.getElementById("site-name").textContent   = data.site;

  infoEl.style.display    = "block";
  buttonsEl.style.display = "flex";
  statusEl.style.display  = "none";

  // Si ya estamos en uno de los servicios, ocultamos sus propios botones
  const onSpotify  = data.source === "spotify";
  const onTidal    = data.source === "tidal";
  const onYTMusic  = data.source === "youtube_music";
  document.getElementById("btn-web").style.display       = onSpotify ? "none" : "flex";
  document.getElementById("btn-app").style.display       = onSpotify ? "none" : "flex";
  document.getElementById("btn-tidal").style.display     = onTidal   ? "none" : "flex";
  document.getElementById("btn-tidal-app").style.display = onTidal   ? "none" : "flex";
  document.getElementById("btn-ytmusic").style.display   = onYTMusic ? "none" : "flex";

  const query = encodeURIComponent([data.artist, data.album].filter(Boolean).join(" "));

  document.getElementById("btn-web").onclick = () => {
    browser.tabs.update(tabId, { url: "https://open.spotify.com/search/" + query + "/albums" });
    window.close();
  };

  document.getElementById("btn-app").onclick = () => {
    browser.tabs.update(tabId, { url: "spotify:search:" + query });
    window.close();
  };

  document.getElementById("btn-tidal").onclick = () => {
    browser.tabs.update(tabId, { url: "https://listen.tidal.com/search?q=" + query });
    window.close();
  };

  document.getElementById("btn-tidal-app").onclick = () => {
    browser.tabs.update(tabId, { url: "tidal://search?q=" + query });
    window.close();
  };

  document.getElementById("btn-ytmusic").onclick = () => {
    browser.tabs.update(tabId, { url: "https://music.youtube.com/search?q=" + query });
    window.close();
  };
}

// ── Al abrir el popup, inyectamos content.js en la pestaña activa ──
browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
  const tab = tabs[0];
  statusEl.style.display = "block";

  browser.tabs.executeScript(tab.id, { file: "content.js" })
    .then(results => {
      const data = results && results[0];
      if (data && data.album) {
        showResult(data, tab.id);
      } else {
        showError("No album detected on this page.<br><small>Try on Metal Archives, RYM, Bandcamp, Discogs…</small>");
      }
    })
    .catch(err => {
      showError("Cannot access this page.<br><small>" + err.message + "</small>");
    });
});
