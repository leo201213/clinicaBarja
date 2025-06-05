// Configuración Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAj7c4X9CAadc0q9THAprpXvfeByP7q9OI",
    authDomain: "centro-medico-barja.firebaseapp.com",
    projectId: "centro-medico-barja",
    storageBucket: "centro-medico-barja.appspot.com",
    messagingSenderId: "191805304136",
    appId: "1:191805304136:web:2bb8d7aec2fc87f7b3977d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/**
 * ✅ Convierte varios formatos a "DD/MM/YYYY" evitando desfase de día
 */
function formatearFechaADDMMAAAA(valor) {
    if (!valor) return '';
    let fecha;
    if (typeof valor === 'number') {
        const base = new Date(Date.UTC(1899, 11, 30));
        fecha = new Date(base.getTime() + valor * 86400000);
    } else if (valor.toDate) {
        fecha = valor.toDate();
    } else if (typeof valor === 'string') {
        const [y, m, d] = valor.split('-');
        fecha = new Date(`${y}-${m}-${d}T00:00:00`);
    }

    if (!fecha || isNaN(fecha.getTime())) return '';
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const anio = fecha.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
}

/**
 * Convierte "DD/MM/YYYY" a "YYYY-MM-DD"
 */
function convertirFechaAISO(fechaTexto) {
    const partes = fechaTexto.split('/');
    if (partes.length !== 3) return '';
    const [dia, mes, anio] = partes;
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

/**
 * Calcula edad detallada desde una fecha "YYYY-MM-DD"
 */
function calcularEdadDetallada(fechaISO) {
    const nac = new Date(fechaISO);
    if (isNaN(nac)) return '';
    const hoy = new Date();
    let anios = hoy.getFullYear() - nac.getFullYear();
    let meses = hoy.getMonth() - nac.getMonth();
    let dias = hoy.getDate() - nac.getDate();
    if (dias < 0) {
        meses--;
        dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    }
    if (meses < 0) {
        anios--;
        meses += 12;
    }

    if (anios > 0) return `${anios} año${anios > 1 ? 's' : ''} ${meses} mes${meses > 1 ? 'es' : ''}`;
    return `${meses} mes${meses !== 1 ? 'es' : ''} ${dias} día${dias !== 1 ? 's' : ''}`;
}

// Limpia campos
function limpiarDatosPaciente() {
    document.getElementById('nombres').value = '';
    document.getElementById('apellidos').value = '';
    document.getElementById('sexo').value = '';
    document.getElementById('fechaNacimiento').value = '';
    document.getElementById('pesoInicial').value = '';
    document.getElementById('tallaInicial').value = '';
    document.getElementById('antecedentesObstetricos').value = '';
    document.getElementById('antecedentesPatologicos').value = '';
    document.getElementById('edad').value = '';
}

function limpiarDatosExpediente() {
    document.getElementById('expedienteNro').value = '';
    document.getElementById('fechaActual').value = '';
    document.getElementById('pesoActual').value = '';
    document.getElementById('tallaActual').value = '';
    document.getElementById('edadActual').value = '';
    document.getElementById('patologicosActuales').value = '';
    document.getElementById('enfermedadActual').value = '';
    document.getElementById('examenFisico').value = '';
    document.getElementById('examenComplementario').value = '';
    document.getElementById('laboratorio').value = '';
    document.getElementById('diagnostico').value = '';
    document.getElementById('tratamiento').value = '';
    document.getElementById('medico').value = '';
}

// Carga datos del paciente desde Firestore
document.getElementById('nroPaciente').addEventListener('change', async() => {
    const nroPaciente = document.getElementById('nroPaciente').value.trim();

    if (!nroPaciente) {
        limpiarDatosPaciente();
        limpiarDatosExpediente();
        return;
    }

    try {
        const docSnap = await db.collection('historias_clinicas').doc(nroPaciente).get();

        if (!docSnap.exists) {
            alert("Paciente no encontrado.");
            limpiarDatosPaciente();
            limpiarDatosExpediente();
            return;
        }

        const data = docSnap.data();

        document.getElementById('nombres').value = data.nombres || '';
        document.getElementById('apellidos').value = data.apellidos || '';
        document.getElementById('sexo').value = data.sexo || '';

        // Formatear y mostrar fecha en DD/MM/YYYY
        const fechaFormateada = formatearFechaADDMMAAAA(data.fecha_nacimiento);
        document.getElementById('fechaNacimiento').value = fechaFormateada;

        // Calcular edad desde fecha ISO (YYYY-MM-DD)
        const fechaISO = convertirFechaAISO(fechaFormateada);
        const edad = calcularEdadDetallada(fechaISO);
        document.getElementById('edad').value = edad;

        document.getElementById('pesoInicial').value = data.peso_inicial || '';
        document.getElementById('tallaInicial').value = data.talla_inicial || '';
        document.getElementById('antecedentesObstetricos').value = data.antecedentes_obstetricos || '';
        document.getElementById('antecedentesPatologicos').value = data.antecedentes_patologicos || '';
        document.getElementById('diagnostico').value = data.diagnostico || '';
        document.getElementById('examenFisico').value = data.examen_fisico || '';

    } catch (error) {
        console.error("Error al obtener datos del paciente:", error);
        alert("Hubo un error al cargar los datos.");
    }
});

/**
 * Calcula la edad actual del paciente en el expediente, usando la fecha de nacimiento y la fecha seleccionada
 */
function calcularEdadEnExpediente() {
    const fechaNacimientoTexto = document.getElementById("fechaNacimiento").value;
    const fechaExpedienteTexto = document.getElementById("fechaActual").value;

    if (!fechaNacimientoTexto || !fechaExpedienteTexto) {
        document.getElementById("edadActual").value = "";
        return;
    }

    // Convertimos texto DD/MM/YYYY a YYYY-MM-DD si es necesario
    const fechaNacimientoISO = convertirFechaAISO(fechaNacimientoTexto);
    const fechaNacimiento = new Date(fechaNacimientoISO);
    const fechaExpediente = new Date(fechaExpedienteTexto);

    if (isNaN(fechaNacimiento.getTime()) || isNaN(fechaExpediente.getTime())) {
        document.getElementById("edadActual").value = "";
        return;
    }

    let anios = fechaExpediente.getFullYear() - fechaNacimiento.getFullYear();
    let meses = fechaExpediente.getMonth() - fechaNacimiento.getMonth();
    let dias = fechaExpediente.getDate() - fechaNacimiento.getDate();

    if (dias < 0) {
        meses--;
        const diasMesAnterior = new Date(fechaExpediente.getFullYear(), fechaExpediente.getMonth(), 0).getDate();
        dias += diasMesAnterior;
    }

    if (meses < 0) {
        anios--;
        meses += 12;
    }

    let edadTexto = "";

    if (anios >= 1) {
        edadTexto = `${anios} año${anios !== 1 ? "s" : ""} ${meses} mes${meses !== 1 ? "es" : ""}`;
    } else {
        edadTexto = `${meses} mes${meses !== 1 ? "es" : ""} ${dias} día${dias !== 1 ? "s" : ""}`;
    }

    document.getElementById("edadActual").value = edadTexto;
}
document.getElementById("fechaActual").addEventListener("change", calcularEdadEnExpediente);

//guardar expediente
document.getElementById('guardarExpediente').addEventListener('click', async() => {
    const nroPaciente = document.getElementById('nroPaciente').value.trim();
    const expedienteNro = document.getElementById('expedienteNro').value.trim();

    if (!nroPaciente || !expedienteNro) {
        alert("Ingrese el número de paciente y expediente.");
        return;
    }

    try {
        const docId = `${nroPaciente}_${expedienteNro}`;

        // Validar si ya existe en la colección principal
        const existente = await db.collection('expedientes').doc(docId).get();
        if (existente.exists) {
            alert("Ya existe un expediente con ese número para este paciente.");
            return;
        }
        // Calcular edad actual antes de guardar
        const edadActualCalculada = calcularEdadDetallada(document.getElementById('fechaNacimiento').value);
        document.getElementById('edadActual').value = edadActualCalculada;
        // Crear el objeto del expediente
        const expediente = {
            nroPaciente,
            expedienteNro,
            fechaActual: document.getElementById('fechaActual').value,
            pesoActual: document.getElementById('pesoActual').value,
            tallaActual: document.getElementById('tallaActual').value,
            edadActual: document.getElementById('edadActual').value,
            patologicosActuales: document.getElementById('patologicosActuales').value,
            enfermedadActual: document.getElementById('enfermedadActual').value,
            examenFisico: document.getElementById('examenFisico').value,
            examenComplementario: document.getElementById('examenComplementario').value,
            laboratorio: document.getElementById('laboratorio').value,
            diagnostico: document.getElementById('diagnostico').value,
            tratamiento: document.getElementById('tratamiento').value,
            medico: document.getElementById('medico').value,
            fechaGuardado: new Date().toISOString()
        };

        // 1️⃣ Guardar en colección principal
        await db.collection('expedientes').doc(docId).set(expediente);

        // 2️⃣ Guardar en documento fijo pacientes/expedientes como subcampo
        await db.collection('pacientes').doc('expedientes').set({
            [docId]: expediente
        }, { merge: true }); // merge para no sobrescribir otros expedientes existentes

        alert("Expediente guardado correctamente.");
        limpiarDatosExpediente();

    } catch (error) {
        console.error("Error al guardar expediente:", error);
        alert("Error al guardar expediente.");
    }
});

async function obtenerRolDesdeSesionActiva() {
    try {
        const doc = await db.collection("sesion_activa").doc("actual").get();
        if (doc.exists) {
            const data = doc.data();
            return data.rol; // debería ser "administrador" o "secretaria"
        } else {
            console.warn("No se encontró el documento sesion_activa/actual");
            return null;
        }
    } catch (error) {
        console.error("Error al obtener rol desde sesion_activa:", error);
        return null;
    }
}