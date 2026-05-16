import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit3, Search, StickyNote, X, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: string;
  tags: string[];
  createdAt: string;
}

const COLORS = [
  'bg-white',
  'bg-yellow-50',
  'bg-blue-50',
  'bg-green-50',
  'bg-pink-50',
  'bg-purple-50',
  'bg-orange-50',
];

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      setNotes(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !title.trim() || !content.trim()) return;

    const noteData = {
      userId: auth.currentUser.uid,
      title,
      content,
      color: selectedColor,
      tags: tags,
      createdAt: editingNote ? editingNote.createdAt : new Date().toISOString(),
    };

    try {
      if (editingNote) {
        await updateDoc(doc(db, 'notes', editingNote.id), noteData);
      } else {
        await addDoc(collection(db, 'notes'), noteData);
      }
      closeModal();
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('آیا از حذف این یادداشت اطمینان دارید؟')) return;
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const openModal = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setContent(note.content);
      setSelectedColor(note.color);
      setTags(note.tags || []);
    } else {
      setEditingNote(null);
      setTitle('');
      setContent('');
      setSelectedColor(COLORS[0]);
      setTags([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
    setSelectedColor(COLORS[0]);
    setTags([]);
    setTagInput('');
  };

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags || [])));

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || (note.tags && note.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Back Button */}
      <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-md py-2 px-4 -mx-4 border-b border-gray-100 flex items-center justify-between">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all font-bold text-sm group"
        >
          <div className="p-1.5 bg-gray-100 rounded-full group-hover:bg-blue-50 transition-colors">
            <Search size={18} className="rotate-180" />
          </div>
          بازگشت
        </button>
        <div className="text-xs font-bold text-gray-400">یادداشت‌های من</div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">یادداشت‌های من</h1>
          <p className="text-gray-500 text-sm">ایده‌ها و نکات مهم خود را ثبت کنید</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Search & Tag Filter */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md py-4 space-y-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="جستجو در یادداشت‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-4 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedTag(null)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                !selectedTag ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              همه
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                  selectedTag === tag ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "relative group rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm hover:shadow-xl transition-all flex flex-col",
                  note.color
                )}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{note.title}</h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(note)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap line-clamp-6 flex-1">
                  {note.content}
                </p>
                
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-bold bg-gray-900/5 text-gray-600 px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-4 flex items-center justify-between border-t border-gray-900/5">
                  <span className="text-[10px] text-gray-400">
                    {new Date(note.createdAt).toLocaleDateString('fa-IR')}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-gray-200" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 space-y-6 transition-colors duration-500",
                selectedColor
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900">
                  {editingNote ? 'ویرایش یادداشت' : 'یادداشت جدید'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-900/5 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-6">
                <div className="space-y-2">
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان یادداشت..."
                    className="w-full bg-transparent border-none text-xl font-bold placeholder:text-gray-400 focus:ring-0 p-0"
                  />
                </div>

                <div className="space-y-2">
                  <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="متن یادداشت را اینجا بنویسید..."
                    className="w-full bg-transparent border-none text-gray-700 placeholder:text-gray-400 focus:ring-0 p-0 min-h-[150px] resize-none leading-relaxed"
                  />
                </div>

                {/* Tags Input */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-gray-900 text-white rounded-full text-[10px] font-bold">
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="افزودن تگ (اینتر بزنید)..."
                    className="w-full bg-gray-900/5 border-none rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-gray-900 transition-all"
                  />
                </div>

                {/* Color Picker */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center",
                        color,
                        selectedColor === color ? "border-gray-900 scale-110" : "border-transparent"
                      )}
                    >
                      {selectedColor === color && <Check size={16} className="text-gray-900" />}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-gray-800 transition-all"
                  >
                    {editingNote ? 'بروزرسانی یادداشت' : 'ذخیره یادداشت'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!loading && filteredNotes.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <StickyNote size={40} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-bold">یادداشتی یافت نشد.</p>
        </div>
      )}
    </div>
  );
};

export default Notes;
