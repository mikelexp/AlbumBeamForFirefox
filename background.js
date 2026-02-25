// background.js — registra el menú contextual y maneja sus clicks

function crearMenus() {
  browser.contextMenus.removeAll().then(() => {
    browser.contextMenus.create({
      id: "album-finder",
      title: "Search album in…",
      contexts: ["page"]
    });
    browser.contextMenus.create({
      id: "spotify-web",
      parentId: "album-finder",
      title: "Spotify Web",
      icons: { "16": "icons/spotify.png" },
      contexts: ["page"]
    });
    browser.contextMenus.create({
      id: "spotify-app",
      parentId: "album-finder",
      title: "Spotify Desktop",
      icons: { "16": "icons/spotify.png" },
      contexts: ["page"]
    });
    browser.contextMenus.create({
      id: "tidal-web",
      parentId: "album-finder",
      title: "Tidal Web",
      icons: { "16": "icons/tidal.png" },
      contexts: ["page"]
    });
    browser.contextMenus.create({
      id: "tidal-app",
      parentId: "album-finder",
      title: "Tidal Desktop",
      icons: { "16": "icons/tidal.png" },
      contexts: ["page"]
    });
    browser.contextMenus.create({
      id: "ytmusic-web",
      parentId: "album-finder",
      title: "YouTube Music",
      icons: { "16": "icons/ytmusic.png" },
      contexts: ["page"]
    });
  });
}

browser.runtime.onInstalled.addListener(crearMenus);
browser.runtime.onStartup.addListener(crearMenus);

browser.contextMenus.onClicked.addListener((info, tab) => {
  const destinos = ["spotify-web", "spotify-app", "tidal-web", "tidal-app", "ytmusic-web"];
  if (!destinos.includes(info.menuItemId)) return;

  browser.tabs.executeScript(tab.id, { file: "content.js" })
    .then(results => {
      const data = results && results[0];
      if (!data || !data.album) return;

      const query = encodeURIComponent([data.artist, data.album].filter(Boolean).join(" "));

      switch (info.menuItemId) {
        case "spotify-web":
          browser.tabs.create({ url: "https://open.spotify.com/search/" + query + "/albums" });
          break;
        case "spotify-app":
          browser.tabs.update(tab.id, { url: "spotify:search:" + query });
          break;
        case "tidal-web":
          browser.tabs.create({ url: "https://listen.tidal.com/search?q=" + query });
          break;
        case "tidal-app":
          browser.tabs.update(tab.id, { url: "tidal://search?q=" + query });
          break;
        case "ytmusic-web":
          browser.tabs.create({ url: "https://music.youtube.com/search?q=" + query });
          break;
      }
    });
});
