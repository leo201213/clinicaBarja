// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAj7c4X9CAadc0q9THAprpXvfeByP7q9OI",
    authDomain: "centro-medico-barja.firebaseapp.com",
    projectId: "centro-medico-barja",
    storageBucket: "centro-medico-barja.appspot.com",
    messagingSenderId: "191805304136",
    appId: "1:191805304136:web:2bb8d7aec2fc87f7b3977d",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Convierte fecha tipo Date a DD/MM/YYYY
function formatearFecha(fecha) {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

// Calcula edad detallada
function calcularEdadDetallada(fechaNacimiento) {
    const hoy = new Date();
    let anios = hoy.getFullYear() - fechaNacimiento.getFullYear();
    let meses = hoy.getMonth() - fechaNacimiento.getMonth();
    let dias = hoy.getDate() - fechaNacimiento.getDate();

    if (dias < 0) {
        meses--;
        const diasMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
        dias += diasMesAnterior;
    }

    if (meses < 0) {
        anios--;
        meses += 12;
    }

    if (anios > 0) return `${anios} año${anios > 1 ? 's' : ''} ${meses} mes${meses !== 1 ? 'es' : ''}`;
    if (meses > 0) return `${meses} mes${meses !== 1 ? 'es' : ''} ${dias} día${dias !== 1 ? 's' : ''}`;
    return `${dias} día${dias !== 1 ? 's' : ''}`;
}

// Buscar al hacer clic
document.getElementById("buscarBtn").addEventListener("click", async() => {
    const texto = document.getElementById("busqueda").value.trim().toLowerCase();
    const resultadosDiv = document.getElementById("resultados");
    resultadosDiv.innerHTML = "";

    if (!texto) return alert("Ingrese un número de paciente o apellido.");

    try {
        const snapshot = await db.collection("expedientes").get();
        const coincidencias = [];

        for (const doc of snapshot.docs) {
            const exp = doc.data();
            const nroPaciente = (exp.nroPaciente || "").toString().toLowerCase();
            const expedienteNro = (exp.expedienteNro || "").toString().toLowerCase();

            if (nroPaciente.includes(texto) || expedienteNro.includes(texto)) {
                coincidencias.push({ id: doc.id, ...exp });
            }
        }

        if (coincidencias.length === 0) {
            resultadosDiv.innerHTML = "<p>No se encontraron coincidencias.</p>";
            return;
        }

        for (const exp of coincidencias) {
            const pacienteDoc = await db.collection("historias_clinicas").doc(exp.nroPaciente).get();
            const paciente = pacienteDoc.exists ? pacienteDoc.data() : {};

            const div = document.createElement("div");
            div.classList.add("resultado-expediente");
            div.innerHTML = `
                <strong>Paciente:</strong> ${exp.nroPaciente} - ${paciente.apellidos || ""} ${paciente.nombres || ""}<br>
                <strong>Expediente Nro:</strong> ${exp.expedienteNro}<br>
                <strong>Fecha:</strong> ${exp.fechaActual || ""}<br>
                <button class="verDetalleBtn" data-id="${exp.id}">Ver Antecedente</button>
            `;
            resultadosDiv.appendChild(div);
        }

        document.querySelectorAll(".verDetalleBtn").forEach((btn) => {
            btn.addEventListener("click", async(e) => {
                const docId = e.target.getAttribute("data-id");
                const expedienteDoc = await db.collection("expedientes").doc(docId).get();
                const exp = expedienteDoc.data();

                const pacienteDoc = await db.collection("historias_clinicas").doc(exp.nroPaciente).get();
                const paciente = pacienteDoc.exists ? pacienteDoc.data() : {};

                idAntecedenteActual = docId; // Asignamos ID global para eliminar luego

                mostrarDetalle({...exp, ...paciente });
            });
        });

    } catch (error) {
        console.error("Error en búsqueda:", error);
        alert("Error al buscar antecedentes.");
    }
});

// Mostrar todos los datos detallados
function mostrarDetalle(data) {
    let fechaNac = null;

    // 1. Si fecha_nacimiento viene como Timestamp de Firestore (formato oficial)
    if (data.fecha_nacimiento && typeof data.fecha_nacimiento === 'object') {
        if (typeof data.fecha_nacimiento.toDate === 'function') {
            // Timestamp oficial de Firebase
            fechaNac = data.fecha_nacimiento.toDate();
        } else if (data.fecha_nacimiento.seconds) {
            // Objeto con segundos (Firestore exportado)
            fechaNac = new Date(data.fecha_nacimiento.seconds * 1000);
        }
    }

    // 2. Si viene como string "YYYY-MM-DD"
    if (!fechaNac && typeof data.fecha_nacimiento === 'string') {
        const partes = data.fecha_nacimiento.split("-");
        if (partes.length === 3) {
            const anio = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1; // Mes base 0
            const dia = parseInt(partes[2], 10);
            if (!isNaN(anio) && !isNaN(mes) && !isNaN(dia)) {
                fechaNac = new Date(anio, mes, dia);
            }
        }
    }

    // 3. Si viene como número
    if (!fechaNac && typeof data.fecha_nacimiento === 'number') {
        const valor = data.fecha_nacimiento;
        if (valor > 0 && valor < 60000) {
            // Asumimos que es una fecha tipo Excel (días desde 1900-01-01)
            const base = new Date(1900, 0, 1);
            base.setDate(base.getDate() + valor - 2); // Restamos 2 por el desfase de Excel
            fechaNac = base;
        } else if (valor < 1e11) {
            // Asumimos que es timestamp en segundos
            fechaNac = new Date(valor * 1000);
        } else {
            // Asumimos que ya es milisegundos
            fechaNac = new Date(valor);
        }
    }

    // Validación final: si es inválida, anulamos
    if (!fechaNac || isNaN(fechaNac.getTime())) {
        fechaNac = null;
    }

    // === Formatear fecha y calcular edad ===
    const fechaFormateada = fechaNac ? formatearFecha(fechaNac) : '';
    const edad = fechaNac ? calcularEdadDetallada(fechaNac) : '';

    // Guardamos para exportar
    data.fechaFormateada = fechaFormateada;
    data.edadCalculada = edad;

    // Mostrar en pantalla los datos
    const contenedor = document.getElementById("detalleContenido");
    contenedor.innerHTML = `
      <table>
        <tr><td><strong>Paciente:</strong></td><td>${data.nroPaciente}</td></tr>
        <tr><td><strong>Expediente Nro:</strong></td><td>${data.expedienteNro || ""}</td></tr>
        <tr><td><strong>Nombres:</strong></td><td>${data.nombres || ""}</td></tr>
        <tr><td><strong>Apellidos:</strong></td><td>${data.apellidos || ""}</td></tr>
        <tr><td><strong>Sexo:</strong></td><td>${data.sexo || ""}</td></tr>
        <tr><td><strong>Fecha Nacimiento:</strong></td><td>${fechaFormateada}</td></tr>
        <tr><td><strong>Edad:</strong></td><td>${edad}</td></tr>
        <tr><td><strong>Fecha Actual (Expediente):</strong></td><td>${data.fechaActual || ""}</td></tr>
        <tr><td><strong>Peso:</strong></td><td>${data.pesoActual}</td></tr>
        <tr><td><strong>Talla:</strong></td><td>${data.tallaActual}</td></tr>
        <tr><td><strong>Patológicos:</strong></td><td>${data.patologicosActuales}</td></tr>
        <tr><td><strong>Enfermedad Actual:</strong></td><td>${data.enfermedadActual}</td></tr>
        <tr><td><strong>Examen Físico:</strong></td><td>${data.examenFisico}</td></tr>
        <tr><td><strong>Complementarios:</strong></td><td>${data.examenComplementario}</td></tr>
        <tr><td><strong>Laboratorio:</strong></td><td>${data.laboratorio}</td></tr>
        <tr><td><strong>Diagnóstico:</strong></td><td>${data.diagnostico}</td></tr>
        <tr><td><strong>Tratamiento:</strong></td><td>${data.tratamiento}</td></tr>
        <tr><td><strong>Médico:</strong></td><td>${data.medico}</td></tr>
      </table>
    `;

    document.getElementById("detalleAntecedente").style.display = "block";

    // Botón para exportar PDF
    document.getElementById("descargarPDF").onclick = () => exportarPDF(data);
}

function formatearFecha(fecha) {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}
// Referencia global al ID actual del antecedente mostrado
let idAntecedenteActual = "";

// Esta función se llama cuando se muestra un antecedente
function mostrarDetalleAntecedente(antecedente, id) {
    idAntecedenteActual = id; // Guardamos el ID para poder eliminarlo
    const detalle = document.getElementById('detalleContenido');
    detalle.innerHTML = `
        <div><strong>Nombre:</strong> ${antecedente.nombre}</div>
        <div><strong>Código:</strong> ${antecedente.codigo}</div>
        <div><strong>Fecha:</strong> ${antecedente.fecha}</div>
        <div><strong>Descripción:</strong> ${antecedente.descripcion}</div>
    `;
    document.getElementById('detalleAntecedente').style.display = 'block';
}

// Escuchar clic en botón de eliminar
document.getElementById("eliminarAntecedente").addEventListener("click", async() => {
    if (!idAntecedenteActual) return alert("No hay antecedente seleccionado.");

    const confirmacion = confirm("¿Estás seguro de que deseas eliminar este antecedente?");
    if (!confirmacion) return;

    try {
        // Cambia aquí la colección si es necesario
        await db.collection("expedientes").doc(idAntecedenteActual).delete();

        alert("Antecedente eliminado correctamente.");
        document.getElementById("detalleAntecedente").style.display = "none";

        // Opcional: limpiar resultados
        document.getElementById("resultados").innerHTML = "";

        // Opcional: hacer una nueva búsqueda si quieres mantener el texto de búsqueda
        const textoBusqueda = document.getElementById("busqueda").value.trim();
        if (textoBusqueda) {
            document.getElementById("buscarBtn").click();
        }

    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Ocurrió un error al intentar eliminar el antecedente.");
    }
});
// Exportar PDF con los datos
function exportarPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(16);
    doc.text("Centro Médico Barja", 105, 15, { align: "center" });

    doc.setFontSize(13);
    doc.text("Detalle del Antecedente Médico", 105, 25, { align: "center" });

    // Estructura de datos como tabla [ [label, valor], ... ]
    const campos = [
        ["Nro Paciente", data.nroPaciente || ""],
        ["Expediente Nro", data.expedienteNro || ""],
        ["Fecha del Expediente", data.fechaActual || ""],
        ["Nombres", data.nombres || ""],
        ["Apellidos", data.apellidos || ""],
        ["Sexo", data.sexo || ""],
        ["Fecha Nacimiento", data.fechaFormateada || ""],
        ["Edad", data.edadCalculada || ""],
        ["Peso", data.pesoActual || ""],
        ["Talla", data.tallaActual || ""],
        ["Patológicos", data.patologicosActuales || ""],
        ["Enfermedad Actual", data.enfermedadActual || ""],
        ["Examen Físico", data.examenFisico || ""],
        ["Complementarios", data.examenComplementario || ""],
        ["Laboratorio", data.laboratorio || ""],
        ["Diagnóstico", data.diagnostico || ""],
        ["Tratamiento", data.tratamiento || ""],
        ["Médico", data.medico || ""],
    ];

    // Crear tabla con autoTable
    doc.autoTable({
        startY: 35,
        head: [
            ["Campo", "Valor"]
        ],
        body: campos,
        theme: 'grid', // puedes usar también 'striped' o 'plain'
        styles: {
            fontSize: 11,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [0, 102, 204],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 120 }
        }
    });

    // Guardar con nombre personalizado
    doc.save(`Antecedente_${data.nroPaciente}_${data.expedienteNro}.pdf`);
}