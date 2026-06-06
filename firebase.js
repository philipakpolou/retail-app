// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCjiJIooOgDCYrasEZG3rc1uQ4jxqi1ZY",
  authDomain: "retail-app-8ff73.firebaseapp.com",
  projectId: "retail-app-8ff73",
  storageBucket: "retail-app-8ff73.firebasestorage.app",
  messagingSenderId: "419919954453",
  appId: "1:419919954453:web:914bca061f11727b65441c",
  measurementId: "G-P5DVDSRE8P"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Auth state listener
auth.onAuthStateChanged((user) => {
  const logoutBtn = document.getElementById("logout");
  const loginForm = document.getElementById("login-form");
  
  if (user) {
    console.log("User logged in:", user.email);
    if (logoutBtn) logoutBtn.style.display = "block";
    if (loginForm) loginForm.style.display = "none";
  } else {
    console.log("User logged out");
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginForm) loginForm.style.display = "block";
  }
});

// Logout function
function logout() {
  auth.signOut().then(() => {
    console.log("User logged out successfully");
  }).catch(err => console.error("Logout error:", err));
}

const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}



