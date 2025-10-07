const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      {product.images?.length > 0 && (
        <img src={product.images[0]} alt={product.title} className="product-image" />
      )}
      <h4 className="product-name">{product.title}</h4>
      <p className="product-description">{product.description}</p>
      <p>Category: {product.category}</p>
      <p>Condition: {product.condition}</p>
      <strong className="product-price">${product.price.toFixed(2)}</strong>
    </div>
  );
};

export default ProductCard;
