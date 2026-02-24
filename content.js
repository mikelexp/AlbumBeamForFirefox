// content.js — se inyecta en la pestaña activa cuando el usuario abre el popup
(function () {

function detectAlbum() {
  const hostname = location.hostname;

  // Elimina el sufijo del sitio del título y devuelve el resto limpio
  function titleBefore(pattern) {
    return document.title.replace(pattern, "").replace(/\s*[-–|]\s*$/, "").trim();
  }

  // ── Spotify Web ──────────────────────────────────────────────────
  if (hostname === "open.spotify.com") {
    let query;
    // JSON-LD MusicAlbum (más fiable)
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const d = JSON.parse(s.textContent);
        if (d['@type'] === 'MusicAlbum' && d.name) {
          const a = d.byArtist;
          const artistName = a ? (Array.isArray(a) ? a[0]?.name : a.name) : null;
          query = artistName ? artistName + " " + d.name : d.name;
          break;
        }
      } catch(e) {}
    }
    // Fallback: título "Album – Album by Artist | Spotify"
    if (!query) {
      const m = document.title.match(/^(.+?)\s*[-–]\s*.+?\s+(?:by|de)\s+(.+?)\s*\|\s*Spotify/i);
      if (m) query = m[2].trim() + " " + m[1].trim();
    }
    if (query) return { artist: "", album: query, site: "Spotify Web", source: "spotify" };
    return null;
  }

  // ── Tidal Web ────────────────────────────────────────────────────
  if (hostname === "listen.tidal.com" || hostname === "tidal.com") {
    const query = document.title.replace(/\s*[-|]\s*TIDAL\s*$/i, "").trim();
    if (query && !/^tidal$/i.test(query)) return { artist: "", album: query, site: "Tidal Web", source: "tidal" };
    return null;
  }

  // ── Pitchfork ────────────────────────────────────────────────────
  if (hostname.includes("pitchfork.com")) {
    const query = document.title.replace(/\s*(?:Album\s+)?Review\s*\|\s*Pitchfork\s*$/i, "").trim();
    if (query) return { artist: "", album: query, site: "Pitchfork" };
  }

  // ── Metal Archives ───────────────────────────────────────────────
  if (hostname.includes("metal-archives.com") || hostname.includes("encyclopaedia-metallum.com")) {
    const p = location.pathname.split("/");
    if (p[1] === "albums" && p[2] && p[3]) {
      const query = [p[2], p[3]].map(s => decodeURIComponent(s).replace(/_/g, " ")).join(" ");
      return { artist: "", album: query, site: "Metal Archives" };
    }
    const query = titleBefore(/\s*\|.*$/);
    if (query) return { artist: "", album: query, site: "Metal Archives" };
  }

  // ── Rate Your Music / Sonemic ────────────────────────────────────
  if (hostname.includes("rateyourmusic.com") || hostname.includes("sonemic.com")) {
    const query = titleBefore(/\s*\|.*$/);
    if (query) return { artist: "", album: query, site: "RYM" };
  }

  // ── Bandcamp ─────────────────────────────────────────────────────
  if (hostname.includes("bandcamp.com")) {
    let query;
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const d = JSON.parse(s.textContent);
        if (d['@type'] === 'MusicAlbum' && d.name) {
          const ba = d.byArtist;
          const artistName = ba ? (Array.isArray(ba) ? ba[0]?.name : ba.name) : null;
          query = artistName ? artistName + " " + d.name : d.name;
          break;
        }
      } catch(e) {}
    }
    if (!query) query = titleBefore(/\s*\|.*$/);
    if (query) return { artist: "", album: query, site: "Bandcamp" };
  }

  // ── AllMusic ─────────────────────────────────────────────────────
  if (hostname.includes("allmusic.com")) {
    const query = titleBefore(/\s*[\|(].*$/);
    if (query) return { artist: "", album: query, site: "AllMusic" };
  }

  // ── Discogs ──────────────────────────────────────────────────────
  if (hostname.includes("discogs.com")) {
    const og = document.querySelector('meta[property="og:title"]');
    if (og && og.content) return { artist: "", album: og.content.trim(), site: "Discogs" };
  }

  // ── MusicBrainz ──────────────────────────────────────────────────
  if (hostname.includes("musicbrainz.org")) {
    const bdi = document.querySelector("span.mp bdi");
    const query = bdi ? bdi.textContent.trim() : titleBefore(/\s*[-|].*$/);
    if (query) return { artist: "", album: query, site: "MusicBrainz" };
  }

  // ── Album of the Year ────────────────────────────────────────────
  if (hostname.includes("albumoftheyear.org")) {
    const m = location.pathname.match(/\/album\/\d+-(.+?)(?:\.php)?$/);
    if (m) return { artist: "", album: m[1].replace(/-/g, " "), site: "Album of the Year" };
  }

  // ── Metacritic ───────────────────────────────────────────────────
  if (hostname.includes("metacritic.com")) {
    const p = location.pathname.split("/");
    if (p[1] === "music" && p[2]) {
      const query = [p[2], p[3]].filter(Boolean).map(s => s.replace(/-/g, " ")).join(" ");
      return { artist: "", album: query, site: "Metacritic" };
    }
  }

  // ── Sputnikmusic ─────────────────────────────────────────────────
  if (hostname.includes("sputnikmusic.com")) {
    const p = location.pathname.split("/");
    // /review/12345/Artist-Name-Album-Title/ o /album/12345/Artist-Name-Album-Title/
    if ((p[1] === "review" || p[1] === "album") && p[3]) {
      const query = decodeURIComponent(p[3]).replace(/-/g, " ");
      return { artist: "", album: query, site: "Sputnikmusic" };
    }
    const query = document.title.replace(/\s*(?:Review\s*)?\|\s*Sputnikmusic\s*$/i, "").trim();
    if (query) return { artist: "", album: query, site: "Sputnikmusic" };
  }

  // ── Wikipedia ────────────────────────────────────────────────────
  if (hostname.includes("wikipedia.org")) {
    const albumName = document.title.replace(/\s*[-–]\s*Wikipedia.*$/i, "").trim();
    let artistName = "";
    for (const el of document.querySelectorAll(".infobox-above, .infobox caption, .infobox th[colspan]")) {
      const m = el.textContent.replace(/\s+/g, " ").trim().match(/\bby\s+(.+)$/i);
      if (m) { artistName = m[1].trim(); break; }
    }
    if (!artistName) {
      for (const th of document.querySelectorAll(".infobox-label, .infobox th")) {
        if (/^artist$/i.test(th.textContent.trim())) {
          const td = th.closest("tr")?.querySelector("td");
          if (td) { artistName = td.textContent.replace(/\[.*?\]/g, "").trim(); break; }
        }
      }
    }
    if (!artistName) {
      const a = document.querySelector(".infobox-above a, .infobox th[colspan] a");
      if (a) artistName = a.textContent.trim();
    }
    if (artistName && albumName) {
      return { artist: "", album: artistName + " " + albumName, site: "Wikipedia" };
    }
    return null;
  }

  // ── Genérico ─────────────────────────────────────────────────────
  const og = document.querySelector('meta[property="og:title"]');
  const raw = (og && og.content) || document.title;
  const query = raw.replace(/\s*[-–|]\s*[^-–|]+$/, "").trim();
  if (query) return { artist: "", album: query, site: "generic" };

  return null;
}

return detectAlbum();

}());
