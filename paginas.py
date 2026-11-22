# Genera politica-de-datos.html y 404.html con el mismo encabezado, pie y hoja de estilos de index.html.
import html, re, sys
sys.path.insert(0, "/home/claude/politica")
from contenido import C

idx = open("site/index.html", encoding="utf-8").read()


def tramo(inicio, fin):
    return idx[idx.index(inicio):idx.index(fin) + len(fin)]


franja = tramo('<div class="franja">', "</div>\n</div>")
cab = tramo('<header class="cabecera">', "</header>")
pie = tramo('<footer class="pie">', "</footer>")
flotante = tramo('<a class="flotante"', "</a>")

for ancla in ["asuntos", "tramites", "cita", "oficina"]:
    cab = cab.replace(f'href="#{ancla}"', f'href="./#{ancla}"')
cab = cab.replace('href="#inicio"', 'href="./"')
cab = cab.replace('href="./#tramites">Trámites en línea</a>\n      <a href="documentos.html">', 'href="./#tramites">Trámites en línea</a>\n      <a href="/documentos.html">')
pie = pie.replace('href="#inicio"', 'href="./"')


def oracion(s):
    s = s.lower()
    return s[0].upper() + s[1:]


cuerpo, abierta = [], False
for i, (tipo, t) in enumerate(C):
    if i < 2:
        continue
    if tipo == "titulo":
        if abierta:
            cuerpo.append("</ul>")
            abierta = False
        cuerpo.append(f"<h2>{html.escape(oracion(t))}</h2>")
    elif tipo == "item":
        if not abierta:
            cuerpo.append("<ul>")
            abierta = True
        m = re.match(r"^([a-z]\))\s(.*)$", t)
        cuerpo.append(f"<li><b>{m.group(1)}</b>{html.escape(m.group(2))}</li>")
    else:
        if abierta:
            cuerpo.append("</ul>")
            abierta = False
        cuerpo.append(f"<p>{html.escape(t)}</p>")
if abierta:
    cuerpo.append("</ul>")

cabeza = """<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0A1628">
<link rel="icon" type="image/png" href="{r}assets/favicon.png">
<link rel="apple-touch-icon" href="{r}assets/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Guzmán Abogados">
<link rel="stylesheet" href="{r}assets/estilo.css?v=20261122l">"""

politica = f"""<!DOCTYPE html>
<html lang="es-CO">
<head>
{cabeza.format(r="")}
<title>Política de tratamiento de datos · Guzmán y Abogados</title>
<meta name="description" content="Política de tratamiento de datos personales de Guzmán y Abogados, Itagüí (Ley 1581 de 2012).">
<link rel="canonical" href="https://guzmanyabogados.com/politica-de-datos.html">
</head>
<body>
<a class="saltar" href="#contenido">Ir al contenido</a>
{franja}
{cab}
<main id="contenido" class="documento">
  <div class="envoltura">
    <p class="ante">Ley 1581 de 2012</p>
    <h1>Política de tratamiento de datos personales</h1>
    <p class="sub">GUZMAN Y ABOGADOS CG</p>
{chr(10).join('    ' + c for c in cuerpo)}
    <p class="volver"><a class="boton boton-linea" href="./">Volver al inicio</a></p>
  </div>
</main>
{pie}
{flotante}
</body>
</html>
"""
open("site/politica-de-datos.html", "w", encoding="utf-8").write(politica)

absoluto = lambda s: s.replace('src="assets/', 'src="/assets/').replace('href="./', 'href="/').replace('href="politica', 'href="/politica')
p404 = f"""<!DOCTYPE html>
<html lang="es-CO">
<head>
{cabeza.format(r="/")}
<title>Página no encontrada · Guzmán y Abogados</title>
<meta name="robots" content="noindex">
</head>
<body>
{absoluto(cab)}
<main class="documento" id="contenido">
  <div class="envoltura" style="max-width:40rem;display:grid;gap:1.3rem;padding-block:3rem">
    <img src="/assets/emblema-dorado.png" alt="" width="96" height="96">
    <h1>No encontramos esa página</h1>
    <p>Puede que la dirección haya cambiado. Vuelva al inicio o escríbanos por WhatsApp al 320 563 9603.</p>
    <p class="acciones"><a class="boton boton-oro" href="/">Ir al inicio</a><a class="boton boton-linea" href="https://wa.me/573205639603" rel="noopener">WhatsApp</a></p>
  </div>
</main>
{absoluto(pie)}
</body>
</html>
"""
open("site/404.html", "w", encoding="utf-8").write(p404)
print("ok")

# Página a la que Wompi devuelve al cliente después de pagar (consulta o certificado).
pago = f"""<!DOCTYPE html>
<html lang="es-CO">
<head>
{cabeza.format(r="/")}
<title>Confirmar por WhatsApp · Guzmán y Abogados</title>
<meta name="robots" content="noindex">
</head>
<body>
{absoluto(cab)}
<main class="documento" id="contenido">
  <div class="envoltura" style="max-width:40rem;display:grid;gap:1.3rem;padding-block:3rem">
    <img src="/assets/emblema-dorado.png" alt="" width="96" height="96">
    <p class="ante" id="estado">Pago en línea</p>
    <h1 id="titulo">Confírmenos su pago por WhatsApp</h1>
    <p id="texto">Toque el botón para escribirnos por WhatsApp. Ya sabremos que viene del pago y le respondemos de inmediato en el horario de atención.</p>
    <p class="acciones" id="acciones-pago"><a class="boton boton-oro" id="whatsapp" href="https://wa.me/573205639603?text=Hola%2C%20acabo%20de%20hacer%20un%20pago%20a%20Guzm%C3%A1n%20y%20Abogados." rel="noopener">Confirmar por WhatsApp</a><a class="boton boton-linea" href="/">Ir al inicio</a></p>
    <form class="doc-manual" id="doc-manual" hidden><label for="doc-codigo">¿Pagó un contrato o un poder en línea? Escriba el código de su documento:</label><span><input id="doc-codigo" placeholder="GA-000000-XXXX" autocomplete="off"><button class="boton boton-linea" type="submit">Recibir mi documento</button></span></form>
    <p class="aviso"><b>Aviso.</b> Somos el puente para que usted haga el trámite: no garantizamos que el trámite sea viable ni que el documento le sirva para lo que busca.</p>
  </div>
</main>
{absoluto(pie)}
<script src="/assets/config.js?v=20261122l"></script>
<script>
(function () {{
  var id = new URLSearchParams(location.search).get("id");
  var boton = document.getElementById("whatsapp");
  var estado = document.getElementById("estado"), titulo = document.getElementById("titulo"), texto = document.getElementById("texto");
  var cfg = window.GA_CONFIG || {{}}, doc = null;
  try {{ doc = JSON.parse(localStorage.getItem("ga_doc") || "null"); }} catch (e) {{}}
  if (doc && Date.now() - doc.t > 3 * 24 * 3600 * 1000) doc = null;
  var cert = null;
  try {{ cert = JSON.parse(localStorage.getItem("ga_cert") || "null"); }} catch (e) {{}}
  if (cert && Date.now() - cert.t > 10 * 24 * 3600 * 1000) cert = null;
  var acciones = document.getElementById("acciones-pago"), manual = document.getElementById("doc-manual");
  function enlace(clase, href, txt) {{ var a = document.createElement("a"); a.className = "boton " + clase; a.href = href; a.textContent = txt; a.rel = "noopener"; return a; }}
  function emitir(codigo) {{
    estado.textContent = "Documento en línea";
    titulo.textContent = "Estamos preparando su documento";
    texto.textContent = "Esto toma unos segundos. No cierre esta página.";
    boton.hidden = true; manual.hidden = true;
    fetch(cfg.api, {{ method: "POST", body: JSON.stringify({{ accion: "emitir", codigo: codigo, transaccion: id }}) }})
      .then(function (r) {{ return r.json(); }})
      .then(function (r) {{
        boton.hidden = false;
        boton.href = "https://wa.me/573205639603?text=" + encodeURIComponent("Hola, pagué el documento " + codigo + ". Referencia de pago: " + id + ".");
        boton.textContent = "Escribir por WhatsApp";
        if (!r.ok) {{ estado.textContent = "Necesitamos revisar"; titulo.textContent = "No pudimos entregar el documento"; texto.textContent = r.error || "Escríbanos por WhatsApp con su código " + codigo + "."; return; }}
        try {{ localStorage.removeItem("ga_doc"); }} catch (e) {{}}
        if (r.estado === "listo") {{
          estado.textContent = "Pago aprobado";
          titulo.textContent = "Su documento está listo";
          texto.textContent = "Descárguelo aquí. También se lo enviamos a " + r.correo + ". Léalo completo antes de firmarlo. Si quiere firmarlo o autenticarlo en línea, sin ir a la notaría:";
          var bytes = atob(r.pdf), arr = new Uint8Array(bytes.length);
          for (var i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
          var url = URL.createObjectURL(new Blob([arr], {{ type: "application/pdf" }}));
          var d = enlace("boton-oro", url, "Descargar mi documento"); d.setAttribute("download", r.nombreArchivo || "documento.pdf");
          acciones.insertBefore(d, acciones.firstChild);
          acciones.appendChild(enlace("boton-linea", "https://checkout.wompi.co/l/rJvdYm", "Firma digital · $19.000 por firma"));
          acciones.appendChild(enlace("boton-linea", "https://checkout.wompi.co/l/WKMW3L", "Autenticación · $49.000 por firma"));
        }} else if (r.estado === "revision") {{
          estado.textContent = "Pago aprobado";
          titulo.textContent = "El abogado está revisando su documento";
          texto.textContent = "Se lo enviamos en PDF a " + r.correo + " a más tardar el siguiente día hábil.";
        }} else if (r.estado === "pendiente") {{
          estado.textContent = "Pago en proceso";
          titulo.textContent = "Su pago se está procesando";
          texto.textContent = "Apenas se apruebe, le enviamos el documento a " + r.correo + ". No tiene que hacer nada más.";
        }}
      }})
      .catch(function () {{ boton.hidden = false; titulo.textContent = "No pudimos conectarnos"; texto.textContent = "Su pago quedó registrado. Escríbanos por WhatsApp con su código " + codigo + " y se lo enviamos."; }});
  }}
  function pagoCert(codigo, nombre) {{
    estado.textContent = "Certificado en línea";
    titulo.textContent = "Confirmando su pago";
    texto.textContent = "Un momento, por favor.";
    fetch(cfg.api, {{ method: "POST", body: JSON.stringify({{ accion: "pagoCertificado", codigo: codigo, transaccion: id }}) }})
      .then(function (r) {{ return r.json(); }})
      .then(function (r) {{
        boton.textContent = "Escribir por WhatsApp";
        boton.href = "https://wa.me/573205639603?text=" + encodeURIComponent("Hola, pagué la solicitud " + codigo + ". Referencia de pago: " + id + ".");
        if (!r.ok) {{ estado.textContent = "Necesitamos revisar"; titulo.textContent = "No pudimos confirmar el pago"; texto.textContent = (r.error || "") + " Escríbanos por WhatsApp con su código " + codigo + "."; return; }}
        if (/^PAGO PENDIENTE/.test(r.estado)) {{ estado.textContent = "Pago en proceso"; titulo.textContent = "Su pago se está procesando"; texto.textContent = "Apenas se apruebe, expedimos " + nombre + " y se lo enviamos a " + r.correo + ". No tiene que hacer nada más."; return; }}
        estado.textContent = "Pago aprobado";
        titulo.textContent = "Gracias, recibimos su pago";
        texto.textContent = "Estamos expidiendo " + nombre + ". Se lo enviamos en PDF a " + r.correo + " lo más pronto posible dentro del horario de atención. No tiene que hacer nada más. Su código es " + codigo + ".";
      }})
      .catch(function () {{ titulo.textContent = "Gracias, recibimos su pago"; texto.textContent = "No pudimos confirmarlo en línea, pero su pago quedó registrado. Escríbanos por WhatsApp con su código " + codigo + "."; }});
  }}
  if (!id || !/^[0-9A-Za-z-]+$/.test(id)) return;
  if (doc && cfg.api) {{ emitir(doc.codigo); return; }}
  manual.hidden = true;
  manual.addEventListener("submit", function (e) {{
    e.preventDefault(); var c = document.getElementById("doc-codigo").value.trim().toUpperCase(); if (c) emitir(c);
  }});
  var linksDocs = Object.keys(cfg.enlaces || {{}}).map(function (k) {{ return String(cfg.enlaces[k]).split("/").pop(); }});
  var porLink = {{ ZLHaPk: "consulta", tnTjo2: "tradicion", D2PQdn: "ficha", B6tFxu: "avaluo", WKMW3L: "firma", rJvdYm: "firma" }};
  var mensaje = function (que) {{
    boton.href = "https://wa.me/573205639603?text=" + encodeURIComponent("Hola, " + que + " Referencia de pago: " + id + ".");
  }};
  mensaje("acabo de hacer un pago a Guzmán y Abogados.");
  fetch("https://production.wompi.co/v1/transactions/" + id)
    .then(function (r) {{ return r.ok ? r.json() : null; }})
    .then(function (j) {{
      var d = j && j.data; if (!d) return;
      var s = d.status, monto = d.amount_in_cents;
      var servicios = {{6000000: "consulta", 2900000: "tradicion", 3200000: "tradicion", 6900000: "ficha", 9000000: "avaluo", 4900000: "firma", 1900000: "firma"}};
      var link = d.payment_link_id || "";
      var servicio = porLink[link] || (linksDocs.indexOf(link) >= 0 ? "documento" : "") || servicios[monto] || (monto % 4900000 === 0 || monto % 1900000 === 0 ? "firma" : "");
      if (s === "APPROVED") {{
        estado.textContent = "Pago aprobado";
        titulo.textContent = "Gracias, recibimos su pago";
        if (servicio === "consulta") {{
          texto.textContent = "Toque el botón para escribirnos por WhatsApp y le confirmamos la fecha y la hora de su cita con el abogado.";
          mensaje("acabo de pagar la consulta con el abogado. Quiero confirmar mi cita.");
        }} else if (servicio === "tradicion" || servicio === "ficha" || servicio === "avaluo") {{
          var nombre = servicio === "tradicion" ? "el certificado de tradición y libertad" : (servicio === "ficha" ? "la ficha predial" : "el certificado de avalúo catastral");
          if (cert && cfg.api) {{ pagoCert(cert.codigo, nombre); return; }}
          texto.textContent = "No tiene que hacer nada más ni guardar ningún código: ya tenemos los datos que escribió en el pago. Le enviamos " + nombre + " en PDF al correo o al WhatsApp que indicó, lo más pronto posible dentro del horario de atención. Si tiene alguna duda, escríbanos por WhatsApp.";
          mensaje("acabo de pagar " + nombre + " en línea.");
          boton.textContent = "Escribir por WhatsApp";
        }} else if (servicio === "firma") {{
          texto.textContent = "Si todavía no nos ha enviado el documento, toque el botón y envíelo en PDF por WhatsApp, o envíelo al correo notificaciones@guzmanyabogados.com. Le avisamos cuando esté listo.";
          mensaje("acabo de pagar la firma de un documento. Les envío el PDF.");
          boton.textContent = "Enviar el documento por WhatsApp";
        }} else if (servicio === "documento" && cfg.api) {{
          titulo.textContent = "Recibimos el pago de su documento";
          texto.textContent = "Escriba abajo el código de su documento para descargarlo. Es el que empieza por GA- y aparece en la pantalla donde pagó. Si no lo tiene, escríbanos por WhatsApp y se lo enviamos.";
          manual.hidden = false;
          mensaje("pagué un documento en línea y no tengo el código.");
          boton.textContent = "Escribir por WhatsApp";
        }} else {{
          texto.textContent = "Toque el botón para escribirnos por WhatsApp y continuamos con su trámite.";
        }}
      }} else if (s === "PENDING") {{
        estado.textContent = "Pago en proceso";
        titulo.textContent = "Su pago se está procesando";
        texto.textContent = "Escríbanos por WhatsApp y continuamos apenas se apruebe el pago.";
        mensaje("hice un pago y está en proceso.");
      }} else if (s === "DECLINED" || s === "VOIDED" || s === "ERROR") {{
        estado.textContent = "Pago no aprobado";
        titulo.textContent = "El pago no se pudo completar";
        texto.textContent = "Puede intentarlo de nuevo con otro medio de pago o escribirnos por WhatsApp y le ayudamos.";
        mensaje("intenté hacer un pago pero no se aprobó.");
        boton.textContent = "Escribir por WhatsApp";
      }}
    }})
    .catch(function () {{ manual.hidden = !cfg.api; }});
}})();
</script>
</body>
</html>
"""
open("site/pago-recibido.html", "w", encoding="utf-8").write(pago)
print("pago ok")


# Certificados en línea: solicitud, verificación del folio y pago
cert = f"""<!DOCTYPE html>
<html lang="es-CO">
<head>
{cabeza.format(r="/")}
<title>Certificado de tradición y libertad en línea · Guzmán y Abogados</title>
<meta name="description" content="Pida en línea su certificado de tradición y libertad, ficha predial o certificado de avalúo catastral. Verificamos que se pueda expedir antes de que usted pague y se lo enviamos en PDF.">
<link rel="canonical" href="https://guzmanyabogados.com/certificados.html">
<meta property="og:title" content="Certificados en línea · Guzmán y Abogados">
<meta property="og:description" content="Verificamos el folio antes de cobrarle y le enviamos el certificado en PDF.">
<meta property="og:image" content="https://guzmanyabogados.com/assets/compartir.png">
</head>
<body>
{absoluto(cab)}
<main id="contenido">
  <section class="seccion seccion-azul app-docs">
    <div class="envoltura">
      <div id="app-cert"><p>Cargando…</p></div>
      <noscript><p>Para pedir el certificado en línea active JavaScript, o escríbanos por WhatsApp al 320 563 9603.</p></noscript>
    </div>
  </section>
</main>
{absoluto(pie)}
{flotante}
<script src="/assets/config.js?v=20261122l"></script>
<script src="/assets/orip.js?v=20261122l"></script>
<script src="/assets/municipios.js?v=20261122l"></script>
<script src="/assets/certificados.js?v=20261122l" defer></script>
<script src="/assets/app.js?v=20261122l" defer></script>
</body>
</html>
"""
open("site/certificados.html", "w", encoding="utf-8").write(cert)
print("certificados ok")


# Documentos en línea (contratos, promesas, poderes y derechos de petición)
docs = f"""<!DOCTYPE html>
<html lang="es-CO">
<head>
{cabeza.format(r="/")}
<title>Contratos, promesas y poderes en línea · Guzmán y Abogados</title>
<meta name="description" content="Haga en línea su contrato de arrendamiento, promesa de compraventa, compraventa de vehículo o poder con las minutas de Guzmán y Abogados. Pague y reciba el PDF en su correo. Con revisión del abogado si la quiere.">
<link rel="canonical" href="https://guzmanyabogados.com/documentos.html">
<meta property="og:title" content="Contratos, promesas y poderes en línea · Guzmán y Abogados">
<meta property="og:description" content="Llene los datos, pague y reciba su documento en PDF en minutos.">
<meta property="og:image" content="https://guzmanyabogados.com/assets/compartir.png">
</head>
<body>
{absoluto(cab)}
<main id="contenido">
  <section class="seccion seccion-azul app-docs">
    <div class="envoltura">
      <div id="catalogo">
        <div class="titulo-seccion">
          <p class="ante">Paso 1 de 3 · Elija su documento</p>
          <h1 class="titulo-app">Contratos, promesas y poderes en línea</h1>
          <p>Llene los datos, pague en línea y reciba su documento en PDF en su correo en minutos. Están hechos con las minutas de la oficina. Si prefiere, el abogado lo revisa antes de enviárselo.</p>
        </div>
        <ul class="tarjetas" id="lista-docs"></ul>
        <div class="despues">
          <p class="nota-titulo">Después, fírmelo sin ir a la notaría</p>
          <p>Firma digital, $19.000 por cada persona que firma. Autenticación notarial digital, $49.000 por cada persona que firma: usted imprime las copias que necesite sin pagar por cada copia.</p>
        </div>
        <p class="aviso"><b>Aviso.</b> Somos el puente para que usted haga el trámite: no garantizamos que el trámite sea viable ni que el documento le sirva para lo que busca. Los datos que nos da y las cláusulas, facultades y anexos que agregue son de su responsabilidad. La autenticación y la firma digital dan fe de quién firma; el contenido es responsabilidad de quien firma. Si su caso no es sencillo, pida una cita con el abogado.</p>
      </div>
      <div id="formulario" hidden></div>
      <div id="pago" hidden></div>
    </div>
  </section>
</main>
{absoluto(pie)}
{flotante}
<script src="/assets/config.js?v=20261122l"></script>
<script src="/assets/municipios.js?v=20261122l" defer></script>
<script src="/assets/documentos.js?v=20261122l" defer></script>
<script src="/assets/app.js?v=20261122l" defer></script>
</body>
</html>
"""
open("site/documentos.html", "w", encoding="utf-8").write(docs)
print("documentos ok")
