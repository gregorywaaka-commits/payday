/* Payday service worker: the app shell is cached so it opens with no signal; the page itself is fetched fresh when the network is there. */
var VER = "payday-202609250718";
var SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-192.png", "./icons/maskable-512.png"];
self.addEventListener("install", function (ev) {
  ev.waitUntil(caches.open(VER).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (ev) {
  ev.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== VER; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; // GitHub's API, fonts and the drag library go straight to the network
  if (req.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/")) {
    ev.respondWith(fetch(req).then(function (res) { var copy = res.clone(); caches.open(VER).then(function (c) { c.put("./index.html", copy); }); return res; })
      .catch(function () { return caches.match("./index.html"); }));
    return;
  }
  ev.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req).then(function (res) { var copy = res.clone(); caches.open(VER).then(function (c) { c.put(req, copy); }); return res; }); }));
});
