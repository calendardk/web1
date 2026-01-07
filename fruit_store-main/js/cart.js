/**
 * js/cart.js - Xử lý hiển thị Cart & Checkout
 */

// Biến toàn cục cho trang này
let discountAmount = 0;
let shippingFee = 0;
const FREE_SHIPPING_THRESHOLD = 500000;

document.addEventListener("DOMContentLoaded", () => {
  initCartPage();
});

function initCartPage() {
  renderCartItems();
  updateCartSummary();
}

// Render danh sách sản phẩm (Giữ nguyên HTML class cũ của đại ca)
function renderCartItems() {
  const cart = CartManager.getCart();
  const container = document.getElementById("cart-items-container");
  const totalItemsElement = document.getElementById("total-items");

  if (!container) return;

  if (totalItemsElement) {
    totalItemsElement.textContent = CartManager.getCartCount();
  }

  if (cart.length === 0) {
    container.innerHTML = `
            <div class="empty-cart" style="text-align: center; padding: 40px;">
                <i class="fas fa-shopping-cart" style="font-size: 40px; color: #ccc;"></i>
                <h3>Giỏ hàng trống</h3>
                <a href="index.html" class="btn-continue">Quay lại mua sắm</a>
            </div>`;
    updateCartSummary();
    return;
  }

  container.innerHTML = cart
    .map((item) => {
      // Đảm bảo lấy giá trị số để tính toán
      const price = item.priceRaw
        ? item.priceRaw
        : parseInt(item.price.toString().replace(/\D/g, "") || "0");
      const subtotal = price * item.quantity;

      return `
            <div class="cart-item" data-id="${item.id}">
                <div class="item-image">
                    <img src="${item.image || "img/placeholder.jpg"}" alt="${
        item.name
      }">
                </div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">
                        ${price.toLocaleString("vi-VN")}₫ × ${
        item.quantity
      } = <strong>${subtotal.toLocaleString("vi-VN")}₫</strong>
                    </div>
                    <div class="item-actions">
                        <div class="quantity-control">
                            <button onclick="changeQty(${
                              item.id
                            }, -1)"><i class="fas fa-minus"></i></button>
                            <input type="text" class="quantity-input" value="${
                              item.quantity
                            }" readonly>
                            <button onclick="changeQty(${
                              item.id
                            }, 1)"><i class="fas fa-plus"></i></button>
                        </div>
                        <button class="btn-remove" onclick="removeItem(${
                          item.id
                        })">
                            <i class="fas fa-trash-alt"></i> Xóa
                        </button>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");
}

function changeQty(id, delta) {
  const item = CartManager.getCart().find((i) => i.id === id);
  if (item) {
    CartManager.updateQuantity(id, item.quantity + delta);
    renderCartItems();
    updateCartSummary();
  }
}

function removeItem(id) {
  if (confirm("Xóa sản phẩm này khỏi giỏ hàng?")) {
    CartManager.removeFromCart(id);
    renderCartItems();
    updateCartSummary();
  }
}

function confirmClearCart() {
  if (confirm("Xóa toàn bộ giỏ hàng?")) {
    CartManager.clearCart();
    renderCartItems();
    updateCartSummary();
  }
}

function updateCartSummary() {
  const cart = CartManager.getCart();
  let subtotal = 0;

  cart.forEach((item) => {
    const price = item.priceRaw
      ? item.priceRaw
      : parseInt(item.price.toString().replace(/\D/g, "") || "0");
    subtotal += price * item.quantity;
  });

  // Tính phí ship
  if (subtotal >= FREE_SHIPPING_THRESHOLD) shippingFee = 0;
  else if (subtotal > 0) shippingFee = 30000;
  else shippingFee = 0;

  const total = subtotal + shippingFee - discountAmount;

  // Cập nhật giao diện
  setText("subtotal", subtotal.toLocaleString("vi-VN") + "₫");
  setText(
    "shipping-fee",
    shippingFee === 0 ? "Miễn phí" : shippingFee.toLocaleString("vi-VN") + "₫"
  );
  setText(
    "discount",
    discountAmount > 0 ? `-${discountAmount.toLocaleString("vi-VN")}₫` : "0₫"
  );
  setText("total", total.toLocaleString("vi-VN") + "₫");
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

// Xử lý mã giảm giá (Demo)
function applyPromoCode() {
  const input = document.getElementById("promo-input");
  const code = input.value.trim().toUpperCase();
  if (code === "ELDEN") {
    discountAmount = 50000;
    alert("Áp dụng mã giảm 50k thành công!");
  } else {
    alert("Mã không hợp lệ!");
    discountAmount = 0;
  }
  updateCartSummary();
}

// HÀM ĐẶT HÀNG (Thay thế checkout cũ)
function checkout() {
  if (typeof UserManager === "undefined") return alert("Lỗi tải trang!");

  const user = UserManager.getCurrentUser();
  if (!user) {
    if (confirm("Bạn chưa đăng nhập. Đăng nhập ngay để đặt hàng?"))
      window.location = "auth.html";
    return;
  }

  if (CartManager.getCart().length === 0) return alert("Giỏ hàng đang trống!");

  // Hỏi thông tin giao hàng
  const address = prompt("Nhập địa chỉ nhận hàng:", "Hà Nội");
  if (!address) return;

  const shipInfo = {
    name: user.fullName,
    phone: user.phone,
    address: address,
    note: "Khách đặt qua Web",
  };

  if (OrderManager.createOrder(shipInfo)) {
    alert("🎉 Đặt hàng thành công! Admin sẽ liên hệ sớm.");
    renderCartItems();
    updateCartSummary();
    // Có thể chuyển về trang chủ
    window.location.href = "index.html";
  }
}
