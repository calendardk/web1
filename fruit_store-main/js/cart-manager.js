/**
 * js/cart-manager.js - Quản lý giỏ hàng (Logic lõi)
 */
const CartManager = {
  getStorageKey() {
    if (typeof UserManager !== "undefined") {
      const user = UserManager.getCurrentUser();
      if (user) return `cart_user_${user.id}`;
    }
    return "cart_guest";
  },

  getCart() {
    return JSON.parse(localStorage.getItem(this.getStorageKey()) || "[]");
  },

  saveCart(cart) {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(cart));
    this.updateCountUI();
  },

  // Hàm thêm giỏ hàng nhận số lượng trực tiếp
  addToCart(productId, name, price, image, quantity = 1) {
    let cart = this.getCart();
    const existingItem = cart.find((item) => item.id === productId);

    // Chuyển giá thành số nguyên để tính toán
    let priceRaw =
      typeof price === "string" ? parseInt(price.replace(/\D/g, "")) : price;

    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
    } else {
      cart.push({
        id: productId,
        name: name,
        price: price, // Giá hiển thị (String)
        priceRaw: priceRaw, // Giá tính toán (Number)
        image: image,
        quantity: parseInt(quantity),
      });
    }
    this.saveCart(cart);
    alert(`Đã thêm ${quantity} sản phẩm "${name}" vào giỏ hàng!`);
  },

  removeFromCart(id) {
    let cart = this.getCart().filter((item) => item.id !== id);
    this.saveCart(cart);
  },

  updateQuantity(id, qty) {
    let cart = this.getCart();
    const item = cart.find((i) => i.id === id);
    if (item) {
      item.quantity = parseInt(qty);
      if (item.quantity <= 0) this.removeFromCart(id);
      else this.saveCart(cart);
    }
  },

  clearCart() {
    localStorage.removeItem(this.getStorageKey());
    this.updateCountUI();
  },

  getCartCount() {
    return this.getCart().reduce((sum, item) => sum + item.quantity, 0);
  },

  updateCountUI() {
    const count = this.getCartCount();
    const els = document.querySelectorAll("#cart-count");
    els.forEach((el) => (el.innerText = `Giỏ hàng (${count})`));
  },
};

document.addEventListener("DOMContentLoaded", () =>
  CartManager.updateCountUI()
);
