/**
 * Product Detail Page JavaScript (Updated for LocalStorage)
 * Handles displaying product details from LocalStorage or JSON
 */

const STORAGE_KEY = "clean_fruit_products"; // Khóa dữ liệu chung

document.addEventListener("DOMContentLoaded", () => {
  initProductDetail();
});

async function initProductDetail() {
  // 1. Lấy ID từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get("id"));

  if (!productId) {
    document.getElementById("product-detail-container").innerHTML =
      "<p>Không tìm thấy sản phẩm.</p>";
    return;
  }

  try {
    let products = [];

    // 2. Load dữ liệu thông minh (Ưu tiên LocalStorage)
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (storedData) {
      // Có hàng trong kho -> Lấy ra dùng ngay
      console.log("Product Detail: Load dữ liệu từ LocalStorage");
      products = JSON.parse(storedData);
    } else {
      // Kho rỗng -> Lấy từ file gốc
      console.log("Product Detail: Load dữ liệu gốc từ file JSON");
      const response = await fetch("products.json");
      const data = await response.json();
      products = data.products;

      // Lưu vào kho để lần sau dùng
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }

    // 3. Tìm sản phẩm trong mảng vừa lấy
    const product = products.find((p) => p.id === productId);

    if (!product) {
      document.getElementById("product-detail-container").innerHTML =
        "<div style='text-align: center; padding: 50px;'><h3>Sản phẩm không tồn tại hoặc đã bị xóa.</h3><a href='index.html'>Về trang chủ</a></div>";
      return;
    }

    // 4. Render dữ liệu ra HTML
    renderProductInfo(product);
  } catch (error) {
    console.error("Lỗi tải sản phẩm:", error);
    document.getElementById("product-detail-container").innerHTML =
      "<p>Có lỗi xảy ra khi tải dữ liệu.</p>";
  }
}

function renderProductInfo(product) {
  const container = document.getElementById("product-detail-container");
  const breadcrumbName = document.getElementById("breadcrumb-name");

  // Cập nhật tên trên breadcrumb
  if (breadcrumbName) breadcrumbName.textContent = product.name;
  document.title = `${product.name} - Clean Fruits`;

  // Xử lý giá
  let priceHTML = "";
  const currentPrice = product.newPrice || product.price; // Giá hiện tại để thêm vào giỏ

  if (product.newPrice && product.oldPrice) {
    priceHTML = `
            <div class="detail-price">
                ${product.newPrice} 
                <span class="old">${product.oldPrice}</span>
            </div>`;
  } else {
    priceHTML = `<div class="detail-price">${product.price}</div>`;
  }

  // HTML chi tiết
  container.innerHTML = `
        <div class="detail-img">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="detail-info">
            <h1>${product.name}</h1>
            ${priceHTML}
            
            <div class="product-meta">
                <p><strong>Xuất xứ:</strong> ${
                  product.origin || "Đang cập nhật"
                }</p>
                <p><strong>Danh mục:</strong> ${product.category}</p>
                <p><strong>Tình trạng:</strong> <span style="color:green">Còn hàng</span></p>
                <p><strong>Mô tả:</strong> Trái cây tươi ngon nhập khẩu, đảm bảo chất lượng vệ sinh an toàn thực phẩm. Cam kết đổi trả nếu không hài lòng.</p>
            </div>

            <div class="detail-actions">
                <div class="quantity-control">
                    <button onclick="decreaseQty()">-</button>
                    <input type="number" id="qty-input" value="1" min="1" readonly>
                    <button onclick="increaseQty()">+</button>
                </div>
                <button class="btn-add-main" onclick="addCurrentProductToCart(${
                  product.id
                }, '${product.name}', '${currentPrice}', '${product.image}')">
                    <i class="fas fa-shopping-basket"></i> Thêm vào giỏ hàng
                </button>
            </div>
        </div>
    `;
}

// Hàm tăng giảm số lượng
window.decreaseQty = function () {
  const input = document.getElementById("qty-input");
  if (parseInt(input.value) > 1) input.value = parseInt(input.value) - 1;
};

window.increaseQty = function () {
  const input = document.getElementById("qty-input");
  input.value = parseInt(input.value) + 1;
};

// Hàm thêm vào giỏ hàng (Gọi CartManager)
window.addCurrentProductToCart = function (id, name, price, image) {
  const qty = parseInt(document.getElementById("qty-input").value) || 1;

  // Loop để thêm số lượng (vì CartManager hiện tại thêm 1 cái mỗi lần gọi)
  for (let i = 0; i < qty; i++) {
    if (typeof CartManager !== "undefined") {
      CartManager.addToCart(id, name, price, image);
    } else {
      console.error("CartManager chưa được load!");
      alert("Lỗi: Không thể thêm vào giỏ hàng. Hãy tải lại trang.");
      break;
    }
  }
};
