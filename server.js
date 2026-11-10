const express = require("express");
const cors = require("cors");
const data = require("./data/products.json");

const app = express();
app.use(cors());
app.use(express.json());

const products = data.products;

// Ana səhifə - mövcud endpoint-lər
app.get("/", (req, res) => {
  res.json({
    message: "Products API işləyir",
    endpoints: {
      all: "/api/products",
      filter: "/api/products?category=T-shirts&search=shelby&minPrice=10&maxPrice=50&sort=price_asc&page=1&limit=20",
      single: "/api/products/:id",
      categories: "/api/categories",
      meta: "/api/meta",
    },
  });
});

// Bütün məhsullar (filter, axtarış, sıralama, səhifələmə ilə)
app.get("/api/products", (req, res) => {
  const { category, search, minPrice, maxPrice, sort, page, limit } = req.query;
  let result = products;

  if (category) {
    const c = category.toLowerCase();
    result = result.filter((p) => p.category.toLowerCase() === c);
  }
  if (search) {
    const s = search.toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(s));
  }
  if (minPrice) result = result.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) result = result.filter((p) => p.price <= Number(maxPrice));

  if (sort === "price_asc") result = [...result].sort((a, b) => a.price - b.price);
  if (sort === "price_desc") result = [...result].sort((a, b) => b.price - a.price);
  if (sort === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));

  const total = result.length;
  if (limit) {
    const l = Math.max(1, Number(limit));
    const pg = Math.max(1, Number(page) || 1);
    result = result.slice((pg - 1) * l, pg * l);
    return res.json({ total, page: pg, limit: l, totalPages: Math.ceil(total / l), products: result });
  }

  res.json({ total, products: result });
});

// Tək məhsul
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Məhsul tapılmadı" });
  res.json(product);
});

// Kateqoriyalar
app.get("/api/categories", (req, res) => {
  const counts = {};
  products.forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
  res.json(Object.entries(counts).map(([name, count]) => ({ name, count })));
});

// Meta məlumat
app.get("/api/meta", (req, res) => res.json(data.meta));

app.use((req, res) => res.status(404).json({ error: "Endpoint tapılmadı" }));

// Lokalda işə salmaq üçün (Vercel-də listen lazım deyil)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
}

module.exports = app;
