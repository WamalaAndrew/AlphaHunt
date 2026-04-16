import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../services/uploadService';
import { Send, ArrowLeft, Search, User, Clock, Image as ImageIcon, Video, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  imageUrl?: string;
  senderId: string;
  createdAt: any;
}

interface Chat {
  id: string;
  participants: string[];
  participantDetails: Record<string, { name: string; photoUrl?: string; role?: string }>;
  lastMessage?: string;
  lastMessageTime?: any;
  updatedAt: any;
}

export default function Messages() {
  const { user, userProfile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Image upload state
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle incoming chat initialization from other pages
  useEffect(() => {
    const initChat = async () => {
      const params = new URLSearchParams(location.search);
      const newChatUserId = params.get('userId');
      const newChatUserName = params.get('name');
      const newChatUserRole = params.get('role');

      if (newChatUserId && user && newChatUserName) {
        // Check if chat already exists
        const existingChat = chats.find(c => c.participants.includes(newChatUserId));
        if (existingChat) {
          setActiveChat(existingChat);
          // Remove query params
          navigate('/messages', { replace: true });
        } else {
          // Create new chat
          try {
            const chatData = {
              participants: [user.uid, newChatUserId],
              participantDetails: {
                [user.uid]: {
                  name: userProfile?.displayName || user.email?.split('@')[0] || 'User',
                  role: userProfile?.role || 'user',
                  photoUrl: userProfile?.photoURL || user.photoURL || ''
                },
                [newChatUserId]: {
                  name: newChatUserName,
                  role: newChatUserRole || 'user'
                }
              },
              updatedAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, 'chats'), chatData);
            const newChat = { id: docRef.id, ...chatData } as Chat;
            setChats(prev => [newChat, ...prev]);
            setActiveChat(newChat);
            navigate('/messages', { replace: true });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'chats');
          }
        }
      }
    };

    if (!loadingChats) {
      initChat();
    }
  }, [location.search, user, chats, loadingChats, navigate, userProfile]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      
      // Sort by updatedAt descending
      chatsData.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return timeB - timeA;
      });

      setChats(chatsData);
      setLoadingChats(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chats');
      setLoadingChats(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activeChat || !user) return;

    const q = query(
      collection(db, `chats/${activeChat.id}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      scrollToBottom();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chats/${activeChat.id}/messages`);
    });

    return () => unsubscribe();
  }, [activeChat, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeChat) return;

    setUploadingImage(true);
    try {
      const downloadUrl = await uploadToCloudinary(file);
      setImageUrl(downloadUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please check your Cloudinary configuration.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageUrl) || !activeChat || !user) return;

    const messageText = newMessage.trim();
    const currentImageUrl = imageUrl;
    
    setNewMessage('');
    setImageUrl('');

    try {
      // Add message
      await addDoc(collection(db, `chats/${activeChat.id}/messages`), {
        text: messageText,
        imageUrl: currentImageUrl || null,
        senderId: user.uid,
        createdAt: serverTimestamp()
      });

      // Update chat last message
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: currentImageUrl ? '📷 Image' : messageText,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Send notification to the other participant
      const otherParticipantId = activeChat.participants.find(id => id !== user.uid);
      if (otherParticipantId) {
        await addDoc(collection(db, 'notifications'), {
          userId: otherParticipantId,
          type: 'message',
          message: `New message from ${user.displayName || 'Someone'}`,
          read: false,
          createdAt: serverTimestamp(),
          link: `/messages?userId=${user.uid}`
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${activeChat.id}/messages`);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredChats = chats.filter(chat => {
    const otherUserId = chat.participants.find(id => id !== user?.uid);
    const otherUser = otherUserId ? chat.participantDetails[otherUserId] : null;
    if (!otherUser) return false;
    return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#fdfbf7] font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Messages</h1>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex gap-6 h-[calc(100vh-73px)]">
        {/* Chat List Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search messages..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all text-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {loadingChats ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center p-8 text-slate-500 text-sm">
                No conversations found.
              </div>
            ) : (
              filteredChats.map(chat => {
                const otherUserId = chat.participants.find(id => id !== user?.uid);
                const otherUser = otherUserId ? chat.participantDetails[otherUserId] : null;
                const isActive = activeChat?.id === chat.id;
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors mb-1 ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-300">
                      {otherUser?.photoUrl ? (
                        <img src={otherUser.photoUrl} alt={otherUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="font-bold text-slate-900 truncate pr-2">{otherUser?.name || 'Unknown User'}</h3>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {formatTime(chat.updatedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {chat.lastMessage || 'Started a conversation'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Active Chat Area */}
        <div className={`flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveChat(null)}
                    className="md:hidden p-2 hover:bg-slate-50 rounded-full text-slate-500"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  {(() => {
                    const otherUserId = activeChat.participants.find(id => id !== user?.uid);
                    const otherUser = otherUserId ? activeChat.participantDetails[otherUserId] : null;
                    return (
                      <>
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                          {otherUser?.photoUrl ? (
                            <img src={otherUser.photoUrl} alt={otherUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <h2 className="font-bold text-slate-900">{otherUser?.name || 'Unknown User'}</h2>
                          <p className="text-xs text-slate-500 capitalize">{otherUser?.role || 'User'}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                <button
                  onClick={() => navigate(`/video-call?room=AlphaHunt-${activeChat.id}`)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 px-4 py-2 rounded-xl transition-colors border border-slate-200 hover:border-amber-200 shadow-sm"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Video Call</span>
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.uid;
                  const showTime = idx === messages.length - 1 || 
                    (messages[idx + 1] && msg.createdAt?.toMillis && messages[idx + 1].createdAt?.toMillis && 
                     messages[idx + 1].createdAt.toMillis() - msg.createdAt.toMillis() > 300000); // 5 mins
                     
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                          isMe 
                            ? 'bg-slate-800 text-white rounded-br-sm' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {msg.imageUrl && (
                          <div className="mb-2 rounded-xl overflow-hidden">
                            <img src={msg.imageUrl} alt="Shared image" className="max-w-full h-auto max-h-64 object-cover" />
                          </div>
                        )}
                        {msg.text && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>
                      {showTime && (
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {formatTime(msg.createdAt)}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
                {imageUrl && (
                  <div className="relative mb-3 inline-block">
                    <img src={imageUrl} alt="Upload preview" className="h-24 rounded-xl border border-slate-200 object-cover" />
                    <button 
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute -top-2 -right-2 bg-white text-rose-500 rounded-full p-1 shadow-md border border-slate-100 hover:bg-rose-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl flex items-end p-1 focus-within:ring-2 focus-within:ring-slate-400 focus-within:border-slate-400 transition-all">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <ImageIcon className="w-5 h-5" />
                      )}
                    </button>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type a message..."
                      className="w-full max-h-32 bg-transparent border-none focus:ring-0 resize-none py-2.5 px-3 text-sm outline-none"
                      rows={1}
                      style={{ minHeight: '44px' }}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={(!newMessage.trim() && !imageUrl) || uploadingImage}
                    className="p-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-slate-400 ml-1" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Your Messages</h3>
              <p className="text-slate-500 max-w-sm">
                Select a conversation from the sidebar to view messages, or start a new chat from a profile.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
