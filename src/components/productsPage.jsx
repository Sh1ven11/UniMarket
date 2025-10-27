import { useState, useEffect } from "react";
import { supabase } from "../supabase"; // The supabase client is imported here
import NewProduct from "./NewProduct";
import ProductCard from "./ProductCard";

const ProductsPage = ({ user, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: false });
      if (error) throw error;
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="login-container">
      <header className="login-header">
        { <h2>Welcome, {/*user.user_metadata?.name ||*/ user.email}!</h2> }
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </header>

      {/* Add Product Section */}
      <section className="login-form">
        <button
          className="primary-btn"
          onClick={() => setShowAddProduct(!showAddProduct)}
        >
          {showAddProduct ? "Close Add Product" : "Add Product"}
        </button>
      </section>

     {showAddProduct && (
      <NewProduct
        user={user}
        onAdd={(newProduct) => setProducts([newProduct, ...products])}
      />
      )}

      {/* Products Grid */}
      <section className="browse-products">
        <h3>All Products</h3>
        {loading ? (
          <p>Loading products...</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                // ✨ PASS THE NECESSARY PROPS HERE ✨
                currentUserId={user.id} 
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProductsPage;