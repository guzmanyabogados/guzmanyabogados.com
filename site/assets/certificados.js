// Certificados en línea: el cliente pide el certificado, la oficina verifica el folio y solo entonces el cliente paga.
(function () {
  "use strict";
  var cfg = window.GA_CONFIG || {};
  var ORIP = window.GA_ORIP || [], MUN = window.GA_MUNICIPIOS || [];
  var SERVICIOS = {
    tradicion: { nombre: "Certificado de tradición y libertad", precio: 29000, pago: "https://checkout.wompi.co/l/tnTjo2" },
    ficha: { nombre: "Ficha predial", precio: 69000, pago: "https://checkout.wompi.co/l/D2PQdn" },
    avaluo: { nombre: "Certificado de avalúo catastral", precio: 90000, pago: "https://checkout.wompi.co/l/B6tFxu" }
  };
  var raiz = document.getElementById("app-cert");
  if (!raiz) return;

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
  function pesos(n) { return "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function clave(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim(); }
  function guardar(c) { try { localStorage.setItem("ga_cert", JSON.stringify({ codigo: c, t: Date.now() })); } catch (e) {} }
  function leerGuardado() { try { var x = JSON.parse(localStorage.getItem("ga_cert") || "null"); return x && Date.now() - x.t < 10 * 24 * 3600 * 1000 ? x.codigo : null; } catch (e) { return null; } }
  function api(cuerpo) {
    return fetch(cfg.api, { method: "POST", body: JSON.stringify(cuerpo) }).then(function (r) { return r.json(); });
  }

  // ---------- Buscador con lista (oficinas de registro y municipios) ----------
  function buscador(opciones, ph) {
    var entrada = el("input", { type: "text", placeholder: ph, autocomplete: "off", "aria-autocomplete": "list" });
    var lista = el("ul", { class: "sugerencias", role: "listbox", hidden: true });
    var caja = el("div", { class: "con-sugerencias" }, [entrada, lista]);
    var elegido = null;
    function mostrar() {
      var q = clave(entrada.value), a = [], b = [];
      if (q) opciones.forEach(function (o) { var i = o.k.indexOf(q); if (i === 0 || o.k.indexOf(" " + q) > 0 || o.cod === q) a.push(o); else if (i > 0) b.push(o); });
      var r = a.concat(b).slice(0, 10);
      lista.innerHTML = "";
      r.forEach(function (o) {
        var li = el("li", { role: "option", texto: o.et });
        li.addEventListener("mousedown", function (ev) { ev.preventDefault(); caja.elegir(o); });
        lista.appendChild(li);
      });
      lista.hidden = !r.length;
    }
    caja.elegir = function (o) { elegido = o; entrada.value = o.et; lista.hidden = true; caja.parentNode && caja.parentNode.classList.remove("falta"); };
    caja.valor = function () { return elegido; };
    caja.entrada = entrada;
    entrada.addEventListener("input", function () { elegido = null; mostrar(); });
    entrada.addEventListener("focus", mostrar);
    entrada.addEventListener("keydown", function (ev) { if (ev.key === "Enter" && !lista.hidden && lista.firstChild) { ev.preventDefault(); lista.firstChild.dispatchEvent(new Event("mousedown")); } });
    entrada.addEventListener("blur", function () {
      setTimeout(function () {
        lista.hidden = true;
        if (!elegido && entrada.value.trim()) { var q = clave(entrada.value), ex = opciones.filter(function (o) { return o.k === q || o.cod === q; }); if (ex.length === 1) caja.elegir(ex[0]); }
      }, 150);
    });
    return caja;
  }
  var OPC_ORIP = ORIP.map(function (o) { return { cod: o[0].toLowerCase(), codigo: o[0], nombre: o[1], et: o[0] + " – " + o[1], k: clave(o[0] + " " + o[1]) }; });
  var repetidos = {}; MUN.forEach(function (m) { repetidos[m[0]] = (repetidos[m[0]] || 0) + 1; });
  var OPC_MUN = MUN.map(function (m) { var et = m[0] === m[1] ? m[0] : m[0] + " (" + m[1] + ")"; return { et: et, valor: et, k: clave(et) }; });

  function campo(etiqueta, control, ayuda, opcional, ancho) {
    var l = el("label", { texto: etiqueta });
    if (opcional) l.appendChild(el("span", { class: "opcional", texto: " (opcional)" }));
    var c = el("div", { class: "campo" + (ancho ? " ancho" : "") }, [l, control]);
    if (ayuda) c.appendChild(el("p", { class: "ayuda", texto: ayuda }));
    return c;
  }

  // ---------- Formulario ----------
  function formulario(tipo) {
    var s = SERVICIOS[tipo] || SERVICIOS.tradicion;
    raiz.innerHTML = "";
    var radios = el("div", { class: "opciones", role: "radiogroup" }, Object.keys(SERVICIOS).map(function (k) {
      var r = el("input", { type: "radio", name: "servicio", value: k, checked: k === tipo });
      r.addEventListener("change", function () { history.replaceState(null, "", "?t=" + k); formulario(k); });
      return el("label", { class: "opcion" }, [r, el("span", { texto: SERVICIOS[k].nombre + " · " + pesos(SERVICIOS[k].precio) })]);
    }));
    var oficina = buscador(OPC_ORIP, "Escriba el código o el nombre, ej. 001 o Medellín");
    var noSe = el("input", { type: "checkbox" });
    var numero = el("input", { type: "text", inputmode: "numeric", placeholder: "Ej. 123456", autocomplete: "off" });
    var municipio = buscador(OPC_MUN, "Escriba y elija de la lista");
    var catastral = el("input", { type: "text", autocomplete: "off", placeholder: "Aparece en la factura del predial" });
    var direccion = el("input", { type: "text", autocomplete: "off", placeholder: "Ej. Calle 52 # 49-66, apto 101" });
    var nombre = el("input", { type: "text", autocomplete: "name" });
    var celular = el("input", { type: "tel", inputmode: "numeric", autocomplete: "tel", placeholder: "Ej. 3001234567" });
    var correo = el("input", { type: "email", autocomplete: "email" });
    var acepta = el("input", { type: "checkbox" }), autoriza = el("input", { type: "checkbox" });
    var error = el("p", { class: "error", hidden: true, role: "alert" });
    var boton = el("button", { class: "boton boton-oro", type: "submit", texto: "Enviar solicitud" });

    // Si pegan la matrícula completa (001-123456), se separa sola en oficina y número.
    numero.addEventListener("input", function () {
      var m = numero.value.trim().match(/^([0-9]{2,3}[A-Za-z]?|[0-9]{2}[A-Za-z])\s*[-–]\s*(\d+)$/);
      if (m) { var o = OPC_ORIP.filter(function (x) { return x.cod === m[1].toLowerCase(); })[0]; if (o) { oficina.elegir(o); noSe.checked = false; ver(); } numero.value = m[2]; }
      else numero.value = numero.value.replace(/[^\d]/g, "");
    });
    var cOficina = campo("Oficina de registro (círculo registral)", oficina, "Es el código antes del guion en la matrícula. Si la matrícula es 001-123456, la oficina es 001 – Medellín Sur. Aparece en la escritura, en un certificado anterior o en la factura del predial.");
    var cNoSe = el("label", { class: "opcion" }, [noSe, el("span", { texto: "No sé la oficina: la buscan ustedes con el municipio" })]);
    var cNumero = campo("Número de matrícula inmobiliaria", numero, "Solo el número que va después del guion. Si pega la matrícula completa, la separamos.");
    var cMunicipio = campo("Municipio donde queda el inmueble", municipio);
    var cCatastral = campo("Número predial o cédula catastral", catastral, null, true);
    var cDireccion = campo("Dirección del inmueble", direccion, null, true);
    function ver() {
      var trad = tipo === "tradicion";
      cOficina.hidden = trad && noSe.checked;
      cMunicipio.hidden = trad && !noSe.checked;
      cCatastral.hidden = cDireccion.hidden = trad;
    }
    noSe.addEventListener("change", ver);

    var f = el("form", { novalidate: true }, [
      el("p", { class: "ante", texto: "Paso 1 de 3 · Datos del inmueble" }),
      el("h1", { class: "titulo-app", texto: s.nombre }),
      el("p", { class: "aviso-datos", texto: "Antes de cobrarle verificamos en la entidad que el certificado se pueda expedir (por ejemplo, que el folio no esté bloqueado). Le avisamos y solo entonces paga " + pesos(s.precio) + "." }),
      el("div", { class: "bloque" }, [el("p", { class: "etiqueta", texto: "¿Qué necesita?" }), radios]),
      el("h2", { class: "bloque-titulo", texto: "Inmueble" }),
      el("div", { class: "rejilla" }, tipo === "tradicion" ? [cOficina, cNumero, el("div", { class: "campo ancho" }, [cNoSe]), cMunicipio]
        : [cMunicipio, cOficina, cNumero, cCatastral, cDireccion]),
      tipo === "tradicion" ? null : el("p", { class: "ayuda", texto: "Escriba al menos uno: la matrícula, el número predial o la dirección. Entre más datos, más rápido lo encontramos." }),
      el("h2", { class: "bloque-titulo", texto: "¿A dónde se lo enviamos?" }),
      el("div", { class: "rejilla" }, [campo("Nombre completo", nombre), campo("Celular con WhatsApp", celular), campo("Correo electrónico", correo, "Allí le llega el certificado en PDF.", false, true)]),
      el("label", { class: "acepto" }, [acepta, el("span", {}, [el("b", { texto: "Entiendo el aviso. " }), "Somos el puente para que usted haga este trámite: no garantizamos que el trámite sea viable ni que el documento le sirva para lo que busca. Los datos que nos da son de su responsabilidad."])]),
      el("label", { class: "acepto" }, [autoriza, el("span", {}, ["Autorizo el uso de mis datos para este trámite, según la ", el("a", { href: "/politica-de-datos.html", target: "_blank", texto: "política de tratamiento de datos" }), "."])]),
      error,
      el("div", { class: "acciones" }, [boton, el("a", { class: "boton boton-linea", href: "/#tramites", texto: "Volver" })])
    ]);
    if (tipo !== "tradicion") { cOficina.querySelector("label").appendChild(el("span", { class: "opcional", texto: " (opcional)" })); cNumero.querySelector("label").appendChild(el("span", { class: "opcional", texto: " (opcional)" })); }
    ver();
    raiz.appendChild(f);

    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      [].forEach.call(f.querySelectorAll(".falta"), function (x) { x.classList.remove("falta"); });
      var faltan = [];
      function falta(c, m) { c.classList.add("falta"); faltan.push(m); }
      var trad = tipo === "tradicion", ofi = oficina.valor(), mun = municipio.valor();
      if (trad) {
        if (!noSe.checked && !ofi) falta(cOficina, "elija la oficina de registro de la lista");
        if (noSe.checked && !mun) falta(cMunicipio, "elija el municipio de la lista");
        if (!/^\d{1,9}$/.test(numero.value)) falta(cNumero, "escriba el número de matrícula");
      } else {
        if (!mun) falta(cMunicipio, "elija el municipio de la lista");
        if (oficina.entrada.value.trim() && !ofi) falta(cOficina, "elija la oficina de registro de la lista");
        if (!numero.value && !catastral.value.trim() && !direccion.value.trim()) falta(cDireccion, "escriba la matrícula, el número predial o la dirección");
      }
      if (nombre.value.trim().length < 5) falta(nombre.parentNode, "escriba su nombre completo");
      if (!/^3\d{9}$/.test(celular.value.replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, ""))) falta(celular.parentNode, "escriba un celular de 10 dígitos");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo.value.trim())) falta(correo.parentNode, "escriba un correo válido");
      if (!acepta.checked || !autoriza.checked) faltan.push("acepte el aviso y autorice el uso de sus datos");
      if (faltan.length) { error.hidden = false; error.textContent = "Revise: " + faltan.join("; ") + "."; error.scrollIntoView({ block: "center" }); return; }
      error.hidden = true; boton.disabled = true; boton.textContent = "Enviando…";
      api({
        accion: "solicitud", servicio: tipo,
        oficina: ofi && !(trad && noSe.checked) ? ofi.codigo + " – " + ofi.nombre : "",
        matricula: numero.value, municipio: mun ? mun.valor : "", catastral: catastral.value.trim(), direccion: direccion.value.trim(),
        nombre: nombre.value.trim().toUpperCase(), whatsapp: celular.value.replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, ""), correo: correo.value.trim(),
        acepta: acepta.checked, autorizaDatos: autoriza.checked
      }).then(function (r) {
        if (!r.ok) throw new Error(r.error || "No pudimos registrar la solicitud");
        guardar(r.codigo);
        history.replaceState(null, "", "?c=" + r.codigo);
        estado(r.codigo, r);
      }).catch(function (e) {
        boton.disabled = false; boton.textContent = "Enviar solicitud";
        error.hidden = false; error.textContent = (e && e.message ? e.message + ". " : "") + "Si el problema sigue, escríbanos por WhatsApp al 320 563 9603.";
      });
    });
  }

  // ---------- Estado de la solicitud ----------
  var temporizador = null;
  function estado(codigo, previo) {
    clearTimeout(temporizador);
    raiz.innerHTML = "";
    var ante = el("p", { class: "ante", texto: "Solicitud en línea" });
    var titulo = el("h1", { class: "titulo-app", texto: "Consultando su solicitud…" });
    var refe = el("p", { class: "ref-cert", texto: "Código " + codigo });
    var texto = el("div", {});
    var acciones = el("div", { class: "acciones" });
    raiz.appendChild(el("div", { id: "pago" }, [ante, titulo, refe, texto, acciones]));
    function wa(msg) { return "https://wa.me/573205639603?text=" + encodeURIComponent(msg); }
    function p(t) { texto.appendChild(el("p", { texto: t })); }
    function pintar(r) {
      texto.innerHTML = ""; acciones.innerHTML = "";
      if (!r.ok) { titulo.textContent = "No encontramos esa solicitud"; p(r.error || "Revise el código o escríbanos por WhatsApp."); acciones.appendChild(el("a", { class: "boton boton-oro", href: wa("Hola, tengo la solicitud " + codigo + "."), texto: "Escribir por WhatsApp" })); return; }
      var s = SERVICIOS[r.servicio] || SERVICIOS.tradicion, ref = r.referencia ? " · " + r.referencia : "";
      refe.textContent = s.nombre + ref + " · Código " + codigo;
      ante.textContent = "Solicitud en línea";
      var e = r.estado;
      if (e === "POR VERIFICAR") {
        ante.textContent = "Paso 2 de 3 · Verificación";
        titulo.textContent = "Estamos verificando que se pueda expedir";
        p("Revisamos en la entidad que el folio esté disponible para expedir el certificado. Todavía no tiene que pagar nada.");
        p("Le avisamos a " + r.correo + " apenas lo verifiquemos, normalmente en pocos minutos dentro del horario de atención: lunes a viernes de 8:00 a. m. a 5:00 p. m. y sábados de 8:00 a. m. a 12:00 m. Esta página también se actualiza sola.");
        acciones.appendChild(el("a", { class: "boton boton-linea", href: wa("Hola, envié la solicitud " + codigo + " (" + s.nombre + ref + ")."), texto: "Escribir por WhatsApp" }));
        temporizador = setTimeout(consultar, 20000);
      } else if (e === "DISPONIBLE") {
        ante.textContent = "Paso 3 de 3 · Pago";
        titulo.textContent = "Verificado: ya puede pagar";
        p("Revisamos y el certificado se puede expedir. Pague " + pesos(s.precio) + " en la plataforma segura de Wompi y se lo enviamos en PDF a " + r.correo + ".");
        if (r.referencia) p("Si Wompi le pide la matrícula, escriba: " + r.referencia);
        acciones.appendChild(el("a", { class: "boton boton-oro", href: s.pago, rel: "noopener", onclick: function () { guardar(codigo); }, texto: "Pagar " + pesos(s.precio) }));
        acciones.appendChild(el("a", { class: "boton boton-linea", href: wa("Hola, tengo una pregunta sobre la solicitud " + codigo + "."), texto: "Preguntar por WhatsApp" }));
      } else if (e === "NO SE PUEDE EXPEDIR") {
        titulo.textContent = "No se puede expedir en línea";
        p("Revisamos y por ahora la entidad no permite expedir este certificado en línea" + (r.nota ? ": " + r.nota : "") + ". No haga ningún pago.");
        p("Escríbanos por WhatsApp y le explicamos qué hacer.");
        acciones.appendChild(el("a", { class: "boton boton-oro", href: wa("Hola, mi solicitud " + codigo + " no se pudo expedir en línea. ¿Qué puedo hacer?"), texto: "Escribir por WhatsApp" }));
      } else if (e === "REVISAR DATOS") {
        titulo.textContent = "Necesitamos confirmar un dato";
        p("No encontramos el inmueble con los datos que nos dio" + (r.nota ? " (" + r.nota + ")" : "") + ". No haga ningún pago todavía: le escribimos por WhatsApp, o escríbanos usted.");
        acciones.appendChild(el("a", { class: "boton boton-oro", href: wa("Hola, sobre mi solicitud " + codigo + ": "), texto: "Escribir por WhatsApp" }));
        acciones.appendChild(el("a", { class: "boton boton-linea", href: "?t=" + r.servicio, onclick: function () { try { localStorage.removeItem("ga_cert"); } catch (x) {} }, texto: "Hacer una solicitud nueva" }));
      } else if (/^PAGO PENDIENTE/.test(e)) {
        titulo.textContent = "Su pago se está procesando";
        p("Apenas se apruebe, expedimos el certificado y se lo enviamos a " + r.correo + ". No tiene que hacer nada más.");
        temporizador = setTimeout(consultar, 30000);
      } else if (e === "PAGADO - POR EXPEDIR" || e === "PAGADO - POR VERIFICAR") {
        titulo.textContent = "Recibimos su pago";
        p("Estamos expidiendo su certificado. Se lo enviamos en PDF a " + r.correo + " lo más pronto posible dentro del horario de atención. No tiene que hacer nada más.");
        acciones.appendChild(el("a", { class: "boton boton-linea", href: wa("Hola, pagué la solicitud " + codigo + "."), texto: "Escribir por WhatsApp" }));
      } else if (e === "ENTREGADO") {
        titulo.textContent = "Certificado enviado";
        p("Se lo enviamos a " + r.correo + ". Si no lo ve, revise la carpeta de spam o escríbanos por WhatsApp.");
        acciones.appendChild(el("a", { class: "boton boton-linea", href: wa("Hola, no me ha llegado el certificado de la solicitud " + codigo + "."), texto: "Escribir por WhatsApp" }));
        acciones.appendChild(el("a", { class: "boton boton-linea", href: "?t=" + r.servicio, onclick: function () { try { localStorage.removeItem("ga_cert"); } catch (x) {} }, texto: "Pedir otro certificado" }));
      } else {
        titulo.textContent = "Estamos revisando su solicitud";
        p("Escríbanos por WhatsApp con su código " + codigo + " y le contamos cómo va.");
        acciones.appendChild(el("a", { class: "boton boton-oro", href: wa("Hola, ¿cómo va mi solicitud " + codigo + "?"), texto: "Escribir por WhatsApp" }));
      }
    }
    function consultar() {
      api({ accion: "estadoSolicitud", codigo: codigo }).then(pintar).catch(function () {
        titulo.textContent = "No pudimos conectarnos"; texto.innerHTML = ""; p("Revise su conexión. Su solicitud " + codigo + " quedó registrada.");
        temporizador = setTimeout(consultar, 30000);
      });
    }
    if (previo && previo.estado) pintar(previo); else consultar();
  }

  // ---------- Página de la oficina: marcar el resultado de la verificación ----------
  function oficina(codigo, clave, sugerido) {
    raiz.innerHTML = "";
    var caja = el("div", { id: "pago" }, [el("p", { class: "ante", texto: "Oficina · " + codigo }), el("h1", { class: "titulo-app", texto: "Cargando la solicitud…" })]);
    raiz.appendChild(caja);
    api({ accion: "detalleSolicitud", c: codigo, k: clave }).then(function (d) {
      caja.innerHTML = "";
      caja.appendChild(el("p", { class: "ante", texto: "Oficina · " + codigo }));
      if (!d.ok) { caja.appendChild(el("h1", { class: "titulo-app", texto: d.titulo || "No se pudo abrir" })); caja.appendChild(el("p", { texto: d.error || "" })); return; }
      caja.appendChild(el("h1", { class: "titulo-app", texto: d.nombreServicio + " " + d.referencia }));
      var dl = el("dl", {});
      [["Estado", d.estado], ["Oficina de registro", d.oficina || "El cliente no la sabe"], ["Matrícula", d.matricula], ["Municipio", d.municipio], ["Número predial", d.catastral], ["Dirección", d.direccion],
        ["Cliente", d.cliente], ["WhatsApp", d.whatsapp], ["Correo", d.correo], ["Pago Wompi", d.pago], ["Nota", d.nota]].forEach(function (f) {
        if (f[1]) { dl.appendChild(el("dt", { texto: f[0] })); dl.appendChild(el("dd", { texto: String(f[1]) })); }
      });
      caja.appendChild(el("div", { class: "resumen" }, [dl]));
      if (d.servicio === "tradicion") caja.appendChild(el("p", {}, [el("a", { class: "boton boton-linea", href: d.snr, target: "_blank", rel: "noopener", texto: "Abrir la Supernotariado" })]));
      var nota = el("input", { type: "text", placeholder: "Ej. folio bloqueado por turno de registro", autocomplete: "off" });
      caja.appendChild(campo("Nota para el cliente (si no se puede expedir o faltan datos)", nota, null, true, true));
      var salida = el("div", {});
      var opciones = [["disponible", "Disponible: el cliente puede pagar", "boton-oro"], ["no", "No se puede expedir", "boton-linea"], ["revisar", "Datos errados", "boton-linea"], ["entregado", "Ya lo envié: entregado", "boton-linea"]];
      var botones = el("div", { class: "acciones" }, opciones.map(function (o) {
        return el("button", { type: "button", class: "boton " + (o[0] === sugerido ? "boton-oro" : o[2] === "boton-oro" && sugerido ? "boton-linea" : o[2]), texto: o[1], onclick: function () {
          [].forEach.call(botones.querySelectorAll("button"), function (x) { x.disabled = true; });
          salida.innerHTML = ""; salida.appendChild(el("p", { texto: "Guardando…" }));
          api({ accion: "marcarFolio", c: codigo, k: clave, e: o[0], nota: nota.value.trim() }).then(function (r) {
            salida.innerHTML = "";
            salida.appendChild(el("h2", { class: "bloque-titulo", texto: r.titulo || (r.ok ? "Listo" : "No se pudo") }));
            salida.appendChild(el("p", { texto: r.ok ? (r.detalle || "") : (r.error || "") }));
            if (r.whatsapp) salida.appendChild(el("p", {}, [el("a", { class: "boton boton-oro", href: r.whatsapp, rel: "noopener", texto: "Avisarle también por WhatsApp" })]));
            [].forEach.call(botones.querySelectorAll("button"), function (x) { x.disabled = false; });
          }).catch(function () { salida.innerHTML = ""; salida.appendChild(el("p", { class: "error", texto: "No hubo conexión. Intente de nuevo." })); [].forEach.call(botones.querySelectorAll("button"), function (x) { x.disabled = false; }); });
        } });
      }));
      caja.appendChild(botones);
      caja.appendChild(salida);
    }).catch(function () { caja.appendChild(el("p", { class: "error", texto: "No hubo conexión. Recargue la página." })); });
  }

  // ---------- Inicio ----------
  var q = new URLSearchParams(location.search), c = (q.get("c") || "").toUpperCase(), t = q.get("t");
  if (/^GA-C\d{6}-[A-Z0-9]{4}$/.test(c) && q.get("k")) oficina(c, q.get("k"), q.get("e"));
  else if (/^GA-C\d{6}-[A-Z0-9]{4}$/.test(c)) { guardar(c); estado(c); }
  else if (!t && leerGuardado()) { history.replaceState(null, "", "?c=" + leerGuardado()); estado(leerGuardado()); }
  else formulario(SERVICIOS[t] ? t : "tradicion");
})();
