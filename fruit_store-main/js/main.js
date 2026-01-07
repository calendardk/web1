/**
 * Clean Fruits - Main JavaScript (Updated for LocalStorage)
 * Tối ưu performance và đồng bộ dữ liệu với Admin
 */

let allProducts = [];
let cartCount = 0;
let currentCategory = "all";
const STORAGE_KEY = "clean_fruit_products"; // Khóa dữ liệu chung với Admin

// Debounce helper function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Lazy loading images
function setupLazyLoading() {
  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: "50px",
    }
  );

  document.querySelectorAll("img[data-src]").forEach((img) => {
    imageObserver.observe(img);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

/**
 * Tính phần trăm giảm giá
 */
function calculateDiscount(oldPrice, newPrice) {
  if (!oldPrice || !newPrice) return null;

  const oldPriceNum = parseFloat(oldPrice.replace(/[^0-9]/g, ""));
  const newPriceNum = parseFloat(newPrice.replace(/[^0-9]/g, ""));

  if (oldPriceNum <= newPriceNum) return null;

  const discountPercent = Math.round(
    ((oldPriceNum - newPriceNum) / oldPriceNum) * 100
  );
  return `-${discountPercent}%`;
}

/**
 * Khởi tạo ứng dụng (Đã sửa để lấy từ LocalStorage)
 */
async function initApp() {
  try {
    let dataProducts = [];

    // BƯỚC 1: Kiểm tra xem Admin có cập nhật gì trong kho (LocalStorage) chưa?
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (storedData) {
      // Có hàng trong kho -> Lấy ra dùng ngay
      console.log("Main: Load dữ liệu từ LocalStorage (Dữ liệu mới nhất)");
      dataProducts = JSON.parse(storedData);
    } else {
      // Kho rỗng -> Lấy từ file gốc (products.json)
      console.log("Main: Load dữ liệu gốc từ file JSON");
      const response = await fetch("products.json");
      if (!response.ok) throw new Error("Không thể tải dữ liệu sản phẩm.");

      const data = await response.json();
      dataProducts = data.products;

      // Lưu luôn vào kho để lần sau dùng
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataProducts));
    }

    // Tự động tính discount cho các sản phẩm
    allProducts = dataProducts.map((product) => {
      if (product.newPrice && product.oldPrice && !product.discount) {
        product.discount = calculateDiscount(
          product.oldPrice,
          product.newPrice
        );
      }
      return product;
    });

    // Render các section ban đầu
    renderSection(allProducts, "flash-sale", "flash-sale-list");
    renderSection(allProducts, "best-seller", "best-seller-list");
    renderSection(allProducts, "gift", "gift-list");
    renderSection(allProducts, "cut-fruit", "cut-fruit-list");

    // Khởi tạo category filter
    initCategoryFilter();

    // Setup lazy loading sau khi render
    setupLazyLoading();

    console.log("Dữ liệu đã được tải và hiển thị thành công.");
  } catch (error) {
    console.error("Lỗi khởi tạo:", error);
  }
}

/**
 * Khởi tạo chức năng lọc theo category
 */
function initCategoryFilter() {
  const categoryCards = document.querySelectorAll(".category-card");

  if (categoryCards.length === 0) return;

  // Debounced filter function
  const debouncedFilter = debounce((category) => {
    filterProductsByCategory(category);
  }, 150);

  categoryCards.forEach((card) => {
    card.addEventListener("click", function () {
      // Bỏ active khỏi tất cả
      categoryCards.forEach((c) => c.classList.remove("active"));

      // Thêm active vào card được chọn
      this.classList.add("active");

      // Lấy category
      const category = this.dataset.category;
      currentCategory = category;

      // Lọc với debounce
      debouncedFilter(category);
    });
  });

  // Thêm hiệu ứng ripple
  categoryCards.forEach((card) => {
    card.addEventListener("click", function (e) {
      const oldRipple = this.querySelector(".ripple-effect");
      if (oldRipple) oldRipple.remove();

      const ripple = document.createElement("span");
      ripple.className = "ripple-effect";
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                animation: ripple 0.6s ease-out;
            `;

      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

/**
 * Lọc và hiển thị sản phẩm theo category
 */
function filterProductsByCategory(category) {
  let filteredSection = document.getElementById("filtered-products-section");

  if (!filteredSection) {
    const categorySection = document.querySelector(".category-section");
    const newSection = document.createElement("div");
    newSection.id = "filtered-products-section";
    newSection.className = "section-wrapper";
    newSection.innerHTML = `
            <div class="section-title">
                <h2 id="filtered-category-title">Sản Phẩm</h2>
            </div>
            <div class="slider-wrapper">
                <button class="slider-btn prev" onclick="scrollSlider('filtered-products-list', -1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="product-grid slider-container" id="filtered-products-list"></div>
                <button class="slider-btn next" onclick="scrollSlider('filtered-products-list', 1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="view-all-wrapper">
                <a href="all-products.html" class="btn-view-all" id="view-all-category">Xem tất cả</a>
            </div>
        `;

    if (categorySection && categorySection.parentElement) {
      const parentContainer = categorySection.parentElement;
      parentContainer.parentNode.insertBefore(
        newSection,
        parentContainer.nextSibling
      );
    }

    filteredSection = newSection;
  }

  const titleElement = document.getElementById("filtered-category-title");
  const categoryNames = {
    "dang-mua": "Trái Cây Đang Mùa",
    cherry: "Cherry Nhập Khẩu",
    nho: "Nho Nhập Khẩu",
    tao: "Táo Nhập Khẩu",
    kiwi: "Kiwi",
    "viet-nam": "Trái Cây Việt Nam",
    "cat-san": "Trái Cây Cắt Sẵn",
    "do-uong": "Đồ Uống",
    "gift-card": "Gift Card",
  };

  if (titleElement) {
    titleElement.textContent = categoryNames[category] || "Tất Cả Sản Phẩm";
  }

  const filteredProducts = allProducts.filter((p) => p.category === category);
  const filteredContainer = document.getElementById("filtered-products-list");

  if (filteredProducts.length === 0) {
    filteredContainer.innerHTML = `
            <p style="padding: 40px; text-align: center; color: #999; grid-column: 1/-1;">
                Chưa có sản phẩm trong danh mục này
            </p>
        `;
    return;
  }

  filteredContainer.innerHTML = filteredProducts
    .map((p) => createProductCard(p))
    .join("");

  setupLazyLoading();

  requestAnimationFrame(() => {
    filteredSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/**
 * Tạo HTML cho product card
 */
function createProductCard(product) {
  const hasSale = product.newPrice && product.oldPrice;
  const isGift = product.tags && product.tags.includes("gift");
  const isCutFruit = product.tags && product.tags.includes("cut-fruit");
  const isBestSeller = product.tags && product.tags.includes("best-seller");

  let priceHTML = "";
  if (hasSale) {
    priceHTML = `
            <span class="new-price">${product.newPrice}</span>
            <span class="old-price">${product.oldPrice}</span>
            ${
              product.discount
                ? `<span class="discount-badge">${product.discount}</span>`
                : ""
            }
        `;
  } else {
    priceHTML = `<span class="new-price">${
      product.price || product.newPrice
    }</span>`;
    if (isGift) {
      priceHTML += `<span class="gift-badge">🎁 GIFT</span>`;
    } else if (isCutFruit) {
      priceHTML += `<span class="fresh-badge">🌿 FRESH</span>`;
    } else if (isBestSeller) {
      priceHTML += `<span class="bestseller-badge">⭐ HOT</span>`;
    }
  }

  let cardClass = "";
  if (isGift) {
    cardClass = "gift-card";
  } else if (isCutFruit) {
    cardClass = "cut-fruit-card";
  } else if (isBestSeller) {
    cardClass = "best-seller-card";
  }

  const detailLink = `product-detail.html?id=${product.id}`;

  return `
        <div class="product-card ${cardClass}">
            <div class="product-img">
                <a href="${detailLink}">
                    <img src="${product.image}" alt="${product.name}">
                </a>
            </div>
            <div class="product-info">
                <div class="product-name">
                    <a href="${detailLink}" style="text-decoration: none; color: inherit;">
                        ${product.name}
                    </a>
                </div>
                <div class="product-price">
                    ${priceHTML}
                </div>
                <button class="btn-add-cart" onclick="addToCart(${product.id})">
                    ${
                      isGift
                        ? "🎁 "
                        : isCutFruit
                        ? "🥗 "
                        : isBestSeller
                        ? "⭐ "
                        : ""
                    }Thêm vào giỏ
                </button>
            </div>
        </div>
    `;
}

/**
 * Hiển thị sản phẩm vào từng khu vực
 */
function renderSection(products, tag, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const filteredItems = products
    .filter((p) => p.tags && p.tags.includes(tag))
    .slice(0, 10);

  if (filteredItems.length === 0) {
    container.innerHTML = `<p style="padding: 20px;">Đang cập nhật sản phẩm...</p>`;
    return;
  }

  container.innerHTML = filteredItems.map((p) => createProductCard(p)).join("");
}

/**
 * Logic điều khiển slider
 */
const sliderEdgeState = {};

function scrollSlider(containerId, direction) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const card = container.querySelector(".product-card");
  if (!card) return;

  const gap = 20;
  const cardWidth = card.offsetWidth + gap;
  const maxScroll = container.scrollWidth - container.clientWidth;

  if (!sliderEdgeState[containerId]) {
    sliderEdgeState[containerId] = {
      atEnd: false,
      atStart: true,
    };
  }

  const state = sliderEdgeState[containerId];

  if (state.atEnd && direction === 1) {
    container.scrollTo({ left: 0, behavior: "smooth" });
    state.atEnd = false;
    state.atStart = true;
    return;
  }

  if (state.atStart && direction === -1) {
    container.scrollTo({ left: maxScroll, behavior: "smooth" });
    state.atStart = false;
    state.atEnd = true;
    return;
  }

  requestAnimationFrame(() => {
    container.scrollBy({
      left: direction * cardWidth,
      behavior: "smooth",
    });
  });

  setTimeout(() => {
    const current = container.scrollLeft;
    state.atStart = current <= 10;
    state.atEnd = current >= maxScroll - cardWidth - 10;
  }, 350);
}

/**
 * Thêm vào giỏ hàng - Sử dụng CartManager
 */
function addToCart(productId, productName) {
  const product = allProducts.find((p) => p.id === productId);

  if (!product) {
    console.error("Product not found:", productId);
    return;
  }

  const price = product.newPrice || product.price || "0₫";
  const image = product.image || "img/placeholder.jpg";

  if (typeof CartManager !== "undefined") {
    CartManager.addToCart(productId, product.name, price, image);
  }
}

/**
 * Cập nhật giao diện giỏ hàng
 */
function updateCartUI() {
  const cartElement = document.querySelector(
    ".header-actions .item:last-child div"
  );
  if (cartElement) {
    cartElement.innerText = `Giỏ hàng (${cartCount})`;
  }
}

/* ==============================================
   LIVE SEARCH FUNCTION (Đã tối ưu cho LocalStorage)
   ============================================== */
document.addEventListener("DOMContentLoaded", () => {
  setupLiveSearch();
});

function setupLiveSearch() {
  const searchBox = document.querySelector(".search-box");
  const input = searchBox.querySelector("input");

  let resultsContainer = document.querySelector(".search-results");
  if (!resultsContainer) {
    resultsContainer = document.createElement("div");
    resultsContainer.className = "search-results";
    searchBox.appendChild(resultsContainer);
  }

  input.addEventListener("input", function (e) {
    const keyword = e.target.value.toLowerCase().trim();

    if (keyword.length < 1) {
      resultsContainer.classList.remove("active");
      return;
    }

    // Lọc từ allProducts (đã được load từ LocalStorage nếu có)
    const matches = allProducts.filter((p) =>
      p.name.toLowerCase().includes(keyword)
    );

    if (matches.length > 0) {
      resultsContainer.innerHTML = matches
        .map(
          (p) => `
                <a href="product-detail.html?id=${p.id}" class="search-item">
                    <img src="${p.image}" alt="${p.name}">
                    <div class="search-item-info">
                        <span class="search-item-name">${p.name}</span>
                        <span class="search-item-price">${
                          p.newPrice || p.price
                        }</span>
                    </div>
                </a>
            `
        )
        .join("");
      resultsContainer.classList.add("active");
    } else {
      resultsContainer.innerHTML = `<div class="search-item" style="justify-content:center; color:#999;">Không tìm thấy sản phẩm</div>`;
      resultsContainer.classList.add("active");
    }
  });

  document.addEventListener("click", function (e) {
    if (!searchBox.contains(e.target)) {
      resultsContainer.classList.remove("active");
    }
  });
}
/* --- LOGIC HIỂN THỊ TÊN NGƯỜI DÙNG CHUNG CHO MỌI TRANG --- */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Kiểm tra xem UserManager đã được load chưa
  if (typeof UserManager !== "undefined") {
    const currentUser = UserManager.getCurrentUser();
    // Tìm chỗ hiển thị tài khoản (dựa vào ID user-account)
    const userArea = document.getElementById("user-account");

    if (currentUser && userArea) {
      // Nếu ĐÃ ĐĂNG NHẬP -> Đổi giao diện
      userArea.innerHTML = `
                <div style="font-weight: bold; color: #4CAF50; cursor: pointer;">
                    Chào, ${currentUser.fullName || currentUser.username}
                </div>
                <div style="font-size: 13px;">
                    <a href="my-orders.html" style="color: #333; text-decoration: none;">📦 Đơn mua</a>
                    <span style="margin:0 5px">|</span>
                    <a href="#" onclick="UserManager.logout()" style="color: red; text-decoration: none;">Thoát</a>
                </div>
            `;
    }
  }
});
