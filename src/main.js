import './style.css';
import * as d3 from 'd3';

// State Management
let products = [];
let categories = [];
let cart = [];
try {
  const savedCart = localStorage.getItem('fit_point_cart');
  if (savedCart) cart = JSON.parse(savedCart);
} catch (e) {
  console.warn('LocalStorage not accessible:', e);
}
let currentCategory = 'all';
let searchQuery = '';
let currentPage = 'home'; 
let currentProductSlug = null;
let isAdminAuthenticated = false;
let editingProductId = null;
let selectedProductForModal = null;
let isMobileMenuOpen = false;
let isAdminMobileMenuOpen = false;
let currentAdminTab = 'dashboard';
let adminInsightsPeriod = 'daily';
let currentProductFormTab = 'general';
let adminOrders = [];
let adminStats = null;
let isCartOpen = false;
let currentOsusuTier = '30k';
let appliedCoupon = null;
let adminCoupons = [];
let isCouponInputVisible = false;
let adminSettings = {};
let adminCategories = [];
let adminAttributes = [];
let selectedAdminProductIds = [];
let editingCategoryId = null;
let editingAttributeId = null;
let currentAttributeId = null;
let editingAttributeValueId = null;

// Constants
const WHATSAPP_NUMBER = '+2348022698524'; 

// Utility for fetching - using standard fetch
const makeApiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return await response.json();
    }
    return await response.text();
  } catch (e) {
    console.error('Request error:', e);
    throw e;
  }
};

const checkAdminSession = async () => {
  const sessionResponse = await makeApiCall('/api/admin/check-session');
  isAdminAuthenticated = sessionResponse?.authenticated || false;
};

// UI Components
const Navbar = () => `
  <nav class="border-b border-brand-green/10 py-8 px-6 sticky top-0 bg-brand-cream z-50">
    <div class="max-w-7xl mx-auto flex justify-between items-center relative">
      <div class="flex gap-10 items-center">
        <a href="/" class="text-3xl font-serif tracking-tighter uppercase font-black text-brand-green group" id="nav-logo">
          Fit <span class="text-luxury-gold italic">Point</span>
        </a>
        <div class="hidden md:flex gap-8 uppercase text-[10px] tracking-[0.2em] font-black">
          <button class="nav-page nav-link cursor-pointer ${currentPage === 'home' ? 'active text-brand-green' : 'opacity-40 hover:opacity-100'}" data-page="home">Home</button>
          <button class="nav-page nav-link cursor-pointer ${currentPage === 'shop' ? 'active text-brand-green' : 'opacity-40 hover:opacity-100'}" data-page="shop">Shop</button>
          <button class="nav-page nav-link cursor-pointer ${currentPage === 'pay-small-small' ? 'active text-brand-green' : 'opacity-40 hover:opacity-100'}" data-page="pay-small-small">Pay Small Small</button>
          <button class="nav-page nav-link cursor-pointer ${currentPage === 'osusu' ? 'active text-brand-green' : 'opacity-40 hover:opacity-100'}" data-page="osusu">Osusu Cycle</button>
          <button class="nav-page nav-link cursor-pointer ${currentPage === 'contact' ? 'active text-brand-green' : 'opacity-40 hover:opacity-100'}" data-page="contact">Contact</button>
        </div>
      </div>
      <div class="flex gap-8 items-center">
        <button id="cart-toggle" class="relative group cursor-pointer flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart opacity-60 group-hover:opacity-100 transition-opacity"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          <span class="uppercase text-[10px] tracking-[0.2em] font-black opacity-60 group-hover:opacity-100 transition-opacity">Cart</span>
          <span id="cart-count" class="text-[10px] bg-brand-green text-brand-cream px-2 py-0.5 rounded-full font-sans font-bold shadow-sm">${cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </button>
        
        <!-- Mobile Menu Toggle -->
        <button id="mobile-menu-toggle" class="md:hidden flex flex-col gap-1.5 cursor-pointer p-2">
          <span class="w-6 h-0.5 bg-brand-green transition-all transform ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}"></span>
          <span class="w-6 h-0.5 bg-brand-green transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}"></span>
          <span class="w-6 h-0.5 bg-brand-green transition-all transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}"></span>
        </button>
      </div>

      <!-- Mobile Menu Dropdown -->
      <div id="mobile-menu" class="${isMobileMenuOpen ? 'flex' : 'hidden'} md:hidden absolute top-full left-0 w-full bg-white border-t border-brand-green/10 flex-col py-10 px-8 gap-8 shadow-2xl animate-fade-in">
        <button class="nav-page text-left uppercase text-[10px] tracking-[0.2em] font-black ${currentPage === 'home' ? 'text-brand-green font-black' : 'opacity-40'}" data-page="home">Home</button>
        <button class="nav-page text-left uppercase text-[10px] tracking-[0.2em] font-black ${currentPage === 'shop' ? 'text-brand-green font-black' : 'opacity-40'}" data-page="shop">Shop</button>
        <button class="nav-page text-left uppercase text-[10px] tracking-[0.2em] font-black ${currentPage === 'pay-small-small' ? 'text-brand-green font-black' : 'opacity-40'}" data-page="pay-small-small">Pay Small Small</button>
        <button class="nav-page text-left uppercase text-[10px] tracking-[0.2em] font-black ${currentPage === 'osusu' ? 'text-brand-green font-black' : 'opacity-40'}" data-page="osusu">Osusu Cycle</button>
        <button class="nav-page text-left uppercase text-[10px] tracking-[0.2em] font-black ${currentPage === 'contact' ? 'text-brand-green font-black' : 'opacity-40'}" data-page="contact">Contact</button>
      </div>
    </div>
  </nav>
`;

const ProductCard = (product) => {
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  return `
  <div class="luxury-card group flex flex-col h-full bg-white">
    <div class="overflow-hidden aspect-[4/5] bg-gray-100 relative cursor-pointer product-link" data-slug="${product.slug}">
      <img src="${product.image_url || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop'}" 
           alt="${product.name}" 
           class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
      ${hasDiscount ? `
        <div class="absolute top-4 right-4 bg-brand-green text-brand-cream px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
          Special Offer
        </div>
      ` : ''}
    </div>
    <div class="p-6 flex-grow flex flex-col">
      <div class="mb-4">
        <span class="text-[10px] uppercase tracking-[0.3em] text-luxury-gold font-bold mb-1 block">${product.brand ? `${product.brand} • ` : ''}${product.category_name || ''}</span>
        <h3 class="text-lg font-serif mb-2 cursor-pointer product-link" data-slug="${product.slug}">${product.name}</h3>
        <div class="flex items-center gap-3">
          ${hasDiscount ? `
            <p class="font-medium text-sm text-brand-green">₦${product.discount_price.toFixed(2)}</p>
            <p class="text-xs opacity-30 line-through">₦${product.price ? product.price.toFixed(2) : '0.00'}</p>
          ` : `
            <p class="font-medium text-sm">₦${product.price ? product.price.toFixed(2) : '0.00'}</p>
          `}
        </div>
      </div>
      <button class="add-to-cart mt-auto w-full bg-brand-green text-white py-4 uppercase text-[10px] font-bold tracking-widest cursor-pointer transition-colors hover:bg-luxury-gold active-scale flex items-center justify-center gap-2" 
              data-id="${product.id}">
        <span>Add to Cart</span>
        <span class="text-xs">🛒</span>
      </button>
    </div>
  </div>
`;
};

const Footer = () => `
  <footer class="py-6 px-6 border-t border-luxury-charcoal/5 text-center mt-20">
    <p class="text-xs uppercase tracking-[0.3em] font-semibold opacity-40 mb-4">Fit Point &copy; 2026. All Rights Reserved.</p>
    <div class="text-[10px] uppercase tracking-[0.4em] font-black opacity-60">
      Powered by <a href="https://201webservices.xyz" target="_blank" class="text-brand-green hover:opacity-80 transition-opacity">201webservices</a>
    </div>
  </footer>
`;

const CartOverlay = () => {
  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = item.discount_price || item.price;
    return sum + (itemPrice * item.quantity);
  }, 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = subtotal * (appliedCoupon.value / 100);
    } else {
      discountAmount = appliedCoupon.value;
    }
  }
  
  const total = Math.max(0, subtotal - discountAmount);

  return `
  <div id="cart-sidebar" class="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white z-[60] transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-700 shadow-[-50px_0_100px_-20px_rgba(0,0,0,0.1)] flex flex-col">
    <div class="p-10 border-b flex justify-between items-center bg-brand-cream/10">
      <h2 class="text-3xl font-serif text-brand-green">Your Cart</h2>
      <button id="close-cart" class="text-2xl cursor-pointer hover:rotate-90 transition-transform opacity-40 hover:opacity-100">&times;</button>
    </div>
    <div class="flex-grow overflow-y-auto p-10 space-y-10">
      ${cart.length === 0 ? '<div class="text-center py-20"><p class="text-3xl font-serif italic opacity-30 mb-8">Your cart is as light as air.</p><button class="nav-page secondary-btn" data-page="shop">Begin Curating</button></div>' : cart.map(item => {
        const itemKey = `${item.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`;
        const itemPrice = item.discount_price || item.price;
        return `
        <div class="flex gap-8 group">
          <div class="w-28 h-36 bg-gray-50 flex-shrink-0 overflow-hidden shadow-md">
            <img src="${item.image_url}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
          </div>
          <div class="flex-grow flex flex-col justify-between py-1">
            <div>
              <h4 class="font-serif font-medium text-xl text-brand-green">${item.name}</h4>
              <div class="mt-2 flex flex-wrap gap-2">
                ${item.selectedColor ? `<span class="text-[8px] uppercase tracking-widest bg-brand-cream/30 text-brand-green px-2 py-1 font-black">Color: ${item.selectedColor}</span>` : ''}
                ${item.selectedSize ? `<span class="text-[8px] uppercase tracking-widest bg-brand-cream/30 text-brand-green px-2 py-1 font-black">Size: ${item.selectedSize}</span>` : ''}
              </div>
            </div>
            <div class="flex justify-between items-center mt-6">
              <div class="flex items-center gap-6">
                <button class="cart-qty-btn w-8 h-8 border border-brand-green/10 flex items-center justify-center hover:bg-brand-cream cursor-pointer text-xs transition-colors" data-id="${itemKey}" data-action="dec">-</button>
                <span class="text-xs font-black font-sans text-brand-green">${item.quantity}</span>
                <button class="cart-qty-btn w-8 h-8 border border-brand-green/10 flex items-center justify-center hover:bg-brand-cream cursor-pointer text-xs transition-colors" data-id="${itemKey}" data-action="inc">+</button>
              </div>
              <p class="text-base font-black font-sans text-brand-green">₦${(itemPrice * item.quantity).toFixed(2)}</p>
            </div>
            <button class="cart-remove mt-4 text-[8px] uppercase tracking-[0.3em] text-red-500 font-black cursor-pointer self-start hover:opacity-60 transition-opacity" data-id="${itemKey}">Remove from cart</button>
          </div>
        </div>
      `}).join('')}
    </div>
    
    <div class="p-10 border-t bg-brand-cream/40 backdrop-blur-sm space-y-6">
      ${cart.length > 0 ? `
        <div class="space-y-4 pt-4 border-t border-brand-green/5">
          <div class="flex justify-between">
            <span class="uppercase tracking-[0.4em] text-[9px] font-black opacity-40">Subtotal</span>
            <span class="text-base font-serif font-medium text-brand-green">₦${subtotal.toFixed(2)}</span>
          </div>
          ${discountAmount > 0 ? `
            <div class="flex justify-between text-green-600">
              <span class="uppercase tracking-[0.4em] text-[9px] font-black">Discount</span>
              <span class="text-base font-serif font-medium">-₦${discountAmount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="flex justify-between border-t border-brand-green/10 pt-4">
            <span class="uppercase tracking-[0.4em] text-[9px] font-black opacity-40">Estimated Total</span>
            <span class="text-3xl font-serif font-medium text-brand-green">₦${total.toFixed(2)}</span>
          </div>
        </div>

        <!-- Coupon Section moved above checkout -->
        <div class="flex flex-col pt-4">
          ${!appliedCoupon && !isCouponInputVisible ? `
            <button id="toggle-coupon" class="w-full text-left text-[9px] font-black uppercase tracking-[0.4em] text-brand-green/40 hover:text-brand-green transition-all cursor-pointer flex items-center justify-between border-brand-green/5 pb-2">
              <span>HAVE A COUPON CODE?</span>
              <span class="text-xs">+</span>
            </button>
          ` : ''}
          
          <div id="coupon-area" class="${!appliedCoupon && !isCouponInputVisible ? 'hidden' : 'space-y-4 mb-2 animate-fade-in'}">
            ${!appliedCoupon ? `
              <div class="flex gap-4">
                <input type="text" id="coupon-code" placeholder="ENTER CODE" class="flex-grow border-b-2 border-brand-green/10 bg-transparent text-[10px] font-black tracking-widest px-4 py-3 focus:outline-none focus:border-brand-green transition-all" value="">
                <button id="apply-coupon" class="bg-brand-green text-brand-cream px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-luxury-gold transition-all cursor-pointer">Apply</button>
              </div>
            ` : `
              <div class="flex justify-between items-center bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                <span class="text-[9px] font-black text-green-600 uppercase tracking-widest">${appliedCoupon.code} APPLIED</span>
                <button id="remove-coupon" class="text-red-500 text-[9px] font-black uppercase cursor-pointer hover:opacity-100 opacity-60 transition-opacity">Remove</button>
              </div>
            `}
          </div>
        </div>
      ` : ''}
      
      ${cart.length > 0 ? `
        <button id="checkout-whatsapp" class="w-full primary-btn cursor-pointer py-5 text-sm flex items-center justify-center gap-2">
          <span>Checkout via WhatsApp</span>
          <span class="text-lg">🛒</span>
        </button>
        <button id="clear-cart" class="w-full text-[9px] uppercase tracking-[0.4em] text-red-500/60 hover:text-red-500 font-black cursor-pointer transition-all py-2 border border-red-500/10 rounded-xl mt-2">Clear Cart</button>
      ` : ''}
    </div>
  </div>
  <div id="cart-backdrop" class="fixed inset-0 bg-brand-green/60 z-[55] ${isCartOpen ? 'opacity-100' : 'hidden opacity-0'} transition-opacity duration-700 backdrop-blur-sm cursor-pointer"></div>
`;
};

const ProductModal = () => '';

// Render Methods
const render = async () => {
  const hash = window.location.hash;
  const pathname = window.location.pathname;
  const root = document.getElementById('app');
  
  if (!root) {
    console.error('Root element #app not found');
    return;
  }

  // Diagnostic: show something immediately
  if (root.innerHTML === '') {
    root.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:serif; color:#004236;">Loading...</div>';
  }
  
  try {
    // Fetch settings if not already loaded
    if (Object.keys(adminSettings).length === 0) {
      const sData = await makeApiCall('/api/settings');
      if (sData) adminSettings = sData;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    root.innerHTML = '<div style="padding:20px; color:red;">Initialization failed. Check console for details.</div>';
    return;
  }

  const isMaintenanceMode = adminSettings.maintenance_mode === '1' || adminSettings.maintenance_mode === true;
  const isAdminPath = hash === '#admin' || pathname === '/admin';

  if (isMaintenanceMode && !isAdminPath) {
    renderMaintenance(root);
    return;
  }
  
  if (isAdminPath) {
    const sessionResponse = await makeApiCall('/api/admin/check-session');
    isAdminAuthenticated = sessionResponse?.authenticated || false;
    renderAdmin(root);
  } else if (hash.startsWith('#product/')) {
    currentProductSlug = hash.replace('#product/', '');
    currentPage = 'product-detail';
    renderStore(root);
  } else {
    currentProductSlug = null;
    renderStore(root);
  }
};

const renderStore = async (root, shouldRefresh = false) => {
  try {
    // Only refresh if products are empty OR if shouldRefresh is true (manually requested)
    if (products.length === 0 || shouldRefresh) {
      const pData = await makeApiCall('/api/products');
      if (pData) products = pData;
      const cData = await makeApiCall('/api/categories');
      if (cData) categories = cData;
      const sData = await makeApiCall('/api/settings');
      if (sData) adminSettings = sData;
    }
  } catch (error) {
    console.error('Data sync failed:', error);
    // Continue rendering even if data fetch fails, to show the layout at least
  }

  // Ensure persistent layout exists
  if (!document.getElementById('main-content')) {
    root.innerHTML = `
      <div id="app-layout" class="flex flex-col min-h-screen">
        <div id="navbar-container"></div>
        <div id="main-content" class="flex-grow"></div>
        <div id="cart-container"></div>
        <div id="footer-container"></div>
      </div>
    `;
  }

  const mainContent = document.getElementById('main-content');
  const navContainer = document.getElementById('navbar-container');
  const cartContainer = document.getElementById('cart-container');
  const footerContainer = document.getElementById('footer-container');

  // Update layout components ONLY if their content might have changed or for active states
  navContainer.innerHTML = Navbar();
  cartContainer.innerHTML = CartOverlay();
  footerContainer.innerHTML = Footer();

  if (currentPage === 'product-detail' && currentProductSlug) {
    await renderProductDetail(mainContent);
  } else if (currentPage === 'home') {
    renderHome(mainContent);
  } else if (currentPage === 'shop') {
    renderShop(mainContent);
  } else if (currentPage === 'pay-small-small') {
    renderPaySmallSmall(mainContent);
  } else if (currentPage === 'osusu') {
    renderOsusu(mainContent);
  } else if (currentPage === 'contact') {
    renderContact(mainContent);
  }
  
  attachStoreEvents();
  
  // Smooth scroll to top on page change (if not just a search/filter update)
  if (!shouldRefresh && searchQuery === '') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const renderProductDetail = async (container) => {
  const product = await makeApiCall(`/api/products/slug/${currentProductSlug}`);
  if (!product || product.error) {
    currentPage = 'shop';
    renderShop(container);
    return;
  }

  const attributeGroups = {};
  if (product.attribute_values) {
    product.attribute_values.forEach(av => {
      if (!attributeGroups[av.attribute_name]) {
        attributeGroups[av.attribute_name] = {
          name: av.attribute_name,
          type: av.attribute_type,
          values: []
        };
      }
      attributeGroups[av.attribute_name].values.push(av);
    });
  }

  const groups = Object.values(attributeGroups);
  const gallery = product.images && product.images.length > 0 
    ? product.images 
    : [{ image_url: product.image_url }];
  
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  // Similar Products
  const similarProducts = products
    .filter(p => p.category_id === product.category_id && p.id !== product.id)
    .slice(0, 4);

  container.innerHTML = `
    <main class="animate-fade-in bg-white min-h-screen py-16 md:py-24">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col lg:flex-row gap-16 lg:gap-24 mb-32">
          
          <!-- Visual Gallery (Left Side) -->
          <div class="w-full lg:w-3/5">
            <div class="aspect-[1/1] bg-brand-cream/10 rounded-[2rem] overflow-hidden mb-10 shadow-sm group relative border border-brand-green/5">
               <img id="main-product-img" src="${gallery[0].image_url}" class="w-full h-full object-contain p-8 md:p-12 transition-transform duration-1000 group-hover:scale-105">
               ${hasDiscount ? `
                <div class="absolute top-8 left-8 bg-luxury-gold text-white px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest z-10 shadow-lg">
                  Curated Offer
                </div>
              ` : ''}
            </div>
            ${gallery.length > 1 ? `
              <div class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                ${gallery.map((img, idx) => `
                  <button class="product-thumb w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 ${idx === 0 ? 'border-brand-green shadow-md' : 'border-brand-green/5 opacity-60'} transition-all active-scale cursor-pointer bg-brand-cream/5" data-url="${img.image_url}">
                    <img src="${img.image_url}" class="w-full h-full object-cover p-2 pointer-events-none">
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Product Story & Customization (Right Side) -->
          <div class="w-full lg:w-2/5">
            <div class="sticky top-32 animate-slide-up">
              <nav class="flex items-center gap-2 mb-10 text-[9px] uppercase tracking-widest font-black opacity-30">
                <a href="/" class="hover:text-brand-green transition-colors">Home</a>
                <span>/</span>
                <button class="nav-page hover:text-brand-green transition-colors" data-page="shop">${product.category_name || 'Collection'}</button>
              </nav>

              <h1 class="text-5xl md:text-6xl font-serif text-brand-green mb-8 leading-tight tracking-tighter">${product.name}</h1>
              
              <div class="flex items-baseline gap-6 mb-12">
                <span class="text-3xl font-black text-brand-green">₦${(product.discount_price || product.price).toFixed(2)}</span>
                ${hasDiscount ? `<span class="text-base text-brand-green/30 line-through font-medium">₦${product.price.toFixed(2)}</span>` : ''}
              </div>

              <div class="prose prose-sm prose-brand mb-16">
                <p class="text-brand-green/60 leading-relaxed font-sans text-base">
                   ${product.description || 'A timeless expression of luxury and form. Each piece is meticulously crafted to embody the Fit Point ethos of accessible excellence and sophisticated design.'}
                </p>
              </div>

              <div class="space-y-12 mb-16">
                <div class="text-[10px] space-y-4 font-black uppercase tracking-widest">
                  <div class="flex gap-2"><span class="opacity-40">Categories:</span> <span class="text-luxury-gold">${product.category_name}</span></div>
                  ${product.brand ? `<div class="flex gap-2"><span class="opacity-40">Brand:</span> <span class="text-brand-green">${product.brand}</span></div>` : ''}
                  <div class="flex gap-2"><span class="opacity-40">SKU:</span> <span class="text-brand-green">FP-${product.id.toString().padStart(4, '0')}</span></div>
                </div>

                ${groups.map(group => `
                  <div class="detail-attribute-row" data-group-name="${group.name}">
                    <div class="flex justify-between items-center mb-6">
                      <h4 class="text-[9px] uppercase tracking-[0.4em] font-black text-brand-green/40">${group.name}</h4>
                      <span class="required-indicator-detail text-[7px] uppercase font-black text-red-400 opacity-0 transition-opacity">Select an Option</span>
                    </div>
                    <div class="flex flex-wrap gap-4">
                      ${group.values.map(val => `
                        <button class="variant-detail-btn p-2 min-w-[3rem] h-12 rounded-full border-2 border-brand-green/10 flex items-center justify-center cursor-pointer hover:border-brand-green transition-all shadow-sm active-scale" 
                                data-group="${group.name}" data-value="${val.name}" title="${val.name}">
                          ${group.type === 'color' ? `
                            <div class="w-8 h-8 rounded-full border border-black/5" style="background-color: ${val.value}"></div>
                          ` : `<span class="text-[10px] font-black">${val.name}</span>`}
                        </button>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <div class="flex flex-col gap-6">
                <button id="add-to-cart-detail" class="w-full bg-brand-green text-white py-8 rounded-2xl text-[11px] uppercase tracking-[0.4em] font-black shadow-2xl shadow-brand-green/20 active-scale disabled:opacity-20 disabled:cursor-not-allowed group cursor-pointer transition-all flex items-center justify-center gap-3" 
                        ${groups.length > 0 ? 'disabled' : ''}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                  <span class="group-disabled:hidden">Add to Cart</span>
                  <span class="hidden group-disabled:inline">Select Required Options</span>
                </button>
                <div class="flex gap-4">
                   <button id="buy-now-detail" class="flex-grow border-2 border-brand-green/10 text-brand-green py-5 rounded-2xl text-[10px] uppercase tracking-widest font-black hover:bg-brand-green hover:text-white transition-all active-scale cursor-pointer">Direct Inquiry</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Similar Products Section -->
        <section class="border-t border-brand-green/5 pt-32">
          <div class="flex justify-between items-end mb-20">
            <div>
              <h2 class="text-[10px] uppercase tracking-[0.5em] text-brand-green/30 font-black mb-6">Discovery</h2>
              <h3 class="text-5xl font-serif text-brand-green">Similar Products</h3>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
            ${similarProducts.length === 0 ? '<p class="opacity-20 italic">Curating more items for this collection...</p>' : similarProducts.map(p => ProductCard(p)).join('')}
          </div>
        </section>
      </div>
    </main>
  `;
  
  // Scoped Event Handlers for Detail Page
  const variantSelectionsDetail = {};
  
  document.querySelectorAll('.variant-detail-btn').forEach(btn => {
    btn.onclick = () => {
      const group = btn.dataset.group;
      const value = btn.dataset.value;
      
      document.querySelectorAll(`.variant-detail-btn[data-group="${group}"]`).forEach(b => {
        b.classList.remove('border-brand-green', 'shadow-xl', 'shadow-brand-green/20', 'bg-brand-green', 'text-white', 'scale-110', 'ring-2', 'ring-brand-green', 'ring-offset-2');
      });
      
      btn.classList.add('border-brand-green', 'scale-110', 'z-10');
      if (btn.querySelector('span')) {
        btn.classList.add('bg-brand-green', 'text-white', 'shadow-lg', 'shadow-brand-green/40');
      } else {
        // For color buttons
        btn.classList.add('ring-2', 'ring-brand-green', 'ring-offset-2', 'shadow-md');
      }
      variantSelectionsDetail[group] = value;
      
      // Image switching logic
      if (product.images) {
        const linkedImg = product.images.find(img => {
          const val = product.attribute_values.find(av => av.id == img.attribute_value_id);
          return val && val.name === value && val.attribute_name === group;
        });
        
        if (linkedImg) {
          const mainImg = document.getElementById('main-product-img');
          if (mainImg) {
            mainImg.style.opacity = '0';
            setTimeout(() => {
              mainImg.src = linkedImg.image_url;
              mainImg.style.opacity = '1';
            }, 200);
          }
        }
      }

      // Check if all selected
      const attributeNames = [...new Set(product.attribute_values.map(av => av.attribute_name))];
      const allSelected = attributeNames.every(name => variantSelectionsDetail[name]);
      const addBtn = document.getElementById('add-to-cart-detail');
      if (allSelected && addBtn) addBtn.disabled = false;
    };
  });

  document.querySelectorAll('.product-thumb').forEach(btn => {
    btn.onclick = () => {
      const url = btn.dataset.url;
      const mainImg = document.getElementById('main-product-img');
      if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
          mainImg.src = url;
          mainImg.style.opacity = '1';
        }, 200);
      }
      document.querySelectorAll('.product-thumb').forEach(t => t.classList.remove('border-brand-green', 'shadow-md', 'opacity-100'));
      btn.classList.add('border-brand-green', 'shadow-md', 'opacity-100');
    };
  });

  document.getElementById('add-to-cart-detail')?.addEventListener('click', () => {
    addToCart({ 
      ...product, 
      selectedVariants: { ...variantSelectionsDetail }
    });
  });

  document.getElementById('buy-now-detail')?.addEventListener('click', () => {
    const message = `Hello Fitpoint! I'm interested in the ${product.name}. Could you provide more details?`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  });
};

const renderHome = (container) => {
  const featured = products.filter(p => p.is_featured === 1);
  
  container.innerHTML = `
    <main class="animate-fade-in bg-brand-cream min-h-screen">
      <!-- Hero Section -->
      <section class="max-w-7xl mx-auto px-6 pt-32 pb-48 text-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <header class="max-w-4xl mx-auto">
          <span class="text-[10px] uppercase tracking-[0.5em] text-brand-green font-black mb-8 block opacity-60">Curated for Confidence</span>
          <h1 class="text-6xl md:text-[7rem] font-serif mb-12 leading-[1] tracking-tight text-brand-green">Elevating Every <br/><span class="italic text-luxury-gold">Step</span> You Take.</h1>
          <p class="text-brand-green/70 text-sm tracking-widest leading-relaxed mb-20 font-sans max-w-2xl mx-auto">Your destination for premium bags and luxury footwear. From statement heels and sneakers to refined men’s shoes, we curate the "Clean Look" for the confident individual luxury style, redefined for your budget.</p>
          <div class="flex flex-col sm:flex-row gap-8 justify-center items-center">
            <button class="primary-btn px-16 nav-page active-scale cursor-pointer" data-page="shop">Shop Now</button>
            <button class="secondary-btn px-16 active-scale cursor-pointer" id="whatsapp-hero">Get in Touch</button>
          </div>
        </header>
      </section>

      <!-- Featured Section -->
      <section class="bg-white py-24 px-6 rounded-t-[4rem] -mt-16 shadow-2xl relative z-10">
        <div class="max-w-7xl mx-auto">
          <div class="mb-20">
            <div class="max-w-full">
              <div class="inline-flex items-center gap-2 bg-brand-green/10 text-brand-green px-4 py-2 rounded-full mb-8">
                <span class="text-sm">🔥</span>
                <span class="text-[9px] uppercase tracking-[0.2em] font-black">Featured Products</span>
              </div>
              <h2 class="text-5xl md:text-7xl font-serif text-brand-green mb-6 tracking-tight lg:whitespace-nowrap">Top Picks Just For You</h2>
              <p class="text-gray-500 font-sans tracking-wide max-w-xl">Carefully selected premium items, brand new and exclusive at unbeatable prices.</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
            ${featured.map(p => ProductCard(p)).join('')}
          </div>
          <div class="text-center mt-40">
            <button class="secondary-btn nav-page px-20 active-scale cursor-pointer" data-page="shop">View all products</button>
          </div>
        </div>
      </section>

      <!-- Services Section: What We Do -->
      <section class="py-40 bg-brand-cream relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-6">
          <div class="text-center mb-24">
            <h2 class="text-[10px] uppercase tracking-[0.5em] text-brand-green font-black mb-6 opacity-60">What We Do</h2>
            <h3 class="text-5xl md:text-7xl font-serif text-brand-green">Luxury Made Accessible</h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
            <!-- Pay Small Small Intro -->
            <div class="bg-white p-12 md:p-20 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all duration-500 group border border-brand-green/5">
              <div class="w-16 h-16 bg-luxury-gold/10 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                <span class="text-3xl">💳</span>
              </div>
              <h4 class="text-4xl font-serif text-brand-green mb-6">Pay Small Small</h4>
              <p class="text-brand-green/60 leading-relaxed mb-10 font-sans tracking-wide">Reserve your favorite premium bags, heels, or sneakers and spread the payment across 3 to 5 weeks. No pressure, just luxury at your pace.</p>
              <button class="nav-page text-[10px] uppercase tracking-[0.3em] font-black border-b-2 border-brand-green pb-2 cursor-pointer hover:text-luxury-gold hover:border-luxury-gold transition-all" data-page="pay-small-small">Learn More</button>
            </div>
            
            <!-- Osusu Cycle Intro -->
            <div class="bg-white p-12 md:p-20 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all duration-500 group border border-brand-green/5">
              <div class="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                <span class="text-3xl">🤝</span>
              </div>
              <h4 class="text-4xl font-serif text-brand-green mb-6">Osusu Cycle</h4>
              <p class="text-brand-green/60 leading-relaxed mb-10 font-sans tracking-wide">A smart contribution-based system. Daily small payments with a guaranteed product reward. Your discipline, your luxury.</p>
              <button class="nav-page text-[10px] uppercase tracking-[0.3em] font-black border-b-2 border-brand-green pb-2 cursor-pointer hover:text-luxury-gold hover:border-luxury-gold transition-all" data-page="osusu">Join the Cycle</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Brand Promise -->
      <section class="py-40 bg-brand-green text-brand-cream text-center">
        <div class="max-w-3xl mx-auto px-6">
          <h2 class="text-4xl font-serif italic mb-10">"Look luxury, feel confident, spend wisely."</h2>
          <p class="text-[10px] uppercase tracking-[0.5em] opacity-60 font-black">Premium Selection • Absolute Confidence • Unbeatable Value</p>
        </div>
      </section>
    </main>
  `;
};

const ProductGrid = (filtered) => {
  if (filtered.length === 0) {
    return `
      <div class="col-span-full text-center py-40">
        <p class="italic font-serif text-3xl opacity-20 mb-4">No treasures found.</p>
        <button id="clear-search" class="text-[10px] uppercase tracking-[0.3em] font-black text-luxury-gold underline cursor-pointer">Clear Search Filters</button>
      </div>
    `;
  }
  return filtered.map(p => ProductCard(p)).join('');
};

const renderShop = (container) => {
  let filtered = currentCategory === 'all' 
    ? products 
    : products.filter(p => p.category_id == currentCategory);

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.brand && p.brand.toLowerCase().includes(query))
    );
  }

  container.innerHTML = `
    <main class="max-w-7xl mx-auto px-6 py-28 animate-fade-in bg-white min-h-screen">
      <header class="mb-32 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-16">
        <div class="flex-grow">
          <h1 class="text-[10px] uppercase tracking-[0.5em] text-luxury-gold font-black mb-6">Discovery</h1>
          <h2 class="text-7xl font-serif text-brand-green leading-none">The Complete <br/>Collection</h2>
          
          <div class="mt-12 relative max-w-md">
            <input type="text" id="shop-search" value="${searchQuery}" placeholder="SEARCH COLLECTIONS..." class="w-full bg-brand-green/5 border-b-2 border-brand-green/10 py-4 px-2 outline-none focus:border-brand-green transition-colors text-[10px] uppercase tracking-[0.2em] font-black placeholder:text-brand-green/20">
            <div class="absolute right-2 top-1/2 -translate-y-1/2 opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
        </div>
        <div class="flex gap-10 uppercase text-[10px] tracking-[0.3em] font-black border-b-2 border-brand-green/5 pb-6 overflow-x-auto w-full lg:w-auto">
          <button class="shop-filter cursor-pointer ${currentCategory === 'all' ? 'text-brand-green border-b-2 border-brand-green' : 'opacity-30 hover:opacity-100 transition-all'}" data-category="all">All Items</button>
          ${categories.map(cat => `
            <button class="shop-filter cursor-pointer ${currentCategory == cat.id ? 'text-brand-green border-b-2 border-brand-green' : 'opacity-30 hover:opacity-100 transition-all'}" data-category="${cat.id}">${cat.name}</button>
          `).join('')}
        </div>
      </header>
      
      <div id="shop-product-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
        ${ProductGrid(filtered)}
      </div>
    </main>
  `;
};

const renderPaySmallSmall = (container) => {
  container.innerHTML = `
    <main class="animate-fade-in bg-white min-h-screen">
      <!-- Hero -->
      <section class="py-40 bg-brand-cream px-6 text-center">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-6xl md:text-8xl font-serif text-brand-green mb-10 tracking-tight">Pay Small <span class="italic text-luxury-gold">Small</span></h1>
          <p class="text-xl text-brand-green/60 font-serif italic mb-12">"Luxury made easy through flexible installment payments."</p>
          <div class="w-24 h-1 bg-luxury-gold mx-auto mb-16"></div>
          <p class="text-brand-green/80 leading-relaxed font-sans tracking-wide max-w-2xl mx-auto">Fit Point Pay Small Small is a flexible installment payment plan that allows you to buy premium products without paying the full amount at once.</p>
        </div>
      </section>

      <!-- Details -->
      <section class="py-32 px-6 max-w-5xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
          <div class="space-y-10">
            <div class="flex gap-8 items-start">
              <div class="w-12 h-12 bg-brand-green text-white flex-shrink-0 flex items-center justify-center font-black rounded-full shadow-lg">1</div>
              <div>
                <h3 class="text-2xl font-serif mb-4 text-brand-green">Pick Your Desire</h3>
                <p class="text-brand-green/60 leading-relaxed font-sans">Browse our collection of premium bags, heels, sneakers, and palms. Choose the piece that defines you.</p>
              </div>
            </div>
            <div class="flex gap-8 items-start">
              <div class="w-12 h-12 bg-brand-green text-white flex-shrink-0 flex items-center justify-center font-black rounded-full shadow-lg">2</div>
              <div>
                <h3 class="text-2xl font-serif mb-4 text-brand-green">Weekly Micro-Payments</h3>
                <p class="text-brand-green/60 leading-relaxed font-sans">Spread your payments comfortably across 3 to 5 weeks. No hidden charges, just simple math.</p>
              </div>
            </div>
            <div class="flex gap-8 items-start">
              <div class="w-12 h-12 bg-brand-green text-white flex-shrink-0 flex items-center justify-center font-black rounded-full shadow-lg">3</div>
              <div>
                <h3 class="text-2xl font-serif mb-4 text-brand-green">Reservation & Delivery</h3>
                <p class="text-brand-green/60 leading-relaxed font-sans">Once you start, we reserve your product. Complete your payments and receive your luxury items stress-free.</p>
              </div>
            </div>
          </div>
          <div class="bg-brand-cream/50 p-12 rounded-[3rem] border border-brand-green/5 relative overflow-hidden">
            <div class="absolute -top-10 -right-10 text-[15rem] leading-none text-brand-green/5 font-serif font-black select-none pointer-events-none">PSS</div>
            <div class="relative z-10">
              <h4 class="text-3xl font-serif text-brand-green mb-8">Ready to start?</h4>
              <p class="text-brand-green/60 mb-10 leading-relaxed font-sans italic">Contact our specialists to set up your custom payment timeline today.</p>
              <button class="primary-btn w-full py-6 active-scale cursor-pointer" id="pss-contact">Inquire via WhatsApp</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;

  document.getElementById('pss-contact')?.addEventListener('click', () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello! I'm interested in the Pay Small Small installment plan. How do I get started?")}`, '_blank');
  });
};

const renderOsusu = (container) => {
  const osusuTiers = {
    '25k': { price: '25,000', daily: '500', total5days: '2,500' },
    '30k': { price: '30,000', daily: '600', total5days: '3,000' },
    '50k': { price: '50,000', daily: '1,000', total5days: '5,000' }
  };
  const activeTier = osusuTiers[currentOsusuTier];

  container.innerHTML = `
    <main class="animate-fade-in bg-white min-h-screen">
      <!-- Hero -->
      <section class="py-40 bg-brand-green text-brand-cream px-6 text-center">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-6xl md:text-8xl font-serif mb-10 tracking-tight">Osusu <span class="italic text-luxury-gold">Cycle</span></h1>
          <p class="text-xl opacity-60 font-serif italic mb-12">"Savings culture meets premium fashion lifestyle."</p>
          <div class="w-24 h-1 bg-luxury-gold mx-auto mb-16"></div>
          <p class="opacity-80 leading-relaxed font-sans tracking-wide max-w-2xl mx-auto italic">Fit Point Osusu Cycle is a smart contribution-based shopping system created to help you own luxury fashion through daily small payments.</p>
        </div>
      </section>

      <!-- How it works -->
      <section class="py-40 px-6">
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-32">
             <div>
               <div class="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                 <h2 class="text-5xl font-serif text-brand-green">The Blueprint</h2>
                 
                 <!-- Tier Toggle -->
                 <div class="flex bg-brand-green/5 p-1 rounded-full border border-brand-green/10">
                   ${Object.keys(osusuTiers).map(tier => `
                     <button class="osusu-tier-btn px-6 py-2 text-[10px] uppercase tracking-widest font-black rounded-full transition-all cursor-pointer ${currentOsusuTier === tier ? 'bg-brand-green text-brand-cream shadow-lg' : 'opacity-40 hover:opacity-100'}" data-tier="${tier}">
                       ${tier}
                     </button>
                   `).join('')}
                 </div>
               </div>

               <div class="space-y-8">
                 <div class="flex items-center gap-6 border-b border-brand-green/5 pb-8">
                   <span class="text-4xl">👥</span>
                   <div>
                     <p class="text-[9px] uppercase tracking-[0.3em] font-black opacity-30 mb-1">Commitment</p>
                     <p class="text-xl font-medium text-brand-green">10 Committed Members per Group</p>
                   </div>
                 </div>
                 <div class="flex items-center gap-6 border-b border-brand-green/5 pb-8">
                   <span class="text-4xl">⚡</span>
                   <div>
                     <p class="text-[9px] uppercase tracking-[0.3em] font-black opacity-30 mb-1">Daily Micro-Contribution</p>
                     <p class="text-xl font-medium text-brand-green">₦${activeTier.daily} Daily (₦${activeTier.total5days} Every 5 Days)</p>
                   </div>
                 </div>
                 <div class="flex items-center gap-6 border-b border-brand-green/5 pb-8">
                   <span class="text-4xl">⏳</span>
                   <div>
                     <p class="text-[9px] uppercase tracking-[0.3em] font-black opacity-30 mb-1">Duration</p>
                     <p class="text-xl font-medium text-brand-green">50-Day Cycle (Approx. 7 Weeks)</p>
                   </div>
                 </div>
                 <div class="flex items-center gap-6 pb-8">
                   <span class="text-4xl">✨</span>
                   <div>
                     <p class="text-[9px] uppercase tracking-[0.3em] font-black opacity-30 mb-1">The Reward</p>
                     <p class="text-xl font-medium text-brand-green">Select product worth ₦${activeTier.price}</p>
                   </div>
                 </div>
               </div>
             </div>
             
             <div class="bg-brand-cream/30 p-12 md:p-20 rounded-[3rem] border-2 border-brand-green/5">
                <h3 class="text-3xl font-serif text-brand-green mb-12">Why it's different.</h3>
                <ul class="space-y-10">
                  <li class="flex gap-6">
                    <span class="text-luxury-gold">✔️</span>
                    <p class="text-brand-green/70 leading-relaxed">No waiting for "turns" like traditional Osusu systems.</p>
                  </li>
                  <li class="flex gap-6">
                    <span class="text-luxury-gold">✔️</span>
                    <p class="text-brand-green/70 leading-relaxed">One person's delay does not stop your reward.</p>
                  </li>
                  <li class="flex gap-6">
                    <span class="text-luxury-gold">✔️</span>
                    <p class="text-brand-green/70 leading-relaxed">Encourages savings habits with a stylish goal in mind.</p>
                  </li>
                  <li class="flex gap-6">
                    <span class="text-luxury-gold">✔️</span>
                    <p class="text-brand-green/70 leading-relaxed">Transparent, structured, and completely goal-oriented.</p>
                  </li>
                </ul>
                <button class="primary-btn w-full mt-16 py-6 active-scale cursor-pointer" id="osusu-contact">Join the Next Cycle</button>
             </div>
          </div>
        </div>
      </section>
    </main>
  `;

  document.getElementById('osusu-contact')?.addEventListener('click', () => {
    const activeTier = osusuTiers[currentOsusuTier];
    const message = `Hello! I'm interested in joining the Fit Point Osusu Cycle specifically for the ${currentOsusuTier} package (₦${activeTier.daily} daily). Can you explain more about the current groups?`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  });
};

// Events
const attachStoreEvents = () => {
  // Search logic
  const shopSearch = document.getElementById('shop-search');
  if (shopSearch) {
    shopSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      const grid = document.getElementById('shop-product-grid');
      if (grid) {
        let filtered = currentCategory === 'all' 
          ? products 
          : products.filter(p => p.category_id == currentCategory);

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) || 
            (p.description && p.description.toLowerCase().includes(query)) ||
            (p.brand && p.brand.toLowerCase().includes(query))
          );
        }
        grid.innerHTML = ProductGrid(filtered);
        
        // Setup events for newly rendered content (like Product Cards or Clear Search)
        document.querySelectorAll('.product-card').forEach(card => {
          card.onclick = () => {
            currentProductSlug = card.dataset.slug;
            currentPage = 'product-detail';
            renderStore(document.getElementById('app'));
          };
        });
        
        document.getElementById('clear-search')?.addEventListener('click', () => {
          searchQuery = '';
          currentCategory = 'all';
          renderStore(document.getElementById('app'));
        });
      }
    });
  }

  document.getElementById('clear-search')?.addEventListener('click', () => {
    searchQuery = '';
    currentCategory = 'all';
    renderStore(document.getElementById('app'));
  });

  document.querySelectorAll('.shop-filter').forEach(btn => {
    btn.onclick = () => {
      currentCategory = btn.dataset.category;
      renderStore(document.getElementById('app'));
    };
  });

  document.querySelectorAll('.nav-page').forEach(btn => {
    btn.onclick = () => {
      currentPage = btn.dataset.page;
      isMobileMenuOpen = false;
      isCartOpen = false;
      window.scrollTo(0, 0);
      renderStore(document.getElementById('app'));
    };
  });

  document.getElementById('nav-logo').onclick = (e) => {
    e.preventDefault();
    currentPage = 'home';
    currentCategory = 'all';
    currentProductSlug = null;
    isMobileMenuOpen = false;
    isCartOpen = false;
    window.location.hash = '';
    window.scrollTo(0, 0);
    renderStore(document.getElementById('app'));
  };

  document.querySelectorAll('.product-link').forEach(btn => {
    btn.onclick = () => {
      const slug = btn.dataset.slug;
      window.location.hash = `#product/${slug}`;
      window.scrollTo(0, 0);
    };
  });

  document.getElementById('clear-cart')?.addEventListener('click', () => {
    cart = [];
    syncCart();
    renderStore(document.getElementById('app'), true);
    showNotification('Cart Cleared');
  });

  const variantSelections = {};
  
  document.querySelectorAll('.variant-btn').forEach(btn => {
    btn.onclick = () => {
      const group = btn.dataset.group;
      const value = btn.dataset.value;
      
      // Toggle visual selection
      document.querySelectorAll(`.variant-btn[data-group="${group}"]`).forEach(b => {
        b.classList.remove('border-brand-green', 'bg-brand-green', 'text-white', 'shadow-lg');
        b.classList.add('border-brand-green/5');
      });
      
      btn.classList.remove('border-brand-green/5');
      btn.classList.add('border-brand-green', 'bg-brand-green', 'text-white', 'shadow-lg');
      
      variantSelections[group] = value;
      
      // Auto-switch gallery image if linked
      if (selectedProductForModal.images) {
        const linkedImg = selectedProductForModal.images.find(img => {
          const val = selectedProductForModal.attribute_values.find(av => av.id == img.attribute_value_id);
          return val && val.name === value && val.attribute_name === group;
        });
        
        if (linkedImg) {
          const mainImg = document.getElementById('main-gallery-img');
          if (mainImg) {
            mainImg.style.opacity = '0';
            setTimeout(() => {
              mainImg.src = linkedImg.image_url;
              mainImg.style.opacity = '1';
            }, 200);
          }
          
          // Update thumbs
          document.querySelectorAll('.gallery-thumb').forEach(thumb => {
             if (thumb.dataset.url === linkedImg.image_url) {
               thumb.classList.add('border-brand-green', 'shadow-md', 'opacity-100');
               thumb.classList.remove('border-transparent', 'opacity-40');
             } else {
               thumb.classList.remove('border-brand-green', 'shadow-md', 'opacity-100');
               thumb.classList.add('border-transparent', 'opacity-40');
             }
          });
        }
      }

      checkModalStatus();
    };
  });

  document.querySelectorAll('.gallery-thumb').forEach(btn => {
    btn.onclick = () => {
      const url = btn.dataset.url;
      const mainImg = document.getElementById('main-gallery-img');
      if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
          mainImg.src = url;
          mainImg.style.opacity = '1';
        }, 200);
      }
      
      document.querySelectorAll('.gallery-thumb').forEach(b => {
        b.classList.remove('border-brand-green', 'shadow-md', 'opacity-100');
        b.classList.add('border-transparent', 'opacity-40');
      });
      btn.classList.add('border-brand-green', 'shadow-md', 'opacity-100');
    };
  });

  function checkModalStatus() {
    const addBtn = document.getElementById('modal-add-to-cart');
    if (!addBtn || !selectedProductForModal) return;
    
    // Get unique attribute groups available for this product
    const attributeNames = [...new Set(selectedProductForModal.attribute_values.map(av => av.attribute_name))];
    const allSelected = attributeNames.every(name => variantSelections[name]);
    
    if (allSelected) {
      addBtn.disabled = false;
      addBtn.querySelector('.group-disabled\\:inline')?.classList.add('hidden');
      addBtn.querySelector('.group-disabled\\:hidden')?.classList.remove('hidden');
    }
  }

  document.getElementById('modal-add-to-cart')?.addEventListener('click', () => {
    const attributeNames = [...new Set(selectedProductForModal.attribute_values.map(av => av.attribute_name))];
    const allSelected = attributeNames.every(name => variantSelections[name]);

    if (!allSelected) {
      // Show warnings
      document.querySelectorAll('.attribute-row').forEach(row => {
        const group = row.dataset.groupName;
        if (!variantSelections[group]) {
          row.querySelector('.required-indicator').style.opacity = '1';
        } else {
          row.querySelector('.required-indicator').style.opacity = '0';
        }
      });
      return;
    }

    addToCart({ 
      ...selectedProductForModal, 
      selectedVariants: { ...variantSelections }
    });
    
    selectedProductForModal = null;
    renderStore(document.getElementById('app'));
    showNotification('Item Curated Successfully');
  });

  document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
    isMobileMenuOpen = !isMobileMenuOpen;
    renderStore(document.getElementById('app'));
  });

  document.getElementById('cart-toggle').onclick = toggleCart;
  document.getElementById('close-cart').onclick = toggleCart;
  document.getElementById('cart-backdrop').onclick = toggleCart;

  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const product = products.find(p => p.id == id);
      if (product) addToCart(product);
    };
  });

  document.querySelectorAll('.cart-qty-btn').forEach(btn => {
    btn.onclick = () => updateCartQty(btn.dataset.id, btn.dataset.action);
  });

  document.querySelectorAll('.cart-remove').forEach(btn => {
    btn.onclick = () => removeFromCart(btn.dataset.id);
  });

  document.querySelectorAll('.osusu-tier-btn').forEach(btn => {
    btn.onclick = () => {
      currentOsusuTier = btn.dataset.tier;
      renderStore(document.getElementById('app'));
    };
  });

  const checkoutBtn = document.getElementById('checkout-whatsapp');
  if (checkoutBtn) checkoutBtn.onclick = checkoutWhatsApp;

  document.getElementById('toggle-coupon')?.addEventListener('click', () => {
    isCouponInputVisible = true;
    renderStore(document.getElementById('app'), true);
  });

  document.getElementById('apply-coupon')?.addEventListener('click', async () => {
    const code = document.getElementById('coupon-code').value.trim();
    if (!code) return;
    
    const res = await makeApiCall(`/api/coupons/validate/${code}`);
    if (res && !res.error) {
      const subtotal = cart.reduce((sum, item) => sum + (item.discount_price || item.price) * item.quantity, 0);
      if (subtotal < res.min_amount) {
        showNotification(`Min. order of ₦${res.min_amount} required`);
        return;
      }
      appliedCoupon = res;
      renderStore(document.getElementById('app'), true);
      showNotification('Success: Coupon Applied');
    } else {
      showNotification('Error: Invalid Coupon Code');
    }
  });

  document.getElementById('remove-coupon')?.addEventListener('click', () => {
    appliedCoupon = null;
    renderStore(document.getElementById('app'), true);
    showNotification('Coupon Removed');
  });
};

// Cart Logic
const toggleCart = () => {
  isCartOpen = !isCartOpen;
  renderStore(document.getElementById('app'), true);
};

const showNotification = (message) => {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-10 right-10 bg-brand-green text-brand-cream px-8 py-4 rounded-2xl shadow-2xl z-[100] animate-fade-in flex items-center gap-4 border border-luxury-gold/20';
  toast.innerHTML = `
    <span class="text-luxury-gold">✨</span>
    <span class="text-[10px] uppercase tracking-widest font-black">${message}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-4');
    toast.style.transition = 'all 0.5s ease';
    setTimeout(() => toast.remove(), 500);
  }, 2500);
};

const showConfirm = (message) => {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-brand-green/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white p-10 rounded-[2rem] border border-luxury-gold/20 shadow-2xl max-w-sm w-full text-center">
        <h4 class="text-[10px] uppercase tracking-[0.4em] font-black text-brand-green/40 mb-6">Security Clearance</h4>
        <p class="text-sm font-medium text-brand-green mb-10 uppercase tracking-tight">${message}</p>
        <div class="grid grid-cols-2 gap-4">
          <button id="confirm-cancel" class="py-4 border border-brand-green/10 rounded-xl text-[9px] uppercase tracking-widest font-black text-brand-green hover:bg-brand-green/5 transition-all cursor-pointer">Cancel</button>
          <button id="confirm-ok" class="py-4 bg-brand-green text-brand-cream rounded-xl text-[9px] uppercase tracking-widest font-black hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20 cursor-pointer">Proceed</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('#confirm-cancel').onclick = () => {
      modal.remove();
      resolve(false);
    };
    modal.querySelector('#confirm-ok').onclick = () => {
      modal.remove();
      resolve(true);
    };
  });
};

const addToCart = (product) => {
  const normalizedProduct = { ...product };
  
  if (product.selectedVariants) {
    if (product.selectedVariants['Color']) normalizedProduct.selectedColor = product.selectedVariants['Color'];
    if (product.selectedVariants['Size']) normalizedProduct.selectedSize = product.selectedVariants['Size'];
    if (product.selectedVariants['color']) normalizedProduct.selectedColor = product.selectedVariants['color'];
    if (product.selectedVariants['size']) normalizedProduct.selectedSize = product.selectedVariants['size'];
  }

  // If adding from card and product has mandatory attributes, redirect to detail instead
  if (!product.selectedVariants && product.attribute_values && product.attribute_values.length > 0) {
    window.location.hash = `#product/${product.slug}`;
    window.scrollTo(0, 0);
    return;
  }

  // Key represents uniqueness including variants
  const cartKey = `${normalizedProduct.id}-${normalizedProduct.selectedColor || ''}-${normalizedProduct.selectedSize || ''}`;
  const existing = cart.find(item => `${item.id}-${item.selectedColor || ''}-${item.selectedSize || ''}` === cartKey);
  
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...normalizedProduct, quantity: 1 });
  }
  syncCart();
  showNotification('Success: Added to Cart');
};

const removeFromCart = (key) => {
  cart = cart.filter(item => `${item.id}-${item.selectedColor || ''}-${item.selectedSize || ''}` !== key);
  syncCart();
};

const updateCartQty = (key, action) => {
  const item = cart.find(i => `${i.id}-${i.selectedColor || ''}-${i.selectedSize || ''}` === key);
  if (!item) return;
  if (action === 'inc') item.quantity++;
  else if (item.quantity > 1) item.quantity--;
  syncCart();
};

const syncCart = () => {
  localStorage.setItem('fit_point_cart', JSON.stringify(cart));
  updateCartUI();
};

const updateCartUI = () => {
  // Update navbar count
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    cartCount.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Update cart overlay if it's rendered
  const cartContainer = document.querySelector('#cart-sidebar .flex-grow.overflow-y-auto');
  if (cartContainer) {
    if (cart.length === 0) {
      cartContainer.innerHTML = '<div class="text-center py-20"><p class="text-3xl font-serif italic opacity-30 mb-8">Your cart is as light as air.</p><button class="nav-page secondary-btn" data-page="shop">Begin Curating</button></div>';
    } else {
      cartContainer.innerHTML = cart.map(item => {
        const itemKey = `${item.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`;
        const itemPrice = item.discount_price || item.price;
        return `
          <div class="flex gap-8 group">
            <div class="w-28 h-36 bg-gray-50 flex-shrink-0 overflow-hidden shadow-md">
              <img src="${item.image_url}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
            </div>
            <div class="flex-grow flex flex-col justify-between py-1">
              <div>
                <h4 class="font-serif font-medium text-xl text-brand-green">${item.name}</h4>
                <div class="mt-2 flex flex-wrap gap-2">
                  ${item.selectedColor ? `<span class="text-[8px] uppercase tracking-widest bg-brand-cream/30 text-brand-green px-2 py-1 font-black">Color: ${item.selectedColor}</span>` : ''}
                  ${item.selectedSize ? `<span class="text-[8px] uppercase tracking-widest bg-brand-cream/30 text-brand-green px-2 py-1 font-black">Size: ${item.selectedSize}</span>` : ''}
                </div>
              </div>
              <div class="flex justify-between items-center mt-6">
                <div class="flex items-center gap-6">
                  <button class="cart-qty-btn w-8 h-8 border border-brand-green/10 flex items-center justify-center hover:bg-brand-cream cursor-pointer text-xs transition-colors" data-id="${itemKey}" data-action="dec">-</button>
                  <span class="text-xs font-black font-sans text-brand-green">${item.quantity}</span>
                  <button class="cart-qty-btn w-8 h-8 border border-brand-green/10 flex items-center justify-center hover:bg-brand-cream cursor-pointer text-xs transition-colors" data-id="${itemKey}" data-action="inc">+</button>
                </div>
                <p class="text-base font-black font-sans text-brand-green">₦${(itemPrice * item.quantity).toFixed(2)}</p>
              </div>
              <button class="cart-remove mt-4 text-[8px] uppercase tracking-[0.3em] text-red-500 font-black cursor-pointer self-start hover:opacity-60 transition-opacity" data-id="${itemKey}">Remove from cart</button>
            </div>
          </div>
        `;
      }).join('');
    }
    
    // Re-bind cart events
    cartContainer.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.onclick = () => updateCartQty(btn.dataset.id, btn.dataset.action);
    });
    cartContainer.querySelectorAll('.cart-remove').forEach(btn => {
      btn.onclick = () => removeFromCart(btn.dataset.id);
    });
    cartContainer.querySelectorAll('.nav-page').forEach(btn => {
      btn.onclick = () => { currentPage = btn.dataset.page; render(); };
    });
  }

  // Update totals
  const subtotal = cart.reduce((sum, item) => sum + (item.discount_price || item.price) * item.quantity, 0);
  let discountAmount = 0;
  if (appliedCoupon) {
    discountAmount = appliedCoupon.type === 'percentage' ? (subtotal * appliedCoupon.value / 100) : appliedCoupon.value;
  }
  const total = Math.max(0, subtotal - discountAmount);
  
  const subtotalEl = document.querySelector('#cart-sidebar .flex.justify-between span:last-child');
  if (subtotalEl) subtotalEl.innerText = `₦${subtotal.toFixed(2)}`;
  
  const totalEl = document.querySelector('#cart-sidebar .text-3xl.font-serif.font-medium');
  if (totalEl) totalEl.innerText = `₦${total.toFixed(2)}`;
  
  // Handle sidebar visibility
  const sidebar = document.getElementById('cart-sidebar');
  const backdrop = document.getElementById('cart-backdrop');
  if (sidebar && backdrop) {
    if (isCartOpen) {
      sidebar.classList.remove('translate-x-full');
      sidebar.classList.add('translate-x-0');
      backdrop.classList.remove('hidden', 'opacity-0');
      backdrop.classList.add('opacity-100');
    } else {
      sidebar.classList.remove('translate-x-0');
      sidebar.classList.add('translate-x-full');
      backdrop.classList.add('opacity-0');
      setTimeout(() => { if (!isCartOpen) backdrop.classList.add('hidden'); }, 700);
    }
  }
};

const checkoutWhatsApp = async () => {
  if (cart.length === 0) return;
  
  const subtotal = cart.reduce((sum, item) => sum + (item.discount_price || item.price) * item.quantity, 0);
  let discountAmount = 0;
  if (appliedCoupon) {
    discountAmount = appliedCoupon.type === 'percentage' 
      ? subtotal * (appliedCoupon.value / 100) 
      : appliedCoupon.value;
  }
  const total = Math.max(0, subtotal - discountAmount);
  
  // Record the order silently for admin dashboard stats
  const orderData = {
    customer_name: "WhatsApp Customer name",
    customer_phone: "Customer Phone number",
    total_amount: total,
    items: cart.map(item => ({
      ...item,
      price: item.discount_price || item.price
    })),
    coupon_code: appliedCoupon ? appliedCoupon.code : null
  };

  let orderIdFormatted = "Pending";
  try {
    const res = await makeApiCall('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (res && res.orderId) {
      orderIdFormatted = `FP-${res.orderId.toString().padStart(4, '0')}`;
    }
  } catch (e) {
    console.warn("Order persistence failed, proceeding to WhatsApp.");
  }
  
  let msg = `Hello Fit Point! I'd like to place an order (ID: ${orderIdFormatted}):\n\n`;
  cart.forEach(item => {
    const effectivePrice = item.discount_price || item.price;
    msg += `• ${item.name}`;
    if (item.selectedColor) msg += ` (Color: ${item.selectedColor})`;
    if (item.selectedSize) msg += ` (Size: ${item.selectedSize})`;
    msg += ` x ${item.quantity}${item.quantity > 1 ? ` (₦${effectivePrice.toFixed(2)} each)` : ''} - ₦${(effectivePrice * item.quantity).toFixed(2)}\n`;
  });
  
  msg += `\nSubtotal: ₦${subtotal.toFixed(2)}`;
  if (appliedCoupon) {
    msg += `\nCoupon: ${appliedCoupon.code} (-₦${discountAmount.toFixed(2)})`;
  }
  msg += `\nTotal Amount: ₦${total.toFixed(2)}`;
  
  // Clear cart AFTER building the message
  cart = [];
  appliedCoupon = null;
  syncCart();
  
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
};

const renderContact = (container) => {
  const whatsapp = adminSettings.whatsapp_number || WHATSAPP_NUMBER;
  const email = adminSettings.email || 'concierge@fitpoint.com';
  const address = adminSettings.address || 'LAGOS CENTRAL SHOWROOM';

  container.innerHTML = `
    <main class="animate-fade-in bg-white min-h-screen">
      <!-- Hero -->
      <section class="py-40 bg-brand-cream px-6 text-center">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-6xl md:text-8xl font-serif text-brand-green mb-10 tracking-tight">Contact <span class="italic text-luxury-gold">Us</span></h1>
          <p class="text-xl text-brand-green/60 font-serif italic mb-12">"We are here to assist your luxury journey."</p>
          <div class="w-24 h-1 bg-luxury-gold mx-auto mb-16"></div>
        </div>
      </section>

      <!-- Contact Info -->
      <section class="py-32 px-6 max-w-5xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
          <div class="space-y-6">
            <div class="w-16 h-16 bg-brand-green/5 rounded-full flex items-center justify-center mx-auto mb-8">
              <span class="text-2xl">📱</span>
            </div>
            <h4 class="text-[10px] uppercase tracking-[0.3em] font-black text-brand-green/40">WhatsApp Liaison</h4>
            <p class="text-xl font-serif text-brand-green">${whatsapp}</p>
            <a href="https://wa.me/${whatsapp.replace(/\D/g, '')}" target="_blank" class="inline-block text-[9px] uppercase tracking-widest font-black text-luxury-gold border-b border-luxury-gold pb-1 mt-4 hover:opacity-60 transition-opacity">Message Us →</a>
          </div>

          <div class="space-y-6">
            <div class="w-16 h-16 bg-brand-green/5 rounded-full flex items-center justify-center mx-auto mb-8">
              <span class="text-2xl">✉️</span>
            </div>
            <h4 class="text-[10px] uppercase tracking-[0.3em] font-black text-brand-green/40">Email Correspondence</h4>
            <p class="text-xl font-serif text-brand-green">${email}</p>
            <a href="mailto:${email}" class="inline-block text-[9px] uppercase tracking-widest font-black text-luxury-gold border-b border-luxury-gold pb-1 mt-4 hover:opacity-60 transition-opacity">Write to Us →</a>
          </div>

          <div class="space-y-6">
            <div class="w-16 h-16 bg-brand-green/5 rounded-full flex items-center justify-center mx-auto mb-8">
              <span class="text-2xl">📍</span>
            </div>
            <h4 class="text-[10px] uppercase tracking-[0.3em] font-black text-brand-green/40">Our Showroom</h4>
            <p class="text-xl font-serif text-brand-green leading-relaxed">${address}</p>
          </div>
        </div>
      </section>
    </main>
  `;
};

const renderMaintenance = (container) => {
  container.innerHTML = `
    <div class="min-h-screen bg-brand-cream flex items-center justify-center p-6 text-center">
      <div class="max-w-xl w-full bg-white p-12 md:p-20 border border-brand-green/10 rounded-[3rem] shadow-2xl animate-fade-in">
        <h1 class="text-5xl md:text-7xl font-serif text-brand-green mb-8 tracking-tight">Curation in <span class="italic text-luxury-gold">Progress</span></h1>
        <div class="w-16 h-1 bg-luxury-gold mx-auto mb-10"></div>
        <p class="text-lg text-brand-green/60 font-serif italic leading-relaxed mb-12">
          "Our digital showroom is currently undergoing a private curation. We will resume our luxury services shortly."
        </p>
        <div class="space-y-8">
          <div class="space-y-4">
            <p class="text-[9px] uppercase tracking-[0.4em] font-black text-brand-green/30">WhatsApp Liaison</p>
            <p class="text-sm font-serif text-brand-green">${adminSettings.whatsapp_number || WHATSAPP_NUMBER}</p>
          </div>
          <div class="space-y-4">
            <p class="text-[9px] uppercase tracking-[0.4em] font-black text-brand-green/30">Email Correspondence</p>
            <p class="text-sm font-serif text-brand-green">${adminSettings.email || 'concierge@fitpoint.com'}</p>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Admin UI Components
const AdminSidebar = () => `
  <div class="fixed inset-0 bg-brand-green/50 z-[55] lg:hidden transition-opacity duration-300 ${isAdminMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}" id="admin-sidebar-overlay"></div>
  <aside id="admin-sidebar" class="w-72 bg-brand-green h-screen flex flex-col fixed left-0 top-0 z-[60] text-brand-cream transition-transform duration-300 transform ${isAdminMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl lg:shadow-none">
    <div class="p-10 mb-8 shrink-0 flex justify-between items-center border-b border-white/5">
      <div>
        <h2 class="text-2xl font-serif italic leading-none">Fit <span class="text-luxury-gold">Point</span></h2>
        <p class="text-[7px] uppercase tracking-[0.4em] text-brand-cream/40 mt-3 font-black tracking-widest">Management Atelier</p>
      </div>
      <button id="close-admin-sidebar" class="lg:hidden text-white/40 hover:text-white transition-colors cursor-pointer p-4 -mr-4">✕</button>
    </div>
    <nav class="space-y-1 flex-grow overflow-y-auto admin-sidebar-scroll px-6 pb-10">
      <button class="admin-tab-btn w-full text-left flex items-center gap-4 py-4 px-6 rounded-2xl transition-all ${currentAdminTab === 'dashboard' ? 'bg-white/10 text-white shadow-lg shadow-black/20' : 'text-white/40 hover:text-white hover:bg-white/5'}" data-tab="dashboard">
        <span class="text-lg opacity-60">📊</span>
        <span class="text-[9px] uppercase tracking-[0.2em] font-bold">Dashboard</span>
      </button>
      <button class="admin-tab-btn w-full text-left flex items-center gap-4 py-4 px-6 rounded-2xl transition-all ${currentAdminTab === 'config' ? 'bg-white/10 text-white shadow-lg shadow-black/20' : 'text-white/40 hover:text-white hover:bg-white/5'}" data-tab="config">
        <span class="text-lg opacity-60">⚙️</span>
        <span class="text-[9px] uppercase tracking-[0.2em] font-bold">Product Config</span>
      </button>
      <button class="admin-tab-btn w-full text-left flex items-center gap-4 py-4 px-6 rounded-2xl transition-all ${currentAdminTab === 'inventory' ? 'bg-white/10 text-white shadow-lg shadow-black/20' : 'text-white/40 hover:text-white hover:bg-white/5'}" data-tab="inventory">
        <span class="text-lg opacity-60">📦</span>
        <span class="text-[9px] uppercase tracking-[0.2em] font-bold">Products</span>
      </button>
      <button class="admin-tab-btn w-full text-left flex items-center gap-4 py-4 px-6 rounded-2xl transition-all ${currentAdminTab === 'promotions' ? 'bg-white/10 text-white shadow-lg shadow-black/20' : 'text-white/40 hover:text-white hover:bg-white/5'}" data-tab="promotions">
        <span class="text-lg opacity-60">🏷️</span>
        <span class="text-[9px] uppercase tracking-[0.2em] font-bold">Promotions</span>
      </button>
      <button class="admin-tab-btn w-full text-left flex items-center gap-4 py-4 px-6 rounded-2xl transition-all ${currentAdminTab === 'orders' ? 'bg-white/10 text-white shadow-lg shadow-black/20' : 'text-white/40 hover:text-white hover:bg-white/5'}" data-tab="orders">
        <span class="text-lg opacity-60">📜</span>
        <span class="text-[9px] uppercase tracking-[0.2em] font-bold">Orders</span>
      </button>
      <button class="admin-tab-btn w-full text-left flex items-center gap-4 py-4 px-6 rounded-2xl transition-all ${currentAdminTab === 'payments' ? 'bg-white/10 text-white shadow-lg shadow-black/20' : 'text-white/40 hover:text-white hover:bg-white/5'}" data-tab="payments">
        <span class="text-lg opacity-60">💳</span>
        <span class="text-[9px] uppercase tracking-[0.2em] font-bold">Payments</span>
      </button>
      <button class="admin-tab-btn w-full text-left flex items-center gap-4 py-4 px-6 rounded-2xl transition-all ${currentAdminTab === 'settings' ? 'bg-white/10 text-white shadow-lg shadow-black/20' : 'text-white/40 hover:text-white hover:bg-white/5'}" data-tab="settings">
        <span class="text-lg opacity-60">🛠️</span>
        <span class="text-[9px] uppercase tracking-[0.2em] font-bold">Settings</span>
      </button>
      <a href="/" class="w-full text-left flex items-center gap-4 py-4 px-6 mt-10 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all border border-white/5">
        <span class="text-lg opacity-60">🏠</span>
        <span class="text-[9px] uppercase tracking-[0.2em] font-bold">View Store</span>
      </a>
    </nav>
    <button id="logout" class="mt-8 shrink-0 flex items-center gap-4 py-4 px-6 rounded-2xl text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 transition-all cursor-pointer">
      <span class="text-lg">🚪</span>
      <span>Sign Out</span>
    </button>
  </aside>
`;

const drawPerformanceCurve = (data) => {
  const container = document.getElementById('performance-chart-container');
  if (!container || !data || data.length === 0) return;

  container.innerHTML = '';
  
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scalePoint()
    .domain(data.map(d => d.date))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.total) * 1.2 || 1000])
    .range([height, 0]);

  // Area under the curve
  const area = d3.area()
    .x(d => x(d.date))
    .y0(height)
    .y1(d => y(d.total))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(data)
    .attr('fill', 'url(#chart-gradient)')
    .attr('d', area);

  // Gradient for the area
  const defs = svg.append('defs');
  const gradient = defs.append('linearGradient')
    .attr('id', 'chart-gradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%');
  
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#1a3c34').attr('stop-opacity', 0.1);
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#1a3c34').attr('stop-opacity', 0);

  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.total))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#1a3c34')
    .attr('stroke-width', 2)
    .attr('d', line);

  // Dots
  svg.selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => x(d.date))
    .attr('cy', d => y(d.total))
    .attr('r', 3)
    .attr('fill', '#c5a059')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .on('mouseover', function(event, d) {
       d3.select(this).attr('r', 6).attr('stroke-width', 3);
    })
    .on('mouseout', function() {
       d3.select(this).attr('r', 3).attr('stroke-width', 1.5);
    });

  // Axes
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => {
       if (adminInsightsPeriod === 'daily') return d.split('-').slice(-1)[0];
       if (adminInsightsPeriod === 'weekly') return d.split('-W')[1];
       return d.split('-').slice(-1)[0];
    }))
    .attr('font-size', '8px')
    .attr('font-family', 'Inter')
    .call(g => g.select('.domain').attr('stroke', '#f0f0f0'))
    .call(g => g.selectAll('line').attr('stroke', '#f0f0f0'));

  svg.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d >= 1000 ? `${d/1000}k` : d))
    .attr('font-size', '8px')
    .attr('font-family', 'Inter')
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('line').attr('stroke', '#f0f0f0').attr('stroke-dasharray', '2,2'));
};

const AdminDashboard = (stats, orders) => {
  // Process data based on period
  const getDailyData = () => {
    return stats.dailySales || [];
  };

  const getWeeklyData = () => {
    const weekly = {};
    orders.filter(o => o.status === 'paid' || o.status === 'processed').forEach(o => {
      const date = new Date(o.created_at);
      const year = date.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      const key = `${year}-W${weekNum}`;
      if (!weekly[key]) weekly[key] = { date: key, total: 0 };
      weekly[key].total += o.total_amount;
    });
    return Object.values(weekly).sort((a, b) => a.date.localeCompare(b.date)).slice(-8);
  };

  const getMonthlyData = () => {
    const monthly = {};
    orders.filter(o => o.status === 'paid' || o.status === 'processed').forEach(o => {
      const date = new Date(o.created_at);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { date: key, total: 0 };
      monthly[key].total += o.total_amount;
    });
    return Object.values(monthly).sort((a, b) => a.date.localeCompare(b.date)).slice(-12);
  };

  const activeData = adminInsightsPeriod === 'daily' ? getDailyData() : (adminInsightsPeriod === 'weekly' ? getWeeklyData() : getMonthlyData());

  return `
  <div class="animate-fade-in space-y-8 md:space-y-12 pb-20">
    <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
      <div>
        <h2 class="text-[10px] uppercase tracking-[0.5em] text-brand-green/40 font-black mb-4">Command Center</h2>
        <h3 class="text-3xl md:text-5xl font-serif text-brand-green">Strategic Dashboard</h3>
      </div>
      <div class="flex gap-2">
        <button class="insights-filter-btn px-4 py-2 rounded-full text-[8px] uppercase font-black border transition-all ${adminInsightsPeriod === 'daily' ? 'bg-brand-green text-white border-brand-green' : 'border-brand-green/10 text-brand-green/40 hover:border-brand-green/30'}" data-period="daily">Daily</button>
        <button class="insights-filter-btn px-4 py-2 rounded-full text-[8px] uppercase font-black border transition-all ${adminInsightsPeriod === 'weekly' ? 'bg-brand-green text-white border-brand-green' : 'border-brand-green/10 text-brand-green/40 hover:border-brand-green/30'}" data-period="weekly">Weekly</button>
        <button class="insights-filter-btn px-4 py-2 rounded-full text-[8px] uppercase font-black border transition-all ${adminInsightsPeriod === 'monthly' ? 'bg-brand-green text-white border-brand-green' : 'border-brand-green/10 text-brand-green/40 hover:border-brand-green/30'}" data-period="monthly">Monthly</button>
      </div>
    </header>
 
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
      <div class="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-brand-green/5">
        <p class="text-[9px] uppercase tracking-widest font-black opacity-30 mb-4">Gross Revenue</p>
        <p class="text-3xl md:text-4xl font-serif text-brand-green">₦${(stats.revenue || 0).toLocaleString()}</p>
        <div class="mt-4 md:mt-6 flex items-center gap-2 text-green-500 text-[10px] font-black uppercase">
          <span>↑</span>
          <span>Growth Active</span>
        </div>
      </div>
      <div class="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-brand-green/5">
        <p class="text-[9px] uppercase tracking-widest font-black opacity-30 mb-4">Payment Pending</p>
        <p class="text-3xl md:text-4xl font-serif text-brand-green">${stats.pending || 0}</p>
        <div class="mt-4 md:mt-6 text-[10px] font-black uppercase tracking-widest ${stats.pending > 0 ? 'text-amber-500' : 'text-brand-green/30'}">
          ${stats.pending > 0 ? 'In Progress' : 'Queue Balanced'}
        </div>
      </div>
      <div class="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-brand-green/5">
        <p class="text-[9px] uppercase tracking-widest font-black opacity-30 mb-4">Rejected Payments</p>
        <p class="text-3xl md:text-4xl font-serif text-red-400">${stats.rejected || 0}</p>
        <div class="mt-4 md:mt-6 text-[10px] font-black uppercase tracking-widest text-red-300">
          Resolution Required
        </div>
      </div>
      <div class="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-brand-green/5">
        <p class="text-[9px] uppercase tracking-widest font-black opacity-30 mb-4">Total Designs</p>
        <p class="text-3xl md:text-4xl font-serif text-brand-green">${stats.totalProducts || 0}</p>
      </div>
    </div>
 
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <!-- Activity Curve -->
      <div class="lg:col-span-1 bg-white p-6 md:p-12 rounded-2xl shadow-sm border border-brand-green/5 h-full">
        <h4 class="text-[10px] uppercase tracking-[0.4em] font-black opacity-40 mb-10 md:mb-12">Performance Curve (${adminInsightsPeriod})</h4>
        <div id="performance-chart-container" class="h-64 flex items-end">
          <!-- d3 chart injected here -->
        </div>
        <div class="mt-12 grid grid-cols-3 gap-6 pt-10 border-t border-brand-green/5">
          <div>
            <p class="text-[7px] uppercase tracking-widest font-black opacity-30 mb-2">Period Total</p>
            <p class="text-sm font-bold text-brand-green">₦${activeData.reduce((sum, d) => sum + d.total, 0).toLocaleString()}</p>
          </div>
          <div>
            <p class="text-[7px] uppercase tracking-widest font-black opacity-30 mb-2">Points</p>
            <p class="text-sm font-bold text-brand-green">${activeData.length}</p>
          </div>
          <div>
            <p class="text-[7px] uppercase tracking-widest font-black opacity-30 mb-2">Average</p>
            <p class="text-sm font-bold text-brand-green">₦${(activeData.length > 0 ? activeData.reduce((sum, d) => sum + d.total, 0) / activeData.length : 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
          </div>
        </div>
      </div>

      <!-- Recent Orders List -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-brand-green/5 overflow-hidden">
        <div class="p-8 border-b border-brand-green/5 flex justify-between items-center">
           <h4 class="text-[10px] uppercase tracking-[0.4em] font-black opacity-40">Recent Activity</h4>
           <button class="admin-tab-btn text-[9px] uppercase tracking-widest font-black text-brand-green opacity-40 hover:opacity-100" data-tab="orders">View Registry</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs uppercase tracking-widest font-black">
            <tbody class="divide-y divide-brand-green/5">
              ${orders.slice(0, 5).map(order => `
                <tr class="hover:bg-brand-cream/5 transition-colors">
                  <td class="py-4 md:py-6 px-4 md:px-10">
                    <p class="text-brand-green text-[10px] md:text-xs font-black">${order.order_id_formatted}</p>
                    <p class="text-[7px] opacity-30 mt-1">${order.customer_phone}</p>
                  </td>
                  <td class="py-4 md:py-6 px-4 md:px-10 text-brand-green text-[10px]">₦${order.total_amount.toFixed(0)}</td>
                  <td class="py-4 md:py-6 px-4 md:px-10 text-right">
                    <span class="px-2 md:px-3 py-1 rounded-full text-[6px] md:text-[7px] ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-600'}">${order.status}</span>
                  </td>
                </tr>
              `).join('')}
              ${orders.length === 0 ? '<tr><td colspan="3" class="py-10 text-center italic opacity-20 capitalize">Quiet in the registry today.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  `;
};

const AdminProductConfig = (categories, attributes) => {
  const editingCategory = editingCategoryId ? categories.find(c => c.id == editingCategoryId) : null;
  const editingAttribute = editingAttributeId ? attributes.find(a => a.id == editingAttributeId) : null;
  
  // If we are viewing values of a specific attribute
  if (currentAttributeId) {
    const attribute = attributes.find(a => a.id == currentAttributeId);
    const editingValue = editingAttributeValueId ? attribute.values.find(v => v.id == editingAttributeValueId) : null;

    return `
      <div class="animate-fade-in space-y-12 pb-20">
        <header class="flex justify-between items-center">
          <div>
            <h2 class="text-[10px] uppercase tracking-[0.5em] text-brand-green/40 font-black mb-4">Variation Control</h2>
            <h3 class="text-3xl md:text-5xl font-serif text-brand-green uppercase tracking-tighter">Values of ${attribute.name}</h3>
          </div>
          <button id="back-to-config" class="bg-brand-green/5 hover:bg-brand-green/10 text-brand-green px-8 py-4 rounded-xl text-[9px] uppercase tracking-[0.2em] font-black transition-all flex items-center gap-3">
            <span>←</span> Back to Config
          </button>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <!-- Add/Edit Value Form -->
          <div class="bg-white p-10 rounded-2xl shadow-sm border border-brand-green/5 lg:sticky lg:top-24">
            <h4 class="text-[10px] uppercase tracking-[0.4em] font-black opacity-40 mb-8">${editingValue ? 'Update' : 'Add New'} Value</h4>
            <form id="attribute-value-form" class="space-y-8">
              <input type="hidden" name="id" value="${editingValue?.id || ''}">
              <input type="hidden" name="attribute_id" value="${currentAttributeId}">
              <div>
                <label class="block text-[8px] uppercase tracking-[0.3em] font-black text-brand-green/30 mb-3">Label Name</label>
                <input type="text" name="name" required value="${editingValue?.name || ''}" placeholder="e.g. Onyx" class="w-full border-b-2 border-brand-green/5 py-4 bg-transparent text-sm focus:border-brand-green outline-none transition-colors text-brand-green font-medium">
              </div>
              <div>
                <label class="block text-[8px] uppercase tracking-[0.3em] font-black text-brand-green/30 mb-3">Value ${attribute.type === 'color' ? '(Hex Code)' : '(Label)'}</label>
                <div class="flex gap-4">
                  ${attribute.type === 'color' ? `<div class="w-12 h-12 rounded-lg border border-brand-green/10 shadow-inner" style="background-color: ${editingValue?.value || '#000000'}"></div>` : ''}
                  <input type="text" name="value" value="${editingValue?.value || ''}" placeholder="${attribute.type === 'color' ? '#000000' : 'Value'}" class="flex-grow border-b-2 border-brand-green/5 py-4 bg-transparent text-sm focus:border-brand-green outline-none transition-colors text-brand-green font-medium">
                </div>
                ${attribute.type === 'color' ? `<p class="text-[7px] uppercase tracking-widest text-brand-green/40 mt-3 font-bold">Standard HEX format required for visual rendering.</p>` : ''}
              </div>
              <button type="submit" class="w-full bg-brand-green text-white py-5 rounded-xl text-[9px] uppercase tracking-[0.2em] font-black shadow-lg shadow-brand-green/20 active-scale cursor-pointer">${editingValue ? 'Sync Value' : 'Submit Value'}</button>
              ${editingValue ? `<button type="button" id="cancel-val-edit" class="w-full text-[8px] uppercase font-black opacity-30 hover:opacity-100 transition-opacity mt-4 py-2">Abort Changes</button>` : ''}
            </form>
          </div>

          <!-- Values List -->
          <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-brand-green/5 overflow-hidden">
            <table class="w-full text-left">
              <thead class="bg-brand-green/5 border-b">
                <tr>
                  <th class="py-6 px-10 text-[8px] uppercase tracking-widest font-black opacity-30">Name</th>
                  <th class="py-6 px-10 text-[8px] uppercase tracking-widest font-black opacity-30">Value</th>
                  <th class="py-6 px-10 text-right text-[8px] uppercase tracking-widest font-black opacity-30">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-green/5">
                ${attribute.values.map(v => `
                  <tr class="hover:bg-brand-cream/5 transition-colors group">
                    <td class="py-6 px-10 font-bold text-brand-green text-xs">${v.name}</td>
                    <td class="py-6 px-10">
                      ${attribute.type === 'color' ? `
                        <div class="flex items-center gap-4">
                          <div class="w-6 h-6 rounded-full shadow-sm border border-black/5" style="background-color: ${v.value}"></div>
                          <span class="text-[9px] font-mono opacity-40 uppercase tracking-tighter">${v.value}</span>
                        </div>
                      ` : `<span class="text-xs text-brand-green/60 font-medium">${v.value || '--'}</span>`}
                    </td>
                    <td class="py-6 px-10 text-right flex justify-end gap-6 items-center">
                      <button class="edit-val-btn text-[8px] uppercase tracking-widest font-black text-brand-green/20 hover:text-brand-green transition-colors cursor-pointer" data-id="${v.id}">Update</button>
                      <button class="delete-val-btn text-[8px] uppercase tracking-widest font-black text-red-200 hover:text-red-500 transition-colors cursor-pointer" data-id="${v.id}">Delete</button>
                    </td>
                  </tr>
                `).join('')}
                ${attribute.values.length === 0 ? `<tr><td colspan="3" class="py-20 text-center italic opacity-20 text-xs">No values established for this attribute.</td></tr>` : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  return `
  <div class="animate-fade-in space-y-16 pb-20">
    <header class="mb-8 md:mb-12">
      <h2 class="text-[10px] uppercase tracking-[0.5em] text-brand-green/40 font-black mb-4">Configuration</h2>
      <h3 class="text-3xl md:text-5xl font-serif text-brand-green uppercase tracking-tighter">Product Architecture</h3>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <!-- Category Management -->
      <div class="space-y-8">
        <div class="bg-white p-10 rounded-2xl shadow-sm border border-brand-green/5">
          <h4 class="text-[10px] uppercase tracking-[0.4em] font-black opacity-40 mb-8">${editingCategory ? 'Update' : 'Add New'} Collection</h4>
          <form id="category-form" class="flex gap-4">
            <input type="hidden" name="id" value="${editingCategory?.id || ''}">
            <input type="text" name="name" required value="${editingCategory?.name || ''}" placeholder="COLLECTION NAME" class="flex-grow border-b-2 border-brand-green/5 py-4 bg-transparent text-sm focus:border-brand-green outline-none transition-colors text-brand-green font-medium uppercase tracking-widest">
            <button type="submit" class="bg-brand-green text-white px-8 py-4 rounded-xl text-[9px] uppercase tracking-widest font-black active-scale cursor-pointer group flex items-center gap-3">
               ${editingCategory ? 'Sync Registry' : 'Create Collection'}
            </button>
            ${editingCategory ? `<button type="button" id="cancel-cat-edit" class="opacity-30 hover:opacity-100 transition-opacity text-[8px] uppercase font-black cursor-pointer">Abort</button>` : ''}
          </form>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-brand-green/5 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-brand-green/5 border-b">
                <tr>
                  <th class="py-6 px-10 text-[8px] uppercase tracking-widest font-black opacity-30">Active Collections</th>
                  <th class="py-6 px-10 text-right text-[8px] uppercase tracking-widest font-black opacity-30">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-green/5">
                ${categories.map(c => `
                  <tr class="hover:bg-brand-cream/5 transition-colors group">
                    <td class="py-6 px-10 font-serif text-brand-green text-lg">${c.name}</td>
                    <td class="py-6 px-10 text-right flex justify-end gap-6 items-center">
                      <button class="edit-cat-btn text-[8px] uppercase tracking-widest font-black text-brand-green/30 hover:text-brand-green transition-colors cursor-pointer" data-id="${c.id}">Update</button>
                      <button class="delete-cat-btn text-[8px] uppercase tracking-widest font-black text-red-200 hover:text-red-500 transition-colors cursor-pointer" data-id="${c.id}">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Attribute Management -->
      <div class="space-y-8">
        <div class="bg-white p-10 rounded-2xl shadow-sm border border-brand-green/5">
          <h4 class="text-[10px] uppercase tracking-[0.4em] font-black opacity-40 mb-8">${editingAttribute ? 'Update' : 'Define New'} Global Attribute</h4>
          <form id="attribute-form" class="flex flex-wrap gap-4">
            <input type="hidden" name="id" value="${editingAttribute?.id || ''}">
            <input type="text" name="name" required value="${editingAttribute?.name || ''}" placeholder="ATTRIBUTE NAME" class="flex-grow border-b-2 border-brand-green/5 py-4 bg-transparent text-sm focus:border-brand-green outline-none transition-colors text-brand-green font-medium uppercase tracking-widest">
            <select name="type" class="border-b-2 border-brand-green/5 py-4 bg-transparent text-xs focus:border-brand-green outline-none text-brand-green font-bold uppercase tracking-widest">
              <option value="text" ${editingAttribute?.type === 'text' ? 'selected' : ''}>Standard Text</option>
              <option value="color" ${editingAttribute?.type === 'color' ? 'selected' : ''}>Color Palette</option>
            </select>
            <button type="submit" class="bg-luxury-gold text-white px-8 py-4 rounded-xl text-[9px] uppercase tracking-widest font-black active-scale cursor-pointer">
              ${editingAttribute ? 'Update' : 'Define'}
            </button>
            ${editingAttribute ? `<button type="button" id="cancel-attr-edit" class="opacity-30 hover:opacity-100 transition-opacity text-[8px] uppercase font-black cursor-pointer">Abort</button>` : ''}
          </form>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-brand-green/5 overflow-hidden">
          <table class="w-full text-left">
            <thead class="bg-brand-green/5 border-b">
              <tr>
                <th class="py-6 px-10 text-[8px] uppercase tracking-widest font-black opacity-30">Attribute</th>
                <th class="py-6 px-10 text-[8px] uppercase tracking-widest font-black opacity-30">Type</th>
                <th class="py-6 px-10 text-[8px] uppercase tracking-widest font-black opacity-30">Values</th>
                <th class="py-6 px-10 text-right text-[8px] uppercase tracking-widest font-black opacity-30">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-green/5">
              ${attributes.map(a => `
                <tr class="hover:bg-brand-cream/5 transition-colors group">
                  <td class="py-6 px-10 font-bold text-brand-green text-sm">${a.name}</td>
                  <td class="py-6 px-10">
                    <span class="text-[8px] uppercase font-black px-3 py-1 rounded-full ${a.type === 'color' ? 'bg-luxury-gold/10 text-luxury-gold' : 'bg-brand-green/10 text-brand-green'}">${a.type}</span>
                  </td>
                  <td class="py-6 px-10">
                    <div class="flex items-center gap-3">
                       <span class="text-xs font-serif text-brand-green">${a.values?.length || 0}</span>
                       <button class="view-values-btn text-[7px] uppercase font-black bg-brand-green/5 hover:bg-brand-green text-brand-green hover:text-white px-3 py-1 rounded transition-all cursor-pointer" data-id="${a.id}">Manage values</button>
                    </div>
                  </td>
                  <td class="py-6 px-10 text-right flex justify-end gap-6 items-center">
                    <button class="edit-attr-btn text-[8px] uppercase tracking-widest font-black text-brand-green/20 hover:text-brand-green transition-colors cursor-pointer" data-id="${a.id}">Update</button>
                    <button class="delete-attr-btn text-[8px] uppercase tracking-widest font-black text-red-200 hover:text-red-500 transition-colors cursor-pointer" data-id="${a.id}">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
`;
};

const AdminInventory = (adminProducts, adminCats, adminAttributes = []) => {
  const editingProduct = editingProductId ? adminProducts.find(p => p.id == editingProductId) : null;
  const currentAttrIds = editingProduct?.attribute_values?.map(av => av.id) || [];

  return `
    <div class="animate-fade-in space-y-12 pb-20">
      <header class="mb-8 md:mb-12">
        <h2 class="text-[10px] uppercase tracking-[0.5em] text-brand-green/40 font-black mb-4">Inventory</h2>
        <h3 class="text-3xl md:text-5xl font-serif text-brand-green uppercase tracking-tighter">Design Catalog</h3>
      </header>

      <div class="grid grid-cols-1 gap-12">
        <!-- New Product Form Area -->
        <div class="bg-white rounded-3xl shadow-sm border border-brand-green/5 overflow-hidden">
          <div class="flex flex-col lg:flex-row border-b border-brand-green/5 min-h-[600px]">
            <!-- Sidebar Navigation -->
            <div class="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-brand-green/5 bg-brand-green/[0.01] p-8 space-y-2">
               <h4 class="text-[10px] uppercase tracking-[0.2em] font-black text-brand-green/30 mb-8 px-4">Navigation</h4>
               <button class="form-tab-btn w-full text-left px-6 py-4 rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all ${currentProductFormTab === 'general' ? 'bg-white text-brand-green shadow-sm' : 'text-brand-green/40 hover:bg-brand-green/5'}" data-tab="general">General</button>
               <button class="form-tab-btn w-full text-left px-6 py-4 rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all ${currentProductFormTab === 'media' ? 'bg-white text-brand-green shadow-sm' : 'text-brand-green/40 hover:bg-brand-green/5'}" data-tab="media">Media Contents</button>
               <button class="form-tab-btn w-full text-left px-6 py-4 rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all ${currentProductFormTab === 'description' ? 'bg-white text-brand-green shadow-sm' : 'text-brand-green/40 hover:bg-brand-green/5'}" data-tab="description">Description</button>
            </div>
            
            <!-- Content Area -->
            <div class="flex-grow p-8 md:p-12">
               <div class="flex justify-between items-center mb-10 pb-6 border-b border-brand-green/5">
                 <h3 class="text-2xl font-serif text-brand-green">${editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                 ${editingProduct ? `<button id="cancel-edit" class="text-[11px] uppercase font-black opacity-30 hover:opacity-100 transition-opacity cursor-pointer">Discard changes</button>` : ''}
               </div>

               <form id="product-form" class="space-y-12">
                 <input type="hidden" name="id" value="${editingProduct?.id || ''}">
                 
                 <!-- General Tab -->
                 <div class="${currentProductFormTab === 'general' ? 'block' : 'hidden'} space-y-10 animate-fade-in">
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div class="space-y-8">
                       <div>
                         <label class="block text-[10px] uppercase tracking-[0.1em] font-bold text-brand-green/40 mb-3">Product Name</label>
                         <input type="text" name="name" required value="${editingProduct?.name || ''}" class="w-full bg-brand-green/5 border border-brand-green/10 rounded-xl px-6 py-4 text-sm focus:border-brand-green outline-none transition-colors" placeholder="e.g. Classic Oversized Hoodie">
                       </div>
                       <div>
                         <label class="block text-[10px] uppercase tracking-[0.1em] font-bold text-brand-green/40 mb-3">Brand</label>
                         <input type="text" name="brand" value="${editingProduct?.brand || ''}" class="w-full bg-brand-green/5 border border-brand-green/10 rounded-xl px-6 py-4 text-sm focus:border-brand-green outline-none transition-colors" placeholder="e.g. Gucci, Zara, etc">
                       </div>
                       <div>
                         <label class="block text-[10px] uppercase tracking-[0.1em] font-bold text-brand-green/40 mb-3">Collection Tier</label>
                         <select name="category_id" class="w-full bg-brand-green/5 border border-brand-green/10 rounded-xl px-6 py-4 text-sm focus:border-brand-green outline-none cursor-pointer">
                           ${adminCats.map(c => `<option value="${c.id}" ${editingProduct?.category_id == c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                         </select>
                       </div>
                     </div>

                     <div class="space-y-8">
                       <div class="grid grid-cols-2 gap-6">
                         <div>
                           <label class="block text-[10px] uppercase tracking-[0.1em] font-bold text-brand-green/40 mb-3">Regular Price (₦)</label>
                           <div class="relative">
                             <span class="absolute left-4 top-1/2 -translate-y-1/2 text-brand-green/30 font-bold">₦</span>
                             <input type="number" step="0.01" name="price" required value="${editingProduct?.price || ''}" class="w-full bg-brand-green/5 border border-brand-green/10 rounded-xl pl-10 pr-6 py-4 text-sm focus:border-brand-green outline-none transition-colors">
                           </div>
                         </div>
                         <div>
                           <label class="block text-[10px] uppercase tracking-[0.1em] font-bold text-brand-green/40 mb-3">Sale Price (₦)</label>
                           <div class="relative">
                             <span class="absolute left-4 top-1/2 -translate-y-1/2 text-brand-green/30 font-bold">₦</span>
                             <input type="number" step="0.01" name="discount_price" value="${editingProduct?.discount_price || ''}" class="w-full bg-brand-green/5 border border-brand-green/10 rounded-xl pl-10 pr-6 py-4 text-sm focus:border-brand-green outline-none transition-colors">
                           </div>
                         </div>
                       </div>
                       
                       <div>
                         <label class="flex items-center gap-4 cursor-pointer group p-6 border border-brand-green/5 rounded-2xl bg-brand-green/[0.01] hover:bg-brand-green/[0.03] transition-all">
                           <input type="checkbox" name="is_featured" value="1" ${editingProduct?.is_featured ? 'checked' : ''} class="w-5 h-5 accent-brand-green rounded-lg">
                           <div class="flex flex-col">
                             <span class="text-[10px] uppercase tracking-widest font-black text-brand-green">Feature on Homepage</span>
                             <span class="text-[8px] opacity-40 uppercase tracking-tight">Promote this piece in the primary curated showcase</span>
                           </div>
                         </label>
                       </div>
                     </div>
                   </div>

                   <!-- Attributes Section -->
                   <div class="pt-8 border-t border-brand-green/5">
                     <label class="block text-[10px] uppercase tracking-[0.1em] font-bold text-brand-green/40 mb-6">Product Variations</label>
                     <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                       ${adminAttributes.map(attr => `
                         <div class="space-y-4">
                           <h5 class="text-[9px] uppercase tracking-widest font-black text-luxury-gold flex items-center gap-2">
                             <span class="w-1.5 h-1.5 bg-luxury-gold"></span>
                             ${attr.name}
                           </h5>
                           <div class="flex flex-wrap gap-2">
                             ${attr.values.map(val => `
                               <label class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-green/10 cursor-pointer hover:bg-brand-green/5 transition-all group ${currentAttrIds.includes(val.id) ? 'bg-brand-green/10 border-brand-green/30' : 'bg-white'}">
                                 <input type="checkbox" name="attribute_value_ids" value="${val.id}" ${currentAttrIds.includes(val.id) ? 'checked' : ''} class="w-3 h-3 accent-brand-green">
                                 <span class="text-[9px] font-bold text-brand-green/70 group-hover:text-brand-green">
                                   ${attr.type === 'color' ? `<span class="inline-block w-2 h-2 rounded-full ring-1 ring-black/10" style="background-color: ${val.value}"></span>` : ''}
                                   ${val.name}
                                 </span>
                               </label>
                             `).join('')}
                           </div>
                         </div>
                       `).join('')}
                       ${adminAttributes.length === 0 ? '<p class="text-[9px] opacity-30 italic">No attributes defined.</p>' : ''}
                     </div>
                   </div>
                 </div>

                 <!-- Media Tab -->
                 <div class="${currentProductFormTab === 'media' ? 'block' : 'hidden'} space-y-10 animate-fade-in">
                   <div class="bg-brand-green/[0.01] border-2 border-dashed border-brand-green/10 rounded-3xl p-16 text-center hover:bg-brand-green/[0.03] transition-all">
                     <input type="file" id="product-images-input" name="images" multiple accept="image/*" class="hidden">
                     <label for="product-images-input" class="cursor-pointer group">
                       <div class="w-20 h-20 bg-brand-green/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-brand-green/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                       </div>
                       <p class="text-xs font-bold text-brand-green uppercase tracking-widest">Select Product Media</p>
                       <p class="text-[9px] text-brand-green/30 mt-2">Maximum 5 high-resolution assets</p>
                     </label>
                   </div>
                   
                   <div id="new-images-preview" class="grid grid-cols-2 md:grid-cols-3 gap-6"></div>

                   ${editingProduct?.images?.length > 0 ? `
                     <div class="pt-10 border-t border-brand-green/5">
                        <h4 class="text-[10px] uppercase tracking-[0.2em] font-black text-brand-green/30 mb-8">Existing Assets</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                           ${editingProduct.images.map(img => {
                             const colorValues = adminAttributes.find(a => a.name.toLowerCase() === 'color')?.values || [];
                             return `
                               <div class="flex items-center gap-6 p-4 bg-brand-green/[0.01] rounded-2xl border border-brand-green/5 group hover:border-brand-green/20 transition-all">
                                 <div class="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                                   <img src="${img.image_url}" class="w-full h-full object-cover">
                                 </div>
                                 <div class="flex-grow">
                                    <label class="block text-[8px] uppercase tracking-widest font-black text-brand-green/20 mb-2">Linked Variant</label>
                                    <select class="existing-image-attr w-full bg-transparent border-b border-brand-green/10 text-[10px] font-bold text-brand-green outline-none py-2" data-url="${img.image_url}">
                                      <option value="">No link</option>
                                      ${colorValues.map(cv => `<option value="${cv.id}" ${img.attribute_value_id == cv.id ? 'selected' : ''}>Color: ${cv.name}</option>`).join('')}
                                    </select>
                                 </div>
                                 <input type="hidden" name="image_data" value='${JSON.stringify({ image_url: img.image_url, attribute_value_id: img.attribute_value_id })}'>
                               </div>
                             `;
                           }).join('')}
                        </div>
                     </div>
                   ` : ''}
                 </div>

                 <!-- Description Tab -->
                 <div class="${currentProductFormTab === 'description' ? 'block' : 'hidden'} space-y-8 animate-fade-in">
                    <div>
                      <label class="block text-[10px] uppercase tracking-[0.2em] font-black text-brand-green/40 mb-4">Product Narrative</label>
                      <textarea name="description" class="w-full bg-brand-green/[0.01] border border-brand-green/10 rounded-3xl p-10 text-sm h-64 focus:border-brand-green outline-none transition-colors text-brand-green font-medium resize-none leading-relaxed" placeholder="Describe the craftsmanship...">${editingProduct?.description || ''}</textarea>
                    </div>
                 </div>

                 <div class="pt-8 flex justify-end">
                    <button type="submit" class="bg-brand-green text-white px-16 py-6 rounded-2xl text-[11px] uppercase tracking-[0.4em] font-black shadow-2xl shadow-brand-green/20 hover:shadow-brand-green/40 hover:-translate-y-1 transition-all active:scale-95 cursor-pointer">
                      ${editingProduct ? 'Commit Changes' : 'Confirm & Publish'}
                    </button>
                 </div>
               </form>
            </div>
          </div>
        </div>

        <!-- Inventory Metrics Table -->
        <div class="bg-white rounded-3xl shadow-sm border border-brand-green/5 overflow-hidden relative">
          <div class="p-10 border-b border-brand-green/5 flex justify-between items-center bg-brand-green/[0.01]">
            <h4 class="text-xl font-serif text-brand-green">Inventory Status</h4>
            <div class="flex items-center gap-4">
               ${selectedAdminProductIds.length > 0 ? `
                 <button id="bulk-delete-btn" class="bg-red-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95 cursor-pointer">
                   Purge Selected (${selectedAdminProductIds.length})
                 </button>
               ` : ''}
               <span class="text-[9px] font-black bg-brand-green text-white px-4 py-2 rounded-lg tracking-widest uppercase">${adminProducts.length} Artifacts</span>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-brand-green/[0.02] border-b border-brand-green/5">
                <tr>
                  <th class="py-8 pl-10 pr-6 w-12">
                    <input type="checkbox" id="select-all-products" ${selectedAdminProductIds.length === adminProducts.length && adminProducts.length > 0 ? 'checked' : ''} class="w-4 h-4 accent-brand-green cursor-pointer">
                  </th>
                  <th class="py-8 px-6 text-[10px] uppercase tracking-[0.4em] font-black opacity-30">Artifact</th>
                  <th class="py-8 px-6 text-[10px] uppercase tracking-[0.4em] font-black opacity-30">Specifications</th>
                  <th class="py-8 px-6 text-[10px] uppercase tracking-[0.4em] font-black opacity-30 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-green/5">
                ${adminProducts.map(p => `
                  <tr class="hover:bg-brand-green/[0.005] transition-colors ${selectedAdminProductIds.includes(String(p.id)) ? 'bg-brand-green/[0.02]' : ''}">
                    <td class="py-8 pl-10 pr-6">
                      <input type="checkbox" class="product-select w-4 h-4 accent-brand-green cursor-pointer" data-id="${p.id}" ${selectedAdminProductIds.includes(String(p.id)) ? 'checked' : ''}>
                    </td>
                    <td class="py-8 px-6">
                      <div class="flex items-center gap-6">
                        <div class="w-16 h-20 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                          <img src="${p.image_url}" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700">
                        </div>
                        <div>
                          <p class="font-serif text-lg text-brand-green font-medium">${p.name}</p>
                          <p class="text-[9px] uppercase tracking-widest font-black text-luxury-gold">${p.brand || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td class="py-8 px-6">
                      <p class="text-[10px] uppercase font-bold text-brand-green/60 mb-2">${p.category_name}</p>
                      <p class="text-xs font-bold text-brand-green">₦${(p.discount_price || p.price).toLocaleString()}</p>
                    </td>
                    <td class="py-8 px-6 text-right space-x-2">
                      <button class="edit-btn p-4 hover:bg-brand-green/5 rounded-2xl transition-all cursor-pointer group" data-id="${p.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-brand-green opacity-30 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                      <button class="delete-btn p-4 hover:bg-red-500/5 rounded-2xl transition-all cursor-pointer group" data-id="${p.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-red-500 opacity-30 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
};

const AdminPromotions = (coupons) => `
  <div class="animate-fade-in space-y-12 pb-20">
    <header class="mb-8 md:mb-12">
      <h2 class="text-[10px] uppercase tracking-[0.5em] text-brand-green/40 font-black mb-4">Promotions</h2>
      <h3 class="text-3xl md:text-5xl font-serif text-brand-green">Vouchers & Offers</h3>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-16">
      <div class="lg:col-span-1">
        <div class="bg-white p-12 rounded-2xl shadow-sm border border-brand-green/5 sticky top-16">
          <h3 class="text-3xl font-serif text-brand-green mb-12 border-b border-brand-green/5 pb-8">Generate Coupon</h3>
          <form id="coupon-form" class="space-y-8">
            <div>
              <label class="block text-[9px] uppercase tracking-[0.4em] font-black text-brand-green/30 mb-3">Coupon Code</label>
              <input type="text" name="code" required placeholder="EXTREME20" class="w-full border-b-2 border-brand-green/5 py-4 bg-transparent text-sm focus:border-brand-green outline-none transition-colors text-brand-green font-black uppercase">
            </div>
            <div>
              <label class="block text-[9px] uppercase tracking-[0.4em] font-black text-brand-green/30 mb-3">Model</label>
              <select name="type" class="w-full border-b-2 border-brand-green/5 py-4 bg-transparent text-sm focus:border-brand-green outline-none cursor-pointer text-brand-green font-medium">
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Discount (₦)</option>
              </select>
            </div>
            <div>
              <label class="block text-[9px] uppercase tracking-[0.4em] font-black text-brand-green/30 mb-3">Value</label>
              <input type="number" name="value" required class="w-full border-b-2 border-brand-green/5 py-4 bg-transparent text-sm focus:border-brand-green outline-none transition-colors text-brand-green font-medium">
            </div>
            <div>
              <label class="block text-[9px] uppercase tracking-[0.4em] font-black text-brand-green/30 mb-3">Min. Purchase (Optional)</label>
              <input type="number" name="min_amount" value="0" class="w-full border-b-2 border-brand-green/5 py-4 bg-transparent text-sm focus:border-brand-green outline-none transition-colors text-brand-green font-medium">
            </div>
            <button type="submit" class="w-full primary-btn mt-10 py-6 text-xs transition-transform active-scale cursor-pointer">Inject into Registry</button>
          </form>
        </div>
      </div>
      <div class="lg:col-span-2">
        <div class="bg-white rounded-2xl shadow-sm border border-brand-green/5 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-brand-green/5 border-b">
                <tr>
                  <th class="py-10 pl-16 pr-10 text-[9px] uppercase tracking-[0.4em] font-black opacity-30">Code</th>
                  <th class="py-10 px-10 text-[9px] uppercase tracking-[0.4em] font-black opacity-30">Benefit</th>
                  <th class="py-10 px-10 text-[9px] uppercase tracking-[0.4em] font-black opacity-30">Minimum</th>
                  <th class="py-10 pl-10 pr-16 text-[9px] uppercase tracking-[0.4em] font-black opacity-30 text-right">Clearance</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-green/5">
                ${coupons.length === 0 ? '<tr><td colspan="4" class="py-20 text-center italic opacity-20 font-serif">No active vouchers generated.</td></tr>' : coupons.map(c => `
                  <tr class="hover:bg-brand-cream/5 transition-colors group">
                    <td class="py-10 pl-16 pr-10">
                      <span class="font-black text-brand-green bg-brand-green/5 px-4 py-2 rounded-lg text-sm">${c.code}</span>
                    </td>
                    <td class="py-10 px-10">
                      <p class="text-[10px] font-black text-brand-green uppercase">${c.type === 'percentage' ? `${c.value}% Off` : `₦${c.value} Off`}</p>
                    </td>
                    <td class="py-10 px-10 text-xs font-serif italic text-brand-green/40">₦${c.min_amount}</td>
                    <td class="py-10 pl-10 pr-16 text-right">
                      <button class="delete-coupon-btn text-[8px] uppercase tracking-widest font-black text-red-300 hover:text-red-500 transition-colors cursor-pointer" data-id="${c.id}">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

const AdminOrders = (orders) => `
  <div class="animate-fade-in space-y-12 pb-20">
    <header class="mb-8 md:mb-12">
      <h2 class="text-[10px] uppercase tracking-[0.5em] text-brand-green/40 font-black mb-4">Command Center</h2>
      <h3 class="text-3xl md:text-5xl font-serif text-brand-green">Order Registry</h3>
    </header>

    <div class="bg-white rounded-2xl shadow-sm border border-brand-green/5 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-brand-green/5 border-b">
            <tr>
              <th class="py-10 pl-16 pr-10 text-[9px] uppercase tracking-[0.4em] font-black opacity-30">Identity</th>
              <th class="py-10 px-10 text-[9px] uppercase tracking-[0.4em] font-black opacity-30">Payload</th>
              <th class="py-10 px-10 text-[9px] uppercase tracking-[0.4em] font-black opacity-30 text-right">Valuation</th>
              <th class="py-10 pl-10 pr-16 text-right text-[9px] uppercase tracking-[0.4em] font-black opacity-30">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-green/5">
            ${orders.length === 0 ? '<tr><td colspan="4" class="py-20 text-center italic opacity-20 font-serif">Registry is empty.</td></tr>' : orders.map(order => `
              <tr class="hover:bg-brand-cream/5 transition-colors">
                <td class="py-10 pl-16 pr-10">
                  <p class="font-serif text-lg text-brand-green">${order.order_id_formatted}</p>
                  <div class="mt-2 space-y-2">
                    <input type="text" value="${order.customer_name || ''}" 
                           class="order-customer-name-input bg-transparent text-[10px] font-bold border-b border-brand-green/5 focus:border-brand-green outline-none w-full text-brand-green" 
                           data-id="${order.id}" placeholder="Customer Name">
                    <input type="text" value="${order.customer_phone || ''}" 
                           class="order-customer-phone-input bg-transparent text-[8px] opacity-40 uppercase tracking-widest border-b border-brand-green/5 focus:border-brand-green outline-none w-full text-brand-green" 
                           data-id="${order.id}" placeholder="Phone Number">
                  </div>
                </td>
                <td class="py-10 px-10">
                  <div class="text-[8px] font-black uppercase tracking-[0.2em] space-y-1">
                    ${order.items.map(item => `<div>${item.quantity}x ${item.product_name}</div>`).join('')}
                  </div>
                </td>
                <td class="py-10 px-10 text-right font-black text-brand-green">₦${order.total_amount.toFixed(0)}</td>
                <td class="py-10 pl-10 pr-16 text-right">
                  <div class="flex items-center justify-end gap-4">
                    <select class="order-status-change bg-transparent text-[8px] font-black uppercase border-b border-brand-green/10 focus:border-brand-green outline-none py-2 cursor-pointer" data-id="${order.id}">
                      <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                      <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
                      <option value="processed" ${order.status === 'processed' ? 'selected' : ''}>Processed</option>
                      <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                    <button class="delete-order-btn p-3 bg-red-500/5 text-red-500 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer" data-id="${order.id}" title="Archive/Delete">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
`;

const AdminPayments = (orders) => {
  const getWeeklyData = () => {
    const weekly = {};
    orders.filter(o => o.status === 'paid' || o.status === 'processed').forEach(o => {
      const date = new Date(o.created_at);
      const year = date.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      const key = `${year}-W${weekNum}`;
      if (!weekly[key]) weekly[key] = { date: key, total: 0, count: 0 };
      weekly[key].total += o.total_amount;
      weekly[key].count += 1;
    });
    return Object.values(weekly).sort((a, b) => b.date.localeCompare(a.date));
  };

  const getMonthlyData = () => {
    const monthly = {};
    orders.filter(o => o.status === 'paid' || o.status === 'processed').forEach(o => {
      const date = new Date(o.created_at);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { date: key, total: 0, count: 0 };
      monthly[key].total += o.total_amount;
      monthly[key].count += 1;
    });
    return Object.values(monthly).sort((a, b) => b.date.localeCompare(a.date));
  };

  const insights = adminInsightsPeriod === 'monthly' ? getMonthlyData() : getWeeklyData();

  return `
  <div class="animate-fade-in space-y-12 pb-20">
    <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
      <div>
        <h2 class="text-[10px] uppercase tracking-[0.5em] text-brand-green/40 font-black mb-4">Financials</h2>
        <h3 class="text-3xl md:text-5xl font-serif text-brand-green">Audit Trail</h3>
      </div>
      <div class="flex gap-2">
        <button class="insights-filter-btn px-4 py-2 rounded-full text-[8px] uppercase font-black border transition-all ${adminInsightsPeriod === 'weekly' ? 'bg-brand-green text-white border-brand-green' : 'border-brand-green/10 text-brand-green/40 hover:border-brand-green/30'}" data-period="weekly">Weekly Analysis</button>
        <button class="insights-filter-btn px-4 py-2 rounded-full text-[8px] uppercase font-black border transition-all ${adminInsightsPeriod === 'monthly' ? 'bg-brand-green text-white border-brand-green' : 'border-brand-green/10 text-brand-green/40 hover:border-brand-green/30'}" data-period="monthly">Monthly Analysis</button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-brand-green/5 overflow-hidden">
        <div class="p-8 border-b border-brand-green/5">
          <h4 class="text-[10px] uppercase tracking-[0.4em] font-black opacity-40">Payment Registry</h4>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-brand-green/5 border-b">
              <tr>
                <th class="py-10 pl-16 pr-10 text-[9px] uppercase tracking-[0.4em] font-black opacity-30">Transaction ID</th>
                <th class="py-10 px-10 text-[9px] uppercase tracking-[0.4em] font-black opacity-30">Reference</th>
                <th class="py-10 px-10 text-[9px] uppercase tracking-[0.4em] font-black opacity-30">Amount</th>
                <th class="py-10 pl-10 pr-16 text-right text-[9px] uppercase tracking-[0.4em] font-black opacity-30">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-green/5">
              ${orders.length === 0 ? '<tr><td colspan="4" class="py-20 text-center italic opacity-20 font-serif">No transactions recorded.</td></tr>' : orders.map(order => `
                <tr class="hover:bg-brand-cream/5 transition-colors">
                  <td class="py-10 pl-16 pr-10 font-mono text-[10px] text-brand-green/60">TRX-${order.id.toString().padStart(6, '0')}</td>
                  <td class="py-10 px-10">
                    <p class="font-black text-[9px] uppercase tracking-widest text-brand-green">${order.order_id_formatted}</p>
                    <p class="text-[7px] opacity-30 font-mono">${new Date(order.created_at).toLocaleString()}</p>
                  </td>
                  <td class="py-10 px-10 font-black text-brand-green">₦${order.total_amount.toFixed(0)}</td>
                  <td class="py-10 pl-10 pr-16 text-right">
                    <div class="flex items-center justify-end gap-3">
                      <span class="px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] ${order.status === 'paid' ? 'bg-green-500/10 text-green-600' : order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-600'}">
                        ${order.status}
                      </span>
                      <button class="delete-order-btn p-2 hover:bg-red-500/10 text-red-500 rounded-md transition-all cursor-pointer" data-id="${order.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="lg:col-span-1 space-y-8">
        <div class="bg-white p-10 rounded-2xl shadow-sm border border-brand-green/5">
          <h4 class="text-[10px] uppercase tracking-[0.4em] font-black opacity-40 mb-8">Summary By ${adminInsightsPeriod}</h4>
          <div class="space-y-6">
            ${insights.slice(0, 10).map(item => `
              <div class="flex justify-between items-center pb-6 border-b border-brand-green/5 last:border-0 last:pb-0">
                <div>
                  <p class="text-[10px] font-bold text-brand-green">${item.date}</p>
                  <p class="text-[8px] opacity-30 font-black uppercase tracking-widest">${item.count} Transactions</p>
                </div>
                <p class="font-serif text-lg text-brand-green">₦${item.total.toLocaleString()}</p>
              </div>
            `).join('')}
            ${insights.length === 0 ? '<p class="text-center py-10 italic opacity-20 capitalize">No matching analysis found.</p>' : ''}
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
};

const AdminSettings = (settings) => `
  <div class="animate-fade-in space-y-12 pb-20">
    <header class="mb-8 md:mb-12">
      <h2 class="text-[10px] uppercase tracking-[0.5em] text-brand-green/40 font-black mb-4">Core Systems</h2>
      <h3 class="text-3xl md:text-5xl font-serif text-brand-green">Global Settings</h3>
    </header>

    <div class="max-w-2xl bg-white p-12 rounded-2xl shadow-sm border border-brand-green/5">
      <form id="settings-form" class="space-y-10">
        <div class="grid grid-cols-1 gap-10">
          <div>
            <label class="block text-[9px] uppercase tracking-[0.4em] font-black text-brand-green/30 mb-4">WhatsApp Liaison</label>
            <input type="text" name="whatsapp_number" value="${settings.whatsapp_number || WHATSAPP_NUMBER}" class="w-full border-b-2 border-brand-green/5 py-4 bg-transparent text-sm focus:border-brand-green outline-none transition-colors text-brand-green font-medium">
          </div>
          <div>
            <label class="block text-[9px] uppercase tracking-[0.4em] font-black text-brand-green/30 mb-4">Official Email</label>
            <input type="email" name="email" value="${settings.email || 'concierge@fitpoint.com'}" class="w-full border-b-2 border-brand-green/5 py-4 bg-transparent text-sm focus:border-brand-green outline-none transition-colors text-brand-green font-medium">
          </div>
          <div>
            <label class="block text-[9px] uppercase tracking-[0.4em] font-black text-brand-green/30 mb-4">Showroom Address</label>
            <textarea name="address" class="w-full border-b-2 border-brand-green/5 py-4 bg-transparent text-sm focus:border-brand-green outline-none transition-colors text-brand-green font-medium h-24 resize-none">${settings.address || 'LAGOS CENTRAL SHOWROOM'}</textarea>
          </div>
          <div class="flex items-center justify-between p-6 bg-brand-cream/10 rounded-xl">
            <div>
               <h5 class="text-[10px] font-black text-brand-green uppercase tracking-widest">Maintenance Protocol</h5>
               <p class="text-[8px] opacity-40 mt-1 uppercase font-bold tracking-tighter">Restrict public access to the showroom</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="maintenance_mode" class="sr-only peer" ${String(settings.maintenance_mode) === '1' || settings.maintenance_mode === true ? 'checked' : ''}>
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
            </label>
          </div>
        </div>
        <button type="submit" class="primary-btn w-full py-6 text-xs transition-transform active-scale cursor-pointer uppercase tracking-[0.4em]">Synchronize Settings</button>
      </form>
    </div>
  </div>
`;

// Admin UI
const renderAdmin = async (root) => {
  if (!isAdminAuthenticated) {
    root.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-brand-cream p-4 md:p-6">
        <div class="bg-white p-8 md:p-14 max-w-md w-full border border-brand-green/10 shadow-2xl rounded-[2rem] md:rounded-[3rem]">
          <div class="text-center mb-14">
            <h2 class="text-4xl font-serif italic mb-4 text-brand-green">Fit <span class="text-luxury-gold">Point</span></h2>
            <p class="text-[9px] uppercase tracking-[0.5em] text-brand-green/40 font-black">Secure Authentication Pipeline</p>
          </div>
          <form id="login-form" class="space-y-12">
            <div>
              <label class="block text-[9px] uppercase tracking-[0.4em] font-black text-brand-green/40 mb-4 ml-1">Identity Profile</label>
              <input type="text" name="username" class="w-full border-b-2 border-brand-green/10 py-4 px-1 focus:outline-none focus:border-brand-green transition-all bg-transparent font-sans text-brand-green text-sm">
            </div>
            <div>
              <label class="block text-[9px] uppercase tracking-[0.4em] font-black text-brand-green/40 mb-4 ml-1">Keyphrase Secret</label>
              <input type="password" name="password" class="w-full border-b-2 border-brand-green/10 py-4 px-1 focus:outline-none focus:border-brand-green transition-all bg-transparent font-sans text-brand-green text-sm">
            </div>
            <button type="submit" id="login-btn" class="w-full primary-btn mt-10 py-6 cursor-pointer active-scale text-xs">Verify Authorization</button>
          </form>
          <p id="login-error" class="text-red-500 text-[9px] uppercase tracking-widest font-black mt-10 hidden text-center italic">Access Denied: Invalid Credentials.</p>
        </div>
      </div>
    `;
    
    document.getElementById('login-form').onsubmit = async (e) => {
      e.preventDefault();
      const loginBtn = document.getElementById('login-btn');
      loginBtn.innerText = 'Verifying...';
      loginBtn.disabled = true;
      
      const loginData = Object.fromEntries(new FormData(e.target));
      const res = await makeApiCall('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      if (res?.success) render();
      else {
        loginBtn.innerText = 'Verify Authorization';
        loginBtn.disabled = false;
        const err = document.getElementById('login-error');
        err.classList.remove('hidden');
      }
    };
  } else {
    // Admin Dashboard Template - Optimized Fetching
    if (products.length === 0) {
      const pData = await makeApiCall('/api/products');
      if (pData) products = pData;
    }
    const adminProducts = products;

    if (categories.length === 0) {
      const cData = await makeApiCall('/api/categories');
      if (cData) categories = cData;
    }
    const adminCats = categories;

    if (adminAttributes.length === 0) {
      adminAttributes = await makeApiCall('/api/attributes') || [];
    }
    
    // Auto-fetch dashboard data based on current tab if needed
    if (currentAdminTab === 'dashboard') {
      if (!adminStats) adminStats = await makeApiCall('/api/admin/stats');
      if (adminOrders.length === 0) adminOrders = await makeApiCall('/api/admin/orders') || [];
    } else if (currentAdminTab === 'orders' || currentAdminTab === 'payments') {
      if (adminOrders.length === 0) adminOrders = await makeApiCall('/api/admin/orders') || [];
    } else if (currentAdminTab === 'promotions') {
      if (adminCoupons.length === 0) adminCoupons = await makeApiCall('/api/admin/coupons') || [];
    } else if (currentAdminTab === 'config') {
      if (adminCategories.length === 0) adminCategories = await makeApiCall('/api/categories') || [];
    } else if (currentAdminTab === 'settings') {
      // settings are handled in render()
    }
    
    // Explicitly check for admin session
    await checkAdminSession();
    
    // Surgical update: If admin skeleton exists, only update main content
    const adminSkeleton = document.getElementById('admin-layout-wrapper');
    if (adminSkeleton && isAdminAuthenticated) {
      const mainContent = document.getElementById('admin-main-content');
      if (mainContent) {
        let content = '';
        if (currentAdminTab === 'dashboard') content = AdminDashboard(adminStats || {}, adminOrders);
        else if (currentAdminTab === 'config') content = AdminProductConfig(adminCategories, adminAttributes);
        else if (currentAdminTab === 'inventory') content = AdminInventory(adminProducts, adminCats, adminAttributes);
        else if (currentAdminTab === 'promotions') content = AdminPromotions(adminCoupons);
        else if (currentAdminTab === 'orders') content = AdminOrders(adminOrders);
        else if (currentAdminTab === 'payments') content = AdminPayments(adminOrders);
        else if (currentAdminTab === 'settings') content = AdminSettings(adminSettings);
        
        mainContent.innerHTML = content;
        
        // Update sidebar mobile state
        const sidebar = document.getElementById('admin-sidebar');
        const overlay = document.getElementById('admin-sidebar-overlay');
        if (sidebar && overlay) {
          if (isAdminMobileMenuOpen) {
            sidebar.classList.add('translate-x-0');
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.add('opacity-100', 'pointer-events-auto');
            overlay.classList.remove('opacity-0', 'pointer-events-none');
          } else {
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
            overlay.classList.remove('opacity-100', 'pointer-events-auto');
            overlay.classList.add('opacity-0', 'pointer-events-none');
          }
        }
        
        // Update sidebar active states
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
          if (btn.dataset.tab === currentAdminTab) {
            btn.classList.add('bg-brand-cream', 'text-brand-green', 'shadow-sm');
            btn.classList.remove('text-brand-cream/60', 'hover:bg-white/5');
          } else {
            btn.classList.remove('bg-brand-cream', 'text-brand-green', 'shadow-sm');
            btn.classList.add('text-brand-cream/60', 'hover:bg-white/5');
          }
        });
        
        attachAdminEvents();
        return;
      }
    }

    root.innerHTML = `
      <div id="admin-layout-wrapper" class="min-h-screen bg-brand-cream/20 font-sans">
        ${AdminSidebar()}
        
        <!-- Mobile Admin Header -->
        <div class="lg:hidden bg-brand-green text-brand-cream p-6 flex justify-between items-center sticky top-0 z-[54]">
          <h2 class="text-xl font-serif italic">Fit <span class="text-luxury-gold">Point</span></h2>
          <button id="toggle-admin-sidebar" class="p-2 border border-white/10 rounded-lg cursor-pointer">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>

        <main id="admin-main-content" class="lg:ml-72 p-6 md:p-16 max-w-6xl mx-auto">
          <!-- Universal Search - Moved to Content Area per request -->
          <div class="mb-12">
            <div class="relative group max-w-2xl">
              <input type="text" id="admin-universal-search" placeholder="Search product, SKU, order id..." 
                     class="w-full bg-white border border-brand-green/10 rounded-2xl py-6 pl-14 pr-6 text-xs text-brand-green placeholder:text-brand-green/20 focus:outline-none focus:border-brand-green/30 transition-all shadow-sm">
              <span class="absolute left-6 top-1/2 -translate-y-1/2 text-brand-green/30 select-none text-lg">🔍</span>
              <div id="search-results-floating" class="hidden absolute top-full left-0 w-full mt-3 bg-white border border-brand-green/10 rounded-2xl shadow-2xl z-[100] max-h-[500px] overflow-y-auto backdrop-blur-xl ring-1 ring-black/5 animate-fade-in"></div>
            </div>
          </div>

          ${currentAdminTab === 'dashboard' ? AdminDashboard(adminStats || {}, adminOrders) : ''}
          ${currentAdminTab === 'config' ? AdminProductConfig(adminCategories, adminAttributes) : ''}
          ${currentAdminTab === 'inventory' ? AdminInventory(adminProducts, adminCats, adminAttributes) : ''}
          ${currentAdminTab === 'promotions' ? AdminPromotions(adminCoupons) : ''}
          ${currentAdminTab === 'orders' ? AdminOrders(adminOrders) : ''}
          ${currentAdminTab === 'payments' ? AdminPayments(adminOrders) : ''}
          ${currentAdminTab === 'settings' ? AdminSettings(adminSettings) : ''}
        </main>
      </div>
    `;

    attachAdminEvents();
  }
};

const attachAdminEvents = () => {
  // Mobile Admin Toggle Events
  if (document.getElementById('toggle-admin-sidebar')) {
    document.getElementById('toggle-admin-sidebar').onclick = () => {
      isAdminMobileMenuOpen = true;
      render();
    };
  }
  if (document.getElementById('close-admin-sidebar')) {
    document.getElementById('close-admin-sidebar').onclick = () => {
      isAdminMobileMenuOpen = false;
      render();
    };
  }
  if (document.getElementById('admin-sidebar-overlay')) {
    document.getElementById('admin-sidebar-overlay').onclick = () => {
      isAdminMobileMenuOpen = false;
      render();
    };
  }

  document.getElementById('logout').onclick = async () => {
    await makeApiCall('/api/admin/logout', { method: 'POST' });
    if (window.location.pathname === '/admin') {
      window.location.href = '/';
    } else {
      window.location.hash = '';
      render();
    }
  };

  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.onclick = () => {
      if (currentAdminTab === btn.dataset.tab) return;
      currentAdminTab = btn.dataset.tab;
      selectedAdminProductIds = []; // Clear selections on tab change
      isAdminMobileMenuOpen = false;
      window.scrollTo(0, 0);
      render();
    };
  });

  // Category Form
  const catForm = document.getElementById('category-form');
  if (catForm) {
    catForm.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData(catForm);
        const id = formData.get('id');
        const name = formData.get('name');
        const url = id ? `/api/admin/categories/${id}` : '/api/admin/categories';
        const method = id ? 'PUT' : 'POST';

        const res = await makeApiCall(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });

        if (res) {
          editingCategoryId = null;
          render();
        }
      } catch (err) {
        showNotification(`Failed to save collection: ${err.message}`);
      }
    };
  }

  document.querySelectorAll('.edit-cat-btn').forEach(btn => {
    btn.onclick = () => {
      editingCategoryId = btn.dataset.id;
      render();
    };
  });

  if (document.getElementById('cancel-cat-edit')) {
    document.getElementById('cancel-cat-edit').onclick = () => {
      editingCategoryId = null;
      render();
    };
  }

  document.querySelectorAll('.delete-cat-btn').forEach(btn => {
    btn.onclick = async () => {
      if (await showConfirm('Permanently delete this collection from the registry?')) {
        const res = await makeApiCall(`/api/admin/categories/${btn.dataset.id}`, { method: 'DELETE' });
        if (res) render();
      }
    };
  });

  // Attribute Form
  const attrForm = document.getElementById('attribute-form');
  if (attrForm) {
    attrForm.onsubmit = async (e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(attrForm));
      const id = formData.id;
      const url = id ? `/api/admin/attributes/${id}` : '/api/admin/attributes';
      const method = id ? 'PUT' : 'POST';

      const res = await makeApiCall(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res) {
        editingAttributeId = null;
        render();
      }
    };
  }

  document.querySelectorAll('.edit-attr-btn').forEach(btn => {
    btn.onclick = () => {
      editingAttributeId = btn.dataset.id;
      render();
    };
  });

  document.getElementById('cancel-attr-edit')?.addEventListener('click', () => {
    editingAttributeId = null;
    render();
  });

  document.querySelectorAll('.delete-attr-btn').forEach(btn => {
    btn.onclick = async () => {
      if (await showConfirm('Delete this attribute and all associated variations?')) {
        await makeApiCall(`/api/admin/attributes/${btn.dataset.id}`, { method: 'DELETE' });
        render();
      }
    };
  });

  document.querySelectorAll('.view-values-btn').forEach(btn => {
    btn.onclick = () => {
      currentAttributeId = btn.dataset.id;
      render();
    };
  });

  document.getElementById('back-to-config')?.addEventListener('click', () => {
    currentAttributeId = null;
    editingAttributeValueId = null;
    render();
  });

  // Attribute Value Form
  const valForm = document.getElementById('attribute-value-form');
  if (valForm) {
    valForm.onsubmit = async (e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(valForm));
      const id = formData.id;
      const url = id ? `/api/admin/attribute-values/${id}` : '/api/admin/attribute-values';
      const method = id ? 'PUT' : 'POST';

      const res = await makeApiCall(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res) {
        editingAttributeValueId = null;
        render();
      }
    };
  }

  document.querySelectorAll('.edit-val-btn').forEach(btn => {
    btn.onclick = () => {
      editingAttributeValueId = btn.dataset.id;
      render();
    };
  });

  document.getElementById('cancel-val-edit')?.addEventListener('click', () => {
    editingAttributeValueId = null;
    render();
  });

  document.querySelectorAll('.delete-val-btn').forEach(btn => {
    btn.onclick = async () => {
      if (await showConfirm('Delete this variation value?')) {
        await makeApiCall(`/api/admin/attribute-values/${btn.dataset.id}`, { method: 'DELETE' });
        render();
      }
    };
  });

  // Settings Form
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.onsubmit = async (e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(settingsForm));
      formData.maintenance_mode = settingsForm.maintenance_mode.checked;

      const res = await makeApiCall('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res?.success) {
        showNotification('Systems Synchronized Successfully');
        // Update local state immediately to avoid "falling back" before render finishes
        adminSettings = { ...adminSettings, ...formData, maintenance_mode: formData.maintenance_mode ? '1' : '0' };
        render();
      }
    };
  }

  const form = document.getElementById('product-form');
  if (form) {
    document.querySelectorAll('.form-tab-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const tab = btn.dataset.tab;
        currentProductFormTab = tab;
        
        // Surgical update instead of full render() to prevent flickering
        document.querySelectorAll('.form-tab-btn').forEach(b => {
          b.classList.remove('bg-white', 'text-brand-green', 'shadow-sm');
          b.classList.add('text-brand-green/40', 'hover:bg-brand-green/5');
        });
        btn.classList.add('bg-white', 'text-brand-green', 'shadow-sm');
        btn.classList.remove('text-brand-green/40', 'hover:bg-brand-green/5');

        document.querySelectorAll('#product-form > div[class*="animate-fade-in"]').forEach(div => {
           div.classList.add('hidden');
           div.classList.remove('block');
        });
        
        const activeTab = document.querySelector(`#product-form > div:nth-of-type(${tab === 'general' ? 1 : tab === 'media' ? 2 : 3})`);
        if (activeTab) {
          activeTab.classList.remove('hidden');
          activeTab.classList.add('block');
        }
      };
    });

    // New Images Preview Logic
    const imagesInput = document.getElementById('product-images-input');
    const previewContainer = document.getElementById('new-images-preview');
    if (imagesInput && previewContainer) {
      imagesInput.onchange = (e) => {
        previewContainer.innerHTML = '';
        const files = Array.from(e.target.files);
        const colorAttr = adminAttributes.find(a => a.name.toLowerCase() === 'color');
        const colorValues = colorAttr ? colorAttr.values : [];
        
        if (files.length > 0) {
          const header = document.createElement('h6');
          header.className = "text-[8px] uppercase tracking-[0.2em] font-black text-brand-green/40 mt-6 mb-2";
          header.innerText = "New Assets Linkage";
          previewContainer.appendChild(header);
        }

        files.forEach((file, index) => {
          const reader = new FileReader();
          reader.onload = (re) => {
            const div = document.createElement('div');
            div.className = "flex items-center gap-4 p-4 bg-brand-cream/40 rounded-xl border border-brand-green/10 animate-fade-in";
            div.innerHTML = `
              <div class="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img src="${re.target.result}" class="w-full h-full object-cover">
              </div>
              <div class="flex-grow">
                 <label class="block text-[7px] uppercase font-black text-brand-green/30 mb-2">Assign Color Variant</label>
                 <select class="new-image-attr w-full bg-transparent border-b border-brand-green/10 text-[9px] font-bold text-brand-green outline-none py-1" data-index="${index}">
                   <option value="">No Link</option>
                   ${colorValues.map(cv => `<option value="${cv.id}">Color: ${cv.name}</option>`).join('')}
                 </select>
              </div>
            `;
            previewContainer.appendChild(div);
          };
          reader.readAsDataURL(file);
        });
      };
    }

    // Live update image metadata hidden fields
    form.addEventListener('change', (e) => {
      if (e.target.classList.contains('existing-image-attr')) {
        const select = e.target;
        const row = select.closest('.flex');
        const hiddenInput = row.querySelector('input[name="image_data"]');
        if (hiddenInput) {
          const url = select.dataset.url;
          const valId = select.value;
          hiddenInput.value = JSON.stringify({ image_url: url, attribute_value_id: valId });
        }
      }
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData(form);
        const id = formData.get('id');
        
        // Handle multiple attribute values
        const attrValueIds = Array.from(formData.getAll('attribute_value_ids'));
        formData.delete('attribute_value_ids');
        formData.append('attribute_value_ids', JSON.stringify(attrValueIds));

        // Handle existing image metadata
        const imageDataInputs = Array.from(formData.getAll('image_data'));
        formData.delete('image_data');
        const existingImages = imageDataInputs.map(val => JSON.parse(val));
        formData.append('existing_images', JSON.stringify(existingImages));

        // Handle new images metadata
        const newImagesMeta = [];
        document.querySelectorAll('.new-image-attr').forEach(select => {
          newImagesMeta.push({ attribute_value_id: select.value || null });
        });
        if (newImagesMeta.length > 0) {
          formData.append('new_images_metadata', JSON.stringify(newImagesMeta));
        }

        const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
        const method = id ? 'PUT' : 'POST';

        const res = await makeApiCall(url, {
          method,
          body: formData
        });
        
        if (res) {
          editingProductId = null;
          currentProductFormTab = 'general';
          render();
        }
      } catch (err) {
        showNotification(`Failed to save product: ${err.message}`);
      }
    };
  }

  document.getElementById('cancel-edit')?.addEventListener('click', () => {
    editingProductId = null;
    render();
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => {
      editingProductId = btn.dataset.id;
      currentProductFormTab = 'general';
      window.scrollTo(0, 0);
      render();
    };
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = async () => {
      if (await showConfirm('Permanently delete this product from the inventory?')) {
        await makeApiCall(`/api/admin/products/${btn.dataset.id}`, { method: 'DELETE' });
        selectedAdminProductIds = selectedAdminProductIds.filter(id => id != btn.dataset.id);
        render();
      }
    };
  });

  // Bulk Selection Logic
  const selectAllCheckbox = document.getElementById('select-all-products');
  if (selectAllCheckbox) {
    selectAllCheckbox.onchange = (e) => {
      if (e.target.checked) {
        // Select all IDs currently visible in the management table
        selectedAdminProductIds = Array.from(document.querySelectorAll('.product-select')).map(cb => cb.dataset.id);
      } else {
        selectedAdminProductIds = [];
      }
      render();
    };
  }

  document.querySelectorAll('.product-select').forEach(cb => {
    cb.onchange = (e) => {
      const id = e.target.dataset.id;
      if (e.target.checked) {
        if (!selectedAdminProductIds.includes(id)) {
          selectedAdminProductIds.push(id);
        }
      } else {
        selectedAdminProductIds = selectedAdminProductIds.filter(i => i !== id);
      }
      render();
    };
  });

  const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
  if (bulkDeleteBtn) {
    bulkDeleteBtn.onclick = async () => {
      const count = selectedAdminProductIds.length;
      if (await showConfirm(`Are you sure you want to permanently purge ${count} selected artifacts from the registry?`)) {
        try {
          // Deleting sequentially for safety, or we could add a bulk endpoint
          // For now, sequentially is safer without changing the server
          for (const id of selectedAdminProductIds) {
            await makeApiCall(`/api/admin/products/${id}`, { method: 'DELETE' });
          }
          showNotification(`Successfully purged ${count} artifacts`);
          selectedAdminProductIds = [];
          render();
        } catch (err) {
          showNotification(`Bulk purge failed: ${err.message}`);
        }
      }
    };
  }

  document.querySelectorAll('.insights-filter-btn').forEach(btn => {
    btn.onclick = () => {
      adminInsightsPeriod = btn.dataset.period;
      renderAdmin(document.getElementById('app'));
    };
  });

  // Draw chart if container exists
  if (currentAdminTab === 'dashboard') {
    const getDailyData = () => {
      return adminStats?.dailySales || [];
    };

    const getWeeklyData = () => {
      const weekly = {};
      adminOrders.filter(o => o.status === 'paid' || o.status === 'processed').forEach(o => {
        const date = new Date(o.created_at);
        const year = date.getFullYear();
        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        const key = `${year}-W${weekNum}`;
        if (!weekly[key]) weekly[key] = { date: key, total: 0 };
        weekly[key].total += o.total_amount;
      });
      return Object.values(weekly).sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
    };

    const getMonthlyData = () => {
      const monthly = {};
      adminOrders.filter(o => o.status === 'paid' || o.status === 'processed').forEach(o => {
        const date = new Date(o.created_at);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!monthly[key]) monthly[key] = { date: key, total: 0 };
        monthly[key].total += o.total_amount;
      });
      return Object.values(monthly).sort((a, b) => a.date.localeCompare(b.date)).slice(-12);
    };

    const activeDataForChart = adminInsightsPeriod === 'daily' ? getDailyData() : (adminInsightsPeriod === 'weekly' ? getWeeklyData() : getMonthlyData());
    
    // Small delay to ensure container is in DOM fully
    setTimeout(() => drawPerformanceCurve(activeDataForChart), 100);
  }

  document.querySelectorAll('.order-status-change').forEach(select => {
    select.onchange = async () => {
      await makeApiCall(`/api/admin/orders/${select.dataset.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: select.value })
      });
      // Refresh data
      adminStats = await makeApiCall('/api/admin/stats');
      render();
    };
  });

  document.querySelectorAll('.order-customer-name-input, .order-customer-phone-input').forEach(input => {
    input.onblur = async () => {
      const row = input.closest('tr');
      const name = row.querySelector('.order-customer-name-input').value;
      const phone = row.querySelector('.order-customer-phone-input').value;
      
      await makeApiCall(`/api/admin/orders/${input.dataset.id}/customer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: name, customer_phone: phone })
      });
      // Silent update for better UX
      const order = adminOrders.find(o => o.id == input.dataset.id);
      if (order) {
        order.customer_name = name;
        order.customer_phone = phone;
      }
    };
  });

  document.querySelectorAll('.delete-order-btn').forEach(btn => {
    btn.onclick = async () => {
      if (await showConfirm('Expunge this transaction from the registry?')) {
        await makeApiCall(`/api/admin/orders/${btn.dataset.id}`, { method: 'DELETE' });
        adminStats = await makeApiCall('/api/admin/stats');
        render();
      }
    };
  });

  const couponForm = document.getElementById('coupon-form');
  if (couponForm) {
    couponForm.onsubmit = async (e) => {
      e.preventDefault();
      const couponData = Object.fromEntries(new FormData(couponForm));
      const res = await makeApiCall('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponData)
      });
      if (res && !res.error) {
        render();
      } else if (res && res.error) {
        showNotification(res.error);
      }
    };
  }

  document.querySelectorAll('.delete-coupon-btn').forEach(btn => {
    btn.onclick = async () => {
      if (await showConfirm('Decommission this promotional voucher?')) {
        await makeApiCall(`/api/admin/coupons/${btn.dataset.id}`, { method: 'DELETE' });
        render();
      }
    };
  });

  document.querySelectorAll('.view-order-details').forEach(btn => {
    btn.onclick = () => {
      const order = adminOrders.find(o => o.id == btn.dataset.id);
      if (order) {
        console.log(`Order Intelligence Captured: ${order.customer_name}`);
        // Optionally implement a non-blocking modal here if needed, but per request removing popups
      }
    };
  });

  // Universal Search Logic
  const searchInput = document.getElementById('admin-universal-search');
  if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
      const q = e.target.value;
      const resultsContainer = document.getElementById('search-results-floating');
      if (!q || q.length < 2) {
        resultsContainer?.classList.add('hidden');
        return;
      }

      const res = await makeApiCall(`/api/admin/search?q=${encodeURIComponent(q)}`);
      if (res && (res.products.length > 0 || res.orders.length > 0)) {
        resultsContainer.classList.remove('hidden');
        resultsContainer.innerHTML = `
          <div class="p-6 border-b border-brand-green/5 bg-brand-cream/10">
            <p class="text-[9px] uppercase tracking-[0.4em] font-black text-luxury-gold italic">Intelligence Registry Search</p>
          </div>
          <div class="p-4 space-y-2">
            ${res.products.map(p => `
              <button class="w-full text-left p-4 hover:bg-brand-cream/40 rounded-2xl transition-all flex items-center gap-5 group search-result-item border border-transparent hover:border-brand-green/10" data-type="product" data-id="${p.id}" data-slug="${p.slug}">
                <div class="w-12 h-16 bg-brand-green/10 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                  <img src="${p.image_url}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500">
                </div>
                <div class="flex-grow">
                  <p class="text-[11px] font-bold text-brand-green group-hover:text-luxury-gold transition-colors uppercase tracking-tight">${p.name}</p>
                  <p class="text-[8px] text-brand-green/30 uppercase tracking-[0.2em] font-black mt-1">PRODUCT • CAT-${p.category_id || '0000'}</p>
                </div>
                <span class="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity font-black text-luxury-gold">VIEW INVENTORY →</span>
              </button>
            `).join('')}
            ${res.orders.map(o => `
              <button class="w-full text-left p-4 hover:bg-brand-cream/40 rounded-2xl transition-all flex items-center gap-5 group search-result-item border border-transparent hover:border-brand-green/10" data-type="order" data-id="${o.id}">
                <div class="w-12 h-12 bg-luxury-gold/5 rounded-full flex items-center justify-center text-[10px] text-luxury-gold font-black flex-shrink-0 border border-luxury-gold/10">
                  ORD
                </div>
                <div class="flex-grow">
                  <p class="text-[11px] font-bold text-brand-green group-hover:text-luxury-gold transition-colors uppercase tracking-tight">${o.order_id_formatted}</p>
                  <p class="text-[8px] text-brand-green/30 uppercase tracking-[0.2em] font-black mt-1">${o.customer_name || 'Anonymous'} • ${o.customer_phone} • ₦${o.total_amount.toLocaleString()}</p>
                </div>
                <span class="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity font-black text-luxury-gold">GO TO ORDERS →</span>
              </button>
            `).join('')}
          </div>
        `;

        document.querySelectorAll('.search-result-item').forEach(btn => {
          btn.onclick = () => {
            const type = btn.dataset.type;
            const id = btn.dataset.id;
            if (type === 'product') {
              currentAdminTab = 'inventory';
              editingProductId = Number(id);
            } else {
              currentAdminTab = 'orders';
              // Optionally scroll or filter order later
            }
            resultsContainer.classList.add('hidden');
            renderAdmin(document.getElementById('app'));
          };
        });
      } else {
        resultsContainer.classList.add('hidden');
      }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !document.getElementById('search-results-floating')?.contains(e.target)) {
        document.getElementById('search-results-floating')?.classList.add('hidden');
      }
    });
  }
};

// Initial Render
window.onhashchange = render;
render();
