import {
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    FacebookAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    signOut
} from "firebase/auth";

import { auth, provider } from "../firebase/firebaseConfig";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import loadingImg from "../assets/login.jpg";
import huellaImg  from "../assets/huella.png";
import lupaImg    from "../assets/lupa.png";

// ── Detección de errores tipográficos en dominios de email ──
const TYPOS_DOMINIO = {
    'gmial.com': 'gmail.com',  'gmai.com': 'gmail.com',   'gmail.co': 'gmail.com',
    'gmail.con': 'gmail.com',  'gmail.om': 'gmail.com',   'gmail.comm': 'gmail.com',
    'gmaill.com': 'gmail.com', 'gmal.com': 'gmail.com',   'gmailcom': 'gmail.com',
    'hotmal.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'hotmail.co': 'hotmail.com',
    'hotmail.con': 'hotmail.com', 'hotmail.comm': 'hotmail.com', 'homail.com': 'hotmail.com',
    'hotmaill.com': 'hotmail.com', 'hotmailcom': 'hotmail.com',
    'outlok.com': 'outlook.com', 'outook.com': 'outlook.com', 'outlook.co': 'outlook.com',
    'outloook.com': 'outlook.com', 'outlookcom': 'outlook.com', 'outllook.com': 'outlook.com',
    'yaho.com': 'yahoo.com',   'yahoo.co': 'yahoo.com',   'yahoo.con': 'yahoo.com',
    'yahooo.com': 'yahoo.com', 'yhoo.com': 'yahoo.com',   'yhaoo.com': 'yahoo.com',
    'iclod.com': 'icloud.com', 'icloud.co': 'icloud.com', 'icoud.com': 'icloud.com',
    'protonmal.com': 'protonmail.com', 'protonmail.co': 'protonmail.com',
}


const FLOATERS_CSS = `
  @keyframes floatUD {
    0%   { transform:translateY(0px) rotate(var(--r,0deg)) scale(1); }
    25%  { transform:translateY(-32px) rotate(calc(var(--r,0deg)+8deg)) scale(1.05); }
    50%  { transform:translateY(-18px) rotate(calc(var(--r,0deg)-5deg)) scale(1.02); }
    75%  { transform:translateY(-26px) rotate(calc(var(--r,0deg)+4deg)) scale(1.04); }
    100% { transform:translateY(0px) rotate(var(--r,0deg)) scale(1); }
  }
  @keyframes floatDiag {
    0%   { transform:translate(0,0) rotate(var(--r,0deg)); }
    20%  { transform:translate(22px,-36px) rotate(calc(var(--r,0deg)+10deg)); }
    40%  { transform:translate(-8px,-22px) rotate(calc(var(--r,0deg)-7deg)); }
    60%  { transform:translate(16px,-40px) rotate(calc(var(--r,0deg)+5deg)); }
    80%  { transform:translate(-12px,-18px) rotate(calc(var(--r,0deg)-4deg)); }
    100% { transform:translate(0,0) rotate(var(--r,0deg)); }
  }
  @keyframes floatSway {
    0%   { transform:translateX(0) translateY(0) rotate(var(--r,0deg)); }
    20%  { transform:translateX(26px) translateY(-22px) rotate(calc(var(--r,0deg)+7deg)); }
    40%  { transform:translateX(8px) translateY(-38px) rotate(calc(var(--r,0deg)-6deg)); }
    60%  { transform:translateX(-20px) translateY(-28px) rotate(calc(var(--r,0deg)+4deg)); }
    80%  { transform:translateX(-10px) translateY(-10px) rotate(calc(var(--r,0deg)-3deg)); }
    100% { transform:translateX(0) translateY(0) rotate(var(--r,0deg)); }
  }
  @keyframes floatGlow {
    0%   { transform:translateY(0) scale(1) rotate(var(--r,0deg));
           opacity:var(--o,0.25); filter:invert(1) brightness(2.5); }
    30%  { transform:translateY(-28px) scale(1.2) rotate(calc(var(--r,0deg)+9deg));
           opacity:calc(var(--o,0.25)*2.8);
           filter:invert(1) brightness(5) drop-shadow(0 0 14px rgba(237,165,31,1)); }
    50%  { transform:translateY(-24px) scale(1.18) rotate(calc(var(--r,0deg)+6deg));
           opacity:calc(var(--o,0.25)*2.5);
           filter:invert(1) brightness(4.5) drop-shadow(0 0 10px rgba(237,165,31,.85)); }
    70%  { transform:translateY(-32px) scale(1.22) rotate(calc(var(--r,0deg)+11deg));
           opacity:calc(var(--o,0.25)*3);
           filter:invert(1) brightness(5.5) drop-shadow(0 0 16px rgba(237,165,31,1)); }
    100% { transform:translateY(0) scale(1) rotate(var(--r,0deg));
           opacity:var(--o,0.25); filter:invert(1) brightness(2.5); }
  }
`

// ── ELEMENTOS FLOTANTES — dispersos, irregulares, muchos ─────────────
const FLOATERS = [
  // ─ HUELLAS grandes (62-82px) ─ posiciones muy variadas ─
  { t:"H", l:2,  top:5,  s:74, o:0.26, d:0,   dr:7,  r:12,  a:"U" },
  { t:"H", l:91, top:3,  s:68, o:0.25, d:3.2, dr:8,  r:-17, a:"D" },
  { t:"H", l:7,  top:38, s:80, o:0.25, d:1.5, dr:7,  r:22,  a:"S" },
  { t:"H", l:86, top:31, s:72, o:0.24, d:5.8, dr:9,  r:-9,  a:"G" },
  { t:"H", l:3,  top:67, s:76, o:0.25, d:2.3, dr:7,  r:16,  a:"U" },
  { t:"H", l:89, top:61, s:68, o:0.24, d:6.5, dr:8,  r:-24, a:"D" },
  { t:"H", l:5,  top:89, s:74, o:0.25, d:0.7, dr:8,  r:7,   a:"S" },
  { t:"H", l:84, top:88, s:70, o:0.24, d:4.1, dr:7,  r:-13, a:"G" },
  { t:"H", l:46, top:1,  s:66, o:0.23, d:8.5, dr:9,  r:35,  a:"U" },
  { t:"H", l:14, top:52, s:78, o:0.24, d:2.8, dr:7,  r:28,  a:"D" },
  { t:"H", l:77, top:55, s:70, o:0.23, d:7.2, dr:8,  r:-19, a:"S" },
  { t:"H", l:54, top:94, s:72, o:0.23, d:5,   dr:9,  r:-38, a:"G" },
  // ─ HUELLAS medianas (44-58px) ─ zona central dispersa ─
  { t:"H", l:21, top:9,  s:52, o:0.21, d:2.5, dr:8,  r:30,  a:"D" },
  { t:"H", l:67, top:12, s:50, o:0.20, d:7.3, dr:7,  r:-19, a:"U" },
  { t:"H", l:34, top:27, s:56, o:0.21, d:4.2, dr:9,  r:14,  a:"G" },
  { t:"H", l:74, top:24, s:48, o:0.20, d:1.1, dr:8,  r:-33, a:"S" },
  { t:"H", l:18, top:44, s:54, o:0.21, d:9.1, dr:7,  r:8,   a:"U" },
  { t:"H", l:61, top:49, s:50, o:0.20, d:3.7, dr:8,  r:-11, a:"D" },
  { t:"H", l:38, top:63, s:56, o:0.21, d:6.9, dr:9,  r:26,  a:"G" },
  { t:"H", l:80, top:74, s:48, o:0.19, d:0.3, dr:7,  r:-28, a:"S" },
  { t:"H", l:25, top:81, s:54, o:0.21, d:5.5, dr:8,  r:40,  a:"U" },
  { t:"H", l:58, top:77, s:50, o:0.19, d:8.8, dr:9,  r:-5,  a:"D" },
  // ─ HUELLAS pequeñas (30-42px) ─ relleno interior ─
  { t:"H", l:42, top:16, s:36, o:0.18, d:5.8, dr:8,  r:19,  a:"S" },
  { t:"H", l:29, top:35, s:38, o:0.17, d:9.5, dr:7,  r:-7,  a:"U" },
  { t:"H", l:55, top:41, s:34, o:0.18, d:2.1, dr:9,  r:22,  a:"D" },
  { t:"H", l:70, top:37, s:40, o:0.17, d:7.6, dr:8,  r:-41, a:"G" },
  { t:"H", l:11, top:73, s:36, o:0.18, d:4.4, dr:7,  r:33,  a:"S" },
  { t:"H", l:48, top:83, s:38, o:0.17, d:1.9, dr:8,  r:-16, a:"U" },
  { t:"H", l:93, top:16, s:34, o:0.18, d:6.2, dr:9,  r:8,   a:"D" },
  { t:"H", l:35, top:96, s:40, o:0.17, d:3.3, dr:7,  r:-29, a:"G" },
  // ─ LUPAS grandes (62-78px) ─ dispersas ─
  { t:"L", l:16, top:17, s:74, o:0.25, d:1.2, dr:8,  r:-11, a:"D" },
  { t:"L", l:75, top:19, s:68, o:0.24, d:5.3, dr:7,  r:13,  a:"S" },
  { t:"L", l:9,  top:51, s:76, o:0.25, d:3.1, dr:9,  r:-22, a:"U" },
  { t:"L", l:79, top:53, s:70, o:0.24, d:7.8, dr:8,  r:9,   a:"G" },
  { t:"L", l:12, top:83, s:74, o:0.25, d:0.4, dr:7,  r:-15, a:"D" },
  { t:"L", l:76, top:91, s:68, o:0.23, d:5.6, dr:9,  r:21,  a:"S" },
  { t:"L", l:43, top:7,  s:72, o:0.24, d:9.3, dr:8,  r:-30, a:"U" },
  { t:"L", l:57, top:71, s:70, o:0.23, d:2.7, dr:7,  r:37,  a:"G" },
  { t:"L", l:30, top:58, s:68, o:0.24, d:6.4, dr:9,  r:-8,  a:"D" },
  { t:"L", l:63, top:28, s:74, o:0.23, d:4.8, dr:8,  r:17,  a:"S" },
  // ─ LUPAS medianas (44-58px) ─ zona interior variada ─
  { t:"L", l:33, top:21, s:54, o:0.21, d:3.5, dr:8,  r:-6,  a:"U" },
  { t:"L", l:62, top:18, s:50, o:0.20, d:8.2, dr:7,  r:25,  a:"D" },
  { t:"L", l:27, top:46, s:56, o:0.21, d:1.8, dr:9,  r:-17, a:"G" },
  { t:"L", l:71, top:43, s:52, o:0.20, d:6.7, dr:8,  r:11,  a:"S" },
  { t:"L", l:39, top:69, s:54, o:0.21, d:4.6, dr:7,  r:-25, a:"U" },
  { t:"L", l:68, top:86, s:50, o:0.19, d:0.9, dr:9,  r:31,  a:"D" },
  { t:"L", l:22, top:93, s:52, o:0.21, d:7.4, dr:8,  r:-20, a:"G" },
  { t:"L", l:85, top:42, s:48, o:0.19, d:3.9, dr:7,  r:42,  a:"S" },
  // ─ LUPAS pequeñas (30-42px) ─ relleno disperso ─
  { t:"L", l:50, top:14, s:36, o:0.18, d:6.8, dr:8,  r:28,  a:"D" },
  { t:"L", l:44, top:48, s:38, o:0.17, d:0.6, dr:7,  r:-4,  a:"S" },
  { t:"L", l:52, top:79, s:40, o:0.18, d:9.7, dr:9,  r:15,  a:"U" },
  { t:"L", l:96, top:37, s:36, o:0.17, d:3.8, dr:8,  r:-32, a:"G" },
  { t:"L", l:1,  top:22, s:38, o:0.18, d:7.1, dr:7,  r:44,  a:"D" },
  { t:"L", l:19, top:97, s:34, o:0.17, d:2.4, dr:9,  r:-10, a:"S" },
];

const detectarTypo = (email) => {
    const partes = email.trim().split('@')
    if (partes.length !== 2 || !partes[0] || !partes[1]) return null
    const dominioCorrecto = TYPOS_DOMINIO[partes[1].toLowerCase()]
    return dominioCorrecto ? `${partes[0]}@${dominioCorrecto}` : null
}

// ── Protección contra fuerza bruta ──────────────────────────
const LOCK_KEY = "pf_login_lock"
const MAX_INTENTOS = 5
const DURACION_BLOQUEO_MS = 60 * 1000

const getLockData = () => {
    try {
        const raw = localStorage.getItem(LOCK_KEY)
        return raw ? JSON.parse(raw) : { intentos: 0, bloqueadoHasta: null }
    } catch { return { intentos: 0, bloqueadoHasta: null } }
}
const saveLockData = (d) => localStorage.setItem(LOCK_KEY, JSON.stringify(d))
const clearLockData = () => localStorage.removeItem(LOCK_KEY)

export default function Login() {
    const navigate = useNavigate();

    const [modo, setModo] = useState("login");
    const [isLoading, setIsLoading] = useState(false);
    const [esperandoVerificacion, setEsperandoVerificacion] = useState(false);
    const [correoVerificacion, setCorreoVerificacion] = useState("");
    const [reenvioMsg, setReenvioMsg] = useState("");
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [recoveryMessage, setRecoveryMessage] = useState("");
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);
    const captchaRef = useRef(null);
    const [lockData, setLockData] = useState(() => getLockData());
    const [countdown, setCountdown] = useState(0);
    const [mostrarBienvenida, setMostrarBienvenida] = useState(false);
    const [nombreBienvenida, setNombreBienvenida] = useState("");
    const [verificandoEmail, setVerificandoEmail] = useState(false);
    const [sugerenciaEmail, setSugerenciaEmail] = useState(null);

    // Decide si mostrar el modal de bienvenida o navegar directo.
    // Muestra el modal si: el backend dice que es nuevo (esNuevo)
    // O si nunca ha visto el modal en este dispositivo (sin clave en localStorage).
    // Una vez mostrado, guarda la clave para no volver a mostrarlo.
    const gestionarBienvenida = (syncData, user) => {
        if (!syncData) { navigate("/"); return; }
        const key = `pf_welcome_${user.uid}`;
        const yaVio = localStorage.getItem(key);
        if (!yaVio) {
            localStorage.setItem(key, "1");
            setNombreBienvenida(
                syncData.usuario?.nombre?.split(" ")[0] ||
                user.displayName?.split(" ")[0] || ""
            );
            setMostrarBienvenida(true);
        } else {
            navigate("/");
        }
    };

    useEffect(() => {
        getRedirectResult(auth).then(async (result) => {
            if (!result?.user) return;
            try {
                const syncData = await syncUsuario(result.user);
                gestionarBienvenida(syncData, result.user);
            } catch { navigate("/"); }
        }).catch(console.error);
    }, []);

    useEffect(() => {
        if (!lockData.bloqueadoHasta) { setCountdown(0); return }

        const tick = () => {
            const restantes = Math.ceil((lockData.bloqueadoHasta - Date.now()) / 1000)
            if (restantes <= 0) {
                clearLockData()
                setLockData({ intentos: 0, bloqueadoHasta: null })
                setCountdown(0)
                return false
            }
            setCountdown(restantes)
            return true
        }

        if (!tick()) return
        const id = setInterval(() => { if (!tick()) clearInterval(id) }, 1000)
        return () => clearInterval(id)
    }, [lockData.bloqueadoHasta]);


    // Paleta de colores (misma que Home)
    const colors = {
        azulOscuro: "#384d51",
        azulMedio: "#0b2643",
        celesteVerdoso: "#4A9DA4",
        naranjaPrincipal: "#eda51f",
        naranjaClaro: "#d2991f",
        mostaza: "#d4a017",
        mostazaOscuro: "#b8860b",
        beige: "#F5E6D3",
        blanco: "#FFFFFF",
        grisClaro: "#E8ECEF",
        azulTexto: "#2C5F8A",
        footerBg: "#0c5962",
        facebook: "#1877F2"
    };

    // Huellas flotantes
    const floatingPaws = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 15,
        duration: 20 + Math.random() * 20,
        size: 15 + Math.random() * 35,
        opacity: 0.03 + Math.random() * 0.05
    }));

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: "" }));
        }
        if (e.target.name === 'email') {
            setSugerenciaEmail(detectarTypo(e.target.value));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (modo === "registro" && !formData.nombre.trim()) {
            newErrors.nombre = "El nombre es requerido";
        }

        {
            if (!formData.email.trim()) {
                newErrors.email = "El email es requerido";
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = "Email inválido";
            }
        }


        if (!formData.password) {
            newErrors.password = "La contraseña es requerida";
        } else if (formData.password.length < 6) {
            newErrors.password = "Mínimo 6 caracteres";
        }

        if (modo === "registro") {
            if (!formData.confirmPassword) {
                newErrors.confirmPassword = "Confirma tu contraseña";
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Las contraseñas no coinciden";
            }
        }

        return newErrors;
    };





    const sendLog = async (action, detail) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/log`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, detail }),
            });
        } catch (error) {
            console.error("Error enviando log:", error);
        }
    };

    const syncUsuario = async (user) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firebase_uid: user.uid,
                    nombre: user.displayName || user.email.split("@")[0],
                    email: user.email,
                    foto_url: user.photoURL || null
                }),
            });
            if (res.ok) return await res.json(); // { ok, usuario, esNuevo }
            return null;
        } catch (error) {
            console.error("Error sincronizando usuario:", error);
            return null;
        }
    };   

    const verificarEmailApi = async (email) => {
        try {
            const controller = new AbortController()
            const t = setTimeout(() => controller.abort(), 5000)
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/verificar-email?email=${encodeURIComponent(email)}`,
                { signal: controller.signal }
            )
            clearTimeout(t)
            if (res.ok) return await res.json()
            return { valido: true }
        } catch {
            return { valido: true } // timeout o red caída: no bloquear
        }
    }

    const resetCaptcha = () => {
        captchaRef.current?.reset();
        setCaptchaToken(null);
    };

    const registrarIntentoFallido = () => {
        const actual = getLockData()
        const nuevosIntentos = actual.intentos + 1
        const nuevo = {
            intentos: nuevosIntentos,
            bloqueadoHasta: nuevosIntentos >= MAX_INTENTOS ? Date.now() + DURACION_BLOQUEO_MS : null
        }
        saveLockData(nuevo)
        setLockData(nuevo)
    }

    const limpiarIntentos = () => {
        clearLockData()
        setLockData({ intentos: 0, bloqueadoHasta: null })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Verificar bloqueo activo antes de cualquier operación
        if (modo === "login") {
            const actual = getLockData()
            if (actual.bloqueadoHasta && actual.bloqueadoHasta > Date.now()) return
        }

        const newErrors = validateForm();

        if (modo === "registro" && !captchaToken) {
            newErrors.captcha = "Debes verificar que no eres un robot";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Verificación avanzada del email solo en registro (MX + dominios desechables)
        if (modo === "registro") {
            setVerificandoEmail(true);
            const verificacion = await verificarEmailApi(formData.email);
            setVerificandoEmail(false);
            if (!verificacion.valido) {
                setErrors({ email: verificacion.mensaje || "Este correo electrónico no es válido" });
                return;
            }
        }

        setIsLoading(true);

        try {
            if (modo === "registro") {
                const credencial = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                await updateProfile(credencial.user, { displayName: formData.nombre.trim() });
                await sendEmailVerification(credencial.user);
                try { await sendLog("REGISTRO", `Usuario registrado: ${formData.email}`) } catch {}
                await signOut(auth);
                resetCaptcha();
                setCorreoVerificacion(formData.email);
                setEsperandoVerificacion(true);
            } else {
                const credencial = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                if (!credencial.user.emailVerified) {
                    await signOut(auth);
                    setErrors({ email: "Debes verificar tu correo antes de ingresar. Revisa tu bandeja de entrada." });
                    setCorreoVerificacion(formData.email);
                    setIsLoading(false);
                    return;
                }
                // sendLog y syncUsuario NO bloquean el login si fallan
                try { await sendLog("LOGIN", `Usuario inició sesión: ${formData.email}`) } catch {}
                let syncData = null;
                try { syncData = await syncUsuario(credencial.user) } catch {}
                limpiarIntentos();
                gestionarBienvenida(syncData, credencial.user);
            }
        } catch (error) {
            console.error("Login error:", error.code, error.message);
            if (modo === "registro") resetCaptcha();
            if (modo === "login") registrarIntentoFallido();
            const mensajes = {
                "auth/email-already-in-use":  "Este email ya está registrado.",
                "auth/user-not-found":         "No existe una cuenta con ese email.",
                "auth/wrong-password":         "Contraseña incorrecta.",
                "auth/invalid-credential":     "Email o contraseña incorrectos.",
                "auth/too-many-requests":      "Demasiados intentos fallidos. Espera 1 minuto.",
                "auth/network-request-failed": "Sin conexión. Verifica tu red.",
                "auth/user-disabled":          "Esta cuenta fue deshabilitada.",
            }
            setErrors({ email: mensajes[error.code] || `Error: ${error.message}` });
            // eliminar el alert genérico que se cerraba instantáneo
            if (!mensajes[error.code]) {
                alert("Error: " + error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            const result = await signInWithPopup(auth, provider);
            
            try { await sendLog("GOOGLE_LOGIN", `Ingreso con Google: ${result.user.email}`) } catch {}
            let syncData = null;
            try { syncData = await syncUsuario(result.user) } catch {}
            gestionarBienvenida(syncData, result.user);
        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                console.log(error);
            }
        } finally {
            setIsLoading(false);
        }
    };



    const handleFacebookLogin = async () => {
        try {
            setIsLoading(true);
            const facebookProvider = new FacebookAuthProvider();
            facebookProvider.setCustomParameters({
                auth_type: 'rerequest',
                scope: 'public_profile'
            });

            // Detectar si es móvil
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                await signInWithRedirect(auth, facebookProvider);
            } else {
                const result = await signInWithPopup(auth, facebookProvider);
                try { await sendLog("FACEBOOK_LOGIN", `Ingreso con Facebook: ${result.user.email}`) } catch {}
                const syncData = await syncUsuario(result.user);
                gestionarBienvenida(syncData, result.user);
            }

        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') return;
            console.error("❌ Error:", error.code, error.message);
            alert("Error: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };





    const handleRecoveryPassword = async (e) => {
        e.preventDefault();
        if (!recoveryEmail) {
            setRecoveryMessage("Por favor ingresa tu email");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(recoveryEmail)) {
            setRecoveryMessage("Email inválido");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, recoveryEmail);
            await sendLog("RECOVERY_PASSWORD", `Recuperación solicitada: ${recoveryEmail}`);
            setRecoveryMessage("📧 Se ha enviado un enlace de recuperación a tu correo");
            setTimeout(() => {
                setShowRecoveryModal(false);
                setRecoveryEmail("");
                setRecoveryMessage("");
            }, 3000);
        } catch (error) {
            if (error.code === "auth/user-not-found") {
                setRecoveryMessage("No existe una cuenta con ese email");
            } else {
                setRecoveryMessage("Error al enviar el correo");
            }
        }
    };








    const handleReenviarVerificacion = async () => {
        setReenvioMsg("");
        try {
            // Re-autenticamos temporalmente solo para reenviar el correo
            const credencial = await signInWithEmailAndPassword(auth, correoVerificacion, formData.password);
            await sendEmailVerification(credencial.user);
            await signOut(auth);
            setReenvioMsg("✅ Correo reenviado. Revisa tu bandeja de entrada (y la carpeta de spam).");
        } catch {
            setReenvioMsg("❌ No se pudo reenviar. Intenta de nuevo en un momento.");
        }
    };

    const handleYaVerifique = async () => {
        setIsLoading(true);
        try {
            const credencial = await signInWithEmailAndPassword(auth, correoVerificacion, formData.password);
            await credencial.user.reload();
            if (credencial.user.emailVerified) {
                await sendLog("REGISTRO_VERIFICADO", `Correo verificado: ${correoVerificacion}`);
                const syncData = await syncUsuario(credencial.user);
                setEsperandoVerificacion(false);
                gestionarBienvenida(syncData, credencial.user);
            } else {
                await signOut(auth);
                setReenvioMsg("⚠️ Aún no hemos detectado la verificación. Abre el enlace del correo y vuelve a intentarlo.");
            }
        } catch {
            setReenvioMsg("❌ Error al verificar. Intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    if (esperandoVerificacion) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4"
                style={{
                    paddingBottom: 80,
                    background: `linear-gradient(135deg, ${colors.azulOscuro} 0%, ${colors.azulMedio} 30%, ${colors.celesteVerdoso} 60%, ${colors.naranjaPrincipal} 100%)`,
                    fontFamily: "'Montserrat', sans-serif"
                }}>
                <div className="rounded-3xl p-8 w-full animate-slideUp"
                    style={{
                        maxWidth: 420,
                        backgroundColor: `${colors.beige}ee`,
                        border: `2px solid ${colors.naranjaPrincipal}`,
                        boxShadow: `0 20px 40px rgba(0,0,0,0.2)`
                    }}>

                    {/* Ícono */}
                    <div className="flex justify-center mb-4">
                        <div style={{ fontSize: 64 }}>📧</div>
                    </div>

                    <h2 className="font-black text-2xl text-center mb-2" style={{ color: colors.azulOscuro }}>
                        Verifica tu correo
                    </h2>
                    <p className="text-sm text-center mb-2" style={{ color: colors.azulMedio }}>
                        Enviamos un enlace de verificación a:
                    </p>
                    <p className="font-black text-center mb-4 text-sm break-all"
                        style={{ color: colors.naranjaPrincipal }}>
                        {correoVerificacion}
                    </p>
                    <p className="text-xs text-center mb-6" style={{ color: colors.azulMedio, opacity: 0.8 }}>
                        Abre el correo y haz clic en el enlace para activar tu cuenta. Si no lo ves, revisa la carpeta de <strong>spam</strong>.
                    </p>

                    {reenvioMsg && (
                        <div className="text-xs text-center mb-4 p-3 rounded-xl font-bold"
                            style={{
                                background: reenvioMsg.startsWith("✅") ? "#e6f7f7" : reenvioMsg.startsWith("⚠️") ? "#fff8e1" : "#fff0f0",
                                color: reenvioMsg.startsWith("✅") ? colors.celesteVerdoso : reenvioMsg.startsWith("⚠️") ? "#b8860b" : "#c62828"
                            }}>
                            {reenvioMsg}
                        </div>
                    )}

                    {/* Botón principal */}
                    <button onClick={handleYaVerifique} disabled={isLoading}
                        className="w-full py-3 rounded-xl font-black text-sm mb-3 transition-all duration-300 hover:scale-105"
                        style={{
                            background: `linear-gradient(135deg, ${colors.naranjaPrincipal}, ${colors.mostaza})`,
                            color: colors.blanco,
                            opacity: isLoading ? 0.7 : 1,
                            cursor: isLoading ? "not-allowed" : "pointer"
                        }}>
                        {isLoading ? "Verificando..." : "✅ Ya verifiqué mi correo"}
                    </button>

                    {/* Reenviar */}
                    <button onClick={handleReenviarVerificacion}
                        className="w-full py-2.5 rounded-xl font-bold text-sm mb-3 transition-all duration-300 hover:scale-105"
                        style={{
                            background: colors.blanco,
                            border: `1.5px solid ${colors.naranjaPrincipal}`,
                            color: colors.naranjaPrincipal,
                            cursor: "pointer"
                        }}>
                        🔁 Reenviar correo
                    </button>

                    {/* Volver */}
                    <button onClick={() => { setEsperandoVerificacion(false); setModo("login"); setReenvioMsg(""); }}
                        className="w-full py-2 rounded-xl font-bold text-xs transition-all duration-300 hover:scale-105"
                        style={{ background: "transparent", color: colors.azulMedio, border: "none", cursor: "pointer" }}>
                        ← Volver al inicio de sesión
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center z-50"
                style={{ background: `linear-gradient(135deg, ${colors.azulOscuro} 0%, ${colors.azulMedio} 50%, ${colors.celesteVerdoso} 100%)` }}>
                {/* Spinner ALREDEDOR de la imagen, no encima */}
                <div style={{ position: "relative", width: 140, height: 140, marginBottom: 24 }}>
                    <div style={{
                        position: "absolute", inset: -6, borderRadius: "50%",
                        border: "4px solid transparent",
                        borderTopColor: colors.naranjaPrincipal,
                        borderRightColor: colors.naranjaClaro,
                        animation: "spin 1s linear infinite",
                    }} />
                    <img src={loadingImg} alt="PawFinder"
                        style={{
                            width: 140, height: 140, borderRadius: "50%",
                            objectFit: "cover",
                            border: `3px solid ${colors.naranjaPrincipal}`,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                            display: "block",
                            animation: "pulse-slow 2s ease-in-out infinite",
                        }}
                    />
                </div>
                <p style={{ color: "white", fontSize: 22, fontWeight: 900, marginBottom: 6,
                    fontFamily: "'Fredoka One', cursive",
                    animation: "pulse-slow 2s ease-in-out infinite" }}>
                    PawFinder
                </p>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginBottom: 28 }}>
                    {modo === "login" ? "Ingresando a tu cuenta..." : "Creando tu cuenta..."}
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                    {[0, 0.2, 0.4].map((d, i) => (
                        <div key={i} style={{
                            width: 12, height: 12, borderRadius: "50%",
                            backgroundColor: [colors.naranjaPrincipal, colors.naranjaClaro, colors.celesteVerdoso][i],
                            animation: `bounce 1.2s ease-in-out ${d}s infinite`,
                        }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{
                background: `linear-gradient(135deg, ${colors.azulOscuro} 0%, ${colors.azulMedio} 30%, ${colors.celesteVerdoso} 60%, ${colors.naranjaPrincipal} 100%)`,
                fontFamily: "'Montserrat', sans-serif"
            }}>

            {/* ── FONDO FLOTANTE ── */}
            <style>{FLOATERS_CSS}</style>
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                {FLOATERS.map((el, i) => {
                    const animMap = { U: "floatUD", D: "floatDiag", S: "floatSway", G: "floatGlow" };
                    const animName = animMap[el.a] || "floatUD";
                    return (
                        <img key={i} src={el.t === "H" ? huellaImg : lupaImg} alt=""
                            style={{
                                position: "absolute",
                                left: `${el.l}%`, top: `${el.top}%`,
                                width: el.s, height: el.s,
                                opacity: el.o,
                                "--o": String(el.o),
                                filter: "invert(1) brightness(2.5)",
                                animation: `${animName} ${el.dr}s ease-in-out ${el.d}s infinite`,
                                animationTimingFunction: "cubic-bezier(0.45,0.05,0.55,0.95)",
                                "--r": `${el.r}deg`,
                                transform: `rotate(${el.r}deg)`,
                                userSelect: "none",
                                pointerEvents: "none",
                            }}
                        />
                    );
                })}
            </div>

            {/* ── Modal de bienvenida (solo primera vez) ── */}
            {mostrarBienvenida && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn"
                    style={{ background: "rgba(11,38,67,0.72)", backdropFilter: "blur(8px)", padding: "20px" }}>
                    <div className="relative w-full animate-slideUp"
                        style={{
                            maxWidth: 400,
                            borderRadius: 28,
                            overflow: "hidden",
                            boxShadow: "0 28px 64px rgba(0,0,0,0.35)",
                            border: `2px solid ${colors.naranjaPrincipal}`
                        }}>

                        {/* Cabecera con gradiente */}
                        <div style={{
                            background: `linear-gradient(135deg, ${colors.azulOscuro} 0%, ${colors.celesteVerdoso} 100%)`,
                            padding: "32px 24px 24px",
                            textAlign: "center",
                            position: "relative",
                            overflow: "hidden"
                        }}>
                            {/* Huellas decorativas de fondo */}
                            {["5%", "25%", "55%", "80%"].map((left, i) => (
                                <span key={i} style={{
                                    position: "absolute", left, top: `${10 + i * 18}%`,
                                    fontSize: 28 + i * 6, opacity: 0.07,
                                    transform: `rotate(${-20 + i * 15}deg)`
                                }}>🐾</span>
                            ))}

                            {/* Logo */}
                            <div style={{ position: "relative", display: "inline-block", marginBottom: 14 }}>
                                <div style={{
                                    position: "absolute", inset: -6, borderRadius: "50%",
                                    background: colors.naranjaPrincipal, opacity: 0.35, filter: "blur(10px)"
                                }} />
                                <img src={loadingImg} alt="PawFinder" style={{
                                    width: 76, height: 76, borderRadius: "50%", objectFit: "cover",
                                    border: `3px solid ${colors.naranjaPrincipal}`, position: "relative"
                                }} />
                            </div>

                            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 6px" }}>
                                PawFinder · Puno, Perú
                            </p>
                            <h2 style={{
                                color: "#ffffff", fontWeight: 900, fontSize: 22,
                                margin: 0, fontFamily: "'Fredoka One', cursive", lineHeight: 1.2
                            }}>
                                ¡Bienvenido a PawFinder!
                            </h2>
                        </div>

                        {/* Cuerpo */}
                        <div style={{ background: colors.beige, padding: "24px 24px 28px" }}>

                            {/* Saludo personalizado */}
                            <p style={{
                                fontSize: 15, fontWeight: 700, color: colors.azulOscuro,
                                textAlign: "center", margin: "0 0 6px"
                            }}>
                                {nombreBienvenida ? <>Hola, <span style={{ color: colors.naranjaPrincipal }}>{nombreBienvenida}</span> 👋</> : "¡Nos alegra tenerte aquí! 👋"}
                            </p>
                            <p style={{
                                fontSize: 12, color: colors.azulMedio, textAlign: "center",
                                margin: "0 0 20px", lineHeight: 1.6, opacity: 0.85
                            }}>
                                Eres parte de nuestra comunidad para ayudar a las mascotas de Puno. Esto es lo que puedes hacer:
                            </p>

                            {/* Features */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
                                {[
                                    { icon: "🐾", titulo: "Reporta mascotas", desc: "Perdidas, encontradas o en avistamiento" },
                                    { icon: "🗺️", titulo: "Mapa de reportes", desc: "Ubica mascotas cerca de ti en Puno" },
                                    { icon: "💉", titulo: "Campañas de vacunación", desc: "Mantén a tu mascota protegida" },
                                    { icon: "🏥", titulo: "Veterinarias cercanas", desc: "Encuentra clínicas y profesionales" },
                                ].map((f) => (
                                    <div key={f.titulo} style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "10px 14px", background: "white",
                                        borderRadius: 14, border: `1px solid ${colors.beige}`,
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
                                    }}>
                                        <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
                                        <div>
                                            <p style={{ fontSize: 12, fontWeight: 800, color: colors.azulOscuro, margin: "0 0 1px" }}>{f.titulo}</p>
                                            <p style={{ fontSize: 11, color: colors.azulMedio, margin: 0, opacity: 0.75 }}>{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <button
                                onClick={() => navigate("/")}
                                className="group relative w-full py-3 rounded-xl font-black text-sm overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-xl"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.naranjaPrincipal}, ${colors.mostaza})`,
                                    border: "none", cursor: "pointer"
                                }}>
                                <span className="relative z-10 text-white flex items-center justify-center gap-2">
                                    <span>¡Comenzar a explorar!</span>
                                    <span className="transition-all duration-300 group-hover:translate-x-1">→</span>
                                </span>
                                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de recuperación de contraseña */}
            {showRecoveryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="rounded-3xl p-8 w-full max-w-md mx-4 animate-slideUp"
                        style={{
                            backgroundColor: colors.beige,
                            border: `2px solid ${colors.naranjaPrincipal}`,
                            boxShadow: `0 20px 40px rgba(0,0,0,0.3)`
                        }}>
                        <h2 className="text-2xl font-black text-center mb-4" style={{ color: colors.azulOscuro }}>
                            Recuperar contraseña
                        </h2>
                        <p className="text-sm text-center mb-6" style={{ color: colors.azulMedio }}>
                            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
                        </p>
                        <form onSubmit={handleRecoveryPassword}>
                            <input
                                type="email"
                                value={recoveryEmail}
                                onChange={(e) => setRecoveryEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="w-full text-sm rounded-xl p-3 mb-4 transition-all duration-300 focus:scale-[1.02]"
                                style={{
                                    border: `1.5px solid ${colors.naranjaPrincipal}`,
                                    background: colors.blanco,
                                    outline: "none"
                                }}
                            />
                            {recoveryMessage && (
                                <p className="text-sm text-center mb-4 animate-pulse" style={{ color: colors.celesteVerdoso }}>
                                    {recoveryMessage}
                                </p>
                            )}
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 py-2 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105"
                                    style={{
                                        background: `linear-gradient(135deg, ${colors.naranjaPrincipal}, ${colors.mostaza})`,
                                        color: colors.blanco
                                    }}>
                                    Enviar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRecoveryModal(false);
                                        setRecoveryEmail("");
                                        setRecoveryMessage("");
                                    }}
                                    className="flex-1 py-2 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105"
                                    style={{
                                        background: colors.blanco,
                                        border: `1.5px solid ${colors.naranjaPrincipal}`,
                                        color: colors.naranjaPrincipal
                                    }}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Huellas flotantes */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {floatingPaws.map((paw) => (
                    <svg
                        key={paw.id}
                        className="absolute animate-float-slow"
                        style={{
                            left: `${paw.left}%`,
                            top: `${paw.top}%`,
                            animationDelay: `${paw.delay}s`,
                            animationDuration: `${paw.duration}s`,
                            opacity: paw.opacity,
                            width: paw.size,
                            height: paw.size
                        }}
                        viewBox="0 0 100 100"
                    >
                        <path d="M20,10 Q25,5 30,10 Q35,5 40,10 Q42,15 40,20 Q35,25 30,20 Q25,25 20,20 Q18,15 20,10Z" fill="white" />
                        <circle cx="28" cy="26" r="3" fill="white" />
                        <circle cx="20" cy="28" r="3" fill="white" />
                        <circle cx="36" cy="28" r="3" fill="white" />
                        <circle cx="28" cy="34" r="4" fill="white" />
                    </svg>
                ))}
            </div>

            <div className="relative z-10 w-full"
                style={{ maxWidth: 420 }}>

                {/* Tarjeta de login */}
                <div className="rounded-3xl p-8 backdrop-blur-md transition-all duration-500 hover:shadow-2xl animate-slideUp"
                    style={{
                        backgroundColor: `${colors.beige}ee`,
                        border: `2px solid ${colors.naranjaPrincipal}`,
                        boxShadow: `0 20px 40px rgba(0,0,0,0.2)`
                    }}>

                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-full opacity-75 blur-md group-hover:opacity-100 transition duration-500"
                                style={{ background: colors.naranjaPrincipal }}></div>
                            <img
                                src={loadingImg}
                                alt="PawFinder Logo"
                                className="relative w-28 h-28 object-cover rounded-full border-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                                style={{ borderColor: colors.naranjaPrincipal }}
                            />
                        </div>
                    </div>

                    {/* Título */}
                    <h1 className="font-black text-3xl text-center mb-1 transition-all duration-300 hover:tracking-wider"
                        style={{ fontFamily: "'Fredoka One', cursive", color: colors.azulOscuro }}>
                        PawFinder
                    </h1>
                    <p className="text-xs font-bold text-center mb-6 relative inline-block w-full"
                        style={{ color: colors.azulMedio }}>
                        {modo === "login" && "Ingresa a tu cuenta"}
                        {modo === "registro" && "Crea tu cuenta con email"}

                        <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5 rounded-full animate-pulse"
                            style={{ backgroundColor: colors.naranjaPrincipal }}></span>
                    </p>

                    <form onSubmit={handleSubmit}>

                        {/* ── Mensaje de cuenta bloqueada ── */}
                        {modo === "login" && countdown > 0 && (
                            <div className="mb-4 animate-slideDown" style={{
                                background: "#fff5f5",
                                border: "1px solid #fecaca",
                                borderRadius: "12px",
                                padding: "14px 16px",
                            }}>
                                <p style={{ color: "#b91c1c", fontWeight: "800", fontSize: "13px", margin: "0 0 4px 0" }}>
                                    Cuenta bloqueada temporalmente
                                </p>
                                <p style={{ color: "#dc2626", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
                                    Demasiados intentos fallidos. Por tu seguridad, espera 1 minuto antes de intentarlo de nuevo.
                                </p>
                            </div>
                        )}

                        {/* Campo nombre (solo registro) */}
                        {modo === "registro" && (
                            <div className="mb-3 animate-slideDown">
                                <input
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    placeholder="Tu nombre completo"
                                    className={`w-full text-sm rounded-xl p-3 transition-all duration-300 focus:scale-[1.02] focus:shadow-lg ${errors.nombre ? 'border-red-500' : ''
                                        }`}
                                    style={{
                                        border: `1.5px solid ${errors.nombre ? '#ef4444' : colors.naranjaPrincipal}`,
                                        background: colors.blanco,
                                        fontFamily: "inherit",
                                        color: colors.azulOscuro,
                                        outline: "none"
                                    }}
                                />
                                {errors.nombre && (
                                    <p className="text-xs text-red-500 mt-1 ml-2 animate-shake">{errors.nombre}</p>
                                )}
                            </div>
                        )}

                        {/* Campo email (solo login y registro normal) */}
                        {(modo === "login" || modo === "registro") && (
                            <div className="mb-3">
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="tu@email.com"
                                    className={`w-full text-sm rounded-xl p-3 transition-all duration-300 focus:scale-[1.02] focus:shadow-lg ${errors.email ? 'border-red-500' : ''
                                        }`}
                                    style={{
                                        border: `1.5px solid ${errors.email ? '#ef4444' : colors.naranjaPrincipal}`,
                                        background: colors.blanco,
                                        fontFamily: "inherit",
                                        color: colors.azulOscuro,
                                        outline: "none"
                                    }}
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-500 mt-1 ml-2 animate-shake">{errors.email}</p>
                                )}
                                {sugerenciaEmail && !errors.email && (
                                    <div className="animate-slideDown mt-2" style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        padding: "8px 12px",
                                        background: "#fffbeb",
                                        border: "1px solid #fcd34d",
                                        borderRadius: "10px",
                                    }}>
                                        <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                                        <span style={{ flex: 1, fontSize: 11, color: "#92400e", fontWeight: 600 }}>
                                            ¿Quisiste decir <strong>{sugerenciaEmail}</strong>?
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, email: sugerenciaEmail }));
                                                setSugerenciaEmail(null);
                                            }}
                                            style={{
                                                background: "none", border: "none",
                                                color: colors.celesteVerdoso, fontWeight: 800,
                                                fontSize: 11, cursor: "pointer",
                                                padding: "2px 6px", borderRadius: 6,
                                                textDecoration: "underline", flexShrink: 0
                                            }}>
                                            Corregir
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}






                        {/* Campo contraseña con ojo */}
                        <div className="mb-3">
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Contraseña"
                                    className="w-full text-sm rounded-xl p-3 pr-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                                    style={{
                                        border: `1.5px solid ${errors.password ? '#ef4444' : colors.naranjaPrincipal}`,
                                        background: colors.blanco,
                                        fontFamily: "inherit",
                                        color: colors.azulOscuro,
                                        outline: "none"
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    style={{
                                        position: "absolute", right: 10, top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none", border: "none",
                                        cursor: "pointer", padding: 0, lineHeight: 1
                                    }}>
                                    {showPassword
                                        ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#888"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.02 0 2 .16 2.91.46M17.1 7.1A8.96 8.96 0 0121 12c0 3-4 7-9 7M3 3l18 18" /></svg>
                                        : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#888"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    }
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500 mt-1 ml-2 animate-shake">{errors.password}</p>
                            )}
                        </div>

                        {/* Campo confirmar contraseña (solo registro) */}
                        {modo === "registro" && (
                            <div className="mb-4 animate-slideDown">
                                <div className="relative">
                                    <input
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirmar contraseña"
                                        className="w-full text-sm rounded-xl p-3 pr-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                                        style={{
                                            border: `1.5px solid ${errors.confirmPassword ? '#ef4444' : formData.confirmPassword && formData.password === formData.confirmPassword ? '#27ae60' : colors.naranjaPrincipal}`,
                                            background: colors.blanco,
                                            fontFamily: "inherit",
                                            color: colors.azulOscuro,
                                            outline: "none"
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(v => !v)}
                                        style={{
                                            position: "absolute", right: 10, top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none", border: "none",
                                            cursor: "pointer", padding: 0, lineHeight: 1
                                        }}>
                                        {showConfirmPassword
                                            ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#888"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.02 0 2 .16 2.91.46M17.1 7.1A8.96 8.96 0 0121 12c0 3-4 7-9 7M3 3l18 18" /></svg>
                                            : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#888"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        }
                                    </button>
                                    {/* Check verde si coinciden */}
                                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                        <span style={{ position: "absolute", right: 34, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>✅</span>
                                    )}
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1 ml-2 animate-shake">{errors.confirmPassword}</p>
                                )}
                            </div>
                        )}






                        {/* reCAPTCHA — solo en registro */}
                        {modo === "registro" && (
                            <div className="mb-4 animate-slideDown">
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    padding: "12px",
                                    borderRadius: "14px",
                                    border: `1.5px solid ${errors.captcha ? '#ef4444' : colors.naranjaPrincipal + '60'}`,
                                    background: `${colors.blanco}cc`,
                                }}>
                                    <ReCAPTCHA
                                        ref={captchaRef}
                                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                        onChange={(token) => {
                                            setCaptchaToken(token);
                                            if (token) setErrors(prev => ({ ...prev, captcha: "" }));
                                        }}
                                        onExpired={() => setCaptchaToken(null)}
                                        theme="light"
                                        hl="es"
                                    />
                                </div>
                                {errors.captcha && (
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        marginTop: "8px",
                                        padding: "8px 12px",
                                        borderRadius: "10px",
                                        background: "#fff0f0",
                                        border: "1px solid #fca5a5",
                                    }}>
                                        <span style={{ fontSize: "14px" }}>🤖</span>
                                        <p style={{
                                            fontSize: "12px",
                                            fontWeight: "700",
                                            color: "#dc2626",
                                            margin: 0,
                                        }}>
                                            {errors.captcha}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Botón principal */}
                        {(() => {
                            const deshabilitado = (modo === "login" && countdown > 0) || verificandoEmail;
                            return (
                                <button
                                    type="submit"
                                    disabled={deshabilitado}
                                    className="group relative w-full py-3 rounded-xl font-black text-sm mb-3 overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-xl"
                                    style={{
                                        background: `linear-gradient(135deg, ${colors.naranjaPrincipal}, ${colors.mostaza})`,
                                        cursor: deshabilitado ? "not-allowed" : "pointer",
                                        opacity: deshabilitado ? 0.6 : 1
                                    }}>
                                    <span className="relative z-10 text-white flex items-center justify-center gap-2">
                                        <span>
                                            {verificandoEmail && "Verificando correo..."}
                                            {!verificandoEmail && modo === "login" && "Ingresar"}
                                            {!verificandoEmail && modo === "registro" && "Crear cuenta con email"}
                                        </span>
                                        {!verificandoEmail && (
                                            <span className="transition-all duration-300 group-hover:translate-x-1">→</span>
                                        )}
                                        {verificandoEmail && (
                                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                                                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                                            </svg>
                                        )}
                                    </span>
                                    {!deshabilitado && <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12"></div>}
                                </button>
                            );
                        })()}

                        {/* Botones para cambiar modo */}
                        <div className="flex gap-2 mb-4">
                            {modo !== "login" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModo("login");
                                        setErrors({});
                                        setShowPassword(false);
                                        setShowConfirmPassword(false);
                                        setFormData({ nombre: "", email: "", password: "", confirmPassword: "" });
                                        resetCaptcha();
                                        setSugerenciaEmail(null);
                                    }}
                                    className="flex-1 py-2 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md group"
                                    style={{
                                        background: colors.blanco,
                                        color: colors.naranjaPrincipal,
                                        border: `1.5px solid ${colors.naranjaPrincipal}`,
                                        cursor: "pointer"
                                    }}>
                                    🔙 Iniciar sesión
                                </button>
                            )}

                            {modo === "login" && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModo("registro");
                                            setErrors({});
                                            setShowPassword(false);
                                            setShowConfirmPassword(false);
                                            setFormData({ nombre: "", email: "", password: "", confirmPassword: "" });
                                            setSugerenciaEmail(null);
                                        }}
                                        className="flex-1 py-2 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md group"
                                        style={{
                                            background: colors.blanco,
                                            color: colors.naranjaPrincipal,
                                            border: `1.5px solid ${colors.naranjaPrincipal}`,
                                            cursor: "pointer"
                                        }}>
                                        ✨ Crear Cuenta nueva
                                    </button>

                                </>
                            )}
                        </div>

                        {/* Olvidé contraseña */}
                        {modo === "login" && (
                            <p
                                onClick={() => setShowRecoveryModal(true)}
                                className="text-xs mb-4 cursor-pointer text-center transition-all duration-300 hover:scale-105 hover:underline inline-block w-full"
                                style={{ color: colors.azulMedio }}>
                                ¿Olvidaste tu contraseña?
                            </p>
                        )}
                    </form>

                    {/* Separador */}
                    <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t" style={{ borderColor: `${colors.naranjaPrincipal}50` }}></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-transparent" style={{ color: colors.azulMedio }}>— o ingresa con —</span>
                        </div>
                    </div>

                    {/* Botón Google — ancho completo, Facebook oculto */}
                    <div>
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full py-3 rounded-xl font-black transition-all duration-300 hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-3"
                            style={{
                                background: colors.blanco,
                                border: `1.5px solid ${colors.naranjaPrincipal}`,
                                color: colors.azulOscuro,
                                cursor: "pointer",
                                fontSize: 15
                            }}>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continuar con Google
                        </button>
                    </div>

                    {/* Texto extra */}
                    <p className="text-center text-xs mt-4" style={{ color: colors.azulMedio, opacity: 0.6 }}>
                        Al continuar aceptas nuestros <a href="/terms.html" className="underline cursor-pointer hover:opacity-100 transition" style={{ color: colors.azulMedio }}>Términos</a>
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.03); }
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(-15px) translateX(8px); }
                    50% { transform: translateY(-8px) translateX(-8px); }
                    75% { transform: translateY(-22px) translateX(4px); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-slideUp { animation: slideUp 0.6s ease-out; }
                .animate-slideDown { animation: slideDown 0.4s ease-out; }
                .animate-shake { animation: shake 0.3s ease-in-out; }
                .animate-bounce { animation: bounce 2s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
                .animate-float-slow { animation: float-slow linear infinite; }
                .animate-spin { animation: spin 1s linear infinite; }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
            `}</style>
        </div>
    );
}