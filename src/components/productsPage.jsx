import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import NewProduct from "./NewProduct";
import ProductCard from "./ProductCard";

export default function ProductsPage({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (!error) setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="page-container">

      {/* HEADER */}
      <header className="page-header">
        <h2>Welcome, {user.email} 👋</h2>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </header>

      {/* ADD PRODUCT */}
      <div className="action-bar">
        <button className="primary-btn" onClick={() => setShowAddProduct(!showAddProduct)}>
          {showAddProduct ? "Cancel" : "Add Product"}
        </button>
      </div>

      {showAddProduct && (
        <div className="add-product-wrapper">
          <NewProduct
            user={user}
            onAdd={(newProduct) => setProducts([newProduct, ...products])}
          />
        </div>
      )}

      {/* PRODUCTS GRID */}
      <section className="products-section">
        <h3>Available Products</h3>

        {loading ? (
          <p className="loading-text">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="empty-state">No products listed yet.</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currentUserId={user.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
