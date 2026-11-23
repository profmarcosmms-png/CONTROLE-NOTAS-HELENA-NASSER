/* Service worker do Controle de Notas Helena Nasser: funciona sem internet depois da primeira visita. */
var VERSAO = 'notas-hn-f2de1873e6';
var CASCA = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
var EXTERNOS = /^https:\/\/(cdnjs\.cloudflare\.com|www\.gstatic\.com\/firebasejs|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSAO).then(function(c){ return c.addAll(CASCA); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k.indexOf('notas-hn-') === 0 && k !== VERSAO; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  /* o próprio aplicativo: abre do cache (rápido e offline); com internet, atualiza o cache em segundo plano */
  if(url.origin === self.location.origin){
    e.respondWith(caches.open(VERSAO).then(function(c){
      return c.match(req, {ignoreSearch: true}).then(function(hit){
        var rede = fetch(req).then(function(r){ if(r && r.ok) c.put(req, r.clone()); return r; }).catch(function(){ return hit; });
        return hit || rede.then(function(r){ return r || c.match('./index.html'); });
      });
    }));
    return;
  }
  /* bibliotecas (PDF, Firebase, fontes): guardadas depois do primeiro uso, para o PDF e o login funcionarem offline */
  if(EXTERNOS.test(req.url)){
    e.respondWith(caches.open(VERSAO).then(function(c){
      return c.match(req).then(function(hit){
        var rede = fetch(req).then(function(r){ if(r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(function(){ return hit; });
        return hit || rede;
      });
    }));
  }
  /* o resto (login e dados do Firebase) passa direto, sem cache */
});
