import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { db, storage } from '../firebase';
import { collection, query, getDocs, orderBy, addDoc, where, updateDoc, doc, arrayUnion, arrayRemove, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Post, UserProfile } from '../types';
import { MessageCircle, Share2, Heart, Plus, MoreHorizontal, Bookmark, Smile, X, Image as ImageIcon, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import InviteFriends from './InviteFriends';

interface Props {
  user: User | null;
  profile: UserProfile | null;
}

const Social: React.FC<Props> = ({ user, profile }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [showHeart, setShowHeart] = useState<string | null>(null);

  useEffect(() => {
    const postsQuery = query(collection(db, 'posts'), where('isStory', '==', false), orderBy('createdAt', 'desc'));
    const storiesQuery = query(collection(db, 'posts'), where('isStory', '==', true), orderBy('createdAt', 'desc'));

    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Post));
      setPosts(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    const unsubscribeStories = onSnapshot(storiesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Post));
      setStories(data);
    }, (error) => {
      console.error('Error fetching stories:', error);
    });

    return () => {
      unsubscribePosts();
      unsubscribeStories();
    };
  }, []);

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    try {
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        likes: isLiked ? p.likes.filter(id => id !== user.uid) : [...p.likes, user.uid]
      } : p));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSave = async (postId: string, isSaved: boolean) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        savedPosts: isSaved ? arrayRemove(postId) : arrayUnion(postId)
      });
      // We might want to update local state if we have a profile state here, 
      // but usually profile is passed from App.tsx. 
      // For now, just show a success message or rely on the UI update in Profile page.
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleDoubleTap = (postId: string, isLiked: boolean) => {
    if (!isLiked) {
      handleLike(postId, false);
    }
    setShowHeart(postId);
    setTimeout(() => setShowHeart(null), 1000);
  };

  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreatePostWithImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!newPostContent.trim() && !newPostImage)) return;

    setIsSubmittingPost(true);
    try {
      let imageUrl = '';
      if (newPostImage) {
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${newPostImage.name}`);
        await uploadBytes(storageRef, newPostImage);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName || user.email || 'کاربر',
        authorPhoto: user.photoURL || '',
        content: newPostContent,
        imageUrl: imageUrl,
        likes: 0,
        comments: 0,
        shares: 0,
        isStory: false,
        createdAt: serverTimestamp()
      });

      setNewPostContent('');
      setNewPostImage(null);
      setIsCreatingPost(false);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Back Button & Header */}
      <div className="sticky top-14 z-40 bg-white/60 backdrop-blur-md py-4 px-4 -mx-4 border-b border-gray-100/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.history.back()}
            className="p-2 bg-gray-100 rounded-xl hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
          >
            <Plus size={20} className="rotate-180" />
          </button>
          <h1 className="text-xl font-black text-gray-900">شبکه اجتماعی</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCreatingPost(true)}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Plus size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {isCreatingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreatingPost(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">ایجاد پست جدید</h2>
                <button onClick={() => setIsCreatingPost(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreatePostWithImage} className="space-y-4">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="چه در ذهن دارید؟"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all h-32 resize-none"
                />

                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setNewPostImage(e.target.files?.[0] || null)}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                  >
                    <ImageIcon size={18} />
                    {newPostImage ? 'تغییر تصویر' : 'افزودن تصویر'}
                  </button>
                  {newPostImage && (
                    <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                      {newPostImage.name}
                    </span>
                  )}
                </div>

                {newPostImage && (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-100">
                    <img 
                      src={URL.createObjectURL(newPostImage)} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button 
                      type="button"
                      onClick={() => setNewPostImage(null)}
                      className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingPost || (!newPostContent.trim() && !newPostImage)}
                  className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingPost ? <Loader2 className="animate-spin" size={20} /> : 'انتشار پست'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stories */}
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar bg-white/40 backdrop-blur-sm py-4 px-2 -mx-4 border-b border-gray-100/20 pt-4">
        <div className="shrink-0 text-center space-y-1">
          <div className="relative w-16 h-16 rounded-full p-[2px] bg-gray-200">
            <div className="w-full h-full rounded-full bg-white p-[2px]">
              <img 
                src={user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`} 
                alt="Me" 
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <button className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full border-2 border-white p-0.5">
              <Plus size={14} />
            </button>
          </div>
          <span className="text-[10px] text-gray-500 font-medium">استوری من</span>
        </div>
        {stories.map((story) => (
          <div key={story.id} className="shrink-0 text-center space-y-1">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <img 
                  src={`https://i.pravatar.cc/150?u=${story.authorId}`} 
                  alt="User" 
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <span className="text-[10px] text-gray-500 font-medium truncate w-16 block">کاربر</span>
          </div>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white border-b border-gray-100 animate-pulse h-[500px]" />
          ))
        ) : posts.length > 0 ? (
          posts.map((post) => {
            const isLiked = user ? post.likes.includes(user.uid) : false;
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card -mx-4 md:mx-0 md:rounded-2xl overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                      <div className="w-full h-full rounded-full bg-white p-[1px]">
                        <img 
                          src={`https://i.pravatar.cc/150?u=${post.authorId}`} 
                          alt="Author" 
                          className="w-full h-full rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">کاربر خراسان</h4>
                      <span className="text-[10px] text-gray-400">هرات، افغانستان</span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                {/* Post Content */}
                <div 
                  className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer"
                  onDoubleClick={() => handleDoubleTap(post.id, isLiked)}
                >
                  {post.images && post.images.length > 0 ? (
                    <img 
                      src={post.images[0]} 
                      alt="Post" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-lg font-medium text-gray-800 leading-relaxed">{post.content}</p>
                    </div>
                  )}
                  
                  <AnimatePresence>
                    {showHeart === post.id && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        <Heart size={100} fill="#ef4444" className="text-red-500 drop-shadow-2xl" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Post Actions */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleLike(post.id, isLiked)}
                        className={cn(
                          "transition-all active:scale-125 hover:scale-110",
                          isLiked ? "text-red-500" : "text-gray-900 hover:text-red-400"
                        )}
                      >
                        <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
                      </button>
                      <button className="text-gray-900 hover:text-blue-500 transition-all hover:scale-110 active:scale-95">
                        <MessageCircle size={24} />
                      </button>
                      <button 
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: 'پست خراسان',
                              text: post.content,
                              url: window.location.href,
                            });
                          }
                        }}
                        className="text-gray-900 hover:text-green-500 transition-all hover:scale-110 active:scale-95 p-1 hover:bg-green-50 rounded-full"
                      >
                        <Share2 size={24} />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleSave(post.id, profile?.savedPosts?.includes(post.id) || false)}
                      className={cn(
                        "transition-all active:scale-125 hover:scale-110",
                        profile?.savedPosts?.includes(post.id) ? "text-blue-600" : "text-gray-900 hover:text-blue-400"
                      )}
                    >
                      <Bookmark size={24} fill={profile?.savedPosts?.includes(post.id) ? "currentColor" : "none"} />
                    </button>
                  </div>

                  {/* Likes Count */}
                  <div className="text-xs font-bold text-gray-900">
                    {post.likes.length.toLocaleString()} پسند
                  </div>

                  {/* Caption */}
                  <div className="text-xs leading-relaxed">
                    <span className="font-bold ml-1">کاربر خراسان</span>
                    <span className="text-gray-800">{post.content}</span>
                  </div>

                  {/* Comments Link */}
                  {post.comments.length > 0 && (
                    <button className="text-[10px] text-gray-400 font-medium">
                      مشاهده همه {post.comments.length} دیدگاه
                    </button>
                  )}

                  {/* Time */}
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider">
                    {post.createdAt?.toDate ? new Intl.RelativeTimeFormat('fa-IR', { numeric: 'auto' }).format(
                      Math.round((post.createdAt.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 
                      'day'
                    ) : 'به تازگی'}
                  </div>
                </div>

                {/* Add Comment */}
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem('comment') as HTMLInputElement;
                    const comment = input.value.trim();
                    if (!comment || !user) return;
                    
                    try {
                      const postRef = doc(db, 'posts', post.id);
                      await updateDoc(postRef, {
                        comments: arrayUnion({
                          userId: user.uid,
                          userName: profile?.displayName || user.email,
                          text: comment,
                          createdAt: new Date().toISOString()
                        })
                      });
                      input.value = '';
                    } catch (error) {
                      console.error('Error adding comment:', error);
                    }
                  }}
                  className="px-4 py-3 border-t border-gray-50 flex items-center gap-3 bg-gray-50/30"
                >
                  <button type="button" className="text-gray-400 hover:text-amber-500 transition-colors">
                    <Smile size={20} />
                  </button>
                  <div className="flex-1 relative">
                    <input 
                      name="comment"
                      type="text" 
                      placeholder="افزودن دیدگاه..." 
                      className="w-full text-xs bg-white border border-gray-200 rounded-full px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="text-blue-600 text-xs font-black hover:text-blue-700 transition-all active:scale-90 disabled:opacity-50"
                  >
                    ارسال
                  </button>
                </form>
              </motion.div>
            );
          })
        ) : (
          <div className="py-20 text-center text-gray-400">
            <p>پستی یافت نشد.</p>
          </div>
        )}
      </div>

      {/* Invite Friends Widget */}
      {user && <InviteFriends user={user} />}
    </div>
  );
};

export default Social;
