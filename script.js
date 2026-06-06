let cart = [];
let total = 0;

function addToCart(product, price) {
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  if (!cartItems || !cartTotal) return;

  cart.push({ product, price });
  total += Number(price);

  const li = document.createElement("li");
  li.textContent = `${product} - $${price}`;
  cartItems.appendChild(li);
  cartTotal.textContent = total.toFixed(2);
}

function createProductCard(product, includeImage = false) {
  const card = document.createElement("div");
  card.classList.add("product");

  card.innerHTML = `
    ${includeImage && product.image ? `<img src="${product.image}" alt="${product.name}" class="product-img">` : ""}
    <h2>${product.name}</h2>
    <p>$${product.price}</p>
    <button onclick="addToCart('${product.name}', ${product.price})">Add to Cart</button>
  `;

  return card;
}

function filterByPrice() {
  const maxValue = document.getElementById("price-filter").value;
  const maxPrice = maxValue ? parseFloat(maxValue) : Infinity;
  const products = document.querySelectorAll(".product");

  products.forEach((product) => {
    const priceText = product.querySelector("p")?.textContent.replace("$", "") || "0";
    const price = parseFloat(priceText);

    product.style.display = price <= maxPrice ? "block" : "none";
  });
}

function displayMessage(id, text, type = "success") {
  const message = document.getElementById(id);
  if (!message) return;
  message.textContent = text;
  message.className = `message ${type}`;
  message.style.display = "block";
}

function clearMessage(id) {
  const message = document.getElementById(id);
  if (!message) return;
  message.textContent = "";
  message.style.display = "none";
}

function loadProductsFromFirestore() {
  if (typeof db === "undefined" || !db) return;

  db.collection("products")
    .get()
    .then((snapshot) => {
      const productSection = document.getElementById("products");
      if (!productSection) return;
      productSection.innerHTML = "";

      snapshot.forEach((doc) => {
        const product = doc.data();
        const card = createProductCard(product, Boolean(product.image));
        productSection.appendChild(card);
      });
    })
    .catch((error) => {
      console.error("Error loading products:", error);
    });
}

function loadUserProducts(user) {
  if (!user || typeof db === "undefined" || !db) return;

  const userProductsDiv = document.getElementById("user-products");
  if (!userProductsDiv) return;
  userProductsDiv.innerHTML = "";

  db.collection("products")
    .where("owner", "==", user.uid)
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        const product = doc.data();
        const productDiv = document.createElement("div");
        productDiv.classList.add("product");
        productDiv.innerHTML = `
          <h2>${product.name}</h2>
          <p>$${product.price}</p>
          <button onclick="deleteProduct('${doc.id}')">Delete</button>
        `;
        userProductsDiv.appendChild(productDiv);
      });
    })
    .catch((error) => {
      console.error("Error loading user products:", error);
    });
}

function deleteProduct(id) {
  if (typeof db === "undefined" || !db) return;

  db.collection("products")
    .doc(id)
    .delete()
    .then(() => {
      displayMessage("auth-message", "Product deleted successfully.", "success");
      loadUserProducts(firebase.auth().currentUser);
    })
    .catch((error) => {
      console.error("Delete error:", error);
      displayMessage("auth-message", error.message, "error");
    });
}

function setupAuthForms() {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const toggleFormBtn = document.getElementById("toggle-form");
  const googleLogin = document.getElementById("google-login");
  const logoutBtn = document.getElementById("logout");

  if (toggleFormBtn && loginForm && signupForm) {
    toggleFormBtn.addEventListener("click", function () {
      const showingLogin = loginForm.style.display !== "none";
      loginForm.style.display = showingLogin ? "none" : "block";
      signupForm.style.display = showingLogin ? "block" : "none";
      this.textContent = showingLogin ? "Already have an account? Login" : "Don't have an account? Sign Up";
    });
  }

  if (signupForm && typeof auth !== "undefined" && auth) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearMessage("auth-message");
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;
      const confirm = document.getElementById("signup-confirm").value;

      if (password !== confirm) {
        displayMessage("auth-message", "Passwords do not match.", "error");
        return;
      }

      auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
          displayMessage("auth-message", "Signup successful!", "success");
        })
        .catch((error) => {
          displayMessage("auth-message", error.message, "error");
        });
    });
  }

  if (loginForm && typeof auth !== "undefined" && auth) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearMessage("auth-message");
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          displayMessage("auth-message", "Login successful!", "success");
        })
        .catch((error) => {
          displayMessage("auth-message", error.message, "error");
        });
    });
  }

  if (googleLogin && typeof auth !== "undefined" && auth) {
    const provider = new firebase.auth.GoogleAuthProvider();
    googleLogin.addEventListener("click", function () {
      auth.signInWithPopup(provider)
        .then((result) => {
          displayMessage("auth-message", `Welcome ${result.user.displayName}!`, "success");
        })
        .catch((error) => {
          displayMessage("auth-message", error.message, "error");
        });
    });
  }

  if (logoutBtn && typeof auth !== "undefined" && auth) {
    logoutBtn.addEventListener("click", function () {
      auth.signOut().catch((error) => {
        displayMessage("auth-message", error.message, "error");
      });
    });
  }
}

function setupChat() {
  const chatForm = document.getElementById("chat-form");
  if (!chatForm) return;

  chatForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const messageInput = document.getElementById("chat-message");
    const chatWindow = document.getElementById("chat-window");
    if (!chatWindow || !messageInput) return;

    const messageText = messageInput.value.trim();
    if (!messageText) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = "chat-message";
    messageDiv.textContent = messageText;
    chatWindow.appendChild(messageDiv);
    messageInput.value = "";
    chatWindow.scrollTop = chatWindow.scrollHeight;
  });
}

function setupFirebaseAuthState() {
  if (typeof auth === "undefined" || !auth) return;

  auth.onAuthStateChanged((user) => {
    const copyAddProduct = document.getElementById("add-product");
    const profileSection = document.getElementById("profile");
    const profileName = document.getElementById("profile-name");
    const authMessage = document.getElementById("auth-message");

    if (copyAddProduct) {
      copyAddProduct.style.display = user ? "block" : "none";
    }

    if (profileSection) {
      profileSection.style.display = user ? "block" : "none";
    }

    if (profileName && user) {
      profileName.textContent = `Logged in as: ${user.email}`;
    }

    if (user) {
      loadUserProducts(user);
    }

    if (authMessage && !user) {
      authMessage.style.display = "none";
    }
  });
}

function setupSearch() {
  const searchBox = document.getElementById("search-box");
  if (!searchBox) return;

  searchBox.addEventListener("keyup", function () {
    const query = this.value.toLowerCase();
    const products = document.querySelectorAll(".product");

    products.forEach((product) => {
      const name = product.querySelector("h2")?.textContent.toLowerCase() || "";
      product.style.display = name.includes(query) ? "block" : "none";
    });
  });
}

function setupAddProduct() {
  const productForm = document.getElementById("product-form");
  if (!productForm) return;

  productForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("product-name").value;
    const price = document.getElementById("product-price").value;
    const imageFile = document.getElementById("product-image").files[0];
    const productSection = document.getElementById("products");
    if (!productSection) return;

    const imageUrl = imageFile ? URL.createObjectURL(imageFile) : "";
    const product = {
      name,
      price,
      image: imageUrl,
    };

    productSection.appendChild(createProductCard(product, Boolean(imageUrl)));
    productForm.reset();

    if (typeof db !== "undefined" && db && typeof auth !== "undefined" && auth?.currentUser) {
      db.collection("products").add({
        ...product,
        owner: auth.currentUser.uid,
      }).catch((error) => {
        console.error("Error saving product:", error);
      });
    }
  });
}

function init() {
  setupSearch();
  setupAddProduct();
  setupAuthForms();
  setupChat();
  setupFirebaseAuthState();
  if (typeof db !== "undefined" && db) {
    loadProductsFromFirestore();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


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

// Firebase initialized in `firebase.js`

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

function toggleMenu() {
  document.getElementById("navbar").classList.toggle("active");
}
