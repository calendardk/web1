/**
 * js/auth.js
 * Xử lý sự kiện trên trang Đăng nhập / Đăng ký
 */

// 1. Chức năng chuyển đổi qua lại giữa 2 form
function showRegister() {
  document.getElementById("login-container").classList.add("hidden");
  document.getElementById("register-container").classList.remove("hidden");
  // Reset form để nhập mới cho sạch sẽ
  document.getElementById("registerForm").reset();
  document.getElementById("regError").style.display = "none";
}

function showLogin() {
  document.getElementById("register-container").classList.add("hidden");
  document.getElementById("login-container").classList.remove("hidden");
  // Reset form
  document.getElementById("loginForm").reset();
  document.getElementById("loginError").style.display = "none";
}

// 2. Xử lý ĐĂNG NHẬP
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault(); // Chặn load lại trang

    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value;
    const errorMsg = document.getElementById("loginError");

    // Gọi UserManager để check
    const result = UserManager.login(username, password);

    if (result.success) {
      // Check quyền để chuyển hướng
      if (result.user.role === "admin") {
        alert("Chào Đại Ca! Đang vào trang quản trị...");
        window.location.href = "admin.html";
      } else {
        alert("Đăng nhập thành công! Chào mừng khách hàng.");
        window.location.href = "index.html";
      }
    } else {
      // Hiện lỗi
      errorMsg.innerText = result.message;
      errorMsg.style.display = "block";
    }
  });
}

// 3. Xử lý ĐĂNG KÝ
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("regName").value.trim();
    const username = document.getElementById("regUser").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const pass = document.getElementById("regPass").value;
    const passConfirm = document.getElementById("regPassConfirm").value;
    const errorMsg = document.getElementById("regError");

    // Validate cơ bản
    if (pass !== passConfirm) {
      errorMsg.innerText = "Mật khẩu nhập lại không khớp!";
      errorMsg.style.display = "block";
      return;
    }

    if (username.length < 3) {
      errorMsg.innerText = "Tên đăng nhập phải dài hơn 3 ký tự!";
      errorMsg.style.display = "block";
      return;
    }

    // Gọi UserManager đăng ký
    const newUser = {
      fullName: name,
      username: username,
      phone: phone,
      password: pass,
    };

    const result = UserManager.register(newUser);

    if (result.success) {
      alert("Đăng ký thành công! Mời bạn đăng nhập.");
      showLogin();
      // Điền sẵn tên đăng nhập cho tiện
      document.getElementById("loginUser").value = username;
    } else {
      errorMsg.innerText = result.message;
      errorMsg.style.display = "block";
    }
  });
}
