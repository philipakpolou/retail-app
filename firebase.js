// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCjiJIooOgDCYrasEZG3rc1uQ4jxqi1ZY",
  authDomain: "retail-app-8ff73.firebaseapp.com",
  projectId: "retail-app-8ff73",
  storageBucket: "retail-app-8ff73.appspot.com",
  messagingSenderId: "419919954453",
  appId: "1:419919954453:web:914bca061f11727b65441c",
  measurementId: "G-P5DVDSRE8P"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();



