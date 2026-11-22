// Instalación como app: deja el acceso directo con el logo en el celular o en el computador.
// Android y computador con Chrome o Edge: la ventana propia del navegador. iPhone, iPad y demás: guía paso a paso.
(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
  }
  var ua = navigator.userAgent || "";
  var enApp = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  var esIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var esIPad = /ipad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var esAndroid = /android/i.test(ua);
  var dentroDeApp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|TikTok|Snapchat/i.test(ua);
  var esSafariMac = !esIOS && /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg\//.test(ua);
  var esFirefox = /Firefox|FxiOS/.test(ua);
  var esSamsung = /SamsungBrowser/.test(ua);
  var pedido = null;

  var botones = [].slice.call(document.querySelectorAll("#instalar-app, [data-instalar]"));
  function mostrarBotones() { botones.forEach(function (b) { b.hidden = enApp; }); }
  mostrarBotones();

  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); pedido = e; });
  window.addEventListener("appinstalled", function () { enApp = true; mostrarBotones(); cerrar(); });

  // ---------- Íconos de la guía ----------
  var ICONO = {
    compartir: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 11H5v10h14V11h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    agregar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="19" r="1.8" fill="currentColor"/></svg>',
    puntos: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg>',
    lineas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    listo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    instalar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v6M9 10l3 3 3-3M8 21h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  function paso(icono, texto) { return '<li><span class="paso-icono">' + (ICONO[icono] || "") + "</span><span>" + texto + "</span></li>"; }

  function pasos() {
    if (dentroDeApp) return {
      titulo: "Primero ábrala en el navegador",
      lista: [paso("puntos", "Toque los tres puntos <b>⋯</b> arriba a la derecha."),
        paso("compartir", "Elija <b>«Abrir en " + (esIOS ? "Safari" : "el navegador") + "»</b>."),
        paso("agregar", "Ya en el navegador, vuelva a tocar <b>«Instalar la app»</b> en la página.")]
    };
    if (esIOS) {
      var chrome = /CriOS|EdgiOS|FxiOS/.test(ua);
      return {
        titulo: esIPad ? "Agréguela a la pantalla de su iPad" : "Agréguela a la pantalla de su iPhone",
        lista: [paso("compartir", "Toque el botón <b>Compartir</b> " + (chrome ? "en la barra de la dirección, arriba a la derecha." : (esIPad ? "arriba a la derecha." : "en la barra de abajo.")) + " Si no ve la barra, deslice la página un poco hacia arriba."),
          paso("agregar", "Deslice el menú hacia arriba y toque <b>«Agregar a inicio»</b> (en algunos iPhone dice «Agregar a pantalla de inicio»)."),
          paso("listo", "Toque <b>«Agregar»</b>, arriba a la derecha. Listo: el logo queda en su pantalla.")]
      };
    }
    if (esAndroid) return {
      titulo: "Agréguela a la pantalla de su celular",
      lista: esSamsung
        ? [paso("lineas", "Toque el menú <b>≡</b> en la barra de abajo."), paso("agregar", "Toque <b>«Agregar página a»</b> y luego <b>«Pantalla de inicio»</b>."), paso("listo", "Confirme con <b>«Agregar»</b>. Listo: el logo queda en su pantalla.")]
        : [paso("menu", "Toque el menú <b>⋮</b> arriba a la derecha."), paso("agregar", "Toque <b>«Instalar aplicación»</b> o <b>«Agregar a la pantalla principal»</b>."), paso("listo", "Confirme con <b>«Instalar»</b>. Listo: el logo queda en su pantalla.")]
    };
    if (esSafariMac) return {
      titulo: "Agréguela al Dock de su Mac",
      lista: [paso("lineas", "En la barra de arriba, abra el menú <b>Archivo</b>."), paso("agregar", "Elija <b>«Agregar al Dock»</b>."), paso("listo", "Toque <b>«Agregar»</b>. Listo: el logo queda en su Dock.")]
    };
    if (esFirefox) return {
      titulo: "Este navegador no permite instalarla",
      lista: [paso("instalar", "Ábrala en <b>Google Chrome</b> o <b>Microsoft Edge</b> y vuelva a tocar <b>«Instalar la app»</b>."), paso("agregar", "O guárdela en favoritos con <b>Ctrl + D</b>.")]
    };
    return {
      titulo: "Instálela en este computador",
      lista: [paso("instalar", "Toque el ícono <b>Instalar</b> que aparece a la derecha de la barra de la dirección."),
        paso("menu", "Si no lo ve, abra el menú <b>⋮</b> (en Edge, <b>⋯</b>) y busque la opción <b>«Instalar»</b>."),
        paso("listo", "Confirme con <b>«Instalar»</b>. Listo: el logo queda en su escritorio.")]
    };
  }

  // ---------- Ventana de la guía ----------
  var capa = null;
  function cerrar() { if (capa) { capa.remove(); capa = null; document.documentElement.classList.remove("sin-scroll"); } }
  function guia() {
    cerrar();
    var p = pasos();
    capa = document.createElement("div");
    capa.className = "instalar-capa";
    capa.innerHTML =
      '<div class="instalar-caja" role="dialog" aria-modal="true" aria-labelledby="instalar-titulo">' +
      '<button class="instalar-cerrar" type="button" aria-label="Cerrar">×</button>' +
      '<div class="instalar-vista"><img src="/assets/icono-192.png" alt="" width="72" height="72"><span>Guzmán Abogados</span></div>' +
      '<p class="instalar-nota">Así queda en su pantalla, con el logo, para entrar con un toque.</p>' +
      '<h2 id="instalar-titulo">' + (pedido ? "Instale la app de Guzmán y Abogados" : p.titulo) + "</h2>" +
      (pedido ? '<p><button class="boton boton-oro instalar-ya" type="button">Instalar ahora</button></p>' : '<ol class="instalar-pasos">' + p.lista.join("") + "</ol>") +
      '<p class="instalar-nota">Es gratis, no ocupa espacio y siempre abre la versión más reciente.</p>' +
      "</div>";
    document.body.appendChild(capa);
    document.documentElement.classList.add("sin-scroll");
    capa.addEventListener("click", function (e) { if (e.target === capa || e.target.classList.contains("instalar-cerrar")) cerrar(); });
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { cerrar(); document.removeEventListener("keydown", esc); } });
    var ya = capa.querySelector(".instalar-ya");
    if (ya) ya.addEventListener("click", function () { cerrar(); instalar(); });
    capa.querySelector(".instalar-cerrar").focus();
  }
  function instalar(e) {
    if (e) e.preventDefault();
    if (pedido) {
      pedido.prompt();
      pedido.userChoice.then(function (r) { if (r && r.outcome === "accepted") { enApp = true; mostrarBotones(); } }).finally(function () { pedido = null; });
      return;
    }
    guia();
  }
  botones.forEach(function (b) { b.addEventListener("click", instalar); });
  // Enlace para compartir por WhatsApp: guzmanyabogados.com/?instalar=1 abre la guía de una vez.
  if (!enApp && /[?&]instalar=1/.test(location.search)) window.addEventListener("load", function () { setTimeout(guia, 600); });
})();
