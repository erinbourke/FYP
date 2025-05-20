import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyBfMcPkN_mBlWFfRb6Roy3s2qYokqlqJVA",
  authDomain: "fyp-erin.firebaseapp.com",
  databaseURL: "https://fyp-erin-default-rtdb.firebaseio.com/",
  projectId: "fyp-erin",
  storageBucket: "fyp-erin.firebasestorage.app",
  messagingSenderId: "568176384937",
  appId: "1:568176384937:web:288fefab89f1e1471c02b8",
  measurementId: "G-D09KEC29PY"
};
//import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
//import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };