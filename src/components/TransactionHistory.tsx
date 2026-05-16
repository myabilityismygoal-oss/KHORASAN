import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, getDocs, orderBy, where, onSnapshot } from 'firebase/firestore';
import { Transaction } from '../types';
import { motion } from 'motion/react';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { cn } from '../lib/utils';

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'reward' | 'transfer'>('all');

  useEffect(() => {
    if (!auth.currentUser) return;
    setLoading(true);

    let q = query(
      collection(db, 'transactions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    if (filter !== 'all') {
      q = query(q, where('type', '==', filter));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Transaction));
      
      if (data.length === 0) {
        // Mock data for demo
        setTransactions([
          {
            id: 't1',
            userId: auth.currentUser!.uid,
            amount: 500,
            type: 'purchase',
            status: 'completed',
            description: 'خرید دوره آموزشی React',
            createdAt: { toDate: () => new Date() }
          },
          {
            id: 't2',
            userId: auth.currentUser!.uid,
            amount: 100,
            type: 'reward',
            status: 'completed',
            description: 'پاداش تکمیل پروفایل',
            createdAt: { toDate: () => new Date(Date.now() - 86400000) }
          },
          {
            id: 't3',
            userId: auth.currentUser!.uid,
            amount: 250,
            type: 'transfer',
            status: 'pending',
            description: 'انتقال به کیف پول',
            createdAt: { toDate: () => new Date(Date.now() - 172800000) }
          }
        ]);
      } else {
        setTransactions(data);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter, auth.currentUser?.uid]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="text-green-500" size={16} />;
      case 'pending': return <Clock className="text-yellow-500" size={16} />;
      case 'failed': return <XCircle className="text-red-500" size={16} />;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <ArrowUpRight className="text-red-500" size={20} />;
      case 'reward': return <ArrowDownLeft className="text-green-500" size={20} />;
      case 'transfer': return <CreditCard className="text-blue-500" size={20} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-md py-4 px-4 -mx-4 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">تاریخچه تراکنش‌ها</h1>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-transparent text-sm font-bold text-gray-900 outline-none cursor-pointer"
          >
            <option value="all">همه</option>
            <option value="purchase">خریدها</option>
            <option value="reward">پاداش‌ها</option>
            <option value="transfer">انتقالات</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-2xl" />
          ))
        ) : transactions.length > 0 ? (
          transactions.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-blue-500 transition-all"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                {getTypeIcon(t.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm truncate">{t.description}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400">{t.createdAt?.toDate().toLocaleDateString('fa-IR')}</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(t.status)}
                    <span className={cn(
                      "text-[10px] font-bold",
                      t.status === 'completed' ? "text-green-600" : t.status === 'pending' ? "text-yellow-600" : "text-red-600"
                    )}>
                      {t.status === 'completed' ? 'موفق' : t.status === 'pending' ? 'در انتظار' : 'ناموفق'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-black text-sm",
                  t.type === 'reward' ? "text-green-600" : "text-red-600"
                )}>
                  {t.type === 'reward' ? '+' : '-'}{t.amount}
                </p>
                <p className="text-[10px] font-bold text-gray-400 italic">Eshqari</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center text-gray-400">
            <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">تراکنشی یافت نشد.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
