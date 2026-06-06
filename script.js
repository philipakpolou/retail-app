let cart = [];
let total = 0;

function addToCart(product, price) {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  if (!cartItems || !cartTotal) return;

  cart.push({ product, price });
  total += Number(price);

  const li = document.createElement('li');
  li.textContent = `${product} - $${price}`;
  cartItems.appendChild(li);
  cartTotal.textContent = total.toFixed(2);
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.classList.add('product');
  const imageUrl = product.image || product.imageURL || '';

  card.innerHTML = `
    ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" class="product-img">` : ''}
    <h2>${product.name}</h2>
    <p>$${product.price}</p>
    <button type="button">Add to Cart</button>
  `;

  const button = card.querySelector('button');
  if (button) {
    button.addEventListener('click', () => addToCart(product.name, product.price));
  }

  return card;
}

function displayMessage(id, text, type = 'success') {
  const message = document.getElementById(id);
  if (!message) return;
  message.textContent = text;
  message.className = `message ${type}`;
  message.style.display = 'block';
}

function clearMessage(id) {
  const message = document.getElementById(id);
  if (!message) return;
  message.textContent = '';
  message.style.display = 'none';
}

function setupSearch() {
  const searchBox = document.getElementById('search-box');
  if (!searchBox) return;

  searchBox.addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const products = document.querySelectorAll('.product');

    products.forEach((product) => {
      const name = product.querySelector('h2')?.textContent.toLowerCase() || '';
      product.style.display = name.includes(query) ? 'block' : 'none';
    });
  });
}

function setupAuthForms() {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const toggleFormBtn = document.getElementById('toggle-form');
  const googleLogin = document.getElementById('google-login');
  const logoutBtn = document.getElementById('logout');

  if (toggleFormBtn && loginForm && signupForm) {
    toggleFormBtn.addEventListener('click', function () {
      const showingLogin = loginForm.style.display !== 'none';
      loginForm.style.display = showingLogin ? 'none' : 'block';
      signupForm.style.display = showingLogin ? 'block' : 'none';
      this.textContent = showingLogin ? 'Already have an account? Login' : "Don't have an account? Sign Up";
    });
  }

  if (signupForm && typeof auth !== 'undefined' && auth) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearMessage('auth-message');

      const email = document.getElementById('signup-email')?.value.trim();
      const password = document.getElementById('signup-password')?.value;
      const confirm = document.getElementById('signup-confirm')?.value;

      if (!email || !password || !confirm) {
        displayMessage('auth-message', 'Please fill in all signup fields.', 'error');
        return;
      }

      if (password !== confirm) {
        displayMessage('auth-message', 'Passwords do not match.', 'error');
        return;
      }

      auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
          displayMessage('auth-message', 'Signup successful! You are now logged in.', 'success');
        })
        .catch((error) => {
          displayMessage('auth-message', error.message, 'error');
        });
    });
  }

  if (loginForm && typeof auth !== 'undefined' && auth) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearMessage('auth-message');

      const email = document.getElementById('login-email')?.value.trim();
      const password = document.getElementById('login-password')?.value;

      if (!email || !password) {
        displayMessage('auth-message', 'Email and password are required.', 'error');
        return;
      }

      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          displayMessage('auth-message', 'Login successful!', 'success');
        })
        .catch((error) => {
          displayMessage('auth-message', error.message, 'error');
        });
    });
  }

  if (googleLogin && typeof auth !== 'undefined' && auth && typeof firebase !== 'undefined') {
    googleLogin.addEventListener('click', function () {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then((result) => {
          displayMessage('auth-message', `Welcome ${result.user.displayName}!`, 'success');
        })
        .catch((error) => {
          displayMessage('auth-message', error.message, 'error');
        });
    });
  }

  if (logoutBtn && typeof auth !== 'undefined' && auth) {
    logoutBtn.addEventListener('click', function () {
      auth.signOut().catch((error) => {
        displayMessage('auth-message', error.message, 'error');
      });
    });
  }
}

async function uploadProductImage(file) {
  if (!storage || !file) return '';
  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = storage.ref(`product-images/${fileName}`);
  await storageRef.put(file);
  return storageRef.getDownloadURL();
}

function setupAddProduct() {
  const productForm = document.getElementById('product-form');
  if (!productForm) return;

  productForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearMessage('auth-message');

    const user = auth?.currentUser;
    if (!user) {
      displayMessage('auth-message', 'Please log in before posting a product.', 'error');
      return;
    }

    const name = document.getElementById('product-name')?.value.trim();
    const price = document.getElementById('product-price')?.value.trim();
    const imageFile = document.getElementById('product-image')?.files[0];

    if (!name || !price) {
      displayMessage('auth-message', 'Product name and price are required.', 'error');
      return;
    }

    try {
      let imageURL = '';
      if (imageFile) {
        imageURL = await uploadProductImage(imageFile);
      }

      const product = {
        name,
        price: Number(price),
        owner: user.uid,
        image: imageURL,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('products').add(product);
      displayMessage('auth-message', 'Product added successfully!', 'success');
      productForm.reset();
    } catch (error) {
      console.error('Add product failed:', error);
      displayMessage('auth-message', error.message || 'Unable to add product.', 'error');
    }
  });
}

function loadUserProducts(user) {
  const userProductsDiv = document.getElementById('user-products');
  if (!user || !userProductsDiv || !db) return;

  db.collection('products')
    .where('owner', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get()
    .then((snapshot) => {
      userProductsDiv.innerHTML = '';
      snapshot.forEach((doc) => {
        const product = doc.data();
        const productDiv = document.createElement('div');
        productDiv.classList.add('product');
        productDiv.innerHTML = `
          <h2>${product.name}</h2>
          <p>$${product.price}</p>
        `;
        userProductsDiv.appendChild(productDiv);
      });
    })
    .catch((error) => {
      console.error('Error loading user products:', error);
    });
}

function setupFirebaseAuthState() {
  if (typeof auth === 'undefined' || !auth) return;

  auth.onAuthStateChanged((user) => {
    const addProduct = document.getElementById('add-product');
    const profileSection = document.getElementById('profile');
    const authMessage = document.getElementById('auth-message');
    const logoutBtn = document.getElementById('logout');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (addProduct) {
      addProduct.style.display = user ? 'block' : 'none';
    }

    if (profileSection) {
      profileSection.style.display = user ? 'block' : 'none';
    }

    if (logoutBtn) {
      logoutBtn.style.display = user ? 'block' : 'none';
    }

    if (loginForm) {
      loginForm.style.display = user ? 'none' : 'block';
    }

    if (signupForm) {
      signupForm.style.display = user ? 'none' : 'none';
    }

    const profileName = document.getElementById('profile-name');
    if (profileName) {
      profileName.textContent = user ? `Logged in as: ${user.email}` : '';
    }

    if (user) {
      loadUserProducts(user);
    }

    if (authMessage && !user) {
      authMessage.style.display = 'none';
    }
  });
}

function setupProductsListener() {
  const productSection = document.getElementById('products');
  if (!productSection || !db) return;

  db.collection('products')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        productSection.innerHTML = '';
        snapshot.forEach((doc) => {
          const product = doc.data();
          productSection.appendChild(createProductCard(product));
        });
      },
      (error) => {
        console.error('Error loading products:', error);
      }
    );
}

function setupChat() {
  const chatForm = document.getElementById('chat-form');
  if (!chatForm) return;

  chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const messageInput = document.getElementById('chat-message');
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow || !messageInput) return;

    const messageText = messageInput.value.trim();
    if (!messageText) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.textContent = messageText;
    chatWindow.appendChild(messageDiv);
    messageInput.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;
  });
}

function init() {
  setupSearch();
  setupAuthForms();
  setupAddProduct();
  setupChat();
  setupFirebaseAuthState();
  setupProductsListener();
}

document.addEventListener('DOMContentLoaded', init);
