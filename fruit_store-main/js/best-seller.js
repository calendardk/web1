/**
 * Best Seller Page JavaScript (Updated for LocalStorage)
 * Handles product rendering, filtering, sorting and pagination
 */

// Global variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let cartCount = 0;
const ITEMS_PER_PAGE = 16; // 4 rows x 4 products
const STORAGE_KEY = "clean_fruit_products"; // Khóa dữ liệu chung

/**
 * Initialize the page
 */
async function initBestSellerPage() {
  try {
    showLoading();

    let dataProducts = [];

    // BƯỚC 1: Kiểm tra kho (LocalStorage) xem có hàng mới không
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (storedData) {
      // Có hàng trong kho -> Lấy ra dùng ngay
      console.log("Best Seller: Load dữ liệu từ LocalStorage");
      dataProducts = JSON.parse(storedData);
    } else {
      // Kho rỗng -> Lấy từ file gốc
      console.log("Best Seller: Load dữ liệu gốc từ file JSON");
      const response = await fetch("products.json");
      if (!response.ok) throw new Error("Cannot load products data");

      const data = await response.json();
      dataProducts = data.products;

      // Lưu vào kho để lần sau dùng
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataProducts));
    }

    // Filter only best-seller products (Lọc sản phẩm bán chạy)
    allProducts = dataProducts.filter(
      (p) => p.tags && p.tags.includes("best-seller")
    );

    // Initialize filtered products
    filteredProducts = [...allProducts];

    // Setup event listeners
    setupFilters();

    // Render initial page
    renderProducts(currentPage);
    renderPagination();
    updateProductCount();

    console.log("Best Seller page loaded successfully");
    console.log(`Total best seller products: ${allProducts.length}`);
  } catch (error) {
    console.error("Error loading best seller page:", error);
    showError();
  }
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
  const selectedSort = sortFilter ? sortFilter.value : "popular";

  // Start with all products
  filteredProducts = [...allProducts];

  // Filter by category
  if (selectedCategory !== "all") {
    filteredProducts = filteredProducts.filter((p) => {
      const tags = p.tags || [];

      switch (selectedCategory) {
        case "imported":
          return tags.includes("imported");
        case "local":
          return tags.includes("local") || tags.includes("vietnam");
        case "premium":
          return tags.includes("premium");
        default:
          return true;
      }
    });
  }

  // Filter by price range
  if (selectedPrice !== "all") {
    filteredProducts = filteredProducts.filter((p) => {
      const price = getProductPrice(p);

      switch (selectedPrice) {
        case "under-100k":
          return price < 100000;
        case "100k-200k":
          return price >= 100000 && price <= 200000;
        case "200k-500k":
          return price >= 200000 && price <= 500000;
        case "above-500k":
          return price > 500000;
        default:
          return true;
      }
    });
  }

  // Sort products
  switch (selectedSort) {
    case "popular":
      // Keep default order (already sorted by popularity)
      break;
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
      break;
  }

  // Reset to first page
  currentPage = 1;
  renderProducts(currentPage);
  renderPagination();
  updateProductCount();
}

/**
 * Get product price as number for filtering/sorting
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
                <i class="fas fa-star"></i>
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
 * Tạo HTML cho product card
 */
function createProductCard(product) {
  // 1. Tạo link đến trang chi tiết
  const detailLink = `product-detail.html?id=${product.id}`;

  // 2. Xử lý logic hiển thị giá và badge
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
      product.price || product.newPrice || "Liên hệ"
    }</span>`;
    if (isGift) {
      priceHTML += `<span class="gift-badge">🎁 GIFT</span>`;
    } else if (isCutFruit) {
      priceHTML += `<span class="fresh-badge">🌿 FRESH</span>`;
    } else if (isBestSeller && !isFlashSale) {
      priceHTML += `<span class="bestseller-badge">⭐ HOT</span>`;
    }
  }

  let cardClass = "";
  if (isFlashSale) cardClass = "flash-sale";
  else if (isGift) cardClass = "gift-card";
  else if (isCutFruit) cardClass = "cut-fruit-card";
  else if (isBestSeller) cardClass = "best-seller-card";

  // 3. Trả về HTML
  return `
        <div class="product-card ${cardClass}">
            <div class="product-img">
                <a href="${detailLink}">
                    <img src="${product.image}" alt="${
    product.name
  }" loading="lazy">
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

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      paginationHTML += `
                <div class="page-number ${
                  i === currentPage ? "active" : ""
                }" onclick="changePage(${i})">
                    ${i}
                </div>
            `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
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
  // Tìm sản phẩm trong danh sách đã load từ kho/JSON
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

  // Gọi CartManager
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
document.addEventListener("DOMContentLoaded", initBestSellerPage);

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
