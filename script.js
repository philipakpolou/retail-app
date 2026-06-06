const CART_STORAGE_KEY = 'marketplace_cart';
let cart = [];
let productsListenerUnsubscribe = null;

function getMessageTarget(defaultId = 'page-message') {
  return document.getElementById(defaultId) ? defaultId : document.getElementById('auth-message') ? 'auth-message' : null;
}

function displayMessage(id, text, type = 'success') {
  const targetId = id || getMessageTarget();
  const message = document.getElementById(targetId);
  if (!message) return;
  message.textContent = text;
  message.className = `message ${type}`;
  message.style.display = 'block';
  if (message.hideTimeout) {
    clearTimeout(message.hideTimeout);
  }
  message.hideTimeout = setTimeout(() => {
    message.style.display = 'none';
  }, 5000);
}

function clearMessage(id) {
  const targetId = id || getMessageTarget();
  const message = document.getElementById(targetId);
  if (!message) return;
  message.textContent = '';
  message.style.display = 'none';
}

function clearAllMessages() {
  ['page-message', 'auth-message'].forEach((targetId) => {
    const message = document.getElementById(targetId);
    if (message) {
      message.textContent = '';
      message.style.display = 'none';
    }
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function loadCart() {
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  try {
    cart = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Invalid cart data, resetting.', error);
    cart = [];
    saveCart();
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function updateCartUI() {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  if (!cartItems || !cartTotal) return;

  cartItems.innerHTML = '';
  if (!cart.length) {
    const empty = document.createElement('li');
    empty.textContent = 'Your cart is empty.';
    cartItems.appendChild(empty);
  } else {
    cart.forEach((item) => {
      const quantity = item.quantity || 1;
      const li = document.createElement('li');
      const itemTotal = quantity * Number(item.price);
      li.innerHTML = `<span>${item.name} (${quantity}) - ${formatCurrency(itemTotal)}</span>`;
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', () => removeCartItem(item.id));
      li.appendChild(removeButton);
      cartItems.appendChild(li);
    });
  }

  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  cartTotal.textContent = total.toFixed(2);
}

function removeCartItem(productId) {
  const index = cart.findIndex((item) => item.id === productId);
  if (index === -1) return;
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
  displayMessage('page-message', 'Item removed from cart.', 'info');
}

function addToCart(product) {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  updateCartUI();
  displayMessage('page-message', `${product.name} added to cart.`, 'success');
}

function checkoutCart() {
  if (!cart.length) {
    displayMessage('page-message', 'Your cart is already empty.', 'info');
    return;
  }

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  cart = [];
  saveCart();
  updateCartUI();
  displayMessage('page-message', `Checkout complete. ${itemCount} item${itemCount !== 1 ? 's' : ''} purchased.`, 'success');
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
  displayMessage('page-message', 'Cart cleared.', 'info');
}

function setupCartButtons() {
  const checkoutButton = document.getElementById('checkout-cart');
  const clearButton = document.getElementById('clear-cart');

  if (checkoutButton) checkoutButton.addEventListener('click', checkoutCart);
  if (clearButton) clearButton.addEventListener('click', clearCart);
}

function setupSearchFilters() {
  const searchBox = document.getElementById('search-box');
  const priceInput = document.getElementById('price-filter');
  const categoryFilter = document.getElementById('category-filter');
  const filterButton = document.getElementById('apply-filters');
  const clearButton = document.getElementById('clear-filters');

  if (searchBox) searchBox.addEventListener('input', filterProducts);
  if (priceInput) priceInput.addEventListener('input', filterProducts);
  if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);
  if (filterButton) filterButton.addEventListener('click', filterProducts);
  if (clearButton) clearButton.addEventListener('click', clearFilters);
}

function filterProducts() {
  const query = document.getElementById('search-box')?.value.trim().toLowerCase() || '';
  const category = document.getElementById('category-filter')?.value || '';
  const priceValue = document.getElementById('price-filter')?.value;
  const maxPrice = priceValue === '' || priceValue == null ? Infinity : Number(priceValue);
  const cards = document.querySelectorAll('#products .product');

  cards.forEach((card) => {
    const name = card.dataset.name || '';
    const price = Number(card.dataset.price || 0);
    const categoryMatch = !category || (card.dataset.category || '').toLowerCase() === category.toLowerCase();
    const matchesQuery = name.includes(query);
    const matchesPrice = Number.isNaN(maxPrice) ? true : price <= maxPrice;
    card.style.display = matchesQuery && matchesPrice && categoryMatch ? 'block' : 'none';
  });
}

function clearFilters() {
  const searchBox = document.getElementById('search-box');
  const priceInput = document.getElementById('price-filter');
  const categoryFilter = document.getElementById('category-filter');

  if (searchBox) searchBox.value = '';
  if (priceInput) priceInput.value = '';
  if (categoryFilter) categoryFilter.value = '';

  filterProducts();
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

  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllMessages();

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
          displayMessage('auth-message', 'Signup successful! Redirecting to the marketplace...', 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1200);
        })
        .catch((error) => {
          displayMessage('auth-message', error.message, 'error');
        });
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllMessages();

      const email = document.getElementById('login-email')?.value.trim();
      const password = document.getElementById('login-password')?.value;

      if (!email || !password) {
        displayMessage('auth-message', 'Email and password are required.', 'error');
        return;
      }

      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          displayMessage('auth-message', 'Login successful! Redirecting to the marketplace...', 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1200);
        })
        .catch((error) => {
          displayMessage('auth-message', error.message, 'error');
        });
    });
  }

  if (googleLogin && typeof firebase !== 'undefined') {
    googleLogin.addEventListener('click', function () {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then((result) => {
          displayMessage('auth-message', `Welcome ${result.user.displayName}! Redirecting to the marketplace...`, 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1200);
        })
        .catch((error) => {
          displayMessage('auth-message', error.message, 'error');
        });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      auth.signOut().catch((error) => {
        displayMessage('page-message', error.message, 'error');
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
    clearAllMessages();

    const user = auth.currentUser;
    if (!user) {
      displayMessage('page-message', 'Please log in before posting a product.', 'error');
      return;
    }

    const name = document.getElementById('product-name')?.value.trim();
    const price = document.getElementById('product-price')?.value.trim();
      const category = document.getElementById('product-category')?.value || 'Others';
      const imageFile = document.getElementById('product-image')?.files[0];

      if (!name || !price || !category) {
        displayMessage('page-message', 'Product name, price, and category are required.', 'error');
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
          category,
        image: imageURL,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('products').add(product);
      displayMessage('page-message', 'Product added successfully!', 'success');
      productForm.reset();
    } catch (error) {
      console.error('Add product failed:', error);
      displayMessage('page-message', error.message || 'Unable to add product.', 'error');
    }
  });
}

function loadUserProducts(user) {
  const userProductsDiv = document.getElementById('user-products');
  if (!userProductsDiv || !db) return;

  if (!user) {
    userProductsDiv.innerHTML = '<p>Please log in to view your products.</p>';
    return;
  }

  db.collection('products')
    .where('owner', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get()
    .then((snapshot) => {
      userProductsDiv.innerHTML = '';

      if (snapshot.empty) {
        userProductsDiv.innerHTML = '<p>You have no listings yet.</p>';
        return;
      }

      snapshot.forEach((doc) => {
        const product = doc.data();
        const productDiv = document.createElement('div');
        productDiv.classList.add('product');
        const categoryLabel = product.category ? `<span class="category-label ${product.category.toLowerCase()}-icon">${product.category}</span>` : '';
        productDiv.innerHTML = `
          <h2>${product.name}</h2>
          ${categoryLabel}
          <p>${formatCurrency(product.price)}</p>
          <div class="profile-actions">
            <button type="button" class="edit-btn" data-id="${doc.id}">Edit</button>
            <button type="button" class="delete-btn" data-id="${doc.id}">Delete</button>
          </div>
        `;
        userProductsDiv.appendChild(productDiv);
      });
    })
    .catch((error) => {
      console.error('Error loading user products:', error);
      displayMessage('page-message', error.message || 'Unable to load your listings.', 'error');
    });
}

function renderProductCard(doc) {
  const product = doc.data();
  const card = document.createElement('div');
  card.classList.add('product');
  card.dataset.name = product.name?.toLowerCase() || '';
  card.dataset.price = product.price || 0;
  card.dataset.category = product.category?.toLowerCase() || '';
  card.dataset.id = doc.id;

  const imageHtml = product.image ? `<img src="${product.image}" alt="${product.name}" class="product-img">` : '';
  const ownerLabel = product.owner === auth.currentUser?.uid ? '<span class="owner-label">Your listing</span>' : '';
  const categoryLabel = product.category ? `<span class="category-label ${product.category.toLowerCase()}-icon">${product.category}</span>` : '';
  const sellerHtml = product.ownerEmail ? `<div class="seller">Seller: ${product.ownerEmail}</div>` : '';

  card.innerHTML = `
    ${imageHtml}
    ${ownerLabel}
    ${categoryLabel}
    <h2>${product.name}</h2>
    ${sellerHtml}
    <p>${formatCurrency(product.price)}</p>
    <button type="button" class="add-cart">Add to Cart</button>
  `;

  const button = card.querySelector('.add-cart');
  if (button) {
    button.addEventListener('click', () => {
      addToCart({ id: doc.id, name: product.name, price: Number(product.price) });
    });
  }

  return card;
}

function setupProductsListener() {
  const productSection = document.getElementById('products');
  if (!productSection || !db) return;

  if (typeof productsListenerUnsubscribe === 'function') {
    productsListenerUnsubscribe();
  }

  productsListenerUnsubscribe = db.collection('products')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        productSection.innerHTML = '';
        if (snapshot.empty) {
          productSection.innerHTML = '<p>No products available yet. Please check back later.</p>';
          return;
        }
        snapshot.forEach((doc) => {
          productSection.appendChild(renderProductCard(doc));
        });
        filterProducts();
      },
      (error) => {
        console.error('Error loading products:', error);
        displayMessage('page-message', error.message || 'Unable to load products.', 'error');
      }
    );
}

function handleProfileActions() {
  const userProductsDiv = document.getElementById('user-products');
  if (!userProductsDiv) return;

  userProductsDiv.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const productId = button.dataset.id;
    if (!productId) return;

    if (button.classList.contains('delete-btn')) {
      if (!confirm('Delete this listing?')) return;

      try {
        await db.collection('products').doc(productId).delete();
        displayMessage('page-message', 'Listing deleted successfully.', 'success');
        loadUserProducts(auth.currentUser);
      } catch (error) {
        console.error('Delete failed:', error);
        displayMessage('page-message', error.message || 'Unable to delete listing.', 'error');
      }
      return;
    }

    if (button.classList.contains('edit-btn')) {
      try {
        const doc = await db.collection('products').doc(productId).get();
        const product = doc.data();
        document.getElementById('edit-id').value = productId;
        document.getElementById('edit-name').value = product.name || '';
        document.getElementById('edit-price').value = product.price || '';
        document.getElementById('edit-product').style.display = 'block';
        document.getElementById('edit-image').style.display = 'block';
        displayMessage('page-message', 'Edit your listing below or update its photo.', 'info');
      } catch (error) {
        console.error('Fetch edit product failed:', error);
        displayMessage('page-message', error.message || 'Unable to load listing for edit.', 'error');
      }
    }
  });
}

function setupProfileForms() {
  const editForm = document.getElementById('edit-form');
  const editImageForm = document.getElementById('edit-image-form');

  if (editForm) {
    editForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearAllMessages();

      const productId = document.getElementById('edit-id')?.value;
      const name = document.getElementById('edit-name')?.value.trim();
      const price = document.getElementById('edit-price')?.value.trim();

      if (!productId || !name || !price) {
        displayMessage('page-message', 'Please complete both fields to update the listing.', 'error');
        return;
      }

      try {
        await db.collection('products').doc(productId).update({
          name,
          price: Number(price),
        });
        displayMessage('page-message', 'Listing updated successfully.', 'success');
        document.getElementById('edit-product').style.display = 'none';
        loadUserProducts(auth.currentUser);
      } catch (error) {
        console.error('Edit failed:', error);
        displayMessage('page-message', error.message || 'Unable to save changes.', 'error');
      }
    });
  }

  if (editImageForm) {
    editImageForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearAllMessages();

      const productId = document.getElementById('edit-id')?.value;
      const newImage = document.getElementById('new-image')?.files[0];

      if (!productId || !newImage) {
        displayMessage('page-message', 'Please choose an image before saving.', 'error');
        return;
      }

      try {
        const imageURL = await uploadProductImage(newImage);
        await db.collection('products').doc(productId).update({
          image: imageURL,
        });
        displayMessage('page-message', 'Product image updated successfully.', 'success');
        document.getElementById('edit-image').style.display = 'none';
        loadUserProducts(auth.currentUser);
      } catch (error) {
        console.error('Image update failed:', error);
        displayMessage('page-message', error.message || 'Unable to update image.', 'error');
      }
    });
  }
}

function loadProfilePage(user) {
  const profileName = document.getElementById('profile-name');
  const profileSection = document.getElementById('profile');
  const editProductSection = document.getElementById('edit-product');
  const editImageSection = document.getElementById('edit-image');

  if (profileName) {
    profileName.textContent = user ? `Logged in as: ${user.email}` : 'Please log in to view your profile.';
  }

  if (profileSection) {
    profileSection.style.display = 'block';
  }

  if (editProductSection) {
    editProductSection.style.display = 'none';
  }
  if (editImageSection) {
    editImageSection.style.display = 'none';
  }

  loadUserProducts(user);
}

function setupChat() {
  const chatWindow = document.getElementById('chat-window');
  const chatForm = document.getElementById('chat-form');
  if (!chatWindow || !db) return;

  db.collection('market-chat')
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      (snapshot) => {
        chatWindow.innerHTML = '';
        snapshot.forEach((doc) => {
          const message = doc.data();
          const messageDiv = document.createElement('div');
          messageDiv.className = 'chat-message';
          const time = message.createdAt && message.createdAt.toDate ? message.createdAt.toDate() : new Date();
          messageDiv.innerHTML = `
            <strong>${message.userName || 'Anonymous'}:</strong>
            <p>${message.text}</p>
            <small>${time.toLocaleString()}</small>
          `;
          chatWindow.appendChild(messageDiv);
        });
        chatWindow.scrollTop = chatWindow.scrollHeight;
      },
      (error) => {
        console.error('Chat error:', error);
        displayMessage('page-message', error.message || 'Unable to load chat.', 'error');
      }
    );

  if (chatForm) {
    chatForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearAllMessages();

      const messageInput = document.getElementById('chat-message');
      const text = messageInput?.value.trim();
      const user = auth.currentUser;

      if (!user) {
        displayMessage('page-message', 'Please log in to send chat messages.', 'error');
        return;
      }

      if (!text) return;

      try {
        await db.collection('market-chat').add({
          owner: user.uid,
          userName: user.email,
          text,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        if (messageInput) messageInput.value = '';
      } catch (error) {
        console.error('Chat send failed:', error);
        displayMessage('page-message', error.message || 'Unable to send message.', 'error');
      }
    });
  }
}

function setupAuthState() {
  auth.onAuthStateChanged((user) => {
    const logoutButtons = document.querySelectorAll('#logout');
    const authSection = document.getElementById('auth');
    const addProductSection = document.getElementById('add-product');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    logoutButtons.forEach((button) => {
      button.style.display = user ? 'inline-flex' : 'none';
    });

    if (authSection) authSection.style.display = user ? 'none' : 'block';
    if (addProductSection) addProductSection.style.display = user ? 'block' : 'none';
    if (loginForm) loginForm.style.display = user ? 'none' : 'block';
    if (signupForm) signupForm.style.display = 'none';

    if (!user && document.getElementById('chat')) {
      displayMessage('page-message', 'Login to participate in chat and post products.', 'info');
    }

    loadProfilePage(user);
    setupProductsListener();
  });
}

function init() {
  loadCart();
  updateCartUI();
  setupCartButtons();
  setupSearchFilters();
  setupAuthForms();
  setupAddProduct();
  setupProfileForms();
  handleProfileActions();
  setupChat();
  setupAuthState();
}

document.addEventListener('DOMContentLoaded', init);
