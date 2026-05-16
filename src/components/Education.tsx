import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { Riddle, WordBankItem, Course } from '../types';
import { GraduationCap, HelpCircle, Book, Sparkles, Search, ChevronLeft, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

const Education: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ai' | 'riddles' | 'wordbank' | 'courses'>('ai');
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [wordBank, setWordBank] = useState<WordBankItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<'general' | 'article'>('general');

  useEffect(() => {
    setLoading(true);
    let unsubscribe: () => void;

    if (activeTab === 'riddles') {
      const q = query(collection(db, 'riddles'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Riddle));
        setRiddles(data);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching riddles:', error);
        setLoading(false);
      });
    } else if (activeTab === 'wordbank') {
      const q = query(collection(db, 'wordbank'), orderBy('word', 'asc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as WordBankItem));
        setWordBank(data);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching word bank:', error);
        setLoading(false);
      });
    } else if (activeTab === 'courses') {
      const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Course));
        setCourses(data);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching courses:', error);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => unsubscribe && unsubscribe();
  }, [activeTab]);

  const handleAiSearch = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setAiResponse('لطفاً کلید API را در تنظیمات وارد کنید.');
        setAiLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = aiMode === 'article' 
        ? `به عنوان یک دستیار مقاله‌نویسی، یک مقاله کامل و ساختاریافته درباره موضوع زیر بنویس. موضوع: ${aiInput}. مقاله باید شامل مقدمه، بدنه و نتیجه‌گیری باشد.`
        : `You are an educational assistant for the Khorasan platform. Help the user learn about: ${aiInput}. Provide clear, educational information in Persian (Dari/Farsi).`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
      });
      setAiResponse(response.text || 'متاسفانه پاسخی یافت نشد.');
    } catch (error) {
      console.error('AI Error:', error);
      setAiResponse('خطایی در برقراری ارتباط با هوش مصنوعی رخ داد.');
    } finally {
      setAiLoading(false);
    }
  };

  const tabs = [
    { id: 'ai', name: 'هوش مصنوعی', icon: <Sparkles size={20} /> },
    { id: 'riddles', name: 'معماها', icon: <HelpCircle size={20} /> },
    { id: 'wordbank', name: 'لغات', icon: <Book size={20} /> },
    { id: 'courses', name: 'کورس‌ها', icon: <GraduationCap size={20} /> },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Back Button */}
      <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-md py-2 px-4 -mx-4 border-b border-gray-100 flex items-center justify-between">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all font-bold text-sm group"
        >
          <div className="p-1.5 bg-gray-100 rounded-full group-hover:bg-blue-50 transition-colors">
            <ChevronLeft size={18} className="rotate-180" />
          </div>
          بازگشت
        </button>
        <div className="text-xs font-bold text-gray-400">آموزش و یادگیری</div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold text-gray-900">آموزش</h1>
        <button className="p-1 hover:bg-gray-100 rounded-full transition-all">
          <Search size={22} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-around border-b border-gray-100 -mx-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center gap-1 py-3 px-4 transition-all border-b-2",
              activeTab === tab.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
            )}
          >
            {tab.icon}
            <span className="text-[10px] font-bold">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-6"
        >
          {activeTab === 'ai' && (
            <div className="space-y-6 pt-4">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-gray-900">دستیار هوشمند</h2>
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => setAiMode('general')}
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold transition-all",
                          aiMode === 'general' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                        )}
                      >
                        آموزش عمومی
                      </button>
                      <button 
                        onClick={() => setAiMode('article')}
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold transition-all",
                          aiMode === 'article' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                        )}
                      >
                        مقاله‌نویسی
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder={aiMode === 'article' ? "موضوع مقاله خود را بنویسید..." : "سوال خود را اینجا بنویسید..."}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all min-h-[100px] text-sm resize-none"
                  />
                  <button
                    onClick={handleAiSearch}
                    disabled={aiLoading || !aiInput.trim()}
                    className="absolute bottom-3 left-3 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>

                {aiResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white rounded-xl border border-blue-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap shadow-sm"
                  >
                    {aiResponse}
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'riddles' && (
            <div className="space-y-4 pt-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-50 animate-pulse rounded-xl" />
                ))
              ) : riddles.map((riddle) => (
                <div key={riddle.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">معما</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      riddle.isAnswered ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    )}>
                      {riddle.isAnswered ? 'پاسخ داده شده' : 'بی‌پاسخ'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 leading-relaxed">{riddle.question}</p>
                  {riddle.answer && (
                    <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700 border-r-2 border-green-500">
                      <span className="font-bold text-green-600">پاسخ: </span> {riddle.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'wordbank' && (
            <div className="grid grid-cols-1 gap-4 pt-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-xl" />
                ))
              ) : wordBank.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-black text-blue-600 mb-1">{item.word}</h3>
                  <p className="text-sm text-gray-900 mb-2">{item.definition}</p>
                  <p className="text-[10px] text-gray-400 italic">مثال: {item.example}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="grid grid-cols-1 gap-6 pt-4">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-64 bg-gray-50 animate-pulse rounded-xl" />
                ))
              ) : courses.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm group">
                  <div className="aspect-video bg-gray-100 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                      <GraduationCap size={64} />
                    </div>
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-white text-[10px] font-bold">
                      {course.price} عشقری
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{course.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{course.description}</p>
                    <button className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                      مشاهده کورس
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Education;
