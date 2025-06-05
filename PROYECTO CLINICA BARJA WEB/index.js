// login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

const form = document.getElementById("form-login");
const mensajeError = document.getElementById("mensaje-error");

form.addEventListener("submit", async(e) => {
    e.preventDefault();
    mensajeError.textContent = ""; // limpiar mensaje de error

    const usuarioIngresado = document.getElementById("usuario").value.trim();
    const claveIngresada = document.getElementById("clave").value.trim();

    if (!usuarioIngresado || !claveIngresada) {
        mensajeError.textContent = "Por favor, complete ambos campos.";
        return;
    }

    try {
        // Buscar el documento del usuario ingresado en la colección "usuarios"
        const docRef = doc(db, "usuarios", usuarioIngresado);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            mensajeError.textContent = "Usuario no encontrado";
            return;
        }

        const datosUsuario = docSnap.data();

        if (datosUsuario.clave !== claveIngresada) {
            mensajeError.textContent = "Contraseña incorrecta";
            return;
        }

        // Login exitoso: guardar sesión activa en Firestore
        await setDoc(doc(db, "sesion_activa", "actual"), {
            usuario: usuarioIngresado,
            rol: datosUsuario.rol
        });

        // Redirigir al panel principal
        window.location.href = "panel.html";

    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        mensajeError.textContent = "Error al iniciar sesión. Intente nuevamente.";
    }
});


//actual firestore reglas
/*
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // This rule allows anyone with your Firestore database reference to view, edit,
    // and delete all data in your Firestore database. It is useful for getting
    // started, but it is configured to expire after 30 days because it
    // leaves your app open to attackers. At that time, all client
    // requests to your Firestore database will be denied.
    //
    // Make sure to write security rules for your app before that time, or else
    // all client requests to your Firestore database will be denied until you Update
    // your rules
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2030, 6, 21);
    }
  }
}
 */