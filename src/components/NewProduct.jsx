import { useState } from "react";
import { supabase } from "../supabase";

const NewProduct = ({ user, onAdd }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("New");
  const [images, setImages] = useState(""); // comma-separated URLs
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("products")
        .insert([{
          seller_id: user.id,
          title,
          description,
          price: parseFloat(price),
          category,
          condition,
          images: images.split(",").map(img => img.trim())
        }])
        .select()
        .single();

      if (error) throw error;
      setMessage("Product added successfully!");
      onAdd(data);

      setTitle(""); setDescription(""); setPrice(""); setCategory(""); setCondition("New"); setImages("");
    } catch (err) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-group">
        <label>Title:</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="form-group">
        <label>Description:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>

      <div className="form-group">
        <label>Price:</label>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </div>

      <div className="form-group">
        <label>Category:</label>
        <input value={category} onChange={(e) => setCategory(e.target.value)} required />
      </div>

      <div className="form-group">
        <label>Condition:</label>
        <select value={condition} onChange={(e) => setCondition(e.target.value)}>
          <option value="New">New</option>
          <option value="Used">Used</option>
        </select>
      </div>

      <div className="form-group">
        <label>Images (comma-separated URLs):</label>
        <input value={images} onChange={(e) => setImages(e.target.value)} />
      </div>

      {message && <div className={`message ${message.includes("Error") ? "error" : "success"}`}>{message}</div>}

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? "Adding..." : "Add Product"}
      </button>
    </form>
  );
};

export default NewProduct;
