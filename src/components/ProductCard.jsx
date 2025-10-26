import { useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';

// ProductCard now accepts currentUserId and supabase as props
const ProductCard = ({ product, currentUserId, supabase }) => {
  const [isSending, setIsSending] = useState(false);
  const [chatInitiated, setChatInitiated] = useState(false);

  // CRITICAL ASSUMPTION: The 'product' object MUST have a 'seller_id' field
  const isSeller = currentUserId === product.seller_id;
  
  const handleChatInitiation = async () => {
    if (!currentUserId) {
        alert("You must be logged in to chat with a seller.");
        return;
    }
    if (isSeller || isSending || chatInitiated) return;
    
    setIsSending(true);

    // 1. Construct the initial message payload
    const messagePayload = {
      sender_id: currentUserId,
      receiver_id: product.seller_id,        // ID of the seller
      product_id: product.id,                // ID of the product
      content: `Hi! I'm interested in your product: ${product.title}`,
      created_at: new Date().toISOString(),
    };

    try {
      // 2. Insert the message into the 'messages' table
      const { error } = await supabase.from('messages').insert([messagePayload]);

      if (error) throw error;

      // 3. Update state to confirm chat was started
      setChatInitiated(true);
      // Optional: Redirect the user to the messages page here, or rely on the alert/button state
      alert('Chat initiated! The seller has been sent a message.');
      
    } catch (err) {
      console.error('Error initiating chat:', err);
      alert('Failed to start chat. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

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

      {/* Display the Chat Button ONLY if the user is logged in AND is NOT the seller */}
      {currentUserId && !isSeller ? (
        <button
          onClick={handleChatInitiation}
          className={`mt-4 w-full flex items-center justify-center py-2 px-4 rounded-lg font-semibold transition ${
            chatInitiated 
              ? 'bg-green-500 text-white cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          } disabled:opacity-70`}
          disabled={isSending || chatInitiated}
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : chatInitiated ? (
            'Chat Started! ✅'
          ) : (
            <>
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat with Seller
            </>
          )}
        </button>
      ) : (
        // Optional message for logged-in sellers or logged-out users
        !currentUserId ? (
            <p className="text-sm text-gray-500 mt-2">Log in to chat with the seller.</p>
        ) : isSeller ? (
             <p className="text-sm text-gray-500 mt-2">This is your product.</p>
        ) : null
      )}
    </div>
  );
};

export default ProductCard;