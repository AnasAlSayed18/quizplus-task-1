const baseUrl = "https://almouraq.store/api/";
let allProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadLayout();
  loadAds();
  loadBrands();
  loadCategories();
  loadProducts();
  updateBadges();
  updateActiveNav();
  setupSearchListener(); // ✅ NEW
});

async function loadLayout() {
  const header = document.getElementById("header");
  const footer = document.getElementById("footer");

  if (header) {
    const headerHTML = await fetch("webapp/header.html").then(res => res.text());
    header.innerHTML = headerHTML;
  }

  if (footer) {
    const footerHTML = await fetch("webapp/footer.html").then(res => res.text());
    footer.innerHTML = footerHTML;
  }
}

function updateActiveNav() {
  const currentPage = location.pathname.split("/").pop();
  document.querySelectorAll(".bottom-nav .nav-item").forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPage || (href === "index.html" && currentPage === "")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function loadProducts() {
  fetch(baseUrl + "get_products.php")
    .then(res => res.json())
    .then(data => {
      allProducts = data;
      displayProducts(allProducts);
    })
    .catch(err => {
      console.error("خطأ تحميل المنتجات:", err);
      const container = document.getElementById("productList");
      if (container) container.innerHTML = "<p>فشل تحميل المنتجات.</p>";
    });
}

function displayProducts(products) {
  const container = document.getElementById("productList");
  if (!container) return;

  container.innerHTML = "";

  products.forEach(p => {
    let isFav = isFavorite(p.name);
    let inCart = isInCart(p.name);

    const offerPercent = p.in_offer == 1
      ? Math.round((1 - (p.offer_price / p.price)) * 100)
      : null;

    const priceHtml = p.in_offer == 1
      ? `<del>${p.price} ₪</del> <span>${p.offer_price} ₪</span>`
      : `<span>${p.price} ₪</span>`;

    const offerHtml = offerPercent ? `<span class="offer">-${offerPercent}%</span>` : "";

    const productCard = document.createElement("div");
    productCard.className = "product-card";
    productCard.innerHTML = `
      ${offerHtml}
      <span class="favorite ${isFav ? 'active' : ''}" data-id="${p.id}">
        <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
      </span>
      <div class="section-name">${getCategoryName(p.category_id)}</div>
      <img src="${p.image_url}" alt="${p.name}" />
      <div class="price">${priceHtml}</div>
      <h4>${p.name}</h4>
      <button class="cart-button ${inCart ? 'added' : ''}" data-id="${p.id}">
        <i class="fa-solid fa-cart-plus"></i>
      </button>
    `;

    productCard.querySelector(".favorite").onclick = () => {
      toggleFavorite(p);
      displayProducts(allProducts); // Refresh to reflect state
      updateBadges();
    };

    productCard.querySelector(".cart-button").onclick = () => {
      toggleCart(p);
      displayProducts(allProducts);
      updateBadges();
    };

    container.appendChild(productCard);
  });
}

function getCategoryName(id) {
  switch (id) {
    case 3: return "مواد غذائية";
    case 9: return "منظفات";
    case 4: return "بلاستيكات";
    case 5: return "فحم وشواء";
    default: return "منتج";
  }
}

// ------------------ FAVORITES ------------------

function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function isFavorite(productName) {
  const name = String(productName).trim().toLowerCase();
  return getFavorites().some(p => String(p.name).trim().toLowerCase() === name);
}

function toggleFavorite(product) {
  let favorites = getFavorites();
  const name = String(product.name).trim().toLowerCase();

  const existsIndex = favorites.findIndex(p => String(p.name).trim().toLowerCase() === name);

  if (existsIndex !== -1) {
    favorites.splice(existsIndex, 1);
  } else {
    favorites.push({
      name: product.name,
      id: product.id,
      price: product.price,
      image_url: product.image_url
    });
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
}

// ------------------ CART ------------------

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function isInCart(productName) {
  const name = String(productName).trim().toLowerCase();
  return getCart().some(p => String(p.name).trim().toLowerCase() === name);
}

function toggleCart(product) {
  let cart = getCart();
  const name = String(product.name).trim().toLowerCase();

  const existsIndex = cart.findIndex(p => String(p.name).trim().toLowerCase() === name);

  if (existsIndex !== -1) {
    cart.splice(existsIndex, 1);
  } else {
    cart.push({
      name: product.name,
      id: product.id,
      price: product.price,
      image_url: product.image_url,
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
}

// ------------------ BADGES ------------------

function updateBadges() {
  const fav = getFavorites().length;
  const cart = getCart().length;

  const favBadge = document.getElementById("favBadge");
  const cartBadge = document.getElementById("cartBadge");
  if (favBadge) favBadge.textContent = fav > 0 ? fav : "0";
  if (cartBadge) cartBadge.textContent = cart > 0 ? cart : "0";

  const favBadgeDesktop = document.getElementById("favBadgeDesktop");
  const cartBadgeDesktop = document.getElementById("cartBadgeDesktop");
  if (favBadgeDesktop) favBadgeDesktop.textContent = fav > 0 ? fav : "";
  if (cartBadgeDesktop) cartBadgeDesktop.textContent = cart > 0 ? cart : "";
}

// ------------------ SEARCH ------------------

function setupSearchListener() {
  const searchInput = document.getElementById("searchField");
  if (!searchInput) return;

  
  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.trim().toLowerCase();
    console.log("Searching for:", keyword);
    const brandSection = document.querySelector(".brands");
    const adSection = document.querySelector(".slider-section");

    if (keyword === "") {
      displayProducts(allProducts);
      brandSection?.classList.remove("hidden");
      adSection?.classList.remove("hidden");
    } else {
      const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(keyword)
      );
      displayProducts(filtered);
      brandSection?.classList.add("hidden");
      adSection?.classList.add("hidden");
    }
  });
}

// ------------------ ADS ------------------

function loadAds() {
  const slider = document.getElementById("adsSlider");
  const dots = document.getElementById("adsDots");
  if (!slider || !dots) return;

  fetch(baseUrl + "get_ads.php")
    .then(res => res.json())
    .then(data => {
      slider.innerHTML = "";
      dots.innerHTML = "";

      let current = 0;

      data.forEach((ad, i) => {
        const img = document.createElement("img");
        img.src = ad.image + "?t=" + Date.now();
        img.style.display = i === 0 ? "block" : "none";
        slider.appendChild(img);

        const dot = document.createElement("span");
        dot.className = "dot" + (i === 0 ? " active" : "");
        dots.appendChild(dot);
      });

      const imgs = slider.querySelectorAll("img");
      const dotEls = dots.querySelectorAll(".dot");

      setInterval(() => {
        imgs[current].style.display = "none";
        dotEls[current].classList.remove("active");
        current = (current + 1) % imgs.length;
        imgs[current].style.display = "block";
        dotEls[current].classList.add("active");
      }, 3000);
    });
}

// ------------------ BRANDS ------------------

function loadBrands() {
  const brandContainer = document.getElementById("brandContainer");
  if (!brandContainer) return;

  fetch(baseUrl + "get_brands.php")
    .then(res => res.json())
    .then(data => {
      brandContainer.innerHTML = "";

      data.forEach(brand => {
        const card = document.createElement("div");
        card.className = "brand-card";

        const img = document.createElement("img");
        img.src = brand.image + "?t=" + Date.now();
        img.alt = brand.name;
        img.title = brand.name;

        const name = document.createElement("span");
        name.textContent = brand.name;

        card.onclick = () => {
          const filtered = allProducts.filter(p => p.brand_name === brand.name);
          displayProducts(filtered);
        };

        card.appendChild(img);
        card.appendChild(name);
        brandContainer.appendChild(card);
      });
    });
}

// ------------------ CATEGORIES ------------------

function loadCategories() {
  const categoryContainer = document.getElementById("categoryButtons");
  if (!categoryContainer) return;

  fetch(baseUrl + "get_categories.php")
    .then(res => res.json())
    .then(data => {
      categoryContainer.innerHTML = "";

      // "All" Button
      const allBtn = document.createElement("button");
      allBtn.textContent = "الكل";
      allBtn.onclick = () => {
        displayProducts(allProducts);
        document.querySelector(".brands")?.classList.remove("hidden");
        document.querySelector(".slider-section")?.classList.remove("hidden");
      };
      categoryContainer.appendChild(allBtn);

      // Category Buttons
      data.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat.name;
        btn.onclick = () => {
          const filtered = allProducts.filter(p => p.category_id == cat.id);
          displayProducts(filtered);
          document.querySelector(".brands")?.classList.add("hidden");
          document.querySelector(".slider-section")?.classList.add("hidden");
        };
        categoryContainer.appendChild(btn);
      });
    });
}

