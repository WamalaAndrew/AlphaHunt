import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, updateDoc, doc, arrayUnion, arrayRemove, increment, deleteDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../services/uploadService';
import { MessageSquare, Heart, Share2, Send, Image as ImageIcon, MoreHorizontal, X, Trash2, TrendingUp } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  authorRole: string;
  content: string;
  imageUrl?: string;
  likes: string[];
  commentsCount: number;
  boostCount?: number;
  createdAt: any;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: any;
}

export default function Feed() {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newPostContent, setNewPostContent] = useState('');
  const [commentText, setCommentText] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Image upload state
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'posts');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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

  const handleComment = async (postId: string, authorId: string) => {
    if (!user || !commentText.trim()) return;

    setCommentSubmitting(true);
    try {
      const newCommentRef = await addDoc(collection(db, `posts/${postId}/comments`), {
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        text: commentText,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });
      
      // Send notification if commenting on someone else's post
      if (authorId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: authorId,
          type: 'comment',
          message: `${user.displayName || 'Someone'} commented on your post.`,
          read: false,
          createdAt: serverTimestamp(),
          link: `/dashboard`
        });
      }
      
      // Update local comments state
      const newLocalComment: Comment = {
        id: newCommentRef.id,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        text: commentText,
        createdAt: new Date(), // Use current date for immediate display
      };

      setComments(prev => ({
        ...prev,
        [postId]: [newLocalComment, ...(prev[postId] || [])]
      }));

      // Update post comments count locally
      setPosts(posts.map(p => p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
      
      setCommentText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${postId}/comments`);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const toggleComments = async (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }
    
    setActiveCommentPostId(postId);
    
    // Fetch comments for this post if not already fetched
    if (!comments[postId]) {
      try {
        const q = query(collection(db, `posts/${postId}/comments`), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const postComments = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Comment[];
        
        setComments(prev => ({
          ...prev,
          [postId]: postComments
        }));
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!newPostContent.trim() && !imageUrl)) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: userProfile?.photoURL || user.photoURL || '',
        authorRole: userProfile?.role || 'seeker',
        content: newPostContent,
        imageUrl: imageUrl || null,
        likes: [],
        commentsCount: 0,
        createdAt: serverTimestamp()
      });
      setNewPostContent('');
      setImageUrl('');
      fetchPosts();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'posts');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string, currentLikes: string[], authorId: string) => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    const hasLiked = currentLikes.includes(user.uid);

    try {
      // Optimistic update
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: hasLiked ? p.likes.filter(id => id !== user.uid) : [...p.likes, user.uid]
          };
        }
        return p;
      }));

      if (hasLiked) {
        await updateDoc(postRef, { likes: arrayRemove(user.uid) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(user.uid) });
        
        // Send notification if liking someone else's post
        if (authorId !== user.uid) {
          await addDoc(collection(db, 'notifications'), {
            userId: authorId,
            type: 'like',
            message: `${user.displayName || 'Someone'} liked your post.`,
            read: false,
            createdAt: serverTimestamp(),
            link: `/dashboard`
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
      fetchPosts(); // Revert on error
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts(posts.filter(p => p.id !== postId));
      setActiveMenuPostId(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post.");
    }
  };

  const handleBoostPost = async (postId: string) => {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        boostCount: increment(10)
      });
      setPosts(posts.map(p => p.id === postId ? { ...p, boostCount: (p.boostCount || 0) + 10 } : p));
      setActiveMenuPostId(null);
    } catch (error) {
      console.error("Error boosting post:", error);
    }
  };

  const handleShare = async (post: Post) => {
    if (isSharing) return;
    
    const shareData = {
      title: `Post by ${post.authorName} on AlphaHunt`,
      text: post.content,
      url: window.location.href
    };
    
    if (navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      } finally {
        setIsSharing(false);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Create Post */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-[#062016]/5">
        <div className="flex gap-4">
          {userProfile?.photoURL || user?.photoURL ? (
            <img src={userProfile?.photoURL || user.photoURL} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-[#062016]/10" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#062016] flex items-center justify-center text-[#bef264] font-bold text-lg">
              {user?.displayName?.charAt(0) || 'U'}
            </div>
          )}
          <form onSubmit={handleCreatePost} className="flex-1">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share an update, ask for advice, or post a job..."
              className="w-full border border-[#062016]/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#bef264] focus:border-transparent resize-none min-h-[100px] text-[#062016] placeholder-slate-400 font-medium"
              aria-label="Create a new post"
            />
            {imageUrl && (
              <div className="relative mt-3 inline-block">
                <img src={imageUrl} alt="Upload preview" className="max-h-48 rounded-xl border border-[#062016]/10" />
                <button 
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute -top-2 -right-2 bg-white text-rose-500 rounded-full p-1 shadow-md border border-slate-100 hover:bg-rose-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex justify-between items-center mt-3">
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
                className="text-slate-400 hover:text-[#062016] p-2 rounded-full hover:bg-[#062016]/5 transition-colors disabled:opacity-50"
              >
                {uploadingImage ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </button>
              <button
                type="submit"
                disabled={submitting || (!newPostContent.trim() && !imageUrl) || uploadingImage}
                className="bg-[#062016] text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-black shadow-lg shadow-[#062016]/10"
              >
                {submitting ? 'Posting...' : <><Send className="w-4 h-4" /> Post</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-[#062016] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[2rem] border border-[#062016]/10 shadow-sm">
          <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#062016]">No posts yet</h3>
          <p className="text-slate-500 mt-1 font-medium">Be the first to share something with the community!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {posts.map(post => (
            <div key={post.id} className="bg-white p-6 rounded-[2rem] border border-[#062016]/5 hover:border-[#bef264]/50 hover:shadow-xl hover:shadow-[#062016]/5 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  {post.authorPhoto ? (
                    <img src={post.authorPhoto} alt={post.authorName} className="w-12 h-12 rounded-full object-cover border border-[#062016]/10" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#062016]/5 flex items-center justify-center text-[#062016] font-bold text-lg border border-[#062016]/10">
                      {post.authorName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-[#062016] text-base capitalize tracking-tight">{post.authorName}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-[#bef264] text-[#062016]">{post.authorRole}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                    className="text-slate-300 hover:text-[#062016] p-2 rounded-full hover:bg-[#062016]/5 transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  
                  {activeMenuPostId === post.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#062016]/10 py-2 z-10">
                      <button 
                        onClick={() => {
                          handleShare(post);
                          setActiveMenuPostId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#062016] hover:bg-[#062016]/5 flex items-center gap-2 font-bold"
                      >
                        <Share2 className="w-4 h-4" /> Share Post
                      </button>
                      
                      {userProfile?.role === 'admin' && (
                        <button 
                          onClick={() => handleBoostPost(post.id)}
                          className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2 font-bold"
                        >
                          <TrendingUp className="w-4 h-4" /> Boost (+10 Likes)
                        </button>
                      )}
                      
                      {(user?.uid === post.authorId || userProfile?.role === 'admin') && (
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Post
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {post.content && (
                <p className="text-[#062016] mb-4 whitespace-pre-wrap leading-relaxed text-base font-medium">{post.content}</p>
              )}
              
              {post.imageUrl && (
                <div className="mb-6 rounded-2xl overflow-hidden border border-[#062016]/5">
                  <img src={post.imageUrl} alt="Post attachment" className="w-full h-auto max-h-[500px] object-cover" />
                </div>
              )}
              
              <div className="flex items-center gap-6 pt-4 border-t border-[#062016]/5">
                <button 
                  onClick={() => handleLike(post.id, post.likes, post.authorId)}
                  className={`flex items-center gap-2 text-sm font-bold transition-colors ${post.likes.includes(user?.uid || '') ? 'text-rose-600' : 'text-slate-400 hover:text-rose-600'}`}
                >
                  <Heart className={`w-5 h-5 ${post.likes.includes(user?.uid || '') ? 'fill-rose-600' : ''}`} />
                  {post.likes.length + (post.boostCount || 0)}
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#062016] transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  {post.commentsCount || 0}
                </button>
                <button 
                  onClick={() => handleShare(post)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#062016] transition-colors ml-auto"
                  aria-label="Share post"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>

              {activeCommentPostId === post.id && (
                <div className="mt-4 pt-4 border-t border-[#062016]/5">
                  {/* Comments List */}
                  <div className="space-y-4 mb-4">
                    {comments[post.id]?.length > 0 ? (
                      comments[post.id].map(comment => (
                        <div key={comment.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-[#062016]">{comment.authorName}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Just now'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 font-medium">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 font-medium text-center py-2">No comments yet. Be the first to reply!</p>
                    )}
                  </div>
                  
                  {/* Global Comment Input */}
                  <div className="flex gap-3">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 border border-[#062016]/10 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#bef264] focus:border-transparent resize-none text-sm font-medium"
                      rows={1}
                      aria-label="Comment text"
                    />
                    <button
                      onClick={() => handleComment(post.id, post.authorId)}
                      disabled={commentSubmitting || !commentText.trim()}
                      className="bg-[#062016] text-white p-2 rounded-xl disabled:opacity-50"
                      aria-label="Post comment"
                    >
                      {commentSubmitting ? '...' : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
