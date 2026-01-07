/**
 * All Products Page JavaScript (Updated for LocalStorage)
 * Handles product display, filtering, sorting and pagination
 */

// Global variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 16; // 4 rows x 4 products
const STORAGE_KEY = "clean_fruit_products"; // Khóa dữ liệu chung với Admin

/**
 * Initialize the page
 */
async function initAllProductsPage() {
  try {
    showLoading();

    let dataProducts = [];

    // BƯỚC 1: Kiểm tra xem có hàng trong kho (LocalStorage) không?
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (storedData) {
      // TRƯỜNG HỢP 1: Có hàng trong kho -> Lấy ra dùng ngay
      console.log("AllProducts: Load dữ liệu từ LocalStorage");
      dataProducts = JSON.parse(storedData);
    } else {
      // TRƯỜNG HỢP 2: Kho rỗng -> Nhập từ file JSON gốc
      console.log("AllProducts: Load dữ liệu gốc từ file JSON");
      const response = await fetch("products.json");
      if (!response.ok) throw new Error("Cannot load products data");

      const data = await response.json();
      dataProducts = data.products;

      // Lưu luôn vào kho để lần sau dùng
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataProducts));
    }

    allProducts = dataProducts;

    // Add discount calculation for products without discount
    allProducts = allProducts.map((product) => {
      if (product.newPrice && product.oldPrice && !product.discount) {
        const discount = calculateDiscount(product.oldPrice, product.newPrice);
        product.discount = discount;
      }
      return product;
    });

    // Initialize filtered products
    filteredProducts = [...allProducts];

    // Setup event listeners
    setupFilters();

    // Check for URL parameters and apply filter
    checkURLParams();

    // Render initial page
    renderProducts(currentPage);
    renderPagination();
    updateProductCount();

    console.log("All Products page loaded successfully");
    console.log(`Total products: ${allProducts.length}`);
  } catch (error) {
    console.error("Error loading all products page:", error);
    showError();
  }
}

/**
 * Check URL parameters and apply filters
 */
function checkURLParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category");

  if (category) {
    const categoryFilter = document.getElementById("category-filter");
    if (categoryFilter) {
      categoryFilter.value = category;
      applyFilters();
    }
  }
}

/**
 * Calculate discount percentage
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
 * Setup filter event listeners
 */
function setupFilters() {
  const categoryFilter = document.getElementById("category-filter");
  const priceFilter = document.getElementById("price-filter");
  const sortFilter = document.getElementById("sort-filter");

  if (categoryFilter) {
    categoryFilter.addEventListener("change", applyFilters);
  }

  if (priceFilter) {
    priceFilter.addEventListener("change", applyFilters);
  }

  if (sortFilter) {
    sortFilter.addEventListener("change", applyFilters);
  }
}

/**
 * Apply filters and sorting
 */
function applyFilters() {
  const categoryFilter = document.getElementById("category-filter");
  const priceFilter = document.getElementById("price-filter");
  const sortFilter = document.getElementById("sort-filter");

  const selectedCategory = categoryFilter ? categoryFilter.value : "all";
  const selectedPrice = priceFilter ? priceFilter.value : "all";
  const selectedSort = sortFilter ? sortFilter.value : "default";

  // Start with all products
  filteredProducts = [...allProducts];

  // Filter by category
  if (selectedCategory !== "all") {
    filteredProducts = filteredProducts.filter(
      (p) => p.category === selectedCategory
    );
  }

  // Filter by price range
  if (selectedPrice !== "all") {
    filteredProducts = filteredProducts.filter((p) => {
      const price = getProductPrice(p);

      switch (selectedPrice) {
        case "under-500k":
          return price < 500000;
        case "500k-1m":
          return price >= 500000 && price < 1000000;
        case "1m-2m":
          return price >= 1000000 && price <= 2000000;
        case "above-2m":
          return price > 2000000;
        default:
          return true;
      }
    });
  }

  // Sort products
  switch (selectedSort) {
    case "price-asc":
      filteredProducts.sort((a, b) => getProductPrice(a) - getProductPrice(b));
      break;
    case "price-desc":
      filteredProducts.sort((a, b) => getProductPrice(b) - getProductPrice(a));
      break;
    case "name-asc":
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
      break;
    default:
      // Keep default order
      break;
  }

  // Reset to first page
  currentPage = 1;
  renderProducts(currentPage);
  renderPagination();
  updateProductCount();
}

/**
 * Get product price as number for sorting
 */
function getProductPrice(product) {
  const priceStr = product.newPrice || product.price || "0";
  return parseFloat(priceStr.replace(/[^0-9]/g, ""));
}

/**
 * Calculate total pages
 */
function getTotalPages() {
  return Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
}

/**
 * Update product count display
 */
function updateProductCount() {
  const countElement = document.getElementById("product-count");
  if (countElement) {
    const total = filteredProducts.length;
    const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(currentPage * ITEMS_PER_PAGE, total);

    if (total === 0) {
      countElement.textContent = "Không có sản phẩm";
    } else {
      countElement.textContent = `Hiển thị ${start}-${end} trong ${total} sản phẩm`;
    }
  }
}

/**
 * Render products for current page
 */
function renderProducts(page) {
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const productsToShow = filteredProducts.slice(startIndex, endIndex);

  const productGrid = document.getElementById("product-grid");

  if (!productGrid) {
    console.error("Product grid not found");
    return;
  }

  if (productsToShow.length === 0) {
    productGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>Không tìm thấy sản phẩm nào</p>
            </div>
        `;
    return;
  }

  productGrid.innerHTML = productsToShow
    .map((product) => createProductCard(product))
    .join("");

  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Create HTML for a product card
 */
function createProductCard(product) {
  const hasSale = product.newPrice && product.oldPrice;
  const isFlashSale = product.tags && product.tags.includes("flash-sale");
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
    } else if (isBestSeller && !isFlashSale) {
      priceHTML += `<span class="bestseller-badge">⭐ HOT</span>`;
    }
  }

  // Determine card class
  let cardClass = "";
  if (isFlashSale) {
    cardClass = "flash-sale";
  } else if (isGift) {
    cardClass = "gift-card";
  } else if (isCutFruit) {
    cardClass = "cut-fruit-card";
  } else if (isBestSeller) {
    cardClass = "best-seller-card";
  }
  // [MỚI] Tạo link
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
                <button class="btn-add-cart" onclick="addToCart(${
                  product.id
                }, '${product.name}')">
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
 * Render pagination controls
 */
function renderPagination() {
  const pagination = document.getElementById("pagination");
  const totalPages = getTotalPages();

  if (!pagination) {
    console.error("Pagination element not found");
    return;
  }

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let paginationHTML = "";

  // Previous button
  paginationHTML += `
        <button onclick="changePage(${currentPage - 1})" ${
    currentPage === 1 ? "disabled" : ""
  }>
            <i class="fas fa-chevron-left"></i> Trước
        </button>
    `;

  // Page numbers with smart ellipsis
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || // Always show first page
      i === totalPages || // Always show last page
      (i >= currentPage - 1 && i <= currentPage + 1) // Show pages around current
    ) {
      paginationHTML += `
                <div class="page-number ${
                  i === currentPage ? "active" : ""
                }" onclick="changePage(${i})">
                    ${i}
                </div>
            `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      // Show ellipsis
      paginationHTML += `<span>...</span>`;
    }
  }

  // Next button
  paginationHTML += `
        <button onclick="changePage(${currentPage + 1})" ${
    currentPage === totalPages ? "disabled" : ""
  }>
            Sau <i class="fas fa-chevron-right"></i>
        </button>
    `;

  pagination.innerHTML = paginationHTML;
}

/**
 * Change to a specific page
 */
function changePage(page) {
  const totalPages = getTotalPages();

  if (page < 1 || page > totalPages) {
    return;
  }

  currentPage = page;
  renderProducts(currentPage);
  renderPagination();
  updateProductCount();
}

/**
 * Add product to cart
 */
function addToCart(productId, productName) {
  // Tìm sản phẩm để lấy đầy đủ thông tin
  const product = allProducts.find((p) => p.id === productId);

  if (!product) {
    console.error("Product not found:", productId);
    CartManager.showNotification("Không tìm thấy sản phẩm!", "error");
    return;
  }

  const price = product.newPrice || product.price || "0₫";
  const image = product.image || "img/placeholder.jpg";

  console.log("Adding to cart:", {
    id: product.id,
    name: product.name,
    price: price,
    image: image,
  });

  // Gọi CartManager với đầy đủ thông tin
  CartManager.addToCart(productId, productName, price, image);

  console.log(`Added product ${productId} to cart.`);
}

/**
 * Show loading state
 */
function showLoading() {
  const productGrid = document.getElementById("product-grid");
  if (productGrid) {
    productGrid.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner"></i>
                <p>Đang tải sản phẩm...</p>
            </div>
        `;
  }
}

/**
 * Show error message
 */
function showError() {
  const productGrid = document.getElementById("product-grid");
  if (productGrid) {
    productGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Có lỗi xảy ra khi tải sản phẩm. Vui lòng thử lại sau.</p>
            </div>
        `;
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initAllProductsPage);

/* ==============================================
   LIVE SEARCH FUNCTION (Tìm kiếm hiển thị ngay)
   ============================================== */
document.addEventListener("DOMContentLoaded", () => {
  setupLiveSearch();
});

function setupLiveSearch() {
  const searchBox = document.querySelector(".search-box");
  const input = searchBox.querySelector("input");

  // 1. Tạo khung chứa kết quả (nếu chưa có)
  let resultsContainer = document.querySelector(".search-results");
  if (!resultsContainer) {
    resultsContainer = document.createElement("div");
    resultsContainer.className = "search-results";
    searchBox.appendChild(resultsContainer);
  }

  // 2. Bắt sự kiện khi gõ phím
  input.addEventListener("input", function (e) {
    const keyword = e.target.value.toLowerCase().trim();

    // Nếu xóa hết chữ thì ẩn bảng
    if (keyword.length < 1) {
      resultsContainer.classList.remove("active");
      return;
    }

    // Lọc sản phẩm từ mảng allProducts (đã load ở initAllProductsPage)
    const matches = allProducts.filter((p) =>
      p.name.toLowerCase().includes(keyword)
    );

    // 3. Hiển thị kết quả
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

  // 4. Ẩn bảng khi click ra ngoài
  document.addEventListener("click", function (e) {
    if (!searchBox.contains(e.target)) {
      resultsContainer.classList.remove("active");
    }
  });
}
