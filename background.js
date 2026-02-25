// background.js — registra el menú contextual y maneja sus clicks

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

function buildMenus(settings) {
  const svc = settings.services;
  const anyEnabled = Object.values(svc).some(Boolean);

  browser.contextMenus.removeAll().then(() => {
    if (!anyEnabled) return;

    browser.contextMenus.create({
      id: "album-finder",
      title: "Search album in…",
      contexts: ["page"]
    });

    if (svc.spotifyWeb) browser.contextMenus.create({
      id: "spotify-web", parentId: "album-finder",
      title: "Spotify Web", icons: { "16": "icons/spotify.png" }, contexts: ["page"]
    });
    if (svc.spotifyDesktop) browser.contextMenus.create({
      id: "spotify-app", parentId: "album-finder",
      title: "Spotify Desktop", icons: { "16": "icons/spotify.png" }, contexts: ["page"]
    });
    if (svc.tidalWeb) browser.contextMenus.create({
      id: "tidal-web", parentId: "album-finder",
      title: "Tidal Web", icons: { "16": "icons/tidal.png" }, contexts: ["page"]
    });
    if (svc.tidalDesktop) browser.contextMenus.create({
      id: "tidal-app", parentId: "album-finder",
      title: "Tidal Desktop", icons: { "16": "icons/tidal.png" }, contexts: ["page"]
    });
    if (svc.ytmusicWeb) browser.contextMenus.create({
      id: "ytmusic-web", parentId: "album-finder",
      title: "YouTube Music", icons: { "16": "icons/ytmusic.png" }, contexts: ["page"]
    });
  });
}

function crearMenus() {
  browser.storage.local.get("settings").then(result => {
    buildMenus(mergeDefaults(result.settings));
  });
}

browser.runtime.onInstalled.addListener(crearMenus);
browser.runtime.onStartup.addListener(crearMenus);

// Rebuild menus in real-time when settings change
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.settings) {
    buildMenus(mergeDefaults(changes.settings.newValue));
  }
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  const handled = ["spotify-web", "spotify-app", "tidal-web", "tidal-app", "ytmusic-web"];
  if (!handled.includes(info.menuItemId)) return;

  Promise.all([
    browser.tabs.executeScript(tab.id, { file: "content.js" }),
    browser.storage.local.get("settings"),
  ]).then(([results, stored]) => {
    const data = results && results[0];
    if (!data || !data.album) return;

    const settings = mergeDefaults(stored.settings);
    const query    = encodeURIComponent([data.artist, data.album].filter(Boolean).join(" "));

    const urls = {
      "spotify-web": "https://open.spotify.com/search/" + query + "/albums",
      "spotify-app": "spotify:search:" + query,
      "tidal-web":   "https://listen.tidal.com/search?q=" + query,
      "tidal-app":   "tidal://search?q=" + query,
      "ytmusic-web": "https://music.youtube.com/search?q=" + query,
    };

    const url        = urls[info.menuItemId];
    const isProtocol = !url.startsWith("http");

    if (settings.newTab && !isProtocol) {
      browser.tabs.create({ url });
    } else {
      browser.tabs.update(tab.id, { url });
    }
  });
});
