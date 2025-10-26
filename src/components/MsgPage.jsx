import { useState, useEffect, useCallback, useMemo } from "react";
// Assuming supabase client is globally available or imported from a common utilities file
import { supabase } from "../supabase"; 
import {
  Send,
  Loader2,
  MessageSquare,
  RefreshCw,
  LogOut
} from "lucide-react";

// The supabase object must be passed as a prop since MsgPage is now a separate file
// and cannot access the mock client defined in App.jsx directly.
const MsgPage = ({ user, onLogout, supabase }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  const currentUserId = user.id;

  // --- Mock Data Helpers (Replace with real Supabase lookups in production) ---
  // In a real app, this data would come from a 'profiles' or 'products' join/lookup
  const getOtherUserName = (otherId) => {
    // Mock user IDs used in the previous App.jsx context
    if (otherId === 'mock-user-id-2') return 'Seller Sam';
    if (otherId === 'mock-user-id-3') return 'Buyer Bob';
    return otherId.substring(0, 8) + '...';
  };
  
  const getProductName = (productId) => {
    if (productId === 'prod-1') return 'Vintage Desk Lamp';
    if (productId === 'prod-2') return 'Calculus Textbook';
    return 'Unknown Product';
  };
  // --- End Mock Data Helpers ---

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch all messages involving the current user (sender or receiver)
      const { data: allMessages, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // 2. Client-side grouping into unique conversations (product + other participant)
      const conversationsMap = {};
      
      allMessages.forEach(msg => {
        const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        // Key is unique combination of product and the other party
        const key = `${msg.product_id}-${otherId}`; 

        if (!conversationsMap[key]) {
          conversationsMap[key] = {
            id: key,
            product_id: msg.product_id,
            product_name: getProductName(msg.product_id),
            other_user_id: otherId,
            other_user_name: getOtherUserName(otherId),
            last_message: msg.contffent,
            last_timestamp: msg.created_at,
          };
        }
      });
      
      const convos = Object.values(conversationsMap).sort((a, b) => new Date(b.last_timestamp) - new Date(a.last_timestamp));
      setConversations(convos);

      // Select the first conversation by default if none is selected
      if (!selectedChatId && convos.length > 0) {
        setSelectedChatId(convos[0].id);
      }

    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, selectedChatId, supabase]); // Added supabase to dependency array

  const fetchMessages = useCallback(async (chatId) => {
    if (!chatId) return setMessages([]);
    setChatLoading(true);
    
    // Find the selected conversation details
    const selectedConvo = conversations.find(c => c.id === chatId);
    if (!selectedConvo) return setChatLoading(false);

    try {
      // Fetch all messages for this specific product_id and between these two users
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("product_id", selectedConvo.product_id)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedConvo.other_user_id}),and(sender_id.eq.${selectedConvo.other_user_id},receiver_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true }); // Display in chronological order

      if (error) throw error;
      setMessages(data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setChatLoading(false);
    }
  }, [currentUserId, conversations, supabase]); // Added supabase to dependency array

  // Initial load of conversations
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages whenever selectedChatId changes and set up real-time listener
  useEffect(() => {
    let subscription = null;
    if (selectedChatId) {
      fetchMessages(selectedChatId);
      
      const handleInserts = (payload) => {
          // Check if the new message belongs to the current chat
          const selectedConvo = conversations.find(c => c.id === selectedChatId);
          if (selectedConvo && payload.new.product_id === selectedConvo.product_id) {
            setMessages(prev => [...prev, payload.new]);
          }
      };

      // Set up the mock real-time subscription
      // In a real app: subscription = supabase.channel('chat-room-' + selectedChatId) ...
      subscription = supabase.channel('all-messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handleInserts)
        .subscribe();
      
      return () => {
          // Cleanup the listener (using unsubscribe from the mock object)
          if (subscription.unsubscribe) {
            subscription.unsubscribe();
          }
      };
    }
  }, [selectedChatId, fetchMessages, conversations, supabase]); // Added supabase to dependency array

  // Memoize the selected conversation object
  const selectedConversation = useMemo(() => {
    return conversations.find(c => c.id === selectedChatId);
  }, [conversations, selectedChatId]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageContent.trim() || !selectedConversation) return;

    const messagePayload = {
      sender_id: currentUserId,
      receiver_id: selectedConversation.other_user_id,
      product_id: selectedConversation.product_id,
      content: newMessageContent.trim(),
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('messages').insert([messagePayload]);

      if (error) throw error;

      // Rely on real-time listener to append the message
      setNewMessageContent('');
      
      // Update conversations list to show new last message
      fetchConversations();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const MessageBubble = ({ message }) => {
    const isSender = message.sender_id === currentUserId;
    return (
      <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className={`max-w-xs lg:max-w-md p-3 rounded-xl shadow-md ${
          isSender
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-tl-none'
        }`}>
          <p className="text-sm">{message.content}</p>
          <span className={`block text-xs mt-1 ${isSender ? 'text-indigo-200' : 'text-gray-500'}`}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 flex flex-col lg:flex-row min-h-[70vh]">
      {/* Sidebar: Conversation List */}
      <aside className="lg:w-1/3 w-full bg-white rounded-xl shadow-lg border border-gray-200 lg:mr-6 mb-6 lg:mb-0 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" /> Your Conversations
          </h3>
          <button onClick={fetchConversations} className="text-gray-500 hover:text-indigo-600 transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="overflow-y-auto flex-grow">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-center text-gray-500">No active conversations.</p>
          ) : (
            conversations.map(convo => (
              <div
                key={convo.id}
                onClick={() => setSelectedChatId(convo.id)}
                className={`p-4 border-b cursor-pointer hover:bg-indigo-50 transition ${
                  selectedChatId === convo.id ? 'bg-indigo-100 border-indigo-500 border-l-4' : 'bg-white'
                }`}
              >
                <p className="font-semibold text-gray-800 truncate">
                  Chat with: {convo.other_user_name}
                </p>
                <p className="text-sm text-indigo-600 truncate my-1">
                  Product: {convo.product_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {convo.last_message}
                </p>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="lg:w-2/3 w-full bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b bg-indigo-50 flex-shrink-0 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-indigo-700">
                  Conversation about: {selectedConversation.product_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Talking to: {selectedConversation.other_user_name}
                </p>
              </div>
              <button onClick={onLogout} className="text-red-500 hover:text-red-700 transition">
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Message History */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50">
              {chatLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 pt-10">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p>Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center flex-shrink-0 bg-white">
              <input
                type="text"
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white p-3 rounded-r-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center disabled:opacity-50"
                disabled={!newMessageContent.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex justify-center items-center h-full text-gray-500 text-lg">
            Select a conversation to start chatting.
          </div>
        )}
      </main>
    </div>
  );
};

export default MsgPage;
