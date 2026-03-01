self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("sudoku-cache").then((cache) => {
      return cache.addAll([
        "/pro.html",
        "/pro.css",
        "/pro.js",
        "/manifest.json"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});