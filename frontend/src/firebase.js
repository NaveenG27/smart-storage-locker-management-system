// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // 1. Add this import

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6anMFkWOV6g2K-OoDk2rXupLDTcevV8Y",
  authDomain: "smart-locker-sync.firebaseapp.com",
  projectId: "smart-locker-sync",
  storageBucket: "smart-locker-sync.firebasestorage.app",
  messagingSenderId: "419448861041",
  appId: "1:419448861041:web:2ecd7541f27005e6b5c6d0",
  measurementId: "G-NFBVDZ5BZH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. Initialize Firestore and EXPORT it as 'db'
export const db = getFirestore(app);