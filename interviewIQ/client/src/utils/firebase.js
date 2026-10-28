


import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "ai-interviewiq-mernstack.firebaseapp.com",
  projectId: "ai-interviewiq-mernstack",
  storageBucket: "ai-interviewiq-mernstack.firebasestorage.app",
  messagingSenderId: "830842348634",
  appId: "1:830842348634:web:6bf85e3cc0e3896365e463",
  measurementId: "G-XE85F870X6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider()

export {auth, provider} 
