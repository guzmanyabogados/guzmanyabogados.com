// Instalación como app (Android, computador y iPhone)
(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
  }
  var boton = document.getElementById("instalar-app");
  if (!boton) return;
  var aviso = document.getElementById("instalar-ios");
  var enApp = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (enApp) return;
  var esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  var pedido = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); pedido = e; boton.hidden = false;
  });
  if (esIOS) boton.hidden = false;
  boton.addEventListener("click", function () {
    if (pedido) { pedido.prompt(); pedido.userChoice.finally(function () { pedido = null; boton.hidden = true; }); }
    else if (esIOS && aviso) { aviso.hidden = !aviso.hidden; }
  });
  window.addEventListener("appinstalled", function () { boton.hidden = true; if (aviso) aviso.hidden = true; });
})();
