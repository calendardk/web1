/**
 * js/user-manager.js
 * Quản lý toàn bộ dữ liệu người dùng (Admin & Khách)
 */

const USER_STORAGE_KEY = "clean_fruit_users";
const CURRENT_USER_KEY = "current_user";

const UserManager = {
  // 1. Khởi tạo dữ liệu mẫu (Nếu kho rỗng thì tạo ngay ông Admin)
  init() {
    const storedUsers = localStorage.getItem(USER_STORAGE_KEY);
    if (!storedUsers) {
      const defaultUsers = [
        {
          id: 1,
          username: "admin",
          password: "123",
          fullName: "Lịch Đại Ca",
          phone: "0988888888",
          role: "admin",
        },
        {
          id: 2,
          username: "khach",
          password: "123",
          fullName: "Khách Mua Hàng",
          phone: "0912345678",
          role: "customer",
        },
      ];
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaultUsers));
      console.log("Đã tạo tài khoản mẫu: admin/123");
    }
  },

  // 2. Lấy danh sách user từ kho
  getUsers() {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // 3. Xử lý Đăng Nhập
  login(username, password) {
    const users = this.getUsers();
    // Tìm người dùng khớp Username & Password
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      // Lưu thông tin người đang online (Bỏ pass đi cho an toàn)
      const sessionUser = { ...user };
      delete sessionUser.password;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    }
    return { success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" };
  },

  // 4. Xử lý Đăng Ký
  register(newUser) {
    const users = this.getUsers();

    // Kiểm tra trùng tên đăng nhập
    if (users.some((u) => u.username === newUser.username)) {
      return { success: false, message: "Tên đăng nhập này đã có người dùng!" };
    }

    // Tạo User mới (Mặc định là khách hàng)
    const userToAdd = {
      id: Date.now(),
      username: newUser.username,
      password: newUser.password,
      fullName: newUser.fullName,
      phone: newUser.phone,
      role: "customer", // Quan trọng: Đăng ký mới luôn là khách
    };

    users.push(userToAdd);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
    return { success: true, message: "Đăng ký thành công!" };
  },

  // 5. Lấy thông tin người đang đăng nhập
  getCurrentUser() {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // 6. Đăng xuất
  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = "auth.html";
  },

  // 7. Kiểm tra quyền Admin (Dùng để chặn cửa trang Admin)
  checkAdminAccess() {
    const user = this.getCurrentUser();
    if (!user || user.role !== "admin") {
      alert("Khu vực cấm! Chỉ dành cho Admin.");
      window.location.href = "index.html"; // Đá về trang chủ
      return false;
    }
    return true;
  },
};

// Chạy khởi tạo ngay khi file được load
UserManager.init();
