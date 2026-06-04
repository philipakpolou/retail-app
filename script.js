import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
let cart = [];
let total = 0;

function addToCart(product, price) {
  cart.push({ product, price });
  total += price;

  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");

  const li = document.createElement("li");
  li.textContent = `${product} - $${price}`;
  cartItems.appendChild(li);

  cartTotal.textContent = total;
}
document.getElementById("search-box").addEventListener("keyup", function() {
  let query = this.value.toLowerCase();
  let products = document.querySelectorAll(".product");

  products.forEach(function(product) {
    let name = product.querySelector("h2").textContent.toLowerCase();
    if (name.includes(query)) {
      product.style.display = "block";
    } else {
      product.style.display = "none";
    }
  });
});
function filterByPrice() {
  let maxPrice = document.getElementById("price-filter").value;
  let products = document.querySelectorAll(".product");

  products.forEach(function(product) {
    let priceText = product.querySelector("p").textContent.replace("$", "");
    let price = parseFloat(priceText);

    if (price <= maxPrice || maxPrice === "") {
      product.style.display = "block";
    } else {
      product.style.display = "none";
    }
  });
}

document.getElementById("product-form").addEventListener("submit", function(e) {
  e.preventDefault();

  let name = document.getElementById("product-name").value;
  let price = document.getElementById("product-price").value;
  let image = document.getElementById("product-image").files[0];

  let productSection = document.getElementById("products");
  let productDiv = document.createElement("div");
  productDiv.classList.add("product");

  productDiv.innerHTML = `
    <img src="${URL.createObjectURL(image)}" alt="${name}" class="product-img">
    <h2>${name}</h2>
    <p>$${price}</p>
    <button onclick="addToCart('${name}', ${price})">Add to Cart</button>
  `;

  productSection.appendChild(productDiv);
});



const firebaseConfig = {
  apiKey: "AIzaSyBCjiJIooOgDCYrasEZG3rc1uQ4jxqi1ZY",
  authDomain: "retail-app-8ff73.firebaseapp.com",
  projectId: "retail-app-8ff73",
  storageBucket: "retail-app-8ff73.firebasestorage.app",
  messagingSenderId: "419919954453",
  appId: "1:419919954453:web:914bca061f11727b65441c",
  measurementId: "G-P5DVDSRE8P"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

document.getElementById("product-form").addEventListener("submit", async function(e) {
  e.preventDefault();

  let name = document.getElementById("product-name").value;
  let price = document.getElementById("product-price").value;

  await db.collection("products").add({
    name: name,
    price: price
  });

  alert("Product added successfully!");
});

db.collection("products").get().then(snapshot => {
  snapshot.forEach(doc => {
    let product = doc.data();
    let productSection = document.getElementById("products");

    let productDiv = document.createElement("div");
    productDiv.classList.add("product");
    productDiv.innerHTML = `
      <h2>${product.name}</h2>
      <p>$${product.price}</p>
      <button onclick="addToCart('${product.name}', ${product.price})">Add to Cart</button>
    `;
    productSection.appendChild(productDiv);
  });
});

const auth = firebase.auth();

// Signup
document.getElementById("signup-form").addEventListener("submit", function(e) {
  e.preventDefault();
  let email = document.getElementById("signup-email").value;
  let password = document.getElementById("signup-password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      alert("Signup successful!");
    })
    .catch(error => {
      alert(error.message);
    });
});

// Login
document.getElementById("login-form").addEventListener("submit", function(e) {
  e.preventDefault();
  let email = document.getElementById("login-email").value;
  let password = document.getElementById("login-password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      alert("Login successful!");
    })
    .catch(error => {
      alert(error.message);
    });
});

// Logout
document.getElementById("logout").addEventListener("click", function() {
  auth.signOut().then(() => {
    alert("Logged out!");
  });
});

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("add-product").style.display = "block";
  } else {
    document.getElementById("add-product").style.display = "none";
  }
});

const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// Google Login
document.getElementById("google-login").addEventListener("click", function() {
  auth.signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      alert("Welcome " + user.displayName + "!");
    })
    .catch(error => {
      alert(error.message);
    });
});

// Logout
document.getElementById("logout").addEventListener("click", function() {
  auth.signOut().then(() => {
    alert("Logged out!");
  });
});

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("add-product").style.display = "block";
  } else {
    document.getElementById("add-product").style.display = "none";
  }
});

await db.collection("products").add({
  name: name,
  price: price,
  owner: auth.currentUser.uid // link product to logged-in user
});

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("profile").style.display = "block";
    document.getElementById("profile-name").textContent = "Logged in as: " + user.email;

    // Load only this user's products
    db.collection("products").where("owner", "==", user.uid).get().then(snapshot => {
      let userProductsDiv = document.getElementById("user-products");
      userProductsDiv.innerHTML = ""; // clear old listings

      snapshot.forEach(doc => {
        let product = doc.data();
        let productDiv = document.createElement("div");
        productDiv.classList.add("product");
        productDiv.innerHTML = `
          <h2>${product.name}</h2>
          <p>$${product.price}</p>
          <button onclick="deleteProduct('${doc.id}')">Delete</button>
        `;
        userProductsDiv.appendChild(productDiv);
      });
    });
  } else {
    document.getElementById("profile").style.display = "none";
  }
});

function deleteProduct(id) {
  db.collection("products").doc(id).delete().then(() => {
    alert("Product deleted!");
    location.reload(); // refresh listings
  });
}

snapshot.forEach(doc => {
  let product = doc.data();
  let productDiv = document.createElement("div");
  productDiv.classList.add("product");
  productDiv.innerHTML = `
    <h2>${product.name}</h2>
    <p>$${product.price}</p>
    <button onclick="editProduct('${doc.id}', '${product.name}', ${product.price})">Edit</button>
    <button onclick="deleteProduct('${doc.id}')">Delete</button>
  `;
  userProductsDiv.appendChild(productDiv);
});

function editProduct(id, name, price) {
  document.getElementById("edit-product").style.display = "block";
  document.getElementById("edit-name").value = name;
  document.getElementById("edit-price").value = price;

  // Save changes
  document.getElementById("edit-form").onsubmit = function(e) {
    e.preventDefault();
    let newName = document.getElementById("edit-name").value;
    let newPrice = document.getElementById("edit-price").value;

    db.collection("products").doc(id).update({
      name: newName,
      price: newPrice
    }).then(() => {
      alert("Product updated!");
      location.reload(); // refresh listings
    });
  };
}

snapshot.forEach(doc => {
  let product = doc.data();
  let productDiv = document.createElement("div");
  productDiv.classList.add("product");
  productDiv.innerHTML = `
    <h2>${product.name}</h2>
    <p>$${product.price}</p>
    <img src="${product.imageURL || 'default.jpg'}" alt="${product.name}" class="product-img">
    <button onclick="editProduct('${doc.id}', '${product.name}', ${product.price})">Edit</button>
    <button onclick="editProductImage('${doc.id}')">Edit Image</button>
    <button onclick="deleteProduct('${doc.id}')">Delete</button>
  `;
  userProductsDiv.appendChild(productDiv);
});

function editProductImage(id) {
  document.getElementById("edit-image").style.display = "block";

  document.getElementById("edit-image-form").onsubmit = async function(e) {
    e.preventDefault();
    let file = document.getElementById("new-image").files[0];
    let storageRef = firebase.storage().ref("product-images/" + file.name);

    // Upload new image
    await storageRef.put(file);
    let newImageURL = await storageRef.getDownloadURL();

    // Update Firestore document
    await db.collection("products").doc(id).update({
      imageURL: newImageURL
    });

    alert("Image updated successfully!");
    location.reload(); // refresh listings
  };
}

function showConfirm(message, onConfirm) {
  document.getElementById("confirm-message").textContent = message;
  document.getElementById("confirm-modal").style.display = "flex";

  document.getElementById("confirm-yes").onclick = function() {
    document.getElementById("confirm-modal").style.display = "none";
    onConfirm();
  };

  document.getElementById("confirm-no").onclick = function() {
    document.getElementById("confirm-modal").style.display = "none";
  };
}

// Example: Delete product with confirmation
function deleteProduct(id) {
  showConfirm("Are you sure you want to delete this product?", async function() {
    await db.collection("products").doc(id).delete();
    alert("Product deleted!");
    location.reload();
  });
}

// Example: Edit product with confirmation
function editProduct(id, name, price) {
  showConfirm("Do you want to edit this product?", function() {
    // Show edit form after confirmation
    document.getElementById("edit-product").style.display = "block";
    document.getElementById("edit-name").value = name;
    document.getElementById("edit-price").value = price;
  });
}

function showConfirm(message, onConfirm) {
  document.getElementById("confirm-message").textContent = message;
  document.getElementById("confirm-modal").style.display = "flex";

  document.getElementById("confirm-yes").onclick = function() {
    document.getElementById("confirm-modal").style.display = "none";
    onConfirm();
  };

  document.getElementById("confirm-no").onclick = function() {
    document.getElementById("confirm-modal").style.display = "none";
  };
}

// Delete product
function deleteProduct(id) {
  showConfirm("This will permanently remove your product. Continue?", async function() {
    await db.collection("products").doc(id).delete();
    alert("Product deleted!");
    location.reload();
  });
}

// Edit product
function editProduct(id, name, price) {
  showConfirm("You are about to edit this product. Proceed?", function() {
    document.getElementById("edit-product").style.display = "block";
    document.getElementById("edit-name").value = name;
    document.getElementById("edit-price").value = price;
  });
}

// Logout
document.getElementById("logout").addEventListener("click", function() {
  showConfirm("Are you sure you want to log out?", function() {
    auth.signOut().then(() => {
      alert("Logged out!");
    });
  });
});

function deleteProduct(id) {
  document.getElementById("confirm-yes").classList.add("btn-delete");
  showConfirm("This will permanently remove your product. Continue?", async function() {
    await db.collection("products").doc(id).delete();
    alert("Product deleted!");
    location.reload();
  });
}

function showConfirm(message, iconClass, onConfirm) {
  document.getElementById("confirm-message").textContent = message;
  let icon = document.getElementById("confirm-icon");
  icon.className = "fa " + iconClass; // set icon class
  document.getElementById("confirm-modal").style.display = "flex";

  document.getElementById("confirm-yes").onclick = function() {
    document.getElementById("confirm-modal").style.display = "none";
    onConfirm();
  };

  document.getElementById("confirm-no").onclick = function() {
    document.getElementById("confirm-modal").style.display = "none";
  };
}

// Delete product
function deleteProduct(id) {
  showConfirm("This will permanently remove your product. Continue?", "fa-trash", async function() {
    await db.collection("products").doc(id).delete();
    alert("Product deleted!");
    location.reload();
  });
}

// Edit product
function editProduct(id, name, price) {
  showConfirm("You are about to edit this product. Proceed?", "fa-pencil-alt", function() {
    document.getElementById("edit-product").style.display = "block";
    document.getElementById("edit-name").value = name;
    document.getElementById("edit-price").value = price;
  });
}

// Logout
document.getElementById("logout").addEventListener("click", function() {
  showConfirm("Are you sure you want to log out?", "fa-door-open", function() {
    auth.signOut().then(() => {
      alert("Logged out!");
    });
  });
});

document.getElementById("product-form").addEventListener("submit", async function(e) {
  e.preventDefault();

  let name = document.getElementById("product-name").value;
  let price = document.getElementById("product-price").value;
  let file = document.getElementById("product-image").files[0];

  // Upload image to Firebase Storage
  let storageRef = firebase.storage().ref("product-images/" + file.name);
  await storageRef.put(file);
  let imageURL = await storageRef.getDownloadURL();

  // Save product with image URL in Firestore
  await db.collection("products").add({
    name: name,
    price: price,
    imageURL: imageURL,
    owner: auth.currentUser.uid
  });

  alert("Product added successfully!");
});

db.collection("products").get().then(snapshot => {
  snapshot.forEach(doc => {
    let product = doc.data();
    let productSection = document.getElementById("products");

    let productDiv = document.createElement("div");
    productDiv.classList.add("product");
    productDiv.innerHTML = `
      <img src="${product.imageURL}" alt="${product.name}" class="product-img">
      <h2>${product.name}</h2>
      <p>$${product.price}</p>
      <button onclick="addToCart('${product.name}', ${product.price})">Add to Cart</button>
    `;
    productSection.appendChild(productDiv);
  });
});

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.getElementById("product-form").addEventListener("submit", async function(e) {
  e.preventDefault();

  let name = document.getElementById("product-name").value;
  let price = document.getElementById("product-price").value;

  await db.collection("products").add({
    name: name,
    price: price,
    owner: auth.currentUser.uid // link to seller
  });

  alert("Product added successfully!");
});

db.collection("products").onSnapshot(snapshot => {
  let productSection = document.getElementById("products");
  productSection.innerHTML = ""; // clear old listings

  snapshot.forEach(doc => {
    let product = doc.data();
    let productDiv = document.createElement("div");
    productDiv.classList.add("product");
    productDiv.innerHTML = `
      <img src="${product.imageURL}" alt="${product.name}" class="product-img">
      <h2>${product.name}</h2>
      <p>$${product.price}</p>
      <button onclick="addToCart('${product.name}', ${product.price})">Add to Cart</button>
    `;
    productSection.appendChild(productDiv);
  });
});

document.getElementById("product-form").addEventListener("submit", async function(e) {
  e.preventDefault();

  let name = document.getElementById("product-name").value;
  let price = document.getElementById("product-price").value;
  let category = document.getElementById("product-category").value;
  let file = document.getElementById("product-image").files[0];

  // Upload image
  let storageRef = firebase.storage().ref("product-images/" + file.name);
  await storageRef.put(file);
  let imageURL = await storageRef.getDownloadURL();

  // Save product with category
  await db.collection("products").add({
    name: name,
    price: price,
    category: category,
    imageURL: imageURL,
    owner: auth.currentUser.uid
  });

  alert("Product added successfully!");
});

db.collection("products").onSnapshot(snapshot => {
  let productSection = document.getElementById("products");
  productSection.innerHTML = "";

  snapshot.forEach(doc => {
    let product = doc.data();
    let productDiv = document.createElement("div");
    productDiv.classList.add("product");
    productDiv.innerHTML = `
      <h3>${product.category}</h3>
      <img src="${product.imageURL}" alt="${product.name}" class="product-img">
      <h2>${product.name}</h2>
      <p>$${product.price}</p>
      <button onclick="addToCart('${product.name}', ${product.price})">Add to Cart</button>
    `;
    productSection.appendChild(productDiv);
  });
});

function filterCategory(category) {
  db.collection("products").where("category", "==", category).onSnapshot(snapshot => {
    let productSection = document.getElementById("products");
    productSection.innerHTML = "";

    snapshot.forEach(doc => {
      let product = doc.data();
      let productDiv = document.createElement("div");
      productDiv.classList.add("product");
      productDiv.innerHTML = `
        <img src="${product.imageURL}" alt="${product.name}" class="product-img">
        <h2>${product.name}</h2>
        <p>$${product.price}</p>
      `;
      productSection.appendChild(productDiv);
    });
  });
}

const chatWindow = document.getElementById("chat-window");

document.getElementById("chat-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  let message = document.getElementById("chat-message").value;

  await db.collection("chats").add({
    senderId: auth.currentUser.uid,
    receiverId: "SELLER_UID_HERE", // replace with actual seller’s UID
    message: message,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  document.getElementById("chat-message").value = "";
});

db.collection("chats")
  .where("receiverId", "==", auth.currentUser.uid)
  .orderBy("timestamp")
  .onSnapshot(snapshot => {
    chatWindow.innerHTML = "";
    snapshot.forEach(doc => {
      let chat = doc.data();
      let msgDiv = document.createElement("div");
      msgDiv.textContent = chat.senderId + ": " + chat.message;
      chatWindow.appendChild(msgDiv);
    });
  });

  let storageRef = firebase.storage().ref("product-images/" + file.name);
await storageRef.put(file);
let imageURL = await storageRef.getDownloadURL();

await db.collection("products").add({
  name: name,
  price: price,
  imageURL: imageURL,   // ✅ store the download URL
  owner: auth.currentUser.uid
});

productDiv.innerHTML = `
  <img src="${product.imageURL}" alt="${product.name}" class="product-img">
  <h2>${product.name}</h2>
  <p>$${product.price}</p>
`;

auth.onAuthStateChanged(user => {
  if (user) {
    // Logged in
    document.getElementById("nav-profile").style.display = "inline";
    document.getElementById("nav-chat").style.display = "inline";
    document.getElementById("logout").style.display = "inline";
    document.getElementById("nav-login").style.display = "none";
  } else {
    // Logged out
    document.getElementById("nav-profile").style.display = "none";
    document.getElementById("nav-chat").style.display = "none";
    document.getElementById("logout").style.display = "none";
    document.getElementById("nav-login").style.display = "inline";
  }
});

// Logout functionality
document.getElementById("logout").addEventListener("click", () => {
  auth.signOut().then(() => {
    alert("Logged out!");
  });
});
