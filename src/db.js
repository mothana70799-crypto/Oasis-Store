const KEYS = {
  products: "oasis_products",
  orders: "oasis_orders",
  users: "oasis_users",
  session: "oasis_session",
  wishlist: "oasis_wishlist",
};

const seedProducts = [
  {
    id: "p1",
    name: "سماعة لاسلكية برو",
    price: 219,
    stock: 14,
    category: "إلكترونيات",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    description: "صوت نقي وعزل ممتاز للضوضاء مع بطارية طويلة.",
  },
  {
    id: "p2",
    name: "ساعة ذكية Active",
    price: 349,
    stock: 10,
    category: "إلكترونيات",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80",
    description: "متابعة نشاطك اليومي مع شاشة AMOLED مقاومة للماء.",
  },
  {
    id: "p3",
    name: "حقيبة سفر خفيفة",
    price: 189,
    stock: 22,
    category: "سفر",
    image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80",
    description: "حقيبة عملية بخامات متينة وحجم مناسب للطيران.",
  },
  {
    id: "p4",
    name: "قميص كاجوال فاخر",
    price: 129,
    stock: 25,
    category: "أزياء",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    description: "قماش مريح بقصة عصرية مناسبة لكل الأوقات.",
  },
  {
    id: "p5",
    name: "عطر أو دو بارفان",
    price: 275,
    stock: 9,
    category: "عطور",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=80",
    description: "رائحة فاخرة بثبات يدوم طوال اليوم.",
  },
  {
    id: "p6",
    name: "كرسي مكتب مريح",
    price: 499,
    stock: 6,
    category: "منزل",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    description: "دعم كامل للظهر مع قابلية تعديل متعددة.",
  },
];

const seedUsers = [
  {
    id: "u_admin",
    name: "مدير المتجر",
    email: "admin@oasis.store",
    password: "admin123",
    role: "admin",
  },
];

function load(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function initDB() {
  if (!localStorage.getItem(KEYS.products)) {
    save(KEYS.products, seedProducts);
  }
  if (!localStorage.getItem(KEYS.orders)) {
    save(KEYS.orders, []);
  }
  if (!localStorage.getItem(KEYS.users)) {
    save(KEYS.users, seedUsers);
  } else {
    const users = getUsers().map((user) => ({
      id: String(user.id || crypto.randomUUID()),
      name: String(user.name || "مستخدم"),
      email: String(user.email || "").toLowerCase(),
      password: String(user.password || ""),
      role: user.role === "admin" ? "admin" : "customer",
    }));
    save(KEYS.users, users);
  }

  if (!localStorage.getItem(KEYS.wishlist)) {
    save(KEYS.wishlist, {});
  }
}

export function getProducts() {
  return load(KEYS.products, seedProducts);
}

export function addProduct(product) {
  const products = getProducts();
  const newItem = { ...product, id: crypto.randomUUID() };
  products.unshift(newItem);
  save(KEYS.products, products);
  return newItem;
}

export function updateProduct(updated) {
  const products = getProducts().map((item) =>
    item.id === updated.id ? { ...item, ...updated } : item
  );
  save(KEYS.products, products);
}

export function deleteProduct(id) {
  const products = getProducts().filter((item) => item.id !== id);
  save(KEYS.products, products);
}

export function getUsers() {
  return load(KEYS.users, seedUsers);
}

export function createUser(user) {
  const users = getUsers();
  const exists = users.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (exists) {
    throw new Error("البريد مستخدم مسبقًا");
  }
  const newUser = {
    id: crypto.randomUUID(),
    role: "customer",
    name: String(user.name),
    email: String(user.email).toLowerCase(),
    password: String(user.password),
  };
  users.push(newUser);
  save(KEYS.users, users);
  return newUser;
}

export function loginUser(email, password) {
  const users = getUsers();
  const found = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!found) {
    throw new Error("بيانات الدخول غير صحيحة");
  }
  const session = {
    id: found.id,
    name: found.name,
    role: found.role,
  };
  save(KEYS.session, session);
  return session;
}

export function getSession() {
  const session = localStorage.getItem(KEYS.session);
  if (!session) return null;

  try {
    const parsed = JSON.parse(session);
    const clean = {
      id: String(parsed.id || ""),
      name: String(parsed.name || ""),
      role: parsed.role === "admin" ? "admin" : "customer",
    };
    save(KEYS.session, clean);
    return clean;
  } catch {
    localStorage.removeItem(KEYS.session);
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(KEYS.session);
}

export function getOrders() {
  return load(KEYS.orders, []);
}

export function createOrder(order) {
  const products = getProducts();

  for (const item of order.items) {
    const found = products.find((product) => product.id === item.id);
    if (!found) {
      throw new Error(`المنتج غير موجود: ${item.name}`);
    }
    if (found.stock < item.qty) {
      throw new Error(`المخزون غير كافٍ للمنتج: ${found.name}`);
    }
  }

  const updatedProducts = products.map((product) => {
    const target = order.items.find((item) => item.id === product.id);
    if (!target) return product;
    return {
      ...product,
      stock: Math.max(0, product.stock - target.qty),
    };
  });

  save(KEYS.products, updatedProducts);

  const orders = getOrders();
  const newOrder = {
    ...order,
    id: `ORD-${Date.now().toString().slice(-7)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  orders.unshift(newOrder);
  save(KEYS.orders, orders);
  return newOrder;
}

export function updateOrderStatus(orderId, status) {
  const orders = getOrders().map((order) =>
    order.id === orderId ? { ...order, status } : order
  );
  save(KEYS.orders, orders);
}

export function getWishlist(scopeId = "guest") {
  const map = load(KEYS.wishlist, {});
  const list = map?.[scopeId];
  return Array.isArray(list) ? list : [];
}

export function toggleWishlistItem(scopeId = "guest", productId) {
  const map = load(KEYS.wishlist, {});
  const current = Array.isArray(map?.[scopeId]) ? map[scopeId] : [];
  const exists = current.includes(productId);
  const next = exists
    ? current.filter((id) => id !== productId)
    : [...current, productId];

  map[scopeId] = next;
  save(KEYS.wishlist, map);

  return {
    added: !exists,
    items: next,
  };
}
