import {
  addProduct,
  deleteProduct,
  getOrders,
  getProducts,
  getSession,
  initDB,
  logoutUser,
  updateOrderStatus,
  updateProduct,
  loginUser,
} from "./db.js";

initDB();

const ui = {
  loginSection: document.querySelector("#loginSection"),
  loginForm: document.querySelector("#loginForm"),
  dashboardSection: document.querySelector("#dashboardSection"),
  logoutBtn: document.querySelector("#logoutBtn"),
  productsCount: document.querySelector("#productsCount"),
  ordersCount: document.querySelector("#ordersCount"),
  revenueValue: document.querySelector("#revenueValue"),
  productForm: document.querySelector("#productForm"),
  resetProductBtn: document.querySelector("#resetProductBtn"),
  productsTable: document.querySelector("#productsTable"),
  ordersTable: document.querySelector("#ordersTable"),
  toast: document.querySelector("#toast"),
};

function money(value) {
  return `${value.toLocaleString("en-US")} ر.س`;
}

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("show");
  setTimeout(() => ui.toast.classList.remove("show"), 2200);
}

function checkAccess() {
  const session = getSession();
  const isAdmin = session?.role === "admin";

  ui.loginSection.classList.toggle("hidden", isAdmin);
  ui.dashboardSection.classList.toggle("hidden", !isAdmin);

  if (isAdmin) {
    renderAll();
  }
}

function renderStats() {
  const products = getProducts();
  const orders = getOrders();
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  ui.productsCount.textContent = String(products.length);
  ui.ordersCount.textContent = String(orders.length);
  ui.revenueValue.textContent = money(revenue);
}

function renderProductsTable() {
  const products = getProducts();
  if (!products.length) {
    ui.productsTable.innerHTML = '<p class="muted">لا توجد منتجات.</p>';
    return;
  }

  ui.productsTable.innerHTML = products
    .map(
      (item) => `
      <article class="table-row">
        <div class="table-row-head">
          <strong>${item.name}</strong>
          <span class="badge">${item.category}</span>
        </div>
        <p class="muted">${item.description}</p>
        <div class="table-row-head">
          <span>${money(item.price)} | مخزون: ${item.stock}</span>
          <div class="table-actions">
            <button class="btn ghost edit-product" data-id="${item.id}" type="button">تعديل</button>
            <button class="btn ghost delete-product" data-id="${item.id}" type="button">حذف</button>
          </div>
        </div>
      </article>
    `
    )
    .join("");

  ui.productsTable.querySelectorAll(".delete-product").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteProduct(btn.dataset.id);
      renderAll();
      toast("تم حذف المنتج");
    });
  });

  ui.productsTable.querySelectorAll(".edit-product").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = getProducts().find((item) => item.id === btn.dataset.id);
      if (!product) return;

      ui.productForm.elements.id.value = product.id;
      ui.productForm.elements.name.value = product.name;
      ui.productForm.elements.price.value = product.price;
      ui.productForm.elements.stock.value = product.stock;
      ui.productForm.elements.category.value = product.category;
      ui.productForm.elements.image.value = product.image;
      ui.productForm.elements.description.value = product.description;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function statusText(status) {
  if (status === "pending") return "قيد المراجعة";
  if (status === "processing") return "قيد التجهيز";
  if (status === "shipped") return "تم الشحن";
  return status;
}

function renderOrdersTable() {
  const orders = getOrders();
  if (!orders.length) {
    ui.ordersTable.innerHTML = '<p class="muted">لا توجد طلبات.</p>';
    return;
  }

  ui.ordersTable.innerHTML = orders
    .map(
      (order) => `
      <article class="table-row">
        <div class="table-row-head">
          <strong>${order.id}</strong>
          <span>${money(order.total)}</span>
        </div>
        <p class="muted">${order.customer.name} | ${order.customer.phone}</p>
        <p class="muted">${order.items.length} منتج - ${new Date(order.createdAt).toLocaleString("ar-SA")}</p>
        <div class="table-row-head">
          <span class="status ${order.status}">${statusText(order.status)}</span>
          <select class="order-status-select" data-id="${order.id}">
            <option value="pending" ${order.status === "pending" ? "selected" : ""}>قيد المراجعة</option>
            <option value="processing" ${order.status === "processing" ? "selected" : ""}>قيد التجهيز</option>
            <option value="shipped" ${order.status === "shipped" ? "selected" : ""}>تم الشحن</option>
          </select>
        </div>
      </article>
    `
    )
    .join("");

  ui.ordersTable.querySelectorAll(".order-status-select").forEach((select) => {
    select.addEventListener("change", () => {
      updateOrderStatus(select.dataset.id, select.value);
      renderAll();
      toast("تم تحديث حالة الطلب");
    });
  });
}

function renderAll() {
  renderStats();
  renderProductsTable();
  renderOrdersTable();
}

function initEvents() {
  ui.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(ui.loginForm);

    try {
      const session = loginUser(String(data.get("email")), String(data.get("password")));
      if (session.role !== "admin") {
        throw new Error("الحساب ليس إداريًا");
      }
      ui.loginForm.reset();
      checkAccess();
      toast("تم تسجيل الدخول");
    } catch (error) {
      toast(error.message);
    }
  });

  ui.logoutBtn.addEventListener("click", () => {
    logoutUser();
    checkAccess();
    toast("تم تسجيل الخروج");
  });

  ui.productForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(ui.productForm);

    const payload = {
      id: String(data.get("id") || ""),
      name: String(data.get("name")),
      price: Number(data.get("price")),
      stock: Number(data.get("stock")),
      category: String(data.get("category")),
      image: String(data.get("image")),
      description: String(data.get("description")),
    };

    if (payload.id) {
      updateProduct(payload);
      toast("تم تحديث المنتج");
    } else {
      addProduct(payload);
      toast("تمت إضافة المنتج");
    }

    ui.productForm.reset();
    renderAll();
  });

  ui.resetProductBtn.addEventListener("click", () => ui.productForm.reset());
}

initEvents();
checkAccess();
