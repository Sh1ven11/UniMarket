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

  // Fetch all unique conversation groups (product + other user)
  const fetchConversations = async () => {
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (!msgs) return;

    // Identify other user + group chats
    const groups = {};
    msgs.forEach((m) => {
      const otherUser = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      const key = `${otherUser}-${m.product_id}`;

      if (!groups[key]) groups[key] = { otherUser, product_id: m.product_id, messages: [] };
      groups[key].messages.push(m);
    });

    const convArray = Object.values(groups);

    // Fetch names of other users
    const userIds = convArray.map((c) => c.otherUser);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);

    // Fetch product titles
    const productIds = convArray.map((c) => c.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("id, title")
      .in("id", productIds);

    // Merge data
    const enhanced = convArray.map((c) => ({
      ...c,
      userName:
        profiles?.find((p) => p.id === c.otherUser)?.first_name +
        " " +
        profiles?.find((p) => p.id === c.otherUser)?.last_name,
      productName: products?.find((p) => p.id === c.product_id)?.title || "Unknown Product",
    }));

    setConversations(enhanced);
  };

  const fetchMessages = async (chat) => {
    setActiveChat(chat);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${chat.otherUser}),and(sender_id.eq.${chat.otherUser},receiver_id.eq.${user.id})`
      )
      .eq("product_id", chat.product_id)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeChat) return;

    const message = {
      product_id: activeChat.product_id,
      sender_id: user.id,
      receiver_id: activeChat.otherUser,
      content: inputMessage.trim(),
    };

    await supabase.from("messages").insert([message]);
    setInputMessage("");
    fetchMessages(activeChat);
  };

  return (
    <div className="chat-container">

      {/* LEFT PANEL */}
      <div className="chat-sidebar">
        <h2>Your Conversations</h2>

        {conversations.map((c, i) => (
          <div
            key={i}
            className={`conversation-item ${activeChat?.otherUser === c.otherUser && activeChat?.product_id === c.product_id ? "active" : ""}`}
            onClick={() => fetchMessages(c)}
          >
            <strong>{c.userName}</strong>
            <p>{c.productName}</p>
          </div>
        ))}
      </div>

      {/* RIGHT PANEL */}
      <div className="chat-main">
        {activeChat ? (
          <>
            <div className="chat-header">
              {activeChat.productName} — Chat with {activeChat.userName}
            </div>

            <div className="chat-messages">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`message-bubble ${
                    m.sender_id === user.id ? "message-sent" : "message-received"
                  }`}
                >
                  {m.content}
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
