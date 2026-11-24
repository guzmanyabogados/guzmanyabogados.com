// Sesión del cliente (celular y correo guardados en este dispositivo al registrarse o iniciar sesión).
// Cambia el botón del menú: «Iniciar sesión / Registrarse» sin sesión y «Mi cuenta» con sesión.
(function () {
  "use strict";
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
