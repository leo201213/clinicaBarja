// panel.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAj7c4X9CAadc0q9THAprpXvfeByP7q9OI",
    authDomain: "centro-medico-barja.firebaseapp.com",
    projectId: "centro-medico-barja",
    storageBucket: "centro-medico-barja.firebasestorage.app",
    messagingSenderId: "191805304136",
    appId: "1:191805304136:web:2bb8d7aec2fc87f7b3977d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const nombreSpan = document.getElementById("usuario-nombre");
const rolSpan = document.getElementById("usuario-rol");
const seccionAdmin = document.getElementById("seccion-admin");
const btnCerrarSesion = document.getElementById("cerrar-sesion");

// Función para cargar datos de la sesión activa
async function cargarSesion() {
    try {
        const sesionRef = doc(db, "sesion_activa", "actual");
        const sesionSnap = await getDoc(sesionRef);

        if (!sesionSnap.exists()) {
            alert("No hay sesión activa. Por favor, inicia sesión.");
            window.location.href = "index.html";
            return;
        }

        const datosSesion = sesionSnap.data();

        nombreSpan.textContent = datosSesion.usuario;
        rolSpan.textContent = datosSesion.rol;

        if (datosSesion.rol === "administrador") {
            seccionAdmin.style.display = "block";
        } else {
            seccionAdmin.style.display = "none";
        }
    } catch (error) {
        console.error("Error al cargar sesión:", error);
        alert("Error al cargar sesión. Intenta iniciar sesión nuevamente.");
        window.location.href = "index.html";
    }
}

// Función para cerrar sesión (elimina el documento 'sesion_activa/actual')
async function cerrarSesion() {
    try {
        await deleteDoc(doc(db, "sesion_activa", "actual"));
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        alert("Error al cerrar sesión, intenta nuevamente.");
    }
}

btnCerrarSesion.addEventListener("click", cerrarSesion);

// Cargar la sesión al cargar la página
cargarSesion();