// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // 認証（ログイン）機能用
import { getFirestore } from "firebase/firestore"; // データベース機能用
import { getAnalytics } from "firebase/analytics";

// Firebaseのプロジェクト設定（鍵）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim()
};

console.log("🔥 Firebase Config:", firebaseConfig);


// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// 他のファイル（SnsApp.jsxなど）でログイン機能とデータベースを使えるように「export」する
export const auth = getAuth(app);
export const db = getFirestore(app);
