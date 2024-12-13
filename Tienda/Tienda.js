const apiUrl = 'https://api.escuelajs.co/api/v1';

let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentPage = 1;
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let isLoading = false;

const homeView = document.getElementById('home-view');
const productList = document.getElementById('product-list');
const loadMoreBtn = document.getElementById('load-more');
const productDetailView = document.getElementById('product-detail-view');
const productDetail = document.getElementById('product-detail');
const cartView = document.getElementById('cart-view');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const categoryList = document.getElementById('category-list');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');

async function loadProducts(page = 1, categoryId = null) {
  let url = `${apiUrl}/products?offset=${(page - 1) * 10}&limit=10`;
  if (categoryId) {
    url = `${apiUrl}/categories/${categoryId}/products`;
  }

  try {
    isLoading = true; // Indicamos que estamos cargando
    const res = await fetch(url);
    const data = await res.json();
    if (!categoryId) {
      products = [...products, ...data]; // Agregar los nuevos productos a la lista existente
    } else {
      products = data; // Si estamos filtrando por categoría, reemplazamos los productos
    }
    renderProducts(products); // Renderizamos los productos

    // Si los productos cargados son menos que el límite, deshabilitamos el botón de "Ver Más"
    if (data.length < 10) {
      loadMoreBtn.disabled = true;
    } else {
      loadMoreBtn.disabled = false; // Habilitamos el botón si aún hay más productos
    }
  } catch (error) {
    console.error('Error cargando productos:', error);
  } finally {
    isLoading = false; // Indicamos que hemos terminado de cargar
  }
}

function renderProducts(products) {
  products.forEach((product) => {
    const item = document.createElement('div');
    item.className = 'product-item';
    item.innerHTML = `
      <img src="${product.images[0]}" alt="${product.title}">
      <h3>${product.title}</h3>
      <p>$${product.price}</p>
      <button onclick="viewProductDetail(${product.id})">Ver Detalle</button>
      <button onclick="addToCart(${product.id})">Agregar al Carrito</button>
    `;
    productList.appendChild(item);
  });
}

async function loadCategories() {
  try {
    const res = await fetch(`${apiUrl}/categories`);
    categories = await res.json();
    renderCategories();
  } catch (error) {
    console.error('Error cargando categorías:', error);
  }
}

function renderCategories() {
  categoryList.innerHTML = '';
  categories.forEach((category) => {
    const button = document.createElement('button');
    button.className = 'category-item';
    button.innerText = category.name;
    button.onclick = () => filterByCategory(category.id);
    categoryList.appendChild(button);
  });
}

function filterByCategory(categoryId) {
  currentPage = 1;
  productList.innerHTML = '';
  loadProducts(currentPage, categoryId);
}

async function viewProductDetail(productId) {
  try {
    const res = await fetch(`${apiUrl}/products/${productId}`);
    const product = await res.json();
    productDetail.innerHTML = `
      <img src="${product.images[0]}" alt="${product.title}">
      <h2>${product.title}</h2>
      <p>${product.description}</p>
      <p>Precio: $${product.price}</p>
      <button onclick="addToCart(${product.id})">Agregar al Carrito</button>
    `;
    toggleView('product-detail-view');
  } catch (error) {
    console.error('Error al cargar el detalle del producto:', error);
  }
}

function addToCart(productId) {
  if (!currentUser) {
    alert('Debe iniciar sesión para agregar productos al carrito.');
    toggleView('login-view');
    return;
  }
  const product = products.find((p) => p.id === productId);
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  updateCart();
}

function updateCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  cartCount.innerText = cart.reduce((acc, item) => acc + item.quantity, 0);
  renderCart();
}

function renderCart() {
  cartItems.innerHTML = '';
  cart.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span>${item.title} x ${item.quantity}</span>
      <span>$${item.price * item.quantity}</span>
      <button onclick="removeFromCart(${item.id})">X</button>
    `;
    cartItems.appendChild(div);
  });
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  updateCart();
}

function toggleView(view) {
  const views = document.querySelectorAll('.view');
  views.forEach((v) => v.classList.remove('active'));
  const activeView = document.getElementById(view);
  if (activeView) activeView.classList.add('active');
}

async function registerUser(name, email, password) {
  try {
    const res = await fetch(`${apiUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (res.ok) {
      alert('Registro exitoso. Ahora puedes iniciar sesión.');
      toggleView('login-view');
    } else {
      alert('Error al registrar usuario.');
    }
  } catch (error) {
    console.error('Error en el registro:', error);
  }
}

async function loginUser(email, password) {
  try {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('currentUser', JSON.stringify(data.user)); // Guardamos los datos del usuario
      currentUser = data.user;
      alert('Inicio de sesión exitoso.');
      toggleView('home-view');
    } else {
      alert('Error al iniciar sesión; intentalo de nuevo.');
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    alert('Error al iniciar sesión; intentalo de nuevo.');
  }
}

document.getElementById('loginBtn').addEventListener('click', () => {
  toggleView('login-view');
});

document.getElementById('homeBtn').addEventListener('click', () => {
  toggleView('home-view');
});

document.getElementById('cartBtn').addEventListener('click', () => {
  toggleView('cart-view');
});

document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  loginUser(email, password);
});

document.getElementById('register-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  registerUser(name, email, password);
});

document.getElementById('load-more').addEventListener('click', () => {
  if (!isLoading) {  
    currentPage++; 
    loadProducts(currentPage); 
  }
});

loadCategories();
loadProducts();
