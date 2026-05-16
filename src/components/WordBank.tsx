import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit3, Search, Book, Sparkles, BrainCircuit, Volume2, X, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

interface WordBankItem {
  id: string;
  word: string;
  definition: string;
  example: string;
  category: string;
  createdAt: string;
}

const CATEGORIES = [
  'عمومی',
  'ادبیات',
  'تاریخ',
  'علمی',
  'فرهنگی',
  'هنری',
];

const WordBank: React.FC = () => {
  const [words, setWords] = useState<WordBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<WordBankItem | null>(null);
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'wordbank'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WordBankItem));
      setWords(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !definition.trim()) return;

    const wordData = {
      word,
      definition,
      example,
      category,
      createdAt: editingWord ? editingWord.createdAt : new Date().toISOString(),
    };

    try {
      if (editingWord) {
        await updateDoc(doc(db, 'wordbank', editingWord.id), wordData);
      } else {
        await addDoc(collection(db, 'wordbank'), wordData);
      }
      closeModal();
    } catch (error) {
      console.error("Error saving word:", error);
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!window.confirm('آیا از حذف این واژه اطمینان دارید؟')) return;
    try {
      await deleteDoc(doc(db, 'wordbank', id));
    } catch (error) {
      console.error("Error deleting word:", error);
    }
  };

  const askAI = async () => {
    if (!word.trim()) return;
    setAiLoading(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Gemini API key is missing");
        setAiLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `معنی و یک مثال برای واژه "${word}" به زبان فارسی (دری) ارائه بده. خروجی را فقط به صورت JSON با فیلدهای definition و example برگردان.` }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      if (data.definition) setDefinition(data.definition);
      if (data.example) setExample(data.example);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const openModal = (item?: WordBankItem) => {
    if (item) {
      setEditingWord(item);
      setWord(item.word);
      setDefinition(item.definition);
      setExample(item.example);
      setCategory(item.category);
    } else {
      setEditingWord(null);
      setWord('');
      setDefinition('');
      setExample('');
      setCategory(CATEGORIES[0]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWord(null);
    setWord('');
    setDefinition('');
    setExample('');
    setCategory(CATEGORIES[0]);
  };

  const filteredWords = words.filter(item => 
    item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="text-xs font-bold text-gray-400">بانک لغات</div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">بانک لغات</h1>
          <p className="text-gray-500 text-sm">گنجینه واژگان و اصطلاحات خراسان</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Search */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md py-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="جستجو در واژگان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-4 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredWords.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-blue-600">{item.word}</h3>
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-gray-900 font-bold leading-relaxed">{item.definition}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteWord(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {item.example && (
                  <div className="bg-gray-50 rounded-2xl p-4 border-r-4 border-blue-500 italic text-sm text-gray-600 leading-relaxed">
                    "{item.example}"
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Volume2 size={20} />
                  </button>
                  <span className="text-[10px] text-gray-300">
                    {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Word Modal */}
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
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900">
                  {editingWord ? 'ویرایش واژه' : 'افزودن واژه جدید'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveWord} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-2">واژه</label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="text"
                      value={word}
                      onChange={(e) => setWord(e.target.value)}
                      placeholder="واژه را وارد کنید..."
                      className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={askAI}
                      disabled={aiLoading || !word.trim()}
                      className={cn(
                        "px-6 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all",
                        aiLoading || !word.trim()
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-100 hover:scale-105"
                      )}
                    >
                      {aiLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                        />
                      ) : (
                        <Sparkles size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-2">معنی و تعریف</label>
                  <textarea
                    required
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    placeholder="تعریف واژه..."
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 min-h-[100px] focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-2">مثال (اختیاری)</label>
                  <textarea
                    value={example}
                    onChange={(e) => setExample(e.target.value)}
                    placeholder="مثالی برای کاربرد واژه..."
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 min-h-[80px] focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-2">دسته‌بندی</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                          category === cat 
                            ? "bg-blue-600 text-white shadow-md" 
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                  >
                    {editingWord ? 'بروزرسانی واژه' : 'ذخیره واژه'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!loading && filteredWords.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Book size={40} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-bold">واژه‌ای یافت نشد.</p>
        </div>
      )}
    </div>
  );
};

export default WordBank;
