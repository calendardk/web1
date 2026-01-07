/**
 * js/admin.js - Phiên bản Final Pro (Đã fix Sort ID tăng dần)
 * - Fix lỗi ID nhảy số (Tự động tăng dần từ số lớn nhất)
 * - Hỗ trợ cả 3 loại ảnh: Link mạng, File local, Base64 upload
 * - Lưu trữ LocalStorage
 * - Sắp xếp: ID nhỏ ở trên, ID lớn ở dưới (Mới thêm nằm cuối)
 */

let currentProducts = [];
const STORAGE_KEY = "clean_fruit_products";

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  // Thêm sự kiện: Khi gõ link ảnh vào ô input thì cập nhật preview ngay
  const imgInput = document.getElementById("prodImage");
  if (imgInput) {
    imgInput.addEventListener("input", function () {
      const previewImg = document.getElementById("previewImage");
      if (this.value.trim() !== "") {
        previewImg.src = this.value;
        previewImg.style.display = "block";
      } else {
        previewImg.style.display = "none";
      }
    });
  }
});

// 1. Load dữ liệu (Kho -> JSON)
async function loadProducts() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      console.log("Admin: Load từ LocalStorage");
      currentProducts = JSON.parse(storedData);
    } else {
      console.log("Admin: Load từ file JSON gốc");
      const response = await fetch("products.json");
      const data = await response.json();
      currentProducts = data.products;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProducts));
    }
    renderTable(currentProducts);
  } catch (error) {
    console.error("Lỗi:", error);
    alert("Có lỗi khi tải dữ liệu!");
  }
}

// 2. Render Bảng (Đã sửa sắp xếp ID Tăng dần)
function renderTable(products) {
  const tbody = document.getElementById("product-table-body");
  tbody.innerHTML = "";

  // [FIX] Sắp xếp ID tăng dần (1, 2, 3... 50, 51)
  // Để sản phẩm mới thêm (ID lớn) nằm dưới cùng
  products.sort((a, b) => a.id - b.id);

  products.forEach((p) => {
    const tr = document.createElement("tr");

    // Xử lý hiển thị tags
    let tagsHtml = "";
    if (p.tags) {
      if (p.tags.includes("flash-sale"))
        tagsHtml += '<span class="badge bg-red">Flash Sale</span> ';
      if (p.tags.includes("best-seller"))
        tagsHtml += '<span class="badge bg-orange">Best Seller</span>';
    }

    // Cái thẻ img ở đây nó chấp nhận mọi loại đường dẫn (Link mạng, link local, base64)
    tr.innerHTML = `
            <td>${p.id}</td>
            <td><img src="${
              p.image
            }" class="img-preview" onerror="this.src='https://via.placeholder.com/40'"></td>
            <td>${p.name}</td>
            <td style="color: #d32f2f; font-weight: bold;">${
              p.newPrice || p.price
            }</td>
            <td>${p.category}</td>
            <td>${tagsHtml}</td>
            <td>
                <button onclick="openModal('edit', ${
                  p.id
                })" style="color: blue; border:none; background:none; cursor:pointer;" title="Sửa"><i class="fas fa-edit"></i></button>
                <button onclick="deleteProduct(${
                  p.id
                })" style="color: red; border:none; background:none; cursor:pointer;" title="Xóa"><i class="fas fa-trash"></i></button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

// 3. Xử lý Modal & Ảnh Preview
const modal = document.getElementById("productModal");
const previewImg = document.getElementById("previewImage");

function openModal(mode, id = null) {
  modal.style.display = "block";
  const form = document.getElementById("productForm");

  // Reset ảnh preview trước
  previewImg.style.display = "none";
  previewImg.src = "";

  if (mode === "add") {
    document.getElementById("modalTitle").innerText = "Thêm Sản Phẩm Mới";
    form.reset();
    document.getElementById("prodId").value = "";
  } else {
    document.getElementById("modalTitle").innerText = "Chỉnh Sửa Sản Phẩm";
    const product = currentProducts.find((p) => p.id === id);
    if (product) {
      document.getElementById("prodId").value = product.id;
      document.getElementById("prodName").value = product.name;
      document.getElementById("prodCategory").value = product.category;
      document.getElementById("prodNewPrice").value =
        product.newPrice || product.price;
      document.getElementById("prodOldPrice").value = product.oldPrice || "";

      // Load ảnh cũ lên (bất kể là link local hay link mạng)
      document.getElementById("prodImage").value = product.image;
      if (product.image) {
        previewImg.src = product.image;
        previewImg.style.display = "block";
      }

      document.getElementById("prodOrigin").value = product.origin || "";

      const tags = product.tags || [];
      document.getElementById("tagBest").checked = tags.includes("best-seller");
      document.getElementById("tagFlash").checked = tags.includes("flash-sale");
      document.getElementById("tagCut").checked = tags.includes("cut-fruit");
    }
  }
}

function closeModal() {
  modal.style.display = "none";
}

window.onclick = function (event) {
  if (event.target == modal) closeModal();
};

// 4. Hàm xử lý khi chọn file từ máy tính (Nút Chọn Ảnh)
function handleImageUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const base64String = e.target.result;
      // Điền chuỗi mã hóa vào ô input text
      document.getElementById("prodImage").value = base64String;
      // Hiện preview
      previewImg.src = base64String;
      previewImg.style.display = "block";
    };

    reader.readAsDataURL(input.files[0]);
  }
}

// 5. Lưu sản phẩm (Logic ID mới + Lưu LocalStorage)
function saveProduct(e) {
  e.preventDefault();

  const idInput = document.getElementById("prodId").value;
  const isEdit = idInput !== "";

  // Lấy tags
  let tags = [];
  if (document.getElementById("tagBest").checked) tags.push("best-seller");
  if (document.getElementById("tagFlash").checked) tags.push("flash-sale");
  if (document.getElementById("tagCut").checked) tags.push("cut-fruit");

  let newId;
  if (isEdit) {
    newId = parseInt(idInput);
  } else {
    // Logic ID thông minh: Tìm ID lớn nhất + 1
    const maxId =
      currentProducts.length > 0
        ? Math.max(...currentProducts.map((p) => p.id))
        : 0;
    newId = maxId + 1;
  }

  const newProduct = {
    id: newId,
    name: document.getElementById("prodName").value,
    category: document.getElementById("prodCategory").value,
    newPrice: document.getElementById("prodNewPrice").value,
    oldPrice: document.getElementById("prodOldPrice").value,
    image: document.getElementById("prodImage").value, // Ô này chứa gì lưu nấy (Path/URL/Base64)
    origin: document.getElementById("prodOrigin").value,
    tags: tags,
  };

  if (isEdit) {
    const index = currentProducts.findIndex((p) => p.id == newId);
    if (index !== -1) currentProducts[index] = newProduct;
    alert("Đã cập nhật sản phẩm thành công!");
  } else {
    // [FIX] Dùng push để thêm vào cuối danh sách (ID lớn nằm dưới)
    currentProducts.push(newProduct);
    alert(`Đã thêm món mới: ${newProduct.name} (ID: ${newId})`);
  }

  // Lưu ngay lập tức
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProducts));

  closeModal();
  renderTable(currentProducts);
}

function deleteProduct(id) {
  if (confirm("Đại ca có chắc muốn xóa món này không?")) {
    currentProducts = currentProducts.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProducts));
    renderTable(currentProducts);
  }
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
  document.getElementById("main-content").classList.toggle("expanded");
}

function resetData() {
  if (
    confirm(
      "CẢNH BÁO: Hành động này sẽ xóa hết dữ liệu đại ca vừa nhập và quay về dữ liệu gốc ban đầu.\n\nChắc chắn chưa?"
    )
  ) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
}
