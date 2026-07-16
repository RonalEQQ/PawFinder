// ── src/firebase/firebaseConfig.js ──────────────────────────────
// ERRORES QUE SE CORRIGIERON:
//   1. Se eliminó el import circular (se importaba a sí mismo)
//   2. Se agregó getFirestore y se exporta `db`
// ────────────────────────────────────────────────────────────────

import { initializeApp }              from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore }               from "firebase/firestore"

const firebaseConfig = {
  apiKey:            "AIzaSyCbJreYKBCpkjtgdTp_l2et60CkVx436Cc",
  authDomain:        "pawfinder-34272.firebaseapp.com",
  projectId:         "pawfinder-34272",
  storageBucket:     "pawfinder-34272.firebasestorage.app",
  messagingSenderId: "30667866685",
  appId:             "1:30667866685:web:55ac99fb7026b11098e054",
  measurementId:     "G-E93CHYRE1S",
}

const app = initializeApp(firebaseConfig)

export const auth     = getAuth(app)
export const db       = getFirestore(app)   // ← FALTABA ESTO
export const provider = new GoogleAuthProvider()