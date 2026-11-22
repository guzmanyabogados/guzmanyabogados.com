// Guzmán y Abogados · Documentos en línea
// Formulario por documento. Las minutas viven en el servidor de la oficina; aquí solo se piden los datos.
(function () {
  "use strict";
  var CFG = window.GA_CONFIG || {};
  var API = CFG.api || "";          // dirección del servidor (Google Apps Script)
  var ENLACES = CFG.enlaces || {};  // valor -> enlace de pago de Wompi
  var WA = "https://wa.me/573205639603?text=";

  // ---------- Definición de los documentos ----------
  var SI_NO = [["no", "No"], ["si", "Sí"]];
  var PROHIBE_MASCOTAS = /(^|[^a-záéíóúñ])(no|proh[ií]b[a-záéíóúñ]*|sin|ningun[ao]?)\s[^.]{0,30}mascotas?|mascotas?[^.]{0,25}(no (se )?permit[a-záéíóúñ]*|proh[ií]bid[a-záéíóúñ]*)/i;
  var CUENTA = [
    { id: "forma", et: "Forma de pago", tipo: "radio", op: [["transferencia", "Transferencia"], ["efectivo", "Efectivo contra recibo"]], def: "transferencia" },
    { id: "tipoCuenta", et: "Tipo de cuenta", tipo: "select", op: [["de ahorros", "Ahorros"], ["corriente", "Corriente"]], si: ["forma", "transferencia"] },
    { id: "cuenta", et: "Número de la cuenta", si: ["forma", "transferencia"] },
    { id: "banco", et: "Banco", ph: "Ej.: Bancolombia", si: ["forma", "transferencia"] },
    { id: "titular", et: "Titular de la cuenta", si: ["forma", "transferencia"] }
  ];
  var VEHICULO = [
    { g: "Datos del vehículo", ayuda: "Cópielos tal como aparecen en la licencia de tránsito." },
    { id: "clase", et: "Clase", ph: "Ej.: automóvil, motocicleta, camioneta" },
    { id: "marca", et: "Marca" }, { id: "linea", et: "Línea" }, { id: "modelo", et: "Modelo (año)", tipo: "numero" },
    { id: "color", et: "Color" },
    { id: "servicio", et: "Servicio", tipo: "select", op: [["Particular", "Particular"], ["Público", "Público"]] },
    { id: "carroceria", et: "Carrocería", ph: "Ej.: sedán, hatchback, doble cabina" },
    { id: "placa", et: "Placa" }, { id: "motor", et: "Número de motor" }, { id: "chasis", et: "Número de chasis o VIN" },
    { id: "transito", et: "Organismo de tránsito donde está matriculado", ph: "Ej.: la Secretaría de Movilidad de Itagüí" },
    { id: "empresa", et: "Empresa a la que está vinculado", si: ["servicio", "Público"] }
  ];

  var DOCS = {
    arriendo_vivienda: {
      nombre: "Contrato de arrendamiento de vivienda", corto: "Arrendamiento de vivienda", precio: { auto: 25000, abogado: 80000 },
      desc: "Casa, apartamento o apartaestudio. Con deudor solidario si lo hay.",
      consejos: ["La Ley 820 de 2003 prohíbe pedir depósitos en dinero o cauciones reales (artículo 16).", "El canon no puede superar el 1 % del valor comercial del inmueble (artículo 18)."],
      roles: [{ id: "arrendador", et: "Quien da en arriendo (arrendador)", min: 1, max: 3, p: { civil: 1, contacto: 1 } },
        { id: "arrendatario", et: "Quien toma en arriendo (arrendatario)", min: 1, max: 3, p: { civil: 1, contacto: 1 } },
        { id: "deudor", et: "Deudor solidario (opcional)", min: 0, max: 3, p: { civil: 1, contacto: 1 } }],
      campos: [
        { g: "El inmueble" },
        { id: "tipoInmueble", et: "Tipo", tipo: "select", op: [["Casa", "Casa"], ["Apartamento", "Apartamento"], ["Apartaestudio", "Apartaestudio"]] },
        { id: "direccion", et: "Dirección completa", ph: "Ej.: Calle 52 # 49-10, apartamento 301" },
        { id: "municipio", et: "Municipio" },
        { id: "matricula", et: "Matrícula inmobiliaria", req: 0, ayuda: "Está en el certificado de tradición o en la factura del predial." },
        { id: "linderos", et: "Linderos", tipo: "area", req: 0, ayuda: "Si los deja en blanco, el contrato remite a los que constan en el título de adquisición." },
        { id: "anexidades", et: "Incluye además", req: 0, ph: "Ej.: el parqueadero número 12 y el cuarto útil 5" },
        { id: "ph", et: "¿Está en propiedad horizontal (edificio o conjunto)?", tipo: "radio", op: SI_NO, def: "no" },
        { id: "phNombre", et: "Nombre del edificio o conjunto", si: ["ph", "si"] },
        { id: "maxPersonas", et: "Máximo de personas que vivirán", tipo: "numero", req: 0 },
        { g: "Término y canon" },
        { id: "meses", et: "Duración (meses)", tipo: "numero", def: "12" },
        { id: "inicio", et: "Fecha de inicio", tipo: "fecha" },
        { id: "canon", et: "Canon mensual", tipo: "dinero" },
        { id: "diasPago", et: "Se paga dentro de los primeros … días de cada mes", tipo: "numero", def: "5" }
      ].concat(CUENTA, [
        { g: "Servicios y otros" },
        { id: "servicios", et: "Servicios públicos a cargo del arrendatario", tipo: "checks", op: ["Acueducto", "Alcantarillado", "Energía", "Gas", "Aseo", "Internet"], def: ["Acueducto", "Alcantarillado", "Energía", "Gas", "Aseo"] },
        { id: "administracion", et: "¿El arrendatario paga la cuota de administración?", tipo: "radio", op: SI_NO, def: "no" },
        { id: "penalTipo", et: "Cláusula penal", tipo: "radio", op: [["canones", "En número de cánones"], ["valor", "Valor fijo"]], def: "canones", ayuda: "Suma que paga quien incumpla. Es frecuente pactar tres cánones." },
        { id: "penalCanones", et: "Número de cánones", tipo: "numero", def: "3", si: ["penalTipo", "canones"] },
        { id: "penal", et: "Valor de la pena", tipo: "dinero", si: ["penalTipo", "valor"] },
        { g: "Otros acuerdos (opcional)", ayuda: "Marque los que quiera incluir. Al final puede escribir otros." },
        { id: "acuerdos", et: "Acuerdos", tipo: "checks", req: 0, op: [["mascotas", "Puede tener mascotas, cumpliendo las normas de convivencia y respondiendo por los daños"], ["pintura", "Se entrega pintado y debe devolverse pintado"], ["recibos", "El arrendatario muestra los recibos pagados cuando se los pidan"], ["visitas", "El arrendador puede visitar el inmueble con aviso previo de dos días"], ["internet", "Internet, televisión y telefonía a nombre del arrendatario, a paz y salvo al entregar"]] }
      ]),
      adicional: "Otros acuerdos entre las partes (opcional)"
    },
    arriendo_local: {
      nombre: "Contrato de arrendamiento de local comercial", corto: "Arrendamiento de local", precio: { auto: 30000, abogado: 100000 },
      desc: "Local, bodega, oficina, garaje, kiosco o puesto. Personas o empresas.",
      consejos: ["Si el arrendatario tiene allí un establecimiento de comercio, tiene derecho de renovación (artículos 518 a 524 del Código de Comercio)."],
      roles: [{ id: "arrendador", et: "Quien da en arriendo (arrendador)", min: 1, max: 3, p: { juridica: 1, contacto: 1 } },
        { id: "arrendatario", et: "Quien toma en arriendo (arrendatario)", min: 1, max: 3, p: { juridica: 1, contacto: 1 } },
        { id: "deudor", et: "Deudor solidario (opcional)", min: 0, max: 3, p: { juridica: 1, contacto: 1 } }],
      campos: [
        { g: "El inmueble" },
        { id: "tipoInmueble", et: "Tipo", tipo: "select", op: [["Local", "Local"], ["Bodega", "Bodega"], ["Oficina", "Oficina"], ["Garaje", "Garaje"], ["Kiosco", "Kiosco"], ["Puesto", "Puesto"]] },
        { id: "direccion", et: "Dirección completa" }, { id: "municipio", et: "Municipio" },
        { id: "matricula", et: "Matrícula inmobiliaria", req: 0 },
        { id: "area", et: "Área aproximada (m²)", tipo: "numero", req: 0 },
        { id: "linderos", et: "Linderos", tipo: "area", req: 0, ayuda: "Si los deja en blanco, el contrato remite a los que constan en el título de adquisición." },
        { id: "ph", et: "¿Está en propiedad horizontal (edificio o centro comercial)?", tipo: "radio", op: SI_NO, def: "no" },
        { id: "phNombre", et: "Nombre del edificio o centro comercial", si: ["ph", "si"] },
        { id: "actividad", et: "Actividad a la que se destina", ph: "Ej.: venta de ropa y accesorios" },
        { g: "Término y canon" },
        { id: "meses", et: "Duración (meses)", tipo: "numero", def: "12" },
        { id: "inicio", et: "Fecha de inicio", tipo: "fecha" },
        { id: "canon", et: "Canon mensual", tipo: "dinero" },
        { id: "iva", et: "¿Se cobra IVA sobre el canon?", tipo: "radio", op: SI_NO, def: "no", ayuda: "Solo si el arrendador es responsable de IVA." },
        { id: "diasPago", et: "Se paga dentro de los primeros … días de cada mes", tipo: "numero", def: "5" }
      ].concat(CUENTA, [
        { id: "reajuste", et: "Reajuste anual", tipo: "radio", op: [["ipc", "IPC del año anterior"], ["porcentaje", "Un porcentaje fijo"]], def: "ipc" },
        { id: "reajustePuntos", et: "Puntos adicionales al IPC (0 si ninguno)", tipo: "numero", def: "0", si: ["reajuste", "ipc"] },
        { id: "reajustePct", et: "Porcentaje de reajuste", tipo: "numero", si: ["reajuste", "porcentaje"] },
        { g: "Otros" },
        { id: "administracion", et: "¿El arrendatario paga la cuota de administración?", tipo: "radio", op: SI_NO, def: "no" },
        { id: "penalTipo", et: "Cláusula penal", tipo: "radio", op: [["canones", "En número de cánones"], ["valor", "Valor fijo"]], def: "canones", ayuda: "Suma que paga quien incumpla. Es frecuente pactar tres cánones." },
        { id: "penalCanones", et: "Número de cánones", tipo: "numero", def: "3", si: ["penalTipo", "canones"] },
        { id: "penal", et: "Valor de la pena", tipo: "dinero", si: ["penalTipo", "valor"] },
        { id: "reporte", et: "¿Autorizan consulta y reporte en centrales de riesgo?", tipo: "radio", op: SI_NO, def: "si" },
        { g: "Otros acuerdos (opcional)", ayuda: "Marque los que quiera incluir. Al final puede escribir otros." },
        { id: "acuerdos", et: "Acuerdos", tipo: "checks", req: 0, op: [["pintura", "Se entrega pintado y debe devolverse pintado"], ["recibos", "El arrendatario muestra los recibos pagados cuando se los pidan"], ["visitas", "El arrendador puede visitar el inmueble con aviso previo de dos días"], ["internet", "Internet, televisión y telefonía a nombre del arrendatario, a paz y salvo al entregar"], ["poliza", "El arrendatario toma una póliza de responsabilidad civil por su actividad"]] }
      ]),
      adicional: "Otros acuerdos entre las partes (opcional)"
    },
    promesa: {
      nombre: "Promesa de compraventa de inmueble", corto: "Promesa de compraventa", precio: { auto: 70000, abogado: 200000 },
      desc: "Casa, apartamento, lote o local. Contado, cuotas, cesantías o crédito.",
      consejos: ["La promesa solo obliga si fija la fecha, la hora y la notaría de la escritura y determina bien el inmueble (artículo 89 de la Ley 153 de 1887). Por eso esos datos son obligatorios.", "Revise el certificado de tradición antes de firmar. Lo sacamos en línea por $29.000."],
      roles: [{ id: "vendedor", et: "Quien promete vender", min: 1, max: 3, p: { civil: 1, contacto: 1 } },
        { id: "comprador", et: "Quien promete comprar", min: 1, max: 3, p: { civil: 1, contacto: 1 } }],
      campos: [
        { g: "El inmueble", ayuda: "Copie los datos del certificado de tradición y de la escritura." },
        { id: "tipoInmueble", et: "Tipo", tipo: "select", op: [["Casa", "Casa"], ["Apartamento", "Apartamento"], ["Apartaestudio", "Apartaestudio"], ["Lote", "Lote"], ["Local", "Local"], ["Bodega", "Bodega"], ["Oficina", "Oficina"], ["Parqueadero", "Parqueadero"], ["Finca", "Finca"]] },
        { id: "direccion", et: "Dirección" }, { id: "municipio", et: "Municipio" },
        { id: "matricula", et: "Matrícula inmobiliaria", ph: "Ej.: 001-123456" },
        { id: "circulo", et: "Oficina de Registro (círculo)", ph: "Ej.: Medellín Sur" },
        { id: "predial", et: "Número predial o cédula catastral", req: 0 },
        { id: "area", et: "Área (m²)", tipo: "numero", req: 0 },
        { id: "linderos", et: "Linderos", tipo: "area" },
        { id: "ph", et: "¿Está en propiedad horizontal?", tipo: "radio", op: SI_NO, def: "no" },
        { id: "phNombre", et: "Nombre del edificio o conjunto", si: ["ph", "si"] },
        { id: "phEscritura", et: "Escritura del reglamento (número)", si: ["ph", "si"] },
        { id: "phFecha", et: "Fecha de esa escritura", tipo: "fecha", si: ["ph", "si"] },
        { id: "phNotaria", et: "Notaría (número o nombre)", ph: "Ej.: Segunda", si: ["ph", "si"] },
        { id: "phCiudad", et: "Ciudad de la notaría", si: ["ph", "si"] },
        { g: "Cómo lo adquirió el vendedor" },
        { id: "modoAdquisicion", et: "Modo de adquisición", tipo: "select", op: [["Compraventa", "Compraventa"], ["Adjudicación en sucesión", "Adjudicación en sucesión"], ["Adjudicación en liquidación de sociedad conyugal o patrimonial", "Liquidación de sociedad conyugal o patrimonial"], ["Donación", "Donación"], ["Permuta", "Permuta"], ["Dación en pago", "Dación en pago"]] },
        { id: "anterior", et: "A quién se lo adquirió" },
        { id: "titEscritura", et: "Escritura (número)" }, { id: "titFecha", et: "Fecha de la escritura", tipo: "fecha" },
        { id: "titNotaria", et: "Notaría (número o nombre)", ph: "Ej.: Primera" }, { id: "titCiudad", et: "Ciudad de la notaría" },
        { g: "Precio y pago" },
        { id: "precio", et: "Precio total", tipo: "dinero" },
        { id: "anticipo", et: "Valor que se paga a la firma de la promesa", tipo: "dinero", req: 0, ayuda: "Si no se paga nada a la firma, déjelo en blanco." },
        { id: "formaSaldo", et: "El saldo se paga", tipo: "radio", op: [["contado", "De contado en una fecha"], ["cuotas", "En cuotas mensuales"], ["cesantias", "Con cesantías"], ["credito", "Con crédito de un banco"]], def: "contado" },
        { id: "fechaPagoSaldo", et: "Fecha de pago del saldo", tipo: "fecha", si: ["formaSaldo", "contado"] },
        { id: "cuotasNumero", et: "Número de cuotas", tipo: "numero", si: ["formaSaldo", "cuotas"] },
        { id: "cuotaValor", et: "Valor de cada cuota", tipo: "dinero", si: ["formaSaldo", "cuotas"] },
        { id: "cuotaDia", et: "Día del mes en que se paga", tipo: "numero", si: ["formaSaldo", "cuotas"] },
        { id: "cuotaPrimera", et: "Fecha de la primera cuota", tipo: "fecha", si: ["formaSaldo", "cuotas"] },
        { id: "garantia", et: "El saldo pendiente a la escritura se garantiza con", tipo: "select", op: [["pagare", "Pagaré"], ["hipoteca", "Hipoteca de primer grado"]], si: ["formaSaldo", "cuotas"] },
        { id: "fondo", et: "Fondo de cesantías o empleador", si: ["formaSaldo", "cesantias"] },
        { id: "entidadCredito", et: "Entidad financiera", si: ["formaSaldo", "credito"] },
        { id: "diasRestitucion", et: "Si niegan el crédito, días hábiles para devolver lo recibido", tipo: "numero", def: "10", si: ["formaSaldo", "credito"] },
        { g: "Entrega y escritura" },
        { id: "fechaEntrega", et: "Fecha de entrega del inmueble", tipo: "fecha" },
        { id: "fechaEscritura", et: "Fecha de la escritura", tipo: "fecha" },
        { id: "horaEscritura", et: "Hora de la escritura", tipo: "hora", def: "10:00" },
        { id: "notaria", et: "Notaría (número o nombre)", ph: "Ej.: Primera" },
        { id: "notariaCiudad", et: "Ciudad de la notaría" },
        { id: "penalTipo", et: "Cláusula penal", tipo: "radio", op: [["porcentaje", "Porcentaje del precio"], ["valor", "Valor fijo"]], def: "porcentaje", ayuda: "Suma que paga quien incumpla. Es frecuente pactar alrededor del 10 % del precio." },
        { id: "penalPct", et: "Porcentaje del precio", tipo: "numero", def: "10", si: ["penalTipo", "porcentaje"] },
        { id: "penal", et: "Valor de la pena", tipo: "dinero", si: ["penalTipo", "valor"] }
      ],
      adicional: "Otros acuerdos entre las partes (opcional)"
    },
    vehiculo: {
      nombre: "Contrato de compraventa de vehículo", corto: "Compraventa de vehículo", precio: { auto: 30000, abogado: 90000 },
      desc: "Carros, motos y camiones. De contado o a plazos, completo o por porcentaje.",
      consejos: ["Pida el certificado de tradición del vehículo antes de firmar.", "El traspaso debe inscribirse en tránsito dentro de los 60 días hábiles siguientes a la compra (artículo 47 de la Ley 769 de 2002). Mientras no se haga, el vendedor sigue figurando como dueño."],
      roles: [{ id: "vendedor", et: "Quien vende", min: 1, max: 3, p: { civil: 1, contacto: 1 } },
        { id: "comprador", et: "Quien compra", min: 1, max: 3, p: { civil: 1, contacto: 1 } }],
      campos: VEHICULO.concat([
        { id: "cupo", et: "¿Se vende también el cupo y la afiliación?", tipo: "radio", op: SI_NO, def: "no", si: ["servicio", "Público"] },
        { id: "porcentaje", et: "Porcentaje que se vende", tipo: "numero", def: "100" },
        { id: "diasPreferencia", et: "Días que tienen los demás copropietarios para comprar si uno vende su parte", tipo: "numero", def: "15", si: ["porcentaje", "<100"] },
        { g: "Precio y pago" },
        { id: "precio", et: "Precio", tipo: "dinero" },
        { id: "formaPago", et: "Forma de pago", tipo: "radio", op: [["contado", "De contado"], ["plazos", "A plazos"]], def: "contado" },
        { id: "medio", et: "Medio de pago", tipo: "radio", op: [["efectivo", "Efectivo"], ["transferencia", "Transferencia"]], def: "efectivo", si: ["formaPago", "contado"] },
        { id: "tipoCuenta", et: "Tipo de cuenta", tipo: "select", op: [["de ahorros", "Ahorros"], ["corriente", "Corriente"]], si: ["medio", "transferencia"] },
        { id: "cuenta", et: "Número de la cuenta", si: ["medio", "transferencia"] },
        { id: "banco", et: "Banco", si: ["medio", "transferencia"] },
        { id: "abono", et: "Valor que se paga a la firma", tipo: "dinero", req: 0, si: ["formaPago", "plazos"] },
        { id: "cuotas", et: "Número de cuotas mensuales", tipo: "numero", si: ["formaPago", "plazos"] },
        { id: "cuotaValor", et: "Valor de cada cuota", tipo: "dinero", si: ["formaPago", "plazos"] },
        { id: "primeraCuota", et: "Fecha de la primera cuota", tipo: "fecha", si: ["formaPago", "plazos"] },
        { id: "interes", et: "Interés de plazo mensual (%) — 0 si no hay", tipo: "numero", def: "0", si: ["formaPago", "plazos"] },
        { id: "aceleracion", et: "El saldo se hace exigible si deja de pagar", tipo: "select", op: [["1", "Una cuota"], ["2", "Dos cuotas"]], si: ["formaPago", "plazos"] },
        { id: "respaldo", et: "El saldo se respalda con", tipo: "select", op: [["ninguno", "Nada adicional"], ["letras", "Letras de cambio"], ["pagare", "Pagaré con carta de instrucciones"]], si: ["formaPago", "plazos"] },
        { id: "seguro", et: "¿El comprador debe tener seguro todo riesgo mientras paga?", tipo: "radio", op: SI_NO, def: "no", si: ["formaPago", "plazos"] },
        { g: "Entrega y traspaso" },
        { id: "fechaEntrega", et: "Fecha de entrega (en blanco si es a la firma)", tipo: "fecha", req: 0 },
        { id: "traspaso", et: "El traspaso se radica", tipo: "radio", op: [["dias", "Dentro de unos días"], ["fecha", "En una fecha"], ["pago", "Cuando se pague todo"]], def: "dias" },
        { id: "traspasoDias", et: "Número de días", tipo: "numero", def: "30", si: ["traspaso", "dias"] },
        { id: "traspasoFecha", et: "Fecha", tipo: "fecha", si: ["traspaso", "fecha"] },
        { id: "gastos", et: "Gastos del traspaso", tipo: "select", op: [["mitades", "Por mitades"], ["vendedor", "Los paga el vendedor"], ["comprador", "Los paga el comprador"]] },
        { id: "penalTipo", et: "Cláusula penal", tipo: "radio", op: [["porcentaje", "Porcentaje del precio"], ["valor", "Valor fijo"]], def: "porcentaje", ayuda: "Suma que paga quien incumpla. Es frecuente pactar alrededor del 10 % del precio." },
        { id: "penalPct", et: "Porcentaje del precio", tipo: "numero", def: "10", si: ["penalTipo", "porcentaje"] },
        { id: "penal", et: "Valor de la pena", tipo: "dinero", si: ["penalTipo", "valor"] }
      ]),
      adicional: "Otros acuerdos entre las partes (opcional)"
    },
    poder_tramites: {
      nombre: "Poder especial para trámites y administración", corto: "Poder para trámites", precio: { auto: 20000, abogado: 60000 },
      desc: "Administrar un inmueble, DIAN, servicios públicos, impuestos, patios, EPS, registro civil, reclamar documentos o dinero.",
      consejos: ["Sirve para trámites ante entidades y para administrar un inmueble: arrendarlo, cobrar los cánones y pagar sus cuentas.",
        "No sirve para vender, prometer en venta, hipotecar ni firmar escrituras, ni para procesos judiciales. Para eso escríbanos por WhatsApp al 320 563 9603 y el abogado se lo prepara.",
        "Muchas entidades, notarías e inmobiliarias piden la firma autenticada. Se la autenticamos en línea por $49.000."],
      roles: [{ id: "poderdante", et: "Quien da el poder", min: 1, max: 3, p: {} },
        { id: "apoderado", et: "Quien recibe el poder", min: 1, max: 1, p: {} },
        { id: "testigo", et: "Testigo que firma a ruego", min: 0, max: 1, p: { simple: 1 }, si: ["ruego", "si"] }],
      campos: [
        { g: "A quién va dirigido" },
        { id: "destino", et: "¿El poder va dirigido a una entidad en particular?", tipo: "radio", op: [["general", "No: A QUIEN PUEDA INTERESAR"], ["entidad", "Sí, a una entidad"]], def: "general" },
        { id: "entidad", et: "Entidad", ph: "Ej.: EPM, DIAN, Nueva EPS", si: ["destino", "entidad"] },
        { id: "entidadMunicipio", et: "Municipio de la entidad", si: ["destino", "entidad"] },
        { g: "Para qué es el poder" },
        { id: "opcion", et: "Trámite", tipo: "select", elegir: 1, op: [["inmueble", "Administrar un inmueble (arrendar, cobrar, pagar cuentas)"], ["dian", "DIAN: RUT y certificados"], ["servicios", "Servicios públicos"], ["impuestos", "Impuesto predial o de industria y comercio"], ["transito", "Retirar un vehículo de patios o parqueadero"], ["salud", "EPS: citas, medicamentos, beneficiarios"], ["registro", "Registro civil: copias y certificados"], ["documentos", "Reclamar un documento"], ["dinero", "Recibir un dinero"], ["otro", "Otro trámite"]] },
        { id: "inTipo", et: "Tipo de inmueble", tipo: "select", op: [["casa", "Casa"], ["apartamento", "Apartamento"], ["local comercial", "Local comercial"], ["oficina", "Oficina"], ["bodega", "Bodega"], ["parqueadero", "Parqueadero"], ["lote", "Lote"], ["finca", "Finca"]], si: ["opcion", "inmueble"] },
        { id: "inDireccion", et: "Dirección completa", ph: "Ej.: Calle 50 # 50-50, apartamento 301", si: ["opcion", "inmueble"] },
        { id: "inMunicipio", et: "Municipio", si: ["opcion", "inmueble"] },
        { id: "inPH", et: "Edificio o conjunto (si es propiedad horizontal)", req: 0, ph: "Ej.: Edificio Los Pinos P.H.", si: ["opcion", "inmueble"] },
        { id: "inMatricula", et: "Matrícula inmobiliaria", ph: "Ej.: 001-123456", ayuda: "Aparece en el certificado de tradición y en la escritura.", si: ["opcion", "inmueble"] },
        { id: "inOrip", et: "Oficina de registro", ph: "Ej.: Medellín Sur", ayuda: "La que figura en el certificado de tradición.", si: ["opcion", "inmueble"] },
        { id: "inCatastral", et: "Cédula o ficha catastral", ayuda: "Aparece en la factura del impuesto predial.", si: ["opcion", "inmueble"] },
        { id: "cuentas", et: "Rendición de cuentas", tipo: "select", op: [["mes", "Cada mes"], ["trimestre", "Cada trimestre"]], si: ["opcion", "inmueble"] },
        { id: "dianAccion", et: "Trámite del RUT", tipo: "select", op: [["Inscribir", "Inscripción"], ["Actualizar", "Actualización"]], si: ["opcion", "dian"] },
        { id: "spServicio", et: "Servicio", tipo: "select", op: [["energía", "Energía"], ["acueducto y alcantarillado", "Acueducto y alcantarillado"], ["gas", "Gas"], ["internet", "Internet"]], si: ["opcion", "servicios"] },
        { id: "spSolicitud", et: "Qué se solicita", tipo: "select", op: [["la instalación", "Instalación"], ["el traslado", "Traslado"], ["la suspensión", "Suspensión"], ["la reconexión", "Reconexión"], ["el cambio de nombre del suscriptor", "Cambio de nombre del suscriptor"]], si: ["opcion", "servicios"] },
        { id: "spDireccion", et: "Dirección del inmueble", si: ["opcion", "servicios"] },
        { id: "spMunicipio", et: "Municipio del inmueble", si: ["opcion", "servicios"] },
        { id: "spTipoNumero", et: "Número de", tipo: "select", op: [["contrato", "Contrato"], ["instalacion", "Instalación"]], si: ["opcion", "servicios"] },
        { id: "spNumero", et: "Número", si: ["opcion", "servicios"] },
        { id: "impImpuesto", et: "Impuesto", tipo: "select", op: [["predial", "Predial"], ["ica", "Industria y comercio"]], si: ["opcion", "impuestos"] },
        { id: "impMunicipio", et: "Municipio", si: ["opcion", "impuestos"] },
        { id: "impObjeto", et: "Matrícula del inmueble o nombre del establecimiento", si: ["opcion", "impuestos"] },
        { id: "impCatastral", et: "Cédula catastral", req: 0, si: ["impImpuesto", "predial"] },
        { id: "impAccion", et: "Sobre el registro de industria y comercio", tipo: "select", op: [["inscribir", "Inscribir"], ["actualizar", "Actualizar"], ["cancelar", "Cancelar"]], si: ["impImpuesto", "ica"] },
        { id: "impVigencias", et: "Años (vigencias)", req: 0, ph: "Ej.: 2024 a 2026", si: ["opcion", "impuestos"] },
        { id: "trLugar", et: "Lugar", tipo: "select", op: [["patios", "Patios"], ["parqueadero", "Parqueadero"]], si: ["opcion", "transito"] },
        { id: "trPlaca", et: "Placa", si: ["opcion", "transito"] }, { id: "trMarca", et: "Marca", si: ["opcion", "transito"] }, { id: "trModelo", et: "Modelo", si: ["opcion", "transito"] },
        { id: "saBeneficiario", et: "Beneficiario que se afilia o retira", req: 0, ph: "Nombre e identificación", si: ["opcion", "salud"] },
        { id: "saAccion", et: "¿Afiliar o retirar?", tipo: "select", op: [["afiliar", "Afiliar"], ["retirar", "Retirar"]], si: ["opcion", "salud"] },
        { id: "reTipo", et: "Registro civil de", tipo: "select", op: [["nacimiento", "Nacimiento"], ["matrimonio", "Matrimonio"], ["defunción", "Defunción"]], si: ["opcion", "registro"] },
        { id: "reNombre", et: "De quién", si: ["opcion", "registro"] },
        { id: "doDescripcion", et: "Documento que se reclama", ph: "Ej.: el oficio de desembargo", si: ["opcion", "documentos"] },
        { id: "doDentro", et: "Expedido dentro de", ph: "Ej.: el proceso con radicado 2025-00123", si: ["opcion", "documentos"] },
        { id: "diPagador", et: "Quién paga", si: ["opcion", "dinero"] }, { id: "diValor", et: "Valor", tipo: "dinero", si: ["opcion", "dinero"] },
        { id: "diConcepto", et: "Por concepto de", si: ["opcion", "dinero"] },
        { id: "otroTexto", et: "Describa el trámite y ante quién", tipo: "area", si: ["opcion", "otro"] },
        { g: "Facultades", ayuda: "Marque lo que la persona podrá hacer en su nombre. Al final puede escribir otras." },
        { id: "facultades", et: "Podrá", tipo: "checks", req: 0, si: ["opcion", "inmueble"], op: [["arrendar", "Arrendar el inmueble: firmar, prorrogar y terminar contratos y reajustar el canon"], ["cobrar", "Cobrar y recibir los cánones y expedir recibos y paz y salvos"], ["entregar", "Entregar y recibir el inmueble y firmar actas e inventarios"], ["pagar", "Pagar servicios, predial, valorización y administración"], ["ph", "Representarlo ante la administración y en las asambleas de la propiedad horizontal"], ["reparaciones", "Contratar y pagar reparaciones y mantenimiento"], ["servicios", "Hacer trámites ante las empresas de servicios públicos"], ["certificados", "Pedir certificados de tradición, estados de cuenta y paz y salvos"], ["acuerdos", "Firmar acuerdos de pago de impuestos, servicios y administración"], ["abogado", "Darle poder a un abogado para la restitución del inmueble y el cobro de cánones"]], def: ["arrendar", "cobrar", "entregar", "pagar"] },
        { id: "facultades", et: "Podrá", tipo: "checks", req: 0, si: ["opcion", "dian"], op: [["formularios", "Presentar y firmar formularios y documentos"], ["copia", "Pedir y recibir copia del RUT"], ["certificados", "Pedir estados de cuenta y certificaciones"]], def: ["formularios", "copia", "certificados"] },
        { id: "facultades", et: "Podrá", tipo: "checks", req: 0, si: ["opcion", "servicios"], op: [["firmar", "Presentar y firmar solicitudes y formularios"], ["facturas", "Pedir duplicados de facturas y estados de cuenta"], ["acuerdos", "Firmar acuerdos de pago"], ["pqr", "Presentar peticiones, quejas y reclamos"], ["recursos", "Interponer recursos contra las decisiones de la empresa"], ["pagar", "Pagar las facturas con el dinero que usted le entregue"]], def: ["firmar", "facturas", "pqr"] },
        { id: "facultades", et: "Podrá", tipo: "checks", req: 0, si: ["opcion", "impuestos"], op: [["estados", "Pedir facturas, estados de cuenta y paz y salvos"], ["acuerdos", "Firmar acuerdos de pago"], ["solicitudes", "Presentar peticiones y solicitudes de prescripción o corrección"], ["pagar", "Pagar el impuesto con el dinero que usted le entregue"]], def: ["estados"] },
        { id: "facultades", et: "Podrá", tipo: "checks", req: 0, si: ["opcion", "transito"], op: [["pagar", "Pagar parqueadero, grúa y demás valores"], ["acta", "Firmar el acta de entrega y recibir el vehículo y sus documentos"]], def: ["pagar", "acta"] },
        { id: "facultades", et: "Podrá", tipo: "checks", req: 0, si: ["opcion", "salud"], op: [["citas", "Pedir, cambiar y cancelar citas"], ["autorizaciones", "Pedir y reclamar autorizaciones y órdenes"], ["medicamentos", "Reclamar medicamentos e insumos"], ["resultados", "Reclamar resultados de exámenes"], ["historia", "Pedir copia de la historia clínica"], ["pqr", "Presentar peticiones, quejas y reclamos"], ["incapacidades", "Radicar incapacidades y reclamar su pago"]], def: ["citas", "autorizaciones", "medicamentos", "resultados"] },
        { id: "facultades", et: "Podrá", tipo: "checks", req: 0, si: ["opcion", "registro"], op: [["reclamar", "Reclamar los documentos y firmar el recibido"], ["pagar", "Pagar los derechos"]], def: ["reclamar", "pagar"] },
        { id: "facultades", et: "Podrá", tipo: "checks", req: 0, si: ["opcion", "documentos"], op: [["recibido", "Firmar el recibido"], ["copias", "Pedir copias del expediente o del trámite"]], def: ["recibido"] },
        { id: "facultades", et: "Podrá", tipo: "checks", req: 0, si: ["opcion", "dinero"], op: [["recibo", "Expedir el recibo o paz y salvo"]], def: ["recibo"] },
        { g: "Condiciones" },
        { id: "vigenciaFecha", et: "Vigente hasta", tipo: "fecha", req: 0, ayuda: "En blanco: hasta terminar el trámite (para administrar un inmueble, por término indefinido). Siempre se puede revocar." },
        { id: "sustituir", et: "¿Puede pasarle el poder a otra persona (sustituirlo)?", tipo: "radio", op: SI_NO, def: "no" },
        { id: "ruego", et: "¿Quien da el poder no sabe o no puede firmar?", tipo: "radio", op: SI_NO, def: "no", ayuda: "En ese caso firma un testigo a ruego y se hace ante notario." },
        { id: "ruegoMotivo", et: "Motivo", tipo: "select", op: [["no_sabe", "No sabe firmar"], ["no_puede", "No puede firmar"]], si: ["ruego", "si"] }
      ],
      adicional: "Otras facultades que quiera dar (una por línea, bajo su responsabilidad)",
      adicionalAyuda: "No escriba aquí facultades para vender, hipotecar o firmar escrituras: este poder no sirve para eso."
    },
    poder_inmueble_venta: {
      nombre: "Poder especial para vender o comprar un inmueble", corto: "Poder para vender o comprar un inmueble", precio: { auto: 60000, abogado: 100000 },
      desc: "Para que otra persona venda o compre por usted una casa, apartamento, lote o local, y firme la promesa y la escritura.",
      consejos: ["Tenga a mano el certificado de tradición, la escritura con que se adquirió el inmueble y la factura del predial: de ahí salen la matrícula, la oficina de registro, la cédula catastral y los datos de la escritura.",
        "Quien da el poder (y el cónyuge o compañero, si firma) debe hacer reconocimiento de firma y contenido ante notario. Si está fuera de Colombia, lo hace ante el consulado o ante notario del país, con apostilla o legalización. Se lo podemos autenticar en línea por $49.000.",
        "Pregunte en la notaría donde se firmará la escritura qué antigüedad máxima acepta para el poder.",
        "Si son varios inmuebles (por ejemplo, apartamento y parqueadero) o el caso tiene algo especial, elija la revisión del abogado o escríbanos por WhatsApp al 320 563 9603."],
      roles: [{ id: "poderdante", et: "Quien da el poder", min: 1, max: 3, p: { civil: 1 } },
        { id: "apoderado", et: "Quien recibe el poder", min: 1, max: 1, p: {} },
        { id: "conyuge", et: "Cónyuge o compañero(a) permanente que firma", min: 1, max: 1, p: { simple: 1 }, si: [["afectado", "si"], ["conyugeFirma", "si"]] }],
      campos: [
        { g: "El negocio" },
        { id: "opcion", et: "¿Para qué es el poder?", tipo: "radio", op: [["vender", "Para vender"], ["comprar", "Para comprar"]], def: "vender" },
        { id: "porcion", et: "¿Qué parte del inmueble?", tipo: "radio", op: [["total", "Todo (100 %)"], ["parte", "Un porcentaje"]], def: "total" },
        { id: "pct", et: "Porcentaje", tipo: "numero", ph: "Ej.: 50", si: ["porcion", "parte"] },
        { id: "comprador", et: "¿Ya sabe a quién se vende?", tipo: "radio", op: [["persona", "Sí"], ["escoge", "No, la escoge quien recibe el poder"]], def: "persona", si: ["opcion", "vender"] },
        { id: "compradorDatos", et: "Nombre e identificación del comprador", ph: "Ej.: PEDRO PÉREZ, C.C. 1.000.000", si: ["comprador", "persona"] },
        { id: "vendedorDatos", et: "Nombre e identificación del vendedor", ph: "Ej.: ANA RUIZ, C.C. 2.000.000", si: ["opcion", "comprar"] },
        { id: "precioModo", et: "¿Fija un precio (mínimo si vende, máximo si compra)?", tipo: "radio", op: [["si", "Sí"], ["no", "No, queda a criterio de quien recibe el poder"]], def: "si" },
        { id: "precio", et: "Precio", tipo: "dinero", si: ["precioModo", "si"] },
        { g: "El inmueble", ayuda: "Copie los datos tal como aparecen en el certificado de tradición y en la escritura." },
        { id: "inTipo", et: "Tipo de inmueble", tipo: "select", op: [["casa", "Casa"], ["apartamento", "Apartamento"], ["lote", "Lote"], ["local", "Local"], ["parqueadero", "Parqueadero"], ["otro", "Otro"]] },
        { id: "inTipoOtro", et: "¿Cuál?", si: ["inTipo", "otro"] },
        { id: "inDireccion", et: "Dirección completa", ph: "Ej.: Calle 50 # 50-50, apartamento 301" },
        { id: "inMunicipio", et: "Municipio" },
        { id: "inArea", et: "Área (metros cuadrados)", ph: "Ej.: 65,40" },
        { id: "inMatricula", et: "Matrícula inmobiliaria", ph: "Ej.: 001-123456" },
        { id: "inOrip", et: "Oficina de registro", ph: "Ej.: Medellín Sur" },
        { id: "inCatastral", et: "Cédula catastral o número predial", ayuda: "Aparece en la factura del impuesto predial." },
        { id: "inLinderos", et: "Linderos", tipo: "radio", op: [["titulo", "Constan en la escritura de adquisición"], ["transcribir", "Los voy a escribir"]], def: "titulo" },
        { id: "inLinderosTexto", et: "Linderos del inmueble", tipo: "area", si: ["inLinderos", "transcribir"] },
        { id: "inAdquirio", et: "¿Cómo lo adquirió el dueño actual?", tipo: "select", op: [["compraventa", "Compraventa"], ["sucesion", "Adjudicación en sucesión"], ["sociedad", "Adjudicación en liquidación de sociedad conyugal"], ["otro", "Otro título"]] },
        { id: "inAdquirioOtro", et: "¿Cuál título?", si: ["inAdquirio", "otro"] },
        { id: "inEscritura", et: "Número de la escritura", ph: "Ej.: 1.234" },
        { id: "inEscrituraFecha", et: "Fecha de la escritura", tipo: "fecha" },
        { id: "inNotaria", et: "Notaría", ph: "Ej.: Segunda" },
        { id: "inNotariaCiudad", et: "Ciudad de la notaría" },
        { id: "ph", et: "¿Es propiedad horizontal (edificio o conjunto)?", tipo: "radio", op: SI_NO, def: "no" },
        { id: "phNombre", et: "Nombre del edificio o conjunto", ph: "Ej.: Edificio Los Pinos", si: ["ph", "si"] },
        { id: "phEscritura", et: "Escritura del reglamento (número)", si: ["ph", "si"] },
        { id: "phFecha", et: "Fecha de esa escritura", tipo: "fecha", si: ["ph", "si"] },
        { id: "phNotaria", et: "Notaría de esa escritura", ph: "Ej.: Primera de Itagüí", si: ["ph", "si"] },
        { g: "Lo que podrá hacer" },
        { id: "recibePrecio", et: "¿Quien recibe el poder puede recibir el dinero?", tipo: "radio", op: [["si", "Sí"], ["no", "No, se me paga a mí o en mi cuenta"]], def: "no", si: ["opcion", "vender"] },
        { id: "financia", et: "¿La compra se paga con crédito, cesantías, ahorro o subsidio?", tipo: "radio", op: SI_NO, def: "no", si: ["opcion", "comprar"] },
        { id: "finTipo", et: "Con", tipo: "select", op: [["credito", "Crédito"], ["cesantias", "Cesantías"], ["ahorro", "Ahorro"], ["subsidio", "Subsidio"]], si: ["financia", "si"] },
        { id: "finEntidad", et: "Entidad", ph: "Ej.: Bancolombia, Fondo Nacional del Ahorro", si: ["financia", "si"] },
        { id: "hipoteca", et: "¿La compra lleva hipoteca?", tipo: "radio", op: SI_NO, def: "no", si: ["opcion", "comprar"] },
        { id: "hipGrado", et: "Grado", tipo: "select", op: [["primer", "Primer grado"], ["segundo", "Segundo grado"]], si: ["hipoteca", "si"] },
        { id: "hipAcreedor", et: "A favor de (nombre e identificación)", si: ["hipoteca", "si"] },
        { id: "hipConcepto", et: "Para garantizar", tipo: "select", op: [["el saldo del precio", "El saldo del precio"], ["el crédito otorgado para la compra", "El crédito otorgado para la compra"]], si: ["hipoteca", "si"] },
        { id: "hipEntidad", et: "¿El acreedor es una entidad financiera?", tipo: "radio", op: SI_NO, def: "si", si: ["hipoteca", "si"], ayuda: "Si es entidad financiera, la cuantía, el plazo y los intereses serán los que ella apruebe." },
        { id: "hipValor", et: "Valor de la hipoteca", tipo: "dinero", si: ["hipEntidad", "no"] },
        { id: "hipPlazo", et: "Plazo", ph: "Ej.: doce (12) meses", si: ["hipEntidad", "no"] },
        { id: "hipTasa", et: "Intereses", ph: "Ej.: el uno por ciento (1 %) mensual", si: ["hipEntidad", "no"] },
        { id: "sustituir", et: "¿Puede pasarle el poder a otra persona (sustituirlo)?", tipo: "radio", op: SI_NO, def: "no" },
        { g: "Vivienda familiar (Ley 258 de 1996)" },
        { id: "afectado", et: "¿El inmueble que se vende está afectado a vivienda familiar?", tipo: "radio", op: SI_NO, def: "no", si: ["opcion", "vender"], ayuda: "Lo dice el certificado de tradición. Si está afectado, el cónyuge o compañero(a) firma este poder." },
        { id: "poseeOtro", et: "¿Tiene otro inmueble afectado a vivienda familiar?", tipo: "radio", op: [["no posee", "No"], ["sí posee", "Sí"]], def: "no posee", si: ["opcion", "comprar"] },
        { id: "afectacionCompra", et: "El inmueble que compra", tipo: "select", elegir: 1, op: [["quedara", "Quedará afectado a vivienda familiar"], ["no_sometera", "No se someterá a afectación (de común acuerdo con el cónyuge)"], ["sin_sociedad", "No es susceptible: no tengo sociedad conyugal ni unión marital vigente"], ["porcentaje", "No es susceptible: se compra solo un porcentaje"]], si: ["opcion", "comprar"] },
        { id: "conyugeFirma", et: "¿El cónyuge o compañero(a) firma este poder?", tipo: "radio", op: [["si", "Sí, firma este poder"], ["no", "No, firmará la escritura"]], def: "si", si: ["afectacionCompra", "no_sometera"] },
        { id: "conyugeCalidad", et: "Quien firma con usted es su", tipo: "radio", op: [["conyuge", "Cónyuge"], ["companero", "Compañero(a) permanente"]], def: "conyuge", si: [["afectado", "si"], ["conyugeFirma", "si"]] }
      ],
      adicional: null
    },
    poder_vehiculo: {
      nombre: "Poder especial para vehículos", corto: "Poder para vehículos", precio: { auto: 20000, abogado: 60000 },
      desc: "Traspaso, vender, comprar o administrar un carro, moto o maquinaria.",
      consejos: ["Para trámites de tránsito el poder debe ir autenticado, y quien lo da y quien lo recibe deben estar inscritos en el RUNT. Se lo autenticamos en línea por $49.000."],
      roles: [{ id: "poderdante", et: "Quien da el poder (propietario)", min: 1, max: 3, p: {} },
        { id: "apoderado", et: "Quien recibe el poder", min: 1, max: 1, p: {} }],
      campos: VEHICULO.concat([
        { g: "Para qué es el poder" },
        { id: "opcion", et: "Objeto", tipo: "select", op: [["traspaso", "Solo hacer el traspaso"], ["vender", "Vender el vehículo"], ["comprar", "Comprar un vehículo"], ["administrar", "Administrar el vehículo"]] },
        { id: "trSentido", et: "El propietario", tipo: "select", op: [["vendio", "Vendió el vehículo"], ["compro", "Compró el vehículo"]], si: ["opcion", "traspaso"] },
        { id: "otraParte", et: "Nombre e identificación de la otra parte", si: ["opcion", "traspaso"] },
        { id: "comprador", et: "Comprador (en blanco: el que escoja el apoderado)", req: 0, si: ["opcion", "vender"] },
        { id: "precioMin", et: "Precio mínimo (opcional)", tipo: "dinero", req: 0, si: ["opcion", "vender"] },
        { id: "recibePrecio", et: "¿El apoderado recibe el dinero?", tipo: "radio", op: [["si", "Sí"], ["no", "No, se paga directo al propietario"]], def: "si", si: ["opcion", "vender"] },
        { id: "vendedorVeh", et: "Nombre e identificación del vendedor", si: ["opcion", "comprar"] },
        { id: "precioMax", et: "Precio máximo (opcional)", tipo: "dinero", req: 0, si: ["opcion", "comprar"] },
        { id: "abogado", et: "¿Puede darle poder a un abogado para comparendos y procesos?", tipo: "radio", op: SI_NO, def: "no", si: ["opcion", "administrar"] },
        { id: "puedeVender", et: "¿Puede vender el vehículo?", tipo: "radio", op: SI_NO, def: "no", si: ["opcion", "administrar"] },
        { id: "vigenciaFecha", et: "Vigente hasta (en blanco: indefinido)", tipo: "fecha", req: 0, si: ["opcion", "administrar"] },
        { id: "cuentas", et: "Rinde cuentas cada", tipo: "select", op: [["mes", "Mes"], ["trimestre", "Trimestre"]], si: ["opcion", "administrar"] },
        { id: "sustituir", et: "¿El apoderado puede pasar el poder a otra persona?", tipo: "radio", op: SI_NO, def: "no" }
      ]),
      adicional: "Facultades adicionales (opcional, bajo su responsabilidad)"
    }
  };

  // ---------- Utilidades ----------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function el(tag, attrs, hijos) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "texto") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (hijos || []).forEach(function (h) { if (h) e.appendChild(typeof h === "string" ? document.createTextNode(h) : h); });
    return e;
  }
  function pesos(n) { return "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function hoy() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  var contador = 0;
  function uid(p) { return (p || "c") + (++contador); }

  // ---------- Campos ----------
  // ---------- Municipios (lista del DANE) ----------
  var MUN = window.GA_MUNICIPIOS || [], REPETIDOS = {};
  function clave(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim(); }
  (function () { var c = {}; MUN.forEach(function (m) { c[m[0]] = (c[m[0]] || 0) + 1; }); Object.keys(c).forEach(function (k) { if (c[k] > 1) REPETIDOS[k] = 1; }); MUN.forEach(function (m) { m[2] = clave(m[0]); }); })();
  function etiquetaMun(m) { return m[0] === m[1] ? m[0] : m[0] + " (" + m[1] + ")"; }
  function valorMun(m) { return REPETIDOS[m[0]] ? m[0] + " (" + m[1] + ")" : m[0]; }
  function buscarMun(q) {
    q = clave(q); if (!q) return [];
    var a = [], b = [];
    MUN.forEach(function (m) { var i = m[2].indexOf(q); if (i === 0) a.push(m); else if (i > 0) b.push(m); });
    var orden = function (x, y) { return (x[1] === "Antioquia" ? 0 : 1) - (y[1] === "Antioquia" ? 0 : 1) || x[0].localeCompare(y[0], "es"); };
    return a.sort(orden).concat(b.sort(orden)).slice(0, 8);
  }
  function esMunicipio(def) { return !def.tipo && /municipio|ciudad$|^domicilio$|^expedida$/i.test(def.id); }
  function campo(def, ambito) {
    var id = uid("f"), tipo = def.tipo || (esMunicipio(def) ? "municipio" : "texto"), req = def.req !== 0;
    var envoltura = el("div", { class: "campo" + (tipo === "area" || tipo === "lista" || tipo === "checks" || tipo === "radio" ? " ancho" : ""), "data-campo": def.id });
    var etiqueta = el("label", { for: id, texto: def.et + (req ? "" : "") });
    if (!req) etiqueta.appendChild(el("span", { class: "opcional", texto: " (opcional)" }));
    var control;
    if (tipo === "select") {
      control = el("select", { id: id, name: def.id, required: req }, (def.elegir ? [el("option", { value: "", texto: "Elija…" })] : []).concat(def.op.map(function (o) { return el("option", { value: o[0], texto: o[1] }); })));
      if (def.def) control.value = def.def;
    } else if (tipo === "radio") {
      etiqueta = el("p", { class: "etiqueta", texto: def.et });
      control = el("div", { class: "opciones", role: "radiogroup" }, def.op.map(function (o, i) {
        var rid = id + "_" + i;
        return el("label", { class: "opcion", for: rid }, [el("input", { type: "radio", id: rid, name: id, value: o[0], checked: (def.def || def.op[0][0]) === o[0] }), el("span", { texto: o[1] })]);
      }));
    } else if (tipo === "checks") {
      etiqueta = el("p", { class: "etiqueta", texto: def.et });
      control = el("div", { class: "opciones" }, def.op.map(function (o, i) {
        var cid = id + "_" + i;
        var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
        return el("label", { class: "opcion", for: cid }, [el("input", { type: "checkbox", id: cid, value: v, checked: (def.def || []).indexOf(v) >= 0 }), el("span", { texto: t })]);
      }));
    } else if (tipo === "municipio") {
      var entrada = el("input", { id: id, name: def.id, type: "text", required: req, placeholder: "Escriba y elija de la lista", autocomplete: "off", "aria-autocomplete": "list" });
      var lista = el("ul", { class: "sugerencias", role: "listbox", hidden: true });
      var elegido = "";
      var mostrar = function () {
        var r = buscarMun(entrada.value); lista.innerHTML = "";
        r.forEach(function (m) {
          var li = el("li", { role: "option", texto: etiquetaMun(m) });
          li.addEventListener("mousedown", function (ev) { ev.preventDefault(); elegir(m); });
          lista.appendChild(li);
        });
        lista.hidden = !r.length;
      };
      var elegir = function (m) { elegido = valorMun(m); entrada.value = etiquetaMun(m); lista.hidden = true; envoltura.classList.remove("falta"); entrada.dispatchEvent(new Event("change", { bubbles: true })); };
      entrada.addEventListener("input", function () { elegido = ""; mostrar(); });
      entrada.addEventListener("focus", mostrar);
      entrada.addEventListener("keydown", function (ev) { if (ev.key === "Enter" && !lista.hidden && lista.firstChild) { ev.preventDefault(); lista.firstChild.dispatchEvent(new Event("mousedown")); } });
      entrada.addEventListener("blur", function () {
        setTimeout(function () {
          lista.hidden = true;
          if (!elegido && entrada.value.trim()) { var exactos = MUN.filter(function (m) { return m[2] === clave(entrada.value); }); if (exactos.length === 1) elegir(exactos[0]); }
        }, 150);
      });
      control = el("div", { class: "con-sugerencias" }, [entrada, lista]);
      envoltura._invalido = function () { return !!entrada.value.trim() && !elegido; };
      envoltura._leerMun = function () { return elegido; };
      if (!def.ayuda) def = Object.assign({}, def, { ayuda: "Escriba las primeras letras y elija el municipio de la lista." });
    } else if (tipo === "area" || tipo === "lista") {
      control = el("textarea", { id: id, name: def.id, rows: tipo === "lista" ? 4 : 3, required: req, placeholder: tipo === "lista" ? "Escriba uno por línea" : (def.ph || "") });
    } else {
      var t = { fecha: "date", hora: "time", numero: "number" }[tipo] || "text";
      control = el("input", { id: id, name: def.id, type: t, required: req, placeholder: def.ph || "", inputmode: tipo === "dinero" ? "numeric" : null, min: tipo === "numero" ? "0" : null, step: tipo === "numero" ? "any" : null, autocomplete: "off" });
      if (def.def) control.value = def.def;
      if (tipo === "dinero") control.addEventListener("input", function () {
        var d = control.value.replace(/\D/g, ""); control.value = d ? pesos(+d).slice(1) : "";
      });
    }
    envoltura.appendChild(etiqueta);
    envoltura.appendChild(control);
    if (def.ayuda) envoltura.appendChild(el("p", { class: "ayuda", texto: def.ayuda }));
    if (def.mayus && control.tagName === "INPUT") control.classList.add("mayus");
    envoltura._leer = function () {
      if (tipo === "municipio") return envoltura._leerMun();
      if (def.mayus) return control.value.trim().toUpperCase();
      if (tipo === "radio") { var r = envoltura.querySelector("input:checked"); return r ? r.value : ""; }
      if (tipo === "checks") return [].slice.call(envoltura.querySelectorAll("input:checked")).map(function (x) { return x.value; });
      if (tipo === "lista") return control.value.split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
      if (tipo === "dinero") return control.value.replace(/\D/g, "");
      return control.value.trim();
    };
    envoltura._def = def;
    return envoltura;
  }
  function condicionCumple(si, ambito) {
    if (!si) return true;
    if (Array.isArray(si[0])) return si.some(function (x) { return condicionCumple(x, ambito); });
    var otro = ambito.querySelector('[data-campo="' + si[0] + '"]');
    if (!otro || otro.hidden) return false;
    var v = otro._leer();
    if (si[1] === "<100") return Number(v || 100) < 100;
    return v === si[1];
  }
  function refrescar(ambito) {
    for (var i = 0; i < 3; i++) [].forEach.call(ambito.querySelectorAll("[data-campo]"), function (c) {
      var ver = condicionCumple(c._def.si, ambito);
      c.hidden = !ver;
      [].forEach.call(c.querySelectorAll("input,select,textarea"), function (x) { x.disabled = !ver; });
    });
    [].forEach.call(ambito.querySelectorAll("[data-rol]"), function (r) { r.hidden = !condicionCumple(r._si, ambito); });
  }

  // ---------- Personas ----------
  function persona(opc, rolEt, quitar, n) {
    var p = el("fieldset", { class: "persona" });
    p.appendChild(el("legend", { texto: "Persona " + (n || 1) }));
    var campos = [];
    if (opc.juridica) campos.push({ id: "juridica", et: "Es", tipo: "radio", op: [["no", "Persona natural"], ["si", "Empresa"]], def: "no" });
    campos.push({ id: "nombre", et: "Nombre completo o razón social", ph: "Como aparece en el documento", mayus: 1 });
    if (!opc.simple) {
      campos.push({ id: "tipoDoc", et: "Documento", tipo: "select", op: [["CC", "Cédula de ciudadanía"], ["CE", "Cédula de extranjería"], ["PPT", "Permiso por protección temporal"], ["PA", "Pasaporte"]], si: opc.juridica ? ["juridica", "no"] : null });
      campos.push({ id: "numero", et: "Número de documento o NIT" });
      campos.push({ id: "expedida", et: "Expedida en", req: 0, si: ["tipoDoc", "CC"] });
      campos.push({ id: "domicilio", et: "Municipio donde vive (domicilio)" });
      if (opc.civil) campos.push({ id: "estadoCivil", et: "Estado civil", tipo: "select", elegir: 1, op: [["soltero", "Soltero"], ["soltera", "Soltera"], ["casado con sociedad conyugal vigente", "Casado con sociedad conyugal vigente"], ["casada con sociedad conyugal vigente", "Casada con sociedad conyugal vigente"], ["casado con sociedad conyugal disuelta y liquidada", "Casado con sociedad conyugal disuelta y liquidada"], ["casada con sociedad conyugal disuelta y liquidada", "Casada con sociedad conyugal disuelta y liquidada"], ["soltero con unión marital de hecho", "Soltero con unión marital de hecho"], ["soltera con unión marital de hecho", "Soltera con unión marital de hecho"], ["divorciado", "Divorciado"], ["divorciada", "Divorciada"], ["viudo", "Viudo"], ["viuda", "Viuda"]] });
      if (opc.juridica) {
        campos.push({ id: "representante", et: "Representante legal", si: ["juridica", "si"], mayus: 1 });
        campos.push({ id: "repNumero", et: "Cédula del representante", si: ["juridica", "si"] });
        campos.push({ id: "camara", et: "Cámara de Comercio", ph: "Ej.: Aburrá Sur", si: ["juridica", "si"] });
      }
      if (opc.contacto) {
        var r = opc.contacto === 2 ? 1 : 0;
        campos.push({ id: "direccion", et: "Dirección", req: r }, { id: "telefono", et: "Teléfono", req: r }, { id: "correo", et: "Correo electrónico", req: r });
      }
    } else campos.push({ id: "numero", et: "Cédula" });
    var rejilla = el("div", { class: "rejilla" }, campos.map(function (c) { return campo(c); }));
    p.appendChild(rejilla);
    if (quitar) p.appendChild(el("button", { type: "button", class: "quitar", texto: "Quitar", onclick: function () { var g = p.parentNode; p.remove(); g._actualizar(); } }));
    p.addEventListener("change", function () { refrescar(p); });
    refrescar(p);
    p._leer = function () {
      var o = {};
      [].forEach.call(p.querySelectorAll("[data-campo]"), function (c) { if (!c.hidden) o[c._def.id] = c._leer(); });
      if (o.juridica === "si") { o.juridica = true; o.tipoDoc = "NIT"; } else delete o.juridica;
      return o;
    };
    return p;
  }
  function grupoRol(rol) {
    var g = el("div", { class: "rol", "data-rol": rol.id });
    g._si = rol.si;
    var cab = el("div", { class: "rol-cabeza" }, [el("h3", { texto: rol.et })]);
    var lista = el("div", { class: "rol-personas" });
    var boton = el("button", { type: "button", class: "boton boton-linea pequeno", texto: "+ Agregar otra persona" });
    lista._actualizar = function () { boton.hidden = lista.children.length >= rol.max; vacio.hidden = lista.children.length > 0; };
    var vacio = el("p", { class: "ayuda", texto: "No hay. Agréguelo si lo necesita." });
    boton.addEventListener("click", function () { lista.appendChild(persona(rol.p, rol.et, lista.children.length >= rol.min, lista.children.length + 1)); lista._actualizar(); });
    for (var i = 0; i < rol.min; i++) lista.appendChild(persona(rol.p, rol.et, false, i + 1));
    g.appendChild(cab); g.appendChild(vacio); g.appendChild(lista); g.appendChild(boton);
    lista._actualizar();
    g._leer = function () { return [].map.call(lista.children, function (p) { return p._leer(); }); };
    return g;
  }

  // ---------- Formulario ----------
  var actual = null;
  function abrir(tipo) {
    var d = DOCS[tipo]; actual = tipo;
    var cont = $("#formulario"); cont.innerHTML = "";
    cont.appendChild(el("p", { class: "ante", texto: "Paso 2 de 3 · Datos del documento" }));
    cont.appendChild(el("h2", { texto: d.nombre }));
    if (d.consejos) cont.appendChild(el("ul", { class: "consejos" }, d.consejos.map(function (c) { return el("li", { texto: c }); })));
    cont.appendChild(el("p", { class: "aviso-datos", html: "<b>Importante:</b> lo que escriba sale tal cual en el documento. Escriba nombres, números y direcciones completos y sin errores. Los nombres de las personas salen en MAYÚSCULA y los municipios se eligen de la lista." }));
    var form = el("form", { id: "doc-form", novalidate: true });
    var sec1 = el("section", { class: "bloque" }, [el("h3", { class: "bloque-titulo", texto: "Las partes" })]);
    d.roles.forEach(function (r) { sec1.appendChild(grupoRol(r)); });
    form.appendChild(sec1);
    var sec2 = el("section", { class: "bloque" }), rej = null;
    d.campos.forEach(function (c) {
      if (c.g) {
        sec2.appendChild(el("h3", { class: "bloque-titulo", texto: c.g }));
        if (c.ayuda) sec2.appendChild(el("p", { class: "ayuda", texto: c.ayuda }));
        rej = el("div", { class: "rejilla" }); sec2.appendChild(rej); return;
      }
      if (!rej) { rej = el("div", { class: "rejilla" }); sec2.appendChild(rej); }
      rej.appendChild(campo(c));
    });
    form.appendChild(sec2);
    var sec3 = el("section", { class: "bloque" }, [el("h3", { class: "bloque-titulo", texto: "Para terminar" })]);
    var rej3 = el("div", { class: "rejilla" });
    if (d.adicional) {
      var cAd = campo({ id: "_adicional", et: d.adicional, tipo: "area", req: 0, ayuda: "Escriba un acuerdo por línea. Sale tal cual lo escriba: revise ortografía, mayúsculas y números. Es de su responsabilidad." + (d.adicionalAyuda ? " " + d.adicionalAyuda : "") });
      var avisoMasc = el("p", { class: "error", hidden: true, texto: "En vivienda no se debe prohibir tener mascotas. Si quiere, marque arriba la opción de mascotas con normas de convivencia." });
      cAd.appendChild(avisoMasc);
      cAd.querySelector("textarea").addEventListener("input", function (e) { avisoMasc.hidden = !(actual === "arriendo_vivienda" && PROHIBE_MASCOTAS.test(e.target.value)); });
      rej3.appendChild(cAd);
    }
    rej3.appendChild(campo({ id: "_anexosLista", et: "Anexos que hacen parte del documento", tipo: "lista", req: 0, ayuda: "Ej.: Inventario del inmueble. Uno por línea." }));
    var archivos = el("div", { class: "campo ancho" }, [el("label", { for: "doc-archivos", texto: "Adjuntar anexos (PDF o foto, máximo 5 archivos y 5 MB en total)" }), el("input", { type: "file", id: "doc-archivos", multiple: true, accept: "application/pdf,image/jpeg,image/png" }), el("p", { class: "ayuda", texto: "Se los enviamos junto con su documento." })]);
    rej3.appendChild(archivos);
    rej3.appendChild(campo({ id: "_municipioFirma", et: "Municipio donde se firma" }));
    var f = campo({ id: "_fechaFirma", et: "Fecha de firma", tipo: "fecha" }); f.querySelector("input").value = hoy(); rej3.appendChild(f);
    sec3.appendChild(rej3);
    sec3.appendChild(el("h3", { class: "bloque-titulo", texto: "¿A dónde le enviamos el documento?" }));
    sec3.appendChild(el("div", { class: "rejilla" }, [campo({ id: "_nombre", et: "Su nombre" }), campo({ id: "_correo", et: "Correo electrónico", ph: "Aquí le llega el PDF" }), campo({ id: "_whatsapp", et: "WhatsApp", req: 0 })]));
    sec3.appendChild(el("h3", { class: "bloque-titulo", texto: "Elija cómo lo quiere" }));
    sec3.appendChild(el("div", { class: "niveles" }, [
      el("label", { class: "nivel" }, [el("input", { type: "radio", name: "nivel", value: "auto", checked: true }), el("b", { texto: "Automático · " + pesos(d.precio.auto) }), el("span", { texto: "Lo recibe en PDF apenas se apruebe el pago." })]),
      el("label", { class: "nivel" }, [el("input", { type: "radio", name: "nivel", value: "abogado" }), el("b", { texto: "Con revisión del abogado · " + pesos(d.precio.abogado) }), el("span", { texto: "El abogado lo revisa y se lo enviamos a más tardar el siguiente día hábil." })])
    ]));
    sec3.appendChild(el("label", { class: "acepto" }, [el("input", { type: "checkbox", id: "acepta", required: true }), el("span", { html: "<b>Entiendo y acepto:</b> Guzmán y Abogados es el puente para hacer este trámite; no garantiza que el trámite sea viable ni que el documento me sirva para lo que busco. Los datos que doy y lo que agrego son de mi responsabilidad. Si lo firmo o autentico en línea, la firma da fe de quién firma, no del contenido." })]));
    sec3.appendChild(el("label", { class: "acepto" }, [el("input", { type: "checkbox", id: "autoriza", required: true }), el("span", { html: "Autorizo el uso de mis datos y los de las demás personas del documento, que me autorizaron a darlos, solo para elaborar y enviar este documento, según la <a href=\"/politica-de-datos.html\" target=\"_blank\" rel=\"noopener\">política de tratamiento de datos</a>." })]));
    form.appendChild(sec3);
    form.appendChild(el("p", { class: "error", id: "doc-error", role: "alert", hidden: true }));
    form.appendChild(el("div", { class: "acciones" }, [el("button", { type: "submit", class: "boton boton-oro", id: "doc-enviar", texto: "Continuar al pago" }), el("button", { type: "button", class: "boton boton-linea", texto: "Elegir otro documento", onclick: volver })]));
    form.addEventListener("change", function () { refrescar(form); });
    form.addEventListener("submit", enviar);
    cont.appendChild(form);
    refrescar(form);
    $("#catalogo").hidden = true; cont.hidden = false; $("#pago").hidden = true;
    cont.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function volver() { $("#formulario").hidden = true; $("#pago").hidden = true; $("#catalogo").hidden = false; $("#catalogo").scrollIntoView({ behavior: "smooth" }); }

  function leerArchivos() {
    var files = [].slice.call(($("#doc-archivos") || {}).files || []).slice(0, 5), total = 0;
    return Promise.all(files.map(function (f) {
      total += f.size;
      return new Promise(function (ok, mal) {
        if (total > 5 * 1024 * 1024) return mal(new Error("Los anexos superan 5 MB en total."));
        var r = new FileReader();
        r.onload = function () { ok({ nombre: f.name, tipo: f.type, contenido: String(r.result).split(",")[1] }); };
        r.onerror = function () { mal(new Error("No se pudo leer " + f.name)); };
        r.readAsDataURL(f);
      });
    }));
  }
  function validar(form) {
    var faltan = [];
    [].forEach.call(form.querySelectorAll("[data-campo]"), function (c) {
      if (c.hidden || c.closest("[hidden]")) return;
      var v = c._leer(), req = c._def.req !== 0;
      var vacio = Array.isArray(v) ? !v.length : !v, malo = c._invalido && c._invalido();
      c.classList.toggle("falta", (req && vacio) || malo);
      if ((req && vacio) || malo) faltan.push(c);
    });
    var correo = form.querySelector('[data-campo="_correo"]');
    if (correo && correo._leer() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo._leer())) { correo.classList.add("falta"); faltan.push(correo); }
    return faltan;
  }
  function enviar(e) {
    e.preventDefault();
    var form = e.target, err = $("#doc-error"), boton = $("#doc-enviar"), d = DOCS[actual];
    err.hidden = true;
    var faltan = validar(form);
    if (faltan.length) { err.textContent = "Faltan datos o hay un dato por corregir. Los marcamos en rojo."; err.hidden = false; faltan[0].scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (!$("#acepta").checked || !$("#autoriza").checked) { err.textContent = "Para continuar, marque las dos casillas del final."; err.hidden = false; return; }
    var datos = { accion: "borrador", tipo: actual, nivel: (form.querySelector('input[name="nivel"]:checked') || {}).value || "auto", partes: {}, campos: {}, acepta: true, autorizaDatos: true };
    [].forEach.call(form.querySelectorAll("[data-rol]"), function (g) { if (!g.hidden) datos.partes[g.getAttribute("data-rol")] = g._leer(); });
    [].forEach.call(form.querySelectorAll(".bloque [data-campo]"), function (c) {
      if (c.hidden || c.closest(".persona")) return;
      var id = c._def.id, v = c._leer();
      if (id.charAt(0) !== "_") datos.campos[id] = v;
    });
    var val = function (id) { var c = form.querySelector('[data-campo="' + id + '"]'); return c ? c._leer() : ""; };
    datos.adicional = val("_adicional");
    datos.anexosLista = val("_anexosLista");
    datos.firma = { municipio: val("_municipioFirma"), fecha: val("_fechaFirma") };
    datos.contacto = { nombre: val("_nombre"), correo: val("_correo"), whatsapp: val("_whatsapp") };
    if (!API) { err.textContent = "El servicio en línea se está activando. Mientras tanto, escríbanos por WhatsApp al 320 563 9603."; err.hidden = false; return; }
    boton.disabled = true; boton.textContent = "Preparando su documento…";
    leerArchivos().then(function (anexos) {
      datos.anexos = anexos;
      return fetch(API, { method: "POST", body: JSON.stringify(datos) }).then(function (r) { return r.json(); });
    }).then(function (r) {
      if (!r.ok) throw new Error(r.error || "No se pudo preparar el documento.");
      var enlace = ENLACES[r.precio];
      try { localStorage.setItem("ga_doc", JSON.stringify({ codigo: r.codigo, precio: r.precio, documento: d.nombre, enlace: enlace, t: Date.now() })); } catch (x) {}
      mostrarPago(r, d, enlace);
    }).catch(function (x) {
      err.textContent = String(x.message || x).replace(/^Falta: /, "Falta: "); err.hidden = false;
    }).finally(function () { boton.disabled = false; boton.textContent = "Continuar al pago"; });
  }
  // Resumen de lo que el usuario escribió, para que lo revise antes de pagar
  function valorVisible(c) {
    var v = c._leer(); if (!v || (Array.isArray(v) && !v.length)) return "";
    var sc = c.querySelector("select"), mun = c.querySelector(".con-sugerencias input");
    if (sc) return sc.options[sc.selectedIndex].text;
    if (mun) return mun.value;
    if (c._def.tipo === "radio") { var r = c.querySelector("input:checked"); return r ? r.parentNode.textContent : String(v); }
    if (c._def.tipo === "checks") return [].map.call(c.querySelectorAll("input:checked"), function (x) { return x.parentNode.textContent; }).join("; ");
    if (c._def.tipo === "dinero") return pesos(v);
    if (c._def.tipo === "fecha" && /^\d{4}-\d{2}-\d{2}$/.test(v)) { var f = v.split("-"); return +f[2] + " de " + ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][+f[1] - 1] + " de " + f[0]; }
    return Array.isArray(v) ? v.join("; ") : String(v);
  }
  function resumenDatos() {
    var form = $("#doc-form"), filas = [];
    if (!form) return null;
    [].forEach.call(form.querySelectorAll("[data-rol]"), function (g) {
      if (g.hidden) return;
      var et = (g.querySelector(".rol-cabeza h3") || {}).textContent || "";
      [].forEach.call(g.querySelectorAll(".persona"), function (pe, i, todas) {
        var partes = [];
        [].forEach.call(pe.querySelectorAll("[data-campo]"), function (c) { if (c.hidden) return; var v = valorVisible(c); if (v) partes.push(c._def.et.replace(/ \(.*\)$/, "") + ": " + v); });
        filas.push([et + (todas.length > 1 ? " " + (i + 1) : ""), partes.join(" · ")]);
      });
    });
    [].forEach.call(form.querySelectorAll(".bloque [data-campo]"), function (c) {
      if (c.hidden || c.closest(".persona") || /^_(nombre|correo|whatsapp)$/.test(c._def.id)) return;
      var v = valorVisible(c); if (v) filas.push([c._def.et.replace(/ \(.*\)$/, ""), v]);
    });
    if (!filas.length) return null;
    return el("details", { class: "resumen", open: true }, [
      el("summary", { texto: "Revise sus datos antes de pagar" }),
      el("p", { class: "ayuda", texto: "Así quedarán en el documento. Si algo está mal, oprima «Corregir datos»." }),
      el("dl", {}, [].concat.apply([], filas.map(function (f) { return [el("dt", { texto: f[0] }), el("dd", { texto: f[1] })]; })))
    ]);
  }
  function mostrarPago(r, d, enlace) {
    var p = $("#pago"); p.innerHTML = "";
    p.appendChild(el("p", { class: "ante", texto: "Paso 3 de 3 · Pago" }));
    p.appendChild(el("h2", { texto: "Su documento está listo para pagar" }));
    p.appendChild(el("p", { html: d.nombre + " · código <b>" + r.codigo + "</b> · valor <b>" + pesos(r.precio) + "</b>" }));
    var res = resumenDatos(); if (res) p.appendChild(res);
    p.appendChild(el("p", { class: "aviso-datos", html: "<b>Anote su código: " + r.codigo + ".</b> Después de pagar, Wompi lo devuelve a nuestra página y el PDF se descarga solo; también le llega al correo. Si la página no se abre sola, el código le sirve para recibir su documento." }));
    p.appendChild(el("div", { class: "acciones" }, [
      enlace ? el("a", { class: "boton boton-oro", href: enlace, texto: "Pagar " + pesos(r.precio) }) : el("a", { class: "boton boton-oro", href: WA + encodeURIComponent("Hola, quiero pagar mi documento " + r.codigo + "."), texto: "Pagar por WhatsApp" }),
      el("button", { type: "button", class: "boton boton-linea", texto: "Corregir datos", onclick: function () { p.hidden = true; $("#formulario").hidden = false; } })
    ]));
    $("#formulario").hidden = true; p.hidden = false; p.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- Catálogo ----------
  function catalogo() {
    var lista = $("#lista-docs");
    Object.keys(DOCS).forEach(function (k) {
      var d = DOCS[k];
      lista.appendChild(el("li", { class: "tarjeta" }, [
        el("h3", { texto: d.corto }),
        el("p", { class: "precio", html: pesos(d.precio.auto) + " <span>con revisión del abogado " + pesos(d.precio.abogado) + "</span>" }),
        el("p", { texto: d.desc }),
        el("div", { class: "acciones-tarjeta" }, [el("button", { type: "button", class: "boton boton-oro", texto: "Hacerlo ahora", onclick: function () { abrir(k); history.replaceState(null, "", "#" + k); } })])
      ]));
    });
    var h = location.hash.slice(1); if (DOCS[h]) abrir(h);
  }
  document.addEventListener("DOMContentLoaded", catalogo);
})();
