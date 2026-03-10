import {
  createOrder,
  getOrders,
  getProducts,
  getSession,
  getWishlist,
  initDB,
  logoutUser,
  toggleWishlistItem,
} from "./db.js";

initDB();

const state = {
  products: getProducts(),
  filtered: [],
  cart: [],
  compare: [],
  session: getSession(),
  wishlistScope: "guest",
  wishlistIds: [],
  activeHeroSlide: 0,
};

const ui = {
  topActions: document.querySelector("#topActions"),
  navToggleBtn: document.querySelector("#navToggleBtn"),
  platformIntro: document.querySelector(".platform-intro"),
  heroKicker: document.querySelector("#heroKicker"),
  heroTitle: document.querySelector("#heroTitle"),
  heroText: document.querySelector("#heroText"),
  heroDots: document.querySelector("#heroDots"),
  productGrid: document.querySelector("#productGrid"),
  categoryFilter: document.querySelector("#categoryFilter"),
  categoryChips: document.querySelector("#categoryChips"),
  sortSelect: document.querySelector("#sortSelect"),
  searchInput: document.querySelector("#searchInput"),
  cartToggleBtn: document.querySelector("#cartToggleBtn"),
  closeCartBtn: document.querySelector("#closeCartBtn"),
  cartDrawer: document.querySelector("#cartDrawer"),
  cartBackdrop: document.querySelector("#cartBackdrop"),
  cartItems: document.querySelector("#cartItems"),
  cartCount: document.querySelector("#cartCount"),
  subtotalValue: document.querySelector("#subtotalValue"),
  shippingValue: document.querySelector("#shippingValue"),
  totalValue: document.querySelector("#totalValue"),
  checkoutForm: document.querySelector("#checkoutForm"),
  ordersList: document.querySelector("#ordersList"),
  toast: document.querySelector("#toast"),
  userArea: document.querySelector("#userArea"),
  productsCountBadge: document.querySelector("#productsCountBadge"),
  rotatingOfferText: document.querySelector("#rotatingOfferText"),
  backToTopBtn: document.querySelector("#backToTopBtn"),
  productModal: document.querySelector("#productModal"),
  closeProductModalBtn: document.querySelector("#closeProductModalBtn"),
  productModalImage: document.querySelector("#productModalImage"),
  productModalCategory: document.querySelector("#productModalCategory"),
  productModalTitle: document.querySelector("#productModalTitle"),
  productModalDescription: document.querySelector("#productModalDescription"),
  productModalPrice: document.querySelector("#productModalPrice"),
  wishlistGrid: document.querySelector("#wishlistGrid"),
  recommendedGrid: document.querySelector("#recommendedGrid"),
  compareTray: document.querySelector("#compareTray"),
  compareItems: document.querySelector("#compareItems"),
  runCompareBtn: document.querySelector("#runCompareBtn"),
  clearCompareBtn: document.querySelector("#clearCompareBtn"),
  compareModal: document.querySelector("#compareModal"),
  closeCompareModalBtn: document.querySelector("#closeCompareModalBtn"),
  compareTable: document.querySelector("#compareTable"),
  orderModal: document.querySelector("#orderModal"),
  closeOrderModalBtn: document.querySelector("#closeOrderModalBtn"),
  copyOrderIdBtn: document.querySelector("#copyOrderIdBtn"),
  orderModalTitle: document.querySelector("#orderModalTitle"),
  orderModalMeta: document.querySelector("#orderModalMeta"),
  orderTimeline: document.querySelector("#orderTimeline"),
  orderItemsList: document.querySelector("#orderItemsList"),
};

const heroSlides = [
  {
    kicker: "عرض اليوم",
    title: "واجهة تسوق أسرع.. وأناقة تليق بتجربتك",
    text: "اكتشف منتجات مختارة بعناية، تصفح سلس، وسلة ذكية تساعدك تخلص الطلب خلال دقائق.",
  },
  {
    kicker: "العرض الأسبوعي",
    title: "تجربة تصفح أخف.. مع اكتشاف أسرع للمنتجات",
    text: "فلترة ذكية، تصنيفات واضحة، وبطاقات احترافية تخليك توصل لمنتجك بسرعة.",
  },
  {
    kicker: "ميزة خاصة",
    title: "من الجوال إلى اللابتوب.. نفس الجودة ونفس السلاسة",
    text: "واجهة متجاوبة بالكامل لرحلة شراء مريحة مهما كان جهازك.",
  },
];

function money(value) {
  return `${value.toLocaleString("en-US")} ر.س`;
}

function resolveWishlistScope() {
  return state.session?.id || "guest";
}

function isWishlisted(productId) {
  return state.wishlistIds.includes(productId);
}

function productCardMarkup(product) {
  const soldOut = product.stock <= 0;

  return `
    <article class="product-card">
      <span class="product-shine"></span>
      <span class="product-tag">مختار بعناية</span>
      <button class="wishlist-btn ${isWishlisted(product.id) ? "active" : ""}" data-id="${product.id}" type="button" aria-label="إضافة للمفضلة">❤</button>
      <img src="${product.image}" alt="${product.name}" loading="lazy" />
      <div class="content">
        <div class="card-topline">
          <span class="badge">${product.category}</span>
          <span class="rating">★ 4.9</span>
        </div>
        <h4 class="product-title">${product.name}</h4>
        <p class="muted">${product.description}</p>
        <div class="card-bottom">
          <p class="price">${money(product.price)}</p>
          <span class="stock-chip">متوفر: ${product.stock}</span>
        </div>
        <button class="btn primary add-to-cart-btn" data-id="${product.id}" type="button" ${soldOut ? "disabled" : ""}>${soldOut ? "نفد المخزون" : "إضافة للسلة"}</button>
        <button class="btn ghost view-details-btn" data-id="${product.id}" type="button">التفاصيل</button>
        <button class="btn ghost compare-btn" data-id="${product.id}" type="button">قارن</button>
      </div>
    </article>
  `;
}

function bindProductActions(root) {
  root.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = state.products.find((p) => p.id === btn.dataset.id);
      if (!product) return;
      if (product.stock <= 0) {
        showToast("المنتج غير متوفر حاليًا");
        return;
      }
      const existing = state.cart.find((item) => item.id === product.id);
      if (existing && existing.qty >= product.stock) {
        showToast("تم الوصول لأقصى كمية متاحة");
        return;
      }
      if (existing) {
        existing.qty += 1;
      } else {
        state.cart.push({ ...product, qty: 1 });
      }
      renderCart();
      renderRecommendations();
      showToast("تمت إضافة المنتج إلى السلة");
    });
  });

  root.querySelectorAll(".view-details-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = state.products.find((p) => p.id === btn.dataset.id);
      if (!product) return;
      openProductModal(product);
    });
  });

  root.querySelectorAll(".compare-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = String(btn.dataset.id);
      if (state.compare.includes(id)) {
        state.compare = state.compare.filter((item) => item !== id);
        renderCompareTray();
        return;
      }

      if (state.compare.length >= 2) {
        showToast("يمكن مقارنة منتجين فقط");
        return;
      }

      state.compare.push(id);
      renderCompareTray();
    });
  });

  root.querySelectorAll(".wishlist-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const result = toggleWishlistItem(state.wishlistScope, String(btn.dataset.id));
      state.wishlistIds = result.items;
      renderProducts();
      renderWishlist();
      renderRecommendations();
      showToast(result.added ? "تمت الإضافة للمفضلة" : "تمت الإزالة من المفضلة");
    });
  });
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("show");
  setTimeout(() => ui.toast.classList.remove("show"), 2200);
}

function renderUserArea() {
  if (!ui.userArea) return;

  if (state.session) {
    ui.userArea.innerHTML = `
      <span class="user-chip">${state.session.name}</span>
      <button class="btn ghost" id="logoutBtn" type="button">تسجيل خروج</button>
    `;
    document.querySelector("#logoutBtn")?.addEventListener("click", () => {
      logoutUser();
      location.reload();
    });
    return;
  }

  ui.userArea.innerHTML = '<a class="btn ghost" href="./login.html">تسجيل دخول</a>';
}

function uniqueCategories() {
  return ["الكل", ...new Set(state.products.map((p) => p.category))];
}

function applyFilters() {
  const query = ui.searchInput.value.trim().toLowerCase();
  const category = ui.categoryFilter.value;
  const sort = ui.sortSelect.value;

  let list = [...state.products];

  if (category !== "الكل") {
    list = list.filter((item) => item.category === category);
  }

  if (query) {
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  }

  if (sort === "priceAsc") list.sort((a, b) => a.price - b.price);
  if (sort === "priceDesc") list.sort((a, b) => b.price - a.price);
  if (sort === "nameAsc") list.sort((a, b) => a.name.localeCompare(b.name, "ar"));

  state.filtered = list;
  renderProducts();
}

function renderCategories() {
  const items = uniqueCategories()
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join("");
  ui.categoryFilter.innerHTML = items;
  renderCategoryChips();
}

function renderCategoryChips() {
  if (!ui.categoryChips) return;
  const chips = uniqueCategories()
    .map(
      (cat) =>
        `<button class="chip ${cat === ui.categoryFilter.value ? "active" : ""}" data-category="${cat}" type="button">${cat}</button>`
    )
    .join("");

  ui.categoryChips.innerHTML = chips;

  ui.categoryChips.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      ui.categoryFilter.value = chip.dataset.category;
      applyFilters();
      renderCategoryChips();
    });
  });
}

function renderProducts() {
  if (ui.productsCountBadge) {
    ui.productsCountBadge.textContent = `${state.filtered.length} منتج`;
  }

  if (!state.filtered.length) {
    ui.productGrid.innerHTML = '<p class="muted">لا توجد منتجات مطابقة حاليًا.</p>';
    return;
  }

  ui.productGrid.innerHTML = state.filtered
    .map((product) => productCardMarkup(product))
    .join("");

  bindProductActions(ui.productGrid);
}

function renderProductSkeleton(count = 6) {
  ui.productGrid.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <article class="product-card skeleton-card">
        <div class="skeleton-line image"></div>
        <div class="content">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line mid"></div>
        </div>
      </article>
    `
    )
    .join("");
}

function renderWishlist() {
  if (!ui.wishlistGrid) return;

  const items = state.wishlistIds
    .map((id) => state.products.find((product) => product.id === id))
    .filter(Boolean);

  if (!items.length) {
    ui.wishlistGrid.innerHTML = '<p class="muted">لا توجد منتجات في المفضلة بعد.</p>';
    return;
  }

  ui.wishlistGrid.innerHTML = items.map((product) => productCardMarkup(product)).join("");
  bindProductActions(ui.wishlistGrid);
}

function renderRecommendations() {
  if (!ui.recommendedGrid) return;

  const cartCategorySet = new Set(
    state.cart
      .map((item) => item.category)
      .filter(Boolean)
  );

  let list = [];

  if (cartCategorySet.size) {
    list = state.products.filter(
      (product) =>
        cartCategorySet.has(product.category) &&
        !state.cart.some((item) => item.id === product.id)
    );
  }

  if (!list.length) {
    list = state.products.filter((product) => !state.wishlistIds.includes(product.id));
  }

  const top = list.slice(0, 4);

  if (!top.length) {
    ui.recommendedGrid.innerHTML = '<p class="muted">لا توجد اقتراحات حاليًا.</p>';
    return;
  }

  ui.recommendedGrid.innerHTML = top.map((product) => productCardMarkup(product)).join("");
  bindProductActions(ui.recommendedGrid);
}

function openProductModal(product) {
  if (!ui.productModal) return;

  ui.productModalImage.src = product.image;
  ui.productModalImage.alt = product.name;
  ui.productModalCategory.textContent = product.category;
  ui.productModalTitle.textContent = product.name;
  ui.productModalDescription.textContent = product.description;
  ui.productModalPrice.textContent = money(product.price);
  ui.productModal.classList.add("open");
  ui.productModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
}

function closeProductModal() {
  if (!ui.productModal) return;
  ui.productModal.classList.remove("open");
  ui.productModal.setAttribute("aria-hidden", "true");
  if (!ui.cartDrawer.classList.contains("open")) {
    document.body.classList.remove("cart-open");
  }
}

function renderCompareTray() {
  if (!ui.compareTray || !ui.compareItems || !ui.runCompareBtn) return;

  if (!state.compare.length) {
    ui.compareTray.classList.remove("show");
    ui.compareItems.innerHTML = "";
    return;
  }

  const items = state.compare
    .map((id) => state.products.find((p) => p.id === id))
    .filter(Boolean)
    .map(
      (product) => `
      <span class="compare-pill">
        ${product.name}
        <button class="remove-compare" data-id="${product.id}" type="button">✕</button>
      </span>
    `
    )
    .join("");

  ui.compareItems.innerHTML = items;
  ui.compareTray.classList.add("show");
  ui.runCompareBtn.disabled = state.compare.length < 2;

  ui.compareItems.querySelectorAll(".remove-compare").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.compare = state.compare.filter((id) => id !== String(btn.dataset.id));
      renderCompareTray();
    });
  });
}

function openCompareModal() {
  if (state.compare.length < 2 || !ui.compareModal || !ui.compareTable) return;

  const items = state.compare
    .map((id) => state.products.find((p) => p.id === id))
    .filter(Boolean);

  if (items.length < 2) return;

  ui.compareTable.innerHTML = `
    <h3>مقارنة المنتجات</h3>
    <div class="compare-row"><strong>المنتج</strong><span>${items[0].name}</span><span>${items[1].name}</span></div>
    <div class="compare-row"><strong>السعر</strong><span>${money(items[0].price)}</span><span>${money(items[1].price)}</span></div>
    <div class="compare-row"><strong>التصنيف</strong><span>${items[0].category}</span><span>${items[1].category}</span></div>
    <div class="compare-row"><strong>المخزون</strong><span>${items[0].stock}</span><span>${items[1].stock}</span></div>
    <div class="compare-row"><strong>الوصف</strong><span>${items[0].description}</span><span>${items[1].description}</span></div>
  `;

  ui.compareModal.classList.add("open");
  ui.compareModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
}

function closeCompareModal() {
  if (!ui.compareModal) return;
  ui.compareModal.classList.remove("open");
  ui.compareModal.setAttribute("aria-hidden", "true");
  if (!ui.cartDrawer.classList.contains("open") && !ui.productModal?.classList.contains("open")) {
    document.body.classList.remove("cart-open");
  }
}

function renderOrderTimeline(status) {
  const steps = [
    { key: "pending", label: "استلام الطلب" },
    { key: "processing", label: "تجهيز الطلب" },
    { key: "shipped", label: "الشحن" },
  ];
  const current = {
    pending: 0,
    processing: 1,
    shipped: 2,
  }[status] ?? 0;

  return steps
    .map((step, index) => `<span class="timeline-step ${index <= current ? "active" : ""}">${step.label}</span>`)
    .join("");
}

function openOrderModal(order) {
  if (!ui.orderModal || !ui.orderModalMeta || !ui.orderItemsList || !ui.orderTimeline) return;

  if (ui.orderModalTitle) {
    ui.orderModalTitle.textContent = `تفاصيل ${order.id}`;
  }

  ui.orderModalMeta.innerHTML = `
    <strong>الحالة</strong>
    <span class="status ${order.status}">${statusMap(order.status)}</span>
    <span>${new Date(order.createdAt).toLocaleString("ar-SA")}</span>
  `;

  ui.orderTimeline.innerHTML = renderOrderTimeline(order.status);
  ui.orderItemsList.innerHTML = order.items
    .map(
      (item) => `
      <article class="order-card">
        <strong>${item.name}</strong>
        <div class="order-meta">
          <span>الكمية: ${item.qty}</span>
          <span>${money(item.price)}</span>
        </div>
      </article>
    `
    )
    .join("");

  ui.copyOrderIdBtn?.setAttribute("data-order-id", order.id);
  ui.orderModal.classList.add("open");
  ui.orderModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
}

function closeOrderModal() {
  if (!ui.orderModal) return;
  ui.orderModal.classList.remove("open");
  ui.orderModal.setAttribute("aria-hidden", "true");
  if (
    !ui.cartDrawer.classList.contains("open") &&
    !ui.productModal?.classList.contains("open") &&
    !ui.compareModal?.classList.contains("open")
  ) {
    document.body.classList.remove("cart-open");
  }
}

function validateCheckout(customer) {
  const name = String(customer.name || "").trim();
  const city = String(customer.city || "").trim();
  const address = String(customer.address || "").trim();
  const phone = String(customer.phone || "").trim();

  if (name.length < 3) return "يرجى كتابة اسم كامل صحيح";
  if (city.length < 2) return "يرجى إدخال المدينة بشكل صحيح";
  if (address.length < 6) return "يرجى إدخال عنوان تفصيلي أوضح";
  if (!/^(?:\+966|0)?5\d{8}$/.test(phone)) return "صيغة رقم الجوال غير صحيحة";
  return null;
}

function renderCart() {
  const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal > 0 ? (subtotal >= 300 ? 0 : 25) : 0;
  const total = subtotal + shipping;

  ui.cartCount.textContent = String(count);
  ui.cartCount.classList.add("bump");
  setTimeout(() => ui.cartCount.classList.remove("bump"), 220);
  ui.subtotalValue.textContent = money(subtotal);
  ui.shippingValue.textContent = money(shipping);
  ui.totalValue.textContent = money(total);

  if (!state.cart.length) {
    ui.cartItems.innerHTML = '<p class="muted">السلة فارغة.</p>';
    renderRecommendations();
    return;
  }

  ui.cartItems.innerHTML = state.cart
    .map(
      (item) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" />
        <div>
          <strong>${item.name}</strong>
          <p class="price">${money(item.price)}</p>
          <div class="qty-control">
            <button data-op="minus" data-id="${item.id}" type="button">-</button>
            <span>${item.qty}</span>
            <button data-op="plus" data-id="${item.id}" type="button">+</button>
          </div>
        </div>
        <button class="remove-btn" data-op="remove" data-id="${item.id}" type="button">حذف</button>
      </div>
    `
    )
    .join("");

  ui.cartItems.querySelectorAll("button[data-op]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const op = btn.dataset.op;
      const item = state.cart.find((x) => x.id === id);
      if (!item) return;

      if (op === "plus") item.qty += 1;
      if (op === "minus") item.qty = Math.max(1, item.qty - 1);
      if (op === "remove") state.cart = state.cart.filter((x) => x.id !== id);

      renderCart();
    });
  });

  renderRecommendations();
}

function renderOrders() {
  const orders = getOrders();
  const ownOrders = state.session ? orders.filter((o) => o.userId === state.session.id) : [];

  if (!state.session) {
    ui.ordersList.innerHTML = '<p class="muted">سجّل دخولك لعرض طلباتك.</p>';
    return;
  }

  if (!ownOrders.length) {
    ui.ordersList.innerHTML = '<p class="muted">لا توجد طلبات حتى الآن.</p>';
    return;
  }

  ui.ordersList.innerHTML = ownOrders
    .map(
      (order) => `
      <article class="order-card">
        <strong>${order.id}</strong>
        <div class="order-meta">
          <span>${new Date(order.createdAt).toLocaleString("ar-SA")}</span>
          <span class="status ${order.status}">${statusMap(order.status)}</span>
        </div>
        <p class="muted">${order.items.length} منتج - ${money(order.total)}</p>
        <button class="btn ghost track-order-btn" data-id="${order.id}" type="button">تتبع الطلب</button>
      </article>
    `
    )
    .join("");

  ui.ordersList.querySelectorAll(".track-order-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const order = ownOrders.find((item) => item.id === btn.dataset.id);
      if (!order) return;
      openOrderModal(order);
    });
  });
}

function statusMap(status) {
  if (status === "pending") return "قيد المراجعة";
  if (status === "processing") return "قيد التجهيز";
  if (status === "shipped") return "تم الشحن";
  return status;
}

function openCart() {
  ui.cartDrawer.classList.add("open");
  ui.cartDrawer.setAttribute("aria-hidden", "false");
  ui.cartBackdrop?.classList.add("show");
  ui.cartBackdrop?.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
}

function closeCart() {
  ui.cartDrawer.classList.remove("open");
  ui.cartDrawer.setAttribute("aria-hidden", "true");
  ui.cartBackdrop?.classList.remove("show");
  ui.cartBackdrop?.setAttribute("aria-hidden", "true");
  if (
    !ui.productModal?.classList.contains("open") &&
    !ui.compareModal?.classList.contains("open") &&
    !ui.orderModal?.classList.contains("open")
  ) {
    document.body.classList.remove("cart-open");
  }
}

function closeNavMenu() {
  if (!ui.topActions || !ui.navToggleBtn) return;
  ui.topActions.classList.remove("open");
  ui.navToggleBtn.setAttribute("aria-expanded", "false");
  ui.navToggleBtn.textContent = "☰";
}

function initNavMenu() {
  if (!ui.navToggleBtn || !ui.topActions) return;

  ui.navToggleBtn.addEventListener("click", () => {
    const open = ui.topActions.classList.toggle("open");
    ui.navToggleBtn.setAttribute("aria-expanded", String(open));
    ui.navToggleBtn.textContent = open ? "✕" : "☰";
  });

  ui.topActions.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("click", () => {
      if (window.innerWidth <= 680 && ui.topActions.classList.contains("open")) {
        closeNavMenu();
      }
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 680) {
      closeNavMenu();
    }
  });
}

function initOfferRotator() {
  if (!ui.rotatingOfferText) return;

  const offers = [
    "على أول طلب عند الوصول إلى 300 ر.س + شحن مجاني",
    "هدايا مجانية على الطلبات المختارة هذا الأسبوع",
    "تخفيضات يومية تتحدث تلقائيًا داخل المتجر",
  ];

  let index = 0;
  setInterval(() => {
    index = (index + 1) % offers.length;
    ui.rotatingOfferText.textContent = offers[index];
  }, 3200);
}

function renderHeroDots() {
  if (!ui.heroDots) return;
  ui.heroDots.innerHTML = heroSlides
    .map(
      (_, index) =>
        `<button class="hero-dot ${index === state.activeHeroSlide ? "active" : ""}" data-index="${index}" type="button" aria-label="عرض ${index + 1}"></button>`
    )
    .join("");

  ui.heroDots.querySelectorAll(".hero-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      state.activeHeroSlide = Number(dot.dataset.index);
      applyHeroSlide();
    });
  });
}

function applyHeroSlide() {
  const slide = heroSlides[state.activeHeroSlide];
  if (!slide || !ui.heroKicker || !ui.heroTitle || !ui.heroText) return;
  ui.heroKicker.textContent = slide.kicker;
  ui.heroTitle.textContent = slide.title;
  ui.heroText.textContent = slide.text;
  renderHeroDots();
}

function initHeroSlider() {
  if (!ui.heroTitle) return;
  applyHeroSlide();
  setInterval(() => {
    state.activeHeroSlide = (state.activeHeroSlide + 1) % heroSlides.length;
    applyHeroSlide();
  }, 4200);
}

function initBackToTop() {
  if (!ui.backToTopBtn) return;

  const syncVisibility = () => {
    ui.backToTopBtn.classList.toggle("show", window.scrollY > 350);
  };

  window.addEventListener("scroll", syncVisibility);
  syncVisibility();

  ui.backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function prefillCheckoutForm() {
  if (!ui.checkoutForm) return;

  const nameInput = ui.checkoutForm.elements.name;
  const phoneInput = ui.checkoutForm.elements.phone;
  const cityInput = ui.checkoutForm.elements.city;
  const addressInput = ui.checkoutForm.elements.address;

  if (state.session?.name && !nameInput.value) {
    nameInput.value = state.session.name;
  }

  if (!state.session) return;

  const latestOrder = getOrders().find((order) => order.userId === state.session.id);
  if (!latestOrder?.customer) return;

  if (!phoneInput.value) phoneInput.value = latestOrder.customer.phone || "";
  if (!cityInput.value) cityInput.value = latestOrder.customer.city || "";
  if (!addressInput.value) addressInput.value = latestOrder.customer.address || "";
}

function initPlatformMotion() {
  if (!ui.platformIntro) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce), (hover: none)").matches) return;

  const tiles = Array.from(ui.platformIntro.querySelectorAll(".intro-tile"));

  ui.platformIntro.addEventListener("mousemove", (event) => {
    const rect = ui.platformIntro.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;

    tiles.forEach((tile, index) => {
      const depth = (index + 1) * 5;
      tile.style.transform = `translate(${px * depth * -1}px, ${py * depth * -1}px)`;
    });
  });

  ui.platformIntro.addEventListener("mouseleave", () => {
    tiles.forEach((tile) => {
      tile.style.transform = "translate(0, 0)";
    });
  });
}

function initEvents() {
  ui.searchInput.addEventListener("input", applyFilters);
  ui.categoryFilter.addEventListener("change", applyFilters);
  ui.categoryFilter.addEventListener("change", renderCategoryChips);
  ui.sortSelect.addEventListener("change", applyFilters);

  ui.cartToggleBtn.addEventListener("click", openCart);
  ui.closeCartBtn.addEventListener("click", closeCart);
  ui.cartBackdrop?.addEventListener("click", closeCart);
  ui.closeProductModalBtn?.addEventListener("click", closeProductModal);
  ui.runCompareBtn?.addEventListener("click", openCompareModal);
  ui.clearCompareBtn?.addEventListener("click", () => {
    state.compare = [];
    renderCompareTray();
  });
  ui.closeCompareModalBtn?.addEventListener("click", closeCompareModal);
  ui.closeOrderModalBtn?.addEventListener("click", closeOrderModal);
  ui.copyOrderIdBtn?.addEventListener("click", async () => {
    const orderId = ui.copyOrderIdBtn?.getAttribute("data-order-id");
    if (!orderId) return;

    try {
      await navigator.clipboard.writeText(orderId);
      showToast("تم نسخ رقم الطلب");
    } catch {
      showToast(orderId);
    }
  });
  ui.productModal?.addEventListener("click", (event) => {
    if (event.target === ui.productModal) {
      closeProductModal();
    }
  });
  ui.compareModal?.addEventListener("click", (event) => {
    if (event.target === ui.compareModal) {
      closeCompareModal();
    }
  });
  ui.orderModal?.addEventListener("click", (event) => {
    if (event.target === ui.orderModal) {
      closeOrderModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCart();
      closeNavMenu();
      closeProductModal();
      closeCompareModal();
      closeOrderModal();
    }
  });

  ui.checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.cart.length) {
      showToast("السلة فارغة");
      return;
    }

    if (!state.session) {
      showToast("سجل دخولك أولًا لإكمال الطلب");
      setTimeout(() => (location.href = "./login.html"), 500);
      return;
    }

    const formData = new FormData(ui.checkoutForm);
    const customer = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      city: formData.get("city"),
      address: formData.get("address"),
    };

    const customerError = validateCheckout(customer);
    if (customerError) {
      showToast(customerError);
      return;
    }

    const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = subtotal >= 300 ? 0 : 25;

    try {
      createOrder({
        userId: state.session.id,
        customer,
        items: state.cart.map((item) => ({
          id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price,
        })),
        subtotal,
        shipping,
        total: subtotal + shipping,
      });

      state.products = getProducts();
      state.filtered = [...state.products];
      state.cart = [];
      ui.checkoutForm.reset();
      applyFilters();
      renderWishlist();
      renderRecommendations();
      renderCart();
      renderOrders();
      showToast("تم إنشاء الطلب بنجاح");
    } catch (error) {
      showToast(error.message || "تعذر إنشاء الطلب");
    }
  });
}

function boot() {
  state.wishlistScope = resolveWishlistScope();
  state.wishlistIds = getWishlist(state.wishlistScope);

  renderUserArea();
  renderCategories();
  renderProductSkeleton();
  renderWishlist();
  renderRecommendations();
  renderCart();
  renderOrders();
  renderCompareTray();
  prefillCheckoutForm();
  initHeroSlider();
  initPlatformMotion();
  initNavMenu();
  initOfferRotator();
  initBackToTop();
  initEvents();

  setTimeout(() => {
    applyFilters();
  }, 220);
}

boot();
