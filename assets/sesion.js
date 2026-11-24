// Sesión del cliente (celular y correo guardados en este dispositivo al registrarse o iniciar sesión).
// Cambia el botón del menú: «Iniciar sesión / Registrarse» sin sesión y «Mi cuenta» con sesión.
(function () {
  "use strict";
  // App de Google Play (TWA): Chrome la abre con referrer android-app://com.guzmanyabogados.app. Se recuerda en la sesión.
  // Dentro de esa app no se ofrecen certificados ni pagos digitales por fuera de Google Play.
  var play = false;
  try {
    if (document.referrer.indexOf("android-app://com.guzmanyabogados.app") === 0) sessionStorage.setItem("ga_play", "1");
    play = sessionStorage.getItem("ga_play") === "1";
  } catch (e) {}
  window.gaPlay = play;
  if (play) document.documentElement.classList.add("app-play");
  function sesion() { try { var s = JSON.parse(localStorage.getItem("ga_cuenta") || "null"); return s && s.whatsapp && s.correo ? s : null; } catch (e) { return null; } }
  function pintar() {
    var s = sesion();
    [].forEach.call(document.querySelectorAll("[data-cuenta]"), function (a) {
      var largo = a.querySelector(".largo"), corto = a.querySelector(".corto");
      if (largo) largo.textContent = s ? "Mi cuenta" : "Iniciar sesión / Registrarse";
      if (corto) corto.textContent = s ? "Mi cuenta" : "Ingresar";
      a.classList.toggle("con-sesion", !!s);
      a.setAttribute("aria-label", s ? "Mi cuenta" : "Iniciar sesión o registrarse");
    });
    [].forEach.call(document.querySelectorAll("[data-solo-sin-sesion]"), function (e) { e.hidden = !!s; });
    [].forEach.call(document.querySelectorAll("[data-solo-con-sesion]"), function (e) { e.hidden = !s; });
  }
  window.gaSesion = pintar;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pintar); else pintar();
})();
