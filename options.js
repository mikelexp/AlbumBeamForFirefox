// options.js

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

const SVC_IDS = ["spotifyWeb", "spotifyDesktop", "tidalWeb", "tidalDesktop", "ytmusicWeb"];

function mergeDefaults(stored) {
  const s = stored || {};
  return {
    services: Object.assign({}, DEFAULTS.services, s.services || {}),
    newTab: s.newTab !== undefined ? s.newTab : DEFAULTS.newTab,
  };
}

function applyToForm(settings) {
  for (const key of SVC_IDS) {
    document.getElementById(key).checked = settings.services[key];
  }
  document.getElementById(settings.newTab ? "tabNew" : "tabCurrent").checked = true;
}

function readFromForm() {
  const services = {};
  for (const key of SVC_IDS) {
    services[key] = document.getElementById(key).checked;
  }
  return {
    services,
    newTab: document.getElementById("tabNew").checked,
  };
}

let toastTimer;
function showToast() {
  const el = document.getElementById("toast");
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1600);
}

function save() {
  browser.storage.local.set({ settings: readFromForm() }).then(showToast);
}

document.querySelectorAll("input").forEach(el => el.addEventListener("change", save));

browser.storage.local.get("settings").then(result => {
  applyToForm(mergeDefaults(result.settings));
});
