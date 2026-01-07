/**
 * js/order-manager.js - Quản lý Đơn hàng (Lưu trữ & Trạng thái)
 * Đã thêm hàm getMyOrders để phục vụ trang "Đơn hàng của tôi"
 */
const ORDER_KEY = "clean_fruit_orders";

const OrderManager = {
  // 1. Lấy tất cả đơn (Dùng cho Admin)
  getAllOrders() {
    return JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
  },

  // 2. [MỚI] Lấy đơn hàng của riêng người đang đăng nhập (Dùng cho Khách)
  getMyOrders() {
    // Phải đảm bảo UserManager đã được load
    if (typeof UserManager === "undefined") return [];

    const user = UserManager.getCurrentUser();
    if (!user) return []; // Chưa đăng nhập thì không có đơn

    const allOrders = this.getAllOrders();
    // Lọc ra những đơn có userId trùng với ID người đang online
    return allOrders.filter((order) => order.userId === user.id);
  },

  // 3. Hàm tạo đơn hàng mới
  createOrder(shipInfo) {
    const user = UserManager.getCurrentUser();
    if (!user) {
      alert("Vui lòng đăng nhập để đặt hàng!");
      window.location.href = "auth.html";
      return false;
    }

    const cart = CartManager.getCart();
    if (cart.length === 0) {
      alert("Giỏ hàng trống! Hãy mua thêm sản phẩm.");
      return false;
    }

    // Tính tổng tiền
    const total = cart.reduce((sum, i) => sum + i.priceRaw * i.quantity, 0);

    const order = {
      id: "DH" + Date.now(), // Mã đơn duy nhất
      userId: user.id,
      userName: user.fullName,
      date: new Date().toLocaleString("vi-VN"),
      status: "pending", // Mặc định: Chờ xử lý
      items: cart,
      total: total,
      shipInfo: shipInfo,
    };

    const orders = this.getAllOrders();
    orders.unshift(order); // Thêm vào đầu danh sách
    localStorage.setItem(ORDER_KEY, JSON.stringify(orders));

    // Xóa giỏ hàng sau khi tạo đơn thành công
    CartManager.clearCart();
    return true;
  },

  // 4. Cập nhật trạng thái (Dùng chung cho Admin duyệt và Khách xác nhận)
  updateStatus(id, status) {
    const orders = this.getAllOrders();
    const order = orders.find((o) => o.id === id);

    if (order) {
      order.status = status;
      localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
      return true;
    }
    return false;
  },

  // 5. Hiển thị trạng thái đẹp mắt
  getBadge(status) {
    const map = {
      pending: '<span class="badge bg-warning">Chờ xử lý</span>',
      confirmed: '<span class="badge bg-info">Đã xác nhận</span>',
      shipping: '<span class="badge bg-primary">Đang giao hàng</span>',
      completed: '<span class="badge bg-success">Giao thành công</span>',
      cancelled: '<span class="badge bg-danger">Đã hủy</span>',
    };
    return map[status] || status;
  },
};
