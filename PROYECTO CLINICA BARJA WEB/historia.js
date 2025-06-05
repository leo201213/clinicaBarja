// Importar módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAj7c4X9CAadc0q9THAprpXvfeByP7q9OI",
    authDomain: "centro-medico-barja.firebaseapp.com",
    projectId: "centro-medico-barja",
    storageBucket: "centro-medico-barja.appspot.com",
    messagingSenderId: "191805304136",
    appId: "1:191805304136:web:2bb8d7aec2fc87f7b3977d"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Calcular edad automáticamente
document.getElementById("fechaNacimiento").addEventListener("change", function() {
    const fecha = new Date(this.value);
    const hoy = new Date();
    let edadTexto = "";

    let años = hoy.getFullYear() - fecha.getFullYear();
    let meses = hoy.getMonth() - fecha.getMonth();
    let días = hoy.getDate() - fecha.getDate();

    if (días < 0) {
        meses--;
        días += 30;
    }
    if (meses < 0) {
        años--;
        meses += 12;
    }

    if (años > 0) {
        edadTexto = `${años} año(s) y ${meses} mes(es)`;
    } else {
        edadTexto = `${meses} mes(es) y ${días} día(s)`;
    }

    document.getElementById("edad").value = edadTexto;
});

// Mostrar/ocultar campos del seguro
document.getElementById("seguro").addEventListener("change", function() {
    const grupoSeguro = document.getElementById("datosSeguro");
    grupoSeguro.style.display = this.checked ? "block" : "none";
});

// Guardar historia clínica
document.getElementById("formHistoriaClinica").addEventListener("submit", async function(e) {
    e.preventDefault();

    const datos = {
        paciente_nro: document.getElementById("pacienteNro").value.trim(),
        nombres: document.getElementById("nombres").value,
        apellidos: document.getElementById("apellidos").value,
        domicilio: document.getElementById("domicilio").value,
        sexo: document.getElementById("sexo").value,
        fecha_nacimiento: document.getElementById("fechaNacimiento").value,
        lugar_nacimiento: document.getElementById("lugarNacimiento").value,
        edad: document.getElementById("edad").value,
        peso: document.getElementById("peso").value,
        talla: document.getElementById("talla").value,
        antecedentes_obstetricos: document.getElementById("antecedentesObstetricos").value,
        antecedentes_patologicos: document.getElementById("antecedentesPatologicos").value,
        examen_fisico: document.getElementById("examenFisico").value,
        laboratorio: document.getElementById("laboratorio").value,
        diagnostico: document.getElementById("diagnostico").value,
        tratamiento: document.getElementById("tratamiento").value,
        telefono_referencia: document.getElementById("telefonoReferencia").value,
        seguro: document.getElementById("seguro").checked,
        codigo_asegurado: document.getElementById("codigoAsegurado").value,
        empresa_aseguradora: document.getElementById("empresaAseguradora").value,
    };

    try {
        const ref = doc(db, "historias_clinicas", datos.paciente_nro);
        const docSnap = await getDoc(ref);

        if (docSnap.exists()) {
            alert("Ya existe una historia clínica con ese número de paciente.");
        } else {
            await setDoc(ref, datos);
            alert("Historia clínica registrada con éxito.");
            document.getElementById("formHistoriaClinica").reset();
            document.getElementById("edad").value = "";
            document.getElementById("datosSeguro").style.display = "none";
        }
    } catch (error) {
        console.error("Error al guardar historia clínica:", error);
        alert("Ocurrió un error al guardar la historia clínica.");
    }
});
// Importar SheetJS desde CDN
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs";

// Evento al presionar el botón Importar
document.getElementById("btnImportar").addEventListener("click", async() => {
    const archivo = document.getElementById("archivoExcel").files[0];

    if (!archivo) {
        alert("Selecciona un archivo Excel primero.");
        return;
    }

    const lector = new FileReader();

    lector.onload = async(e) => {
        const datosBinarios = new Uint8Array(e.target.result);
        const libro = XLSX.read(datosBinarios, { type: "array" });
        const hoja = libro.Sheets[libro.SheetNames[0]];
        const pacientes = XLSX.utils.sheet_to_json(hoja);

        let contadorNuevos = 0;
        let contadorExistentes = 0;

        for (const paciente of pacientes) {
            const id = String(paciente.paciente_nro).trim();

            if (!id) continue; // Saltar si no hay número

            const ref = doc(db, "historias_clinicas", id);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                console.log(`Paciente ${id} ya existe. Omitido.`);
                contadorExistentes++;
                continue;
            }

            try {
                await setDoc(ref, paciente);
                console.log(`Paciente ${id} registrado con éxito.`);
                contadorNuevos++;
            } catch (error) {
                console.error(`Error al guardar paciente ${id}:`, error);
            }
        }

        alert(`Importación finalizada.\nNuevos: ${contadorNuevos}\nExistentes: ${contadorExistentes}`);
    };

    lector.readAsArrayBuffer(archivo);
});
import {
    collection,
    query,
    where,
    getDocs,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.getElementById("btnBuscar").addEventListener("click", async() => {
    const valor = document.getElementById("busquedaPaciente").value.trim().toLowerCase();
    const contenedor = document.getElementById("resultadoBusqueda");
    contenedor.innerHTML = "Buscando...";

    if (!valor) {
        contenedor.innerHTML = "<p>Introduce un número de paciente o apellido.</p>";
        return;
    }

    let resultados = [];

    // Intentamos buscar por número exacto
    const refDirecto = doc(db, "historias_clinicas", valor);
    const snapDirecto = await getDoc(refDirecto);
    if (snapDirecto.exists()) {
        resultados.push({ id: valor, ...snapDirecto.data() });
    } else {
        // Buscar por apellidos (búsqueda parcial en lowercase)
        const coleccion = collection(db, "historias_clinicas");
        const q = query(coleccion);
        const docs = await getDocs(q);

        docs.forEach(docSnap => {
            const data = docSnap.data();
            if (data.apellidos && data.apellidos.toLowerCase().includes(valor)) {
                resultados.push({ id: docSnap.id, ...data });
            }
        });
    }

    if (resultados.length === 0) {
        contenedor.innerHTML = "<p>No se encontró ningún paciente.</p>";
        return;
    }

    // Función para convertir número Excel a fecha JS
    function excelDateToJSDate(serial) {
        // Excel comienza en 1900-01-01, pero hay que restar 1 día por cómo se cuentan
        const utc_days = Math.floor(serial - 1);
        // Creamos la fecha en UTC para evitar ajustes por zona horaria local
        const fechaUTC = new Date(Date.UTC(1900, 0, 1 + utc_days));

        return fechaUTC;
    }
    // Función para formatear fecha como dd/mm/yyyy
    function formatearFecha(date) {
        const d = date.getDate().toString().padStart(2, "0");
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    }

    // Función para calcular edad (años y meses) desde fecha nacimiento
    function calcularEdad(fechaNacimiento) {
        const hoy = new Date();
        let años = hoy.getFullYear() - fechaNacimiento.getFullYear();
        let meses = hoy.getMonth() - fechaNacimiento.getMonth();
        let días = hoy.getDate() - fechaNacimiento.getDate();

        if (días < 0) {
            meses--;
            días += 30;
        }
        if (meses < 0) {
            años--;
            meses += 12;
        }

        if (años > 0) {
            return `${años} año(s) y ${meses} mes(es)`;
        } else {
            return `${meses} mes(es) y ${días} día(s)`;
        }
    }

    function parseFechaLocal(fechaStr) {
        const partes = fechaStr.split("-");
        if (partes.length !== 3) return null;
        const anio = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1; // Mes en base 0
        const dia = parseInt(partes[2], 10);
        return new Date(anio, mes, dia);
    }
    // Preparar resultados con fecha y edad corregidos
    const resultadosFormateados = resultados.map(p => {
        let fechaNacimientoRaw = p.fecha_nacimiento;

        let fechaNacimientoObj;

        // Detectar si es número (excel) o string ISO o dd/mm/yyyy
        if (typeof fechaNacimientoRaw === "number") {
            fechaNacimientoObj = excelDateToJSDate(fechaNacimientoRaw);
        } else if (typeof fechaNacimientoRaw === "string") {
            if (/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimientoRaw)) {
                // Si está en formato yyyy-mm-dd, crear fecha local
                fechaNacimientoObj = parseFechaLocal(fechaNacimientoRaw);
            } else {
                // Intentar crear Date directamente para otros formatos con hora
                fechaNacimientoObj = new Date(fechaNacimientoRaw);
                if (isNaN(fechaNacimientoObj)) {
                    fechaNacimientoObj = null;
                }
            }
        } else {
            fechaNacimientoObj = null;
        }

        // Formatear fecha legible o dejar el valor original si no válido
        let fechaFormateada = fechaNacimientoObj ? formatearFecha(fechaNacimientoObj) : fechaNacimientoRaw;

        // Calcular edad solo si tenemos fecha válida
        let edad = fechaNacimientoObj ? calcularEdad(fechaNacimientoObj) : (p.edad || "");

        return {
            ...p,
            fecha_nacimiento_formateada: fechaFormateada,
            edad_calculada: edad
        };
    });

    contenedor.innerHTML = resultadosFormateados.map(p => `
        <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
            <strong>Paciente N°:</strong> ${p.id}<br>
            <strong>Nombre:</strong> ${p.nombres} ${p.apellidos}<br>
            <strong>Fecha de Nacimiento:</strong> ${p.fecha_nacimiento_formateada}<br>
            <strong>Edad:</strong> ${p.edad_calculada}<br>
            <strong>Teléfono:</strong> ${p.telefono_referencia || "No registrado"}<br>
            <button onclick="eliminarPaciente('${p.id}')">🗑️ Eliminar</button>
            <button onclick='descargarPDF(${JSON.stringify(p)})'>📄 Descargar PDF</button>
        </div>
    `).join("");
});

// Función para eliminar paciente
window.eliminarPaciente = async(id) => {
    if (!confirm(`¿Estás seguro de eliminar al paciente N° ${id}? Esta acción no se puede deshacer.`)) return;

    try {
        await deleteDoc(doc(db, "historias_clinicas", id));
        alert(`Paciente N° ${id} eliminado con éxito.`);
        document.getElementById("btnBuscar").click(); // Volver a buscar
    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Hubo un error al eliminar el paciente.");
    }
};
// Función para descargar PDF con formato tipo tabla
window.descargarPDF = (datos) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // -----------------------------
    // Formatear fecha de nacimiento
    // -----------------------------
    let fechaNacimientoTexto = "";
    const fechaRaw = datos.fecha_nacimiento;

    // Convertir todo a string temporalmente
    const fechaStr = String(fechaRaw || "").trim();

    let fecha;

    if (!isNaN(fechaRaw) && Number(fechaRaw) > 10000) {
        // Es probable que sea formato Excel (días desde 1900)
        fecha = convertirFechaDesdeExcel(fechaRaw);
    } else if (fechaStr.includes('/')) {
        // Formato dd/mm/yyyy
        const [dia, mes, anio] = fechaStr.split('/').map(n => parseInt(n, 10));
        fecha = new Date(anio, mes - 1, dia);
    } else if (fechaStr.includes('-')) {
        // Formato yyyy-mm-dd
        const [anio, mes, dia] = fechaStr.split('-').map(n => parseInt(n, 10));
        fecha = new Date(anio, mes - 1, dia);
    } else {
        // Otro formato (último recurso)
        fecha = new Date(fechaStr);
    }

    if (fecha && !isNaN(fecha.getTime())) {
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        fechaNacimientoTexto = `${dia}/${mes}/${anio}`;
    } else {
        fechaNacimientoTexto = fechaStr;
    }

    // Función auxiliar
    function convertirFechaDesdeExcel(numero) {
        const fechaBase = new Date(1900, 0, 1);
        const dias = parseInt(numero, 10) - 2; // Ajuste por bug de Excel (1900 no fue bisiesto)
        fechaBase.setDate(fechaBase.getDate() + dias);
        return fechaBase;
    }
    // -----------------------------
    // -----------------------------
    // Calcular edad detallada
    // -----------------------------
    let edadTexto = datos.edad;
    if (!edadTexto && fecha && !isNaN(fecha.getTime())) {
        const hoy = new Date();
        const nacimiento = fecha;

        let años = hoy.getFullYear() - nacimiento.getFullYear();
        let meses = hoy.getMonth() - nacimiento.getMonth();
        let dias = hoy.getDate() - nacimiento.getDate();

        // Ajustar meses y días si es necesario
        if (dias < 0) {
            meses--;
            const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
            dias += mesAnterior.getDate();
        }

        if (meses < 0) {
            años--;
            meses += 12;
        }

        // Construir texto de edad
        if (años >= 1) {
            edadTexto = `${años} año${años > 1 ? 's' : ''} ${meses} mes${meses !== 1 ? 'es' : ''}`;
        } else if (meses >= 1) {
            edadTexto = `${meses} mes${meses !== 1 ? 'es' : ''} ${dias} día${dias !== 1 ? 's' : ''}`;
        } else {
            edadTexto = `${dias} día${dias !== 1 ? 's' : ''}`;
        }
    }
    // -----------------------------
    // Estructura de campos para la tabla
    // -----------------------------
    const campos = [
        ["Paciente Nº", datos.paciente_nro || ''],
        ["Nombres", datos.nombres || ''],
        ["Apellidos", datos.apellidos || ''],
        ["Domicilio", datos.domicilio || ''],
        ["Sexo", datos.sexo || ''],
        ["Fecha de Nacimiento", fechaNacimientoTexto],
        ["Lugar de Nacimiento", datos.lugar_nacimiento || ''],
        ["Edad", edadTexto || ''],
        ["Peso (kg)", datos.peso || ''],
        ["Talla (cm)", datos.talla || ''],
        ["Antecedentes Obstétricos", datos.antecedentes_obstetricos || ''],
        ["Antecedentes Patológicos", datos.antecedentes_patologicos || ''],
        ["Examen Físico", datos.examen_fisico || ''],
        ["Laboratorio", datos.laboratorio || ''],
        ["Diagnóstico", datos.diagnostico || ''],
        ["Tratamiento", datos.tratamiento || ''],
        ["Teléfono de Referencia", datos.telefono_referencia || ''],
        ["Tiene Seguro", datos.seguro ? "Sí" : "No"],
        ["Código de Asegurado", datos.codigo_asegurado || ''],
        ["Empresa Aseguradora", datos.empresa_aseguradora || ''],
    ];

    // -----------------------------
    // Título
    // -----------------------------
    doc.setFontSize(14);
    doc.text("Historia Clínica - Centro Médico Barja", 105, 15, null, null, "center");

    // -----------------------------
    // Tabla con autoTable
    // -----------------------------
    doc.autoTable({
        startY: 25,
        head: [
            ["Campo", "Valor"]
        ],
        body: campos,
        theme: 'grid',
        styles: {
            cellPadding: 3,
            fontSize: 10,
        },
        headStyles: {
            fillColor: [52, 152, 219], // Azul claro
            textColor: 255,
            halign: 'center'
        },
        bodyStyles: {
            valign: 'top'
        }
    });

    // -----------------------------
    // Descargar PDF
    // -----------------------------
    const nombreArchivo = `Historia_${datos.paciente_nro || 'sinNum'}_${datos.apellidos || 'sinApellidos'}.pdf`;
    doc.save(nombreArchivo);
};