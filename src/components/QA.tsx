import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, MessageCircle, CheckCircle2, Plus, Send, User, Clock, Search, Sparkles, BrainCircuit } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

interface Question {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  isAnswered: boolean;
  answers: Answer[];
  createdAt: string;
}

interface Answer {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  isAI?: boolean;
  createdAt: string;
}

const QA: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      setQuestions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newTitle.trim() || !newContent.trim()) return;

    try {
      await addDoc(collection(db, 'questions'), {
        userId: auth.currentUser.uid,
        title: newTitle,
        content: newContent,
        tags: [],
        isAnswered: false,
        answers: [],
        createdAt: new Date().toISOString(),
      });
      setNewTitle('');
      setNewContent('');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  const handleAddAnswer = async (questionId: string, content: string, isAI = false) => {
    if (!auth.currentUser || !content.trim()) return;

    const questionRef = doc(db, 'questions', questionId);
    const newAnswer = {
      id: Math.random().toString(36).substr(2, 9),
      authorId: isAI ? 'ai-assistant' : auth.currentUser.uid,
      authorName: isAI ? 'هوش مصنوعی خراسان' : (auth.currentUser.displayName || 'کاربر ناشناس'),
      content,
      isAI,
      createdAt: new Date().toISOString(),
    };

    try {
      await updateDoc(questionRef, {
        answers: arrayUnion(newAnswer),
        isAnswered: true
      });
    } catch (error) {
      console.error("Error adding answer:", error);
    }
  };

  const askAI = async (question: Question) => {
    setAiLoading(question.id);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Gemini API key is missing");
        setAiLoading(null);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `به عنوان یک دستیار هوشمند در اپلیکیشن خراسان، به این سوال پاسخ بده. سوال: ${question.title}\nتوضیحات: ${question.content}` }] }],
        config: {
          systemInstruction: "You are a helpful AI assistant for the Khorasan app. Provide accurate, helpful, and culturally relevant answers in Persian (Dari/Farsi).",
        }
      });
      
      const aiResponse = response.text || "متأسفانه در حال حاضر قادر به پاسخگویی نیستم.";
      await handleAddAnswer(question.id, aiResponse, true);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setAiLoading(null);
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
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
        <div className="text-xs font-bold text-gray-400">سوال و جواب</div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">سوال و جواب</h1>
          <p className="text-gray-500 text-sm">پرسش‌های خود را مطرح کنید و از هوش مصنوعی کمک بگیرید</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
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
            placeholder="جستجو در سوالات..."
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
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredQuestions.map((question) => (
              <motion.div
                key={question.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                      {question.title}
                    </h3>
                    {question.isAnswered && (
                      <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full flex items-center gap-1 text-[10px] font-black uppercase">
                        <CheckCircle2 size={12} />
                        پاسخ داده شده
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{question.content}</p>
                  <div className="flex items-center gap-4 text-[10px] text-gray-400">
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      {question.userId.substring(0, 8)}...
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(question.createdAt).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                </div>

                {/* AI Help Button */}
                {!question.answers?.some(a => a.isAI) && (
                  <button
                    onClick={() => askAI(question)}
                    disabled={aiLoading === question.id}
                    className={cn(
                      "w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all",
                      aiLoading === question.id 
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-95"
                    )}
                  >
                    {aiLoading === question.id ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                        />
                        در حال پردازش توسط هوش مصنوعی...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        پاسخ توسط هوش مصنوعی خراسان
                      </>
                    )}
                  </button>
                )}

                {/* Answers Section */}
                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                    <MessageCircle size={18} />
                    پاسخ‌ها ({question.answers?.length || 0})
                  </div>
                  
                  <div className="space-y-4">
                    {question.answers?.map((answer) => (
                      <div 
                        key={answer.id} 
                        className={cn(
                          "rounded-2xl p-5 space-y-2",
                          answer.isAI ? "bg-blue-50 border border-blue-100" : "bg-gray-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {answer.isAI && <BrainCircuit size={16} className="text-blue-600" />}
                            <span className={cn(
                              "text-xs font-black",
                              answer.isAI ? "text-blue-700" : "text-gray-900"
                            )}>
                              {answer.authorName}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {new Date(answer.createdAt).toLocaleTimeString('fa-IR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{answer.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Answer */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = (e.target as any).elements.answer;
                      handleAddAnswer(question.id, input.value);
                      input.value = '';
                    }}
                    className="flex gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100"
                  >
                    <input
                      name="answer"
                      type="text"
                      placeholder="پاسخ خود را بنویسید..."
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-gray-400 shadow-sm"
                    />
                    <motion.button 
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      ارسال
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Question Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                  <HelpCircle size={32} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">طرح سوال جدید</h2>
                <p className="text-gray-500 text-sm">سوال خود را بپرسید تا جامعه و هوش مصنوعی به شما کمک کنند</p>
              </div>

              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-2">عنوان سوال</label>
                  <input
                    required
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثلاً: چطور می‌توانم مقاله نویسی را شروع کنم؟"
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-2">توضیحات بیشتر</label>
                  <textarea
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="جزئیات سوال خود را اینجا بنویسید..."
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 min-h-[120px] focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                  >
                    انتشار سوال
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QA;
