import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function MessagePage({ user }) {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    // 1. Fetch all messages involving the current user
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!msgs) return;

    // 2. Group messages by (product_id, other_user_id)
    const groups = {};

    msgs.forEach((m) => {
      const otherUser = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      const key = `${m.product_id}-${otherUser}`;
      if (!groups[key]) groups[key] = m; // store latest message
    });

    const grouped = Object.values(groups);

    // Fetch unique user IDs & product IDs
    const userIds = grouped.map((m) =>
      m.sender_id === user.id ? m.receiver_id : m.sender_id
    );
    const productIds = grouped.map((m) => m.product_id);

    // Fetch names
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);

    // Fetch product titles
    const { data: products } = await supabase
      .from("products")
      .select("id, title")
      .in("id", productIds);

    const finalData = grouped.map((m) => {
      const otherUserId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      const person = profiles?.find((p) => p.id === otherUserId) || {};
      const product = products?.find((p) => p.id === m.product_id) || {};

      return {
        ...m,
        userName: `${person.first_name || ""} ${person.last_name || ""}`,
        productName: product.title || "Unknown Product",
        otherUserId,
      };
    });

    setConversations(finalData);
  };

  const loadMessages = async (conv) => {
    setActiveChat(conv);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("product_id", conv.product_id)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeChat) return;

    const newMessage = {
      product_id: activeChat.product_id,
      sender_id: user.id,
      receiver_id: activeChat.otherUserId,
      text: inputMessage.trim(),
    };

    await supabase.from("messages").insert([newMessage]);

    setInputMessage("");
    loadMessages(activeChat);
  };

  return (
    <div className="chat-container">

      {/* LEFT SIDEBAR */}
      <div className="chat-sidebar">
        <h2>Chats</h2>

        {conversations.map((c) => (
          <div
            key={c.id}
            className={`conversation-item ${activeChat?.id === c.id ? "active" : ""}`}
            onClick={() => loadMessages(c)}
          >
            <strong>{c.userName}</strong>
            <div className="small">Product: {c.productName}</div>
          </div>
        ))}
      </div>

      {/* MAIN CHAT */}
      <div className="chat-main">
        {activeChat ? (
          <>
            <div className="chat-header">
              Chat with {activeChat.userName} — {activeChat.productName}
            </div>

            <div className="chat-messages">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`message-bubble ${
                    m.sender_id === user.id ? "message-sent" : "message-received"
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <div className="chat-input-area">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="chat-placeholder">Select a conversation</div>
        )}
      </div>

    </div>
  );
}
