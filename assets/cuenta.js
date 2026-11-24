// Mi cuenta: registro de usuarios y avance hacia la minuta gratis (una por cada 5 trámites pagados).
(function () {
  "use strict";
  var cfg = window.GA_CONFIG || {}, raiz = document.getElementById("app-cuenta");
  if (!raiz) return;
  var CADA = 5;
  function el(tag, attrs, hijos) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "texto") e.textContent = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (hijos || []).forEach(function (h) { if (h) e.appendChild(typeof h === "string" ? document.createTextNode(h) : h); });
    return e;
  }
  function api(cuerpo) { return fetch(cfg.api, { method: "POST", body: JSON.stringify(cuerpo) }).then(function (r) { return r.json(); }); }
  function cel(v) { return String(v || "").replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, ""); }
  function guardar(x) { try { localStorage.setItem("ga_cuenta", JSON.stringify(x)); } catch (e) {} if (window.gaSesion) window.gaSesion(); }
  function leer() { try { return JSON.parse(localStorage.getItem("ga_cuenta") || "null"); } catch (e) { return null; } }
  function olvidar() { try { localStorage.removeItem("ga_cuenta"); } catch (e) {} if (window.gaSesion) window.gaSesion(); }
  function campo(etiqueta, control, ayuda, ancho) {
    var c = el("div", { class: "campo" + (ancho ? " ancho" : "") }, [el("label", { texto: etiqueta }), control]);
    if (ayuda) c.appendChild(el("p", { class: "ayuda", texto: ayuda }));
    return c;
  }

  // ---------- Avance ----------
  function avance(r, datos) {
    raiz.innerHTML = "";
    var hechos = r.tramites % r.cada, puntos = el("ol", { class: "progreso", "aria-label": hechos + " de " + r.cada + " trámites" });
    for (var i = 0; i < r.cada; i++) puntos.appendChild(el("li", { class: i < hechos ? "lleno" : "" }, [String(i + 1)]));
    var caja = el("div", { id: "pago" }, [
      el("p", { class: "ante", texto: "Mi cuenta" }),
      el("h1", { class: "titulo-app", texto: "Hola, " + (r.nombre || "bienvenido") }),
      el("p", { texto: "Lleva " + r.tramites + (r.tramites === 1 ? " trámite pagado" : " trámites pagados") + " con nosotros." + (r.ganadas ? " Ha ganado " + r.ganadas + (r.ganadas === 1 ? " minuta gratis." : " minutas gratis.") : "") }),
      puntos,
      el("p", { class: "progreso-texto", texto: r.minuta ? "Tiene una minuta gratis lista." : "Le faltan " + r.faltan + (r.faltan === 1 ? " trámite" : " trámites") + " para su próxima minuta gratis." })
    ]);
    var acciones = el("div", { class: "acciones" }), salida = el("p", { class: "ayuda" });
    if (r.minuta) {
      caja.appendChild(el("p", { texto: "Sirve para cualquier documento en línea (contratos, promesas, poderes, pagarés y más), hasta el " + r.minuta.vence + ". Le enviamos el código a " + r.correo + ": escríbalo en la casilla «Código de beneficio» al pedir el documento, con este mismo correo o celular." }));
      acciones.appendChild(el("a", { class: "boton boton-oro", href: "/documentos.html", texto: "Usar mi minuta gratis" }));
      var reenviar = el("button", { type: "button", class: "boton boton-linea", texto: "Reenviarme el código", onclick: function () {
        reenviar.disabled = true; salida.textContent = "Enviando…";
        api({ accion: "reenviarCodigo", whatsapp: datos.whatsapp, correo: datos.correo }).then(function (x) {
          salida.textContent = x.ok ? "Listo: se lo enviamos a " + x.enviado + ". Revise también la carpeta de spam." : (x.error || "No se pudo enviar."); reenviar.disabled = false;
        }).catch(function () { salida.textContent = "No hubo conexión. Intente de nuevo."; reenviar.disabled = false; });
      } });
      acciones.appendChild(reenviar);
    } else {
      acciones.appendChild(el("a", { class: "boton boton-oro", href: "/documentos.html", texto: "Hacer un documento en línea" }));
      if (!(function () { try { return sessionStorage.getItem("ga_play") === "1"; } catch (e) { return false; } })()) acciones.appendChild(el("a", { class: "boton boton-linea", href: "/#tramites", texto: "Pedir un certificado" }));
    }
    caja.appendChild(acciones);
    caja.appendChild(salida);
    caja.appendChild(el("p", { class: "aviso-datos", texto: "Cuentan los trámites pagados con este celular o este correo: documentos en línea, certificados y servicios en la oficina. Las minutas gratis no suman. El código vence a los 60 días." }));
    caja.appendChild(el("p", {}, [el("a", { href: "#", class: "enlace-wa", texto: "Cerrar sesión en este dispositivo", onclick: function (ev) { ev.preventDefault(); olvidar(); inicio(null, "entrar"); } })]));
    raiz.appendChild(caja);
  }

  // ---------- Inicio: cliente nuevo (registro) o iniciar sesión ----------
  function inicio(msg, pestana, previo) {
    raiz.innerHTML = "";
    previo = previo || {};
    var q = new URLSearchParams(location.search);
    pestana = pestana || (q.has("entrar") ? "entrar" : "registro");
    var caja = el("div", { id: "pago" });
    caja.appendChild(el("p", { class: "ante", texto: "Programa de fidelización" }));
    caja.appendChild(el("h1", { class: "titulo-app", texto: "Una minuta gratis por cada " + CADA + " trámites" }));
    caja.appendChild(el("p", { texto: "Regístrese gratis. Por cada " + CADA + " trámites que haga con nosotros (documentos en línea, certificados o servicios en la oficina) le regalamos una minuta en línea, la que usted quiera. El código le llega solo a su correo." }));
    var bRegistro = el("button", { type: "button", role: "tab", texto: "Cliente nuevo: registrarme" });
    var bEntrar = el("button", { type: "button", role: "tab", texto: "Ya tengo cuenta: iniciar sesión" });
    caja.appendChild(el("div", { class: "pestanas", role: "tablist" }, [bRegistro, bEntrar]));
    if (msg) caja.appendChild(el("p", { class: "error", role: "alert", texto: msg }));

    // Registro
    var nombre = el("input", { type: "text", autocomplete: "name", value: previo.nombre || "" }), celular = el("input", { type: "tel", inputmode: "numeric", autocomplete: "tel", placeholder: "Ej. 3001234567", value: previo.whatsapp || "" });
    var correo = el("input", { type: "email", autocomplete: "email", value: previo.correo || "" }), autoriza = el("input", { type: "checkbox" }), mensajes = el("input", { type: "checkbox" });
    var error = el("p", { class: "error", hidden: true, role: "alert" }), boton = el("button", { class: "boton boton-oro", type: "submit", texto: "Registrarme gratis" });
    var f = el("form", { novalidate: true }, [
      el("div", { class: "rejilla" }, [campo("Nombre completo", nombre), campo("Celular con WhatsApp", celular), campo("Correo electrónico", correo, "Use el mismo celular o correo cuando pida sus trámites, para que se los contemos.", true)]),
      el("label", { class: "acepto" }, [autoriza, el("span", {}, ["Autorizo el uso de mis datos para el registro y el programa de fidelización, según la ", el("a", { href: "/politica-de-datos.html", target: "_blank", texto: "política de tratamiento de datos" }), "."])]),
      el("label", { class: "acepto" }, [mensajes, el("span", {}, ["Quiero recibir recordatorios y beneficios de Guzmán y Abogados por correo y WhatsApp. ", el("span", { class: "opcional", texto: "(opcional; puede retirarlo cuando quiera)" })])]),
      error,
      el("div", { class: "acciones" }, [boton])
    ]);
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var faltan = [], wa = cel(celular.value), co = correo.value.trim();
      if (nombre.value.trim().length < 5) faltan.push("escriba su nombre completo");
      if (!/^3\d{9}$/.test(wa)) faltan.push("escriba un celular de 10 dígitos");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(co)) faltan.push("escriba un correo válido");
      if (!autoriza.checked) faltan.push("autorice el uso de sus datos");
      if (faltan.length) { error.hidden = false; error.textContent = "Revise: " + faltan.join("; ") + "."; return; }
      error.hidden = true; boton.disabled = true; boton.textContent = "Registrando…";
      api({ accion: "registro", nombre: nombre.value.trim(), whatsapp: wa, correo: co, autorizaDatos: true, autorizaMensajes: mensajes.checked }).then(function (r) {
        if (!r.ok) throw new Error(r.error || "No pudimos registrarlo");
        var datos = { whatsapp: wa, correo: co, nombre: r.nombreCompleto || nombre.value.trim().toUpperCase() }; guardar(datos); avance(r, datos);
      }).catch(function (e) { boton.disabled = false; boton.textContent = "Registrarme gratis"; error.hidden = false; error.textContent = (e && e.message ? e.message + ". " : "") + "Si el problema sigue, escríbanos por WhatsApp al 320 563 9603."; });
    });

    // Iniciar sesión
    var celular2 = el("input", { type: "tel", inputmode: "numeric", autocomplete: "tel", placeholder: "Ej. 3001234567", value: previo.whatsapp || "" }), correo2 = el("input", { type: "email", autocomplete: "email", value: previo.correo || "" });
    var error2 = el("p", { class: "error", hidden: true, role: "alert" }), boton2 = el("button", { class: "boton boton-oro", type: "submit", texto: "Iniciar sesión" });
    var g = el("form", { novalidate: true }, [
      el("p", { class: "ayuda", texto: "Escriba el celular y el correo con los que se registró. No necesita contraseña." }),
      el("div", { class: "rejilla" }, [campo("Celular con WhatsApp", celular2), campo("Correo electrónico", correo2)]),
      error2, el("div", { class: "acciones" }, [boton2])
    ]);
    g.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var datos = { whatsapp: cel(celular2.value), correo: correo2.value.trim() };
      if (!/^3\d{9}$/.test(datos.whatsapp) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datos.correo)) { error2.hidden = false; error2.textContent = "Escriba su celular de 10 dígitos y su correo."; return; }
      error2.hidden = true; boton2.disabled = true; boton2.textContent = "Consultando…";
      api({ accion: "miCuenta", whatsapp: datos.whatsapp, correo: datos.correo }).then(function (r) {
        boton2.disabled = false; boton2.textContent = "Iniciar sesión";
        if (!r.ok && r.noRegistrado) { inicio("Todavía no está registrado con ese celular y ese correo. Regístrese aquí: es gratis.", "registro", datos); return; }
        if (!r.ok) { error2.hidden = false; error2.textContent = r.error || "No encontramos su registro."; return; }
        datos.nombre = r.nombreCompleto || r.nombre || ""; guardar(datos); avance(r, datos);
      }).catch(function () { boton2.disabled = false; boton2.textContent = "Iniciar sesión"; error2.hidden = false; error2.textContent = "No hubo conexión. Intente de nuevo."; });
    });

    function mostrar(cual) {
      f.hidden = cual !== "registro"; g.hidden = cual !== "entrar";
      bRegistro.setAttribute("aria-selected", String(cual === "registro")); bEntrar.setAttribute("aria-selected", String(cual === "entrar"));
    }
    bRegistro.addEventListener("click", function () { mostrar("registro"); });
    bEntrar.addEventListener("click", function () { mostrar("entrar"); });
    caja.appendChild(f); caja.appendChild(g);
    caja.appendChild(el("p", { class: "aviso-datos", texto: "La minuta gratis sirve para cualquier documento en línea; no aplica a certificados. Cuentan los trámites pagados con el mismo celular o correo, también los que ya hizo con nosotros." }));
    raiz.appendChild(caja);
    mostrar(pestana);
  }

  var guardado = leer();
  if (guardado && guardado.whatsapp && guardado.correo && cfg.api) {
    api({ accion: "miCuenta", whatsapp: guardado.whatsapp, correo: guardado.correo }).then(function (r) {
      if (!r.ok) { olvidar(); inicio(); return; }
      if (r.nombreCompleto && guardado.nombre !== r.nombreCompleto) { guardado.nombre = r.nombreCompleto; guardar(guardado); }
      avance(r, guardado);
    }).catch(function () { inicio("No hubo conexión. Recargue la página."); });
  } else inicio();
})();
