import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, onSnapshot, orderBy, limit, runTransaction } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Send, History, Loader2 } from 'lucide-react';
import { UserProfile, Transaction } from '../types';
import { cn } from '../lib/utils';
import { sendNotification } from '../services/notificationService';

interface Props {
  user: User;
  profile: UserProfile | null;
}

const TokenSystem: React.FC<Props> = ({ user, profile }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const qFrom = query(
      collection(db, 'transactions'),
      where('fromId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const qTo = query(
      collection(db, 'transactions'),
      where('toId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    let fromTransactions: Transaction[] = [];
    let toTransactions: Transaction[] = [];

    const updateTransactions = () => {
      const combined = [...fromTransactions, ...toTransactions]
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i) // Unique
        .sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          return timeB - timeA;
        })
        .slice(0, 10);
      setTransactions(combined);
    };

    const unsubscribeFrom = onSnapshot(qFrom, (snapshot) => {
      fromTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      updateTransactions();
    });

    const unsubscribeTo = onSnapshot(qTo, (snapshot) => {
      toTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      updateTransactions();
    });

    return () => {
      unsubscribeFrom();
      unsubscribeTo();
    };
  }, [user.uid]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError('مبلغ نامعتبر است.');
      setLoading(false);
      return;
    }

    if (profile && profile.tokenBalance < transferAmount) {
      setError('موجودی کافی نیست.');
      setLoading(false);
      return;
    }

    try {
      // Find recipient by email
      const q = query(collection(db, 'users'), where('email', '==', recipientEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('کاربری با این ایمیل یافت نشد.');
        setLoading(false);
        return;
      }

      const recipientDoc = querySnapshot.docs[0];
      const recipientId = recipientDoc.id;
      const recipientData = recipientDoc.data() as UserProfile;

      if (recipientId === user.uid) {
        setError('نمی‌توانید به خودتان توکن بفرستید.');
        setLoading(false);
        return;
      }

      // Atomic transaction
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', user.uid);
        const recipientRef = doc(db, 'users', recipientId);
        
        const senderSnap = await transaction.get(senderRef);
        const recipientSnap = await transaction.get(recipientRef);

        if (!senderSnap.exists() || !recipientSnap.exists()) {
          throw new Error("User profile not found");
        }

        const newSenderBalance = senderSnap.data().tokenBalance - transferAmount;
        const newRecipientBalance = recipientSnap.data().tokenBalance + transferAmount;

        transaction.update(senderRef, { tokenBalance: newSenderBalance });
        transaction.update(recipientRef, { tokenBalance: newRecipientBalance });

        const transactionRecord = {
          fromId: user.uid,
          toId: recipientId,
          amount: transferAmount,
          type: 'transfer',
          createdAt: new Date().toISOString(),
          status: 'completed'
        };
        
        const transRef = doc(collection(db, 'transactions'));
        transaction.set(transRef, transactionRecord);
      });

      // Send notifications based on preferences
      if (recipientData.preferences?.notifications?.transactions?.inApp !== false) {
        await sendNotification(
          recipientId,
          'دریافت توکن',
          `شما ${transferAmount} توکن عشقری از ${profile?.displayName || user.email} دریافت کردید.`,
          'success',
          'transaction',
          '/wallet'
        );
      }

      if (profile?.preferences?.notifications?.transactions?.inApp !== false) {
        await sendNotification(
          user.uid,
          'انتقال توکن',
          `شما ${transferAmount} توکن عشقری به ${recipientData.displayName || recipientData.email} ارسال کردید.`,
          'info',
          'transaction',
          '/wallet'
        );
      }

      setSuccess('انتقال با موفقیت انجام شد.');
      setRecipientEmail('');
      setAmount('');
    } catch (err: any) {
      setError('خطا در انجام تراکنش: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Wallet Summary */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-blue-600 p-6 rounded-xl text-white shadow-sm">
          <div className="flex items-center gap-2 mb-4 opacity-80">
            <Wallet size={20} />
            <span className="text-sm font-medium">موجودی کیف پول</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-bold font-mono">{profile?.tokenBalance || 0}</h2>
            <span className="text-sm opacity-80">توکن عشقری</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2">
            <Send size={18} className="text-blue-600" />
            انتقال توکن
          </h3>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">ایمیل گیرنده</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                placeholder="example@mail.com"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">مبلغ</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-mono"
                placeholder="0.00"
                required
              />
            </div>
            {error && <p className="text-red-500 text-[10px]">{error}</p>}
            {success && <p className="text-green-500 text-[10px]">{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'ارسال توکن'}
            </button>
          </form>
        </div>
      </div>

      {/* Transaction History */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-2">
            <History size={18} className="text-blue-600" />
            تاریخچه تراکنش‌ها
          </h3>
          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      t.fromId === user.uid ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                    )}>
                      {t.fromId === user.uid ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {t.fromId === user.uid ? 'ارسال توکن' : 'دریافت توکن'}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(t.createdAt).toLocaleString('fa-IR')}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-mono font-bold text-base",
                    t.fromId === user.uid ? "text-red-600" : "text-green-600"
                  )}>
                    {t.fromId === user.uid ? '-' : '+'}{t.amount}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm">
                <p>تراکنشی یافت نشد.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenSystem;
