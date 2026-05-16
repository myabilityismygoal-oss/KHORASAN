import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, getDocs, orderBy, where, limit, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Course, Notification as AppNotification } from './types';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import ProfilePage from './components/Profile';
import BusinessDetail from './components/BusinessDetail';
import Messaging from './components/Messaging';
import TokenSystem from './components/TokenSystem';
import Search from './components/Search';
import Home from './components/Home';
import Settings from './components/Settings';
import Shop from './components/Shop';
import ProductDetail from './components/ProductDetail';
import Education from './components/Education';
import Library from './components/Library';
import Social from './components/Social';
import EducationProfile from './components/EducationProfile';
import BusinessRegistration from './components/BusinessRegistration';
import Art from './components/Art';
import TransactionHistory from './components/TransactionHistory';
import BottomNav from './components/BottomNav';
import APKDashboard from './components/APKDashboard';
import Culture from './components/Culture';
import Riddles from './components/Riddles';
import QA from './components/QA';
import Notes from './components/Notes';
import WordBank from './components/WordBank';
import Explore from './components/Explore';
import Reminders from './components/Reminders';
import Checkout from './components/Checkout';
import { motion, AnimatePresence } from 'motion/react';

import { CartProvider } from './contexts/CartContext';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Course));
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      // Clean up previous profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Use onSnapshot for real-time profile updates
        unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            // Auto-elevate special UIDs for admin panel access
            if (firebaseUser.uid === 'tfw1pd6SzlP1DK91BwXfj8AUvsA3' && data.role !== 'admin') {
              try {
                await updateDoc(userRef, { role: 'admin' });
              } catch (e) {
                console.error("Failed to auto-elevate user to admin:", e);
              }
            }
            setProfile(data);
          } else {
            // Create profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              tokenBalance: 100, // Initial tokens
              role: 'user',
              createdAt: new Date().toISOString(),
              preferences: {
                notifications: {
                  newFeatures: { inApp: true, push: true },
                  transactions: { inApp: true, push: true },
                  messages: { inApp: true, push: true },
                  offers: { inApp: true, push: true },
                  alerts: { inApp: true, push: true },
                  priceChanges: { inApp: true, push: true },
                  stockUpdates: { inApp: true, push: true },
                }
              }
            };
            await setDoc(userRef, newProfile);
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // Push Notification Listener
  useEffect(() => {
    if (!user || !profile?.preferences) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = change.doc.data() as AppNotification;
          
          // Check browser permission
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const prefs = profile.preferences?.notifications;
            if (!prefs) return;

            let shouldShow = false;
            if (notification.category === 'message' && prefs.messages.push) shouldShow = true;
            else if (notification.category === 'transaction' && prefs.transactions.push) shouldShow = true;
            else if (notification.category === 'feature' && prefs.newFeatures.push) shouldShow = true;
            else if (notification.category === 'offer' && prefs.offers.push) shouldShow = true;
            else if (notification.category === 'alert' && prefs.alerts.push) shouldShow = true;
            else if (notification.category === 'system' && prefs.alerts.push) shouldShow = true;
            else if (notification.category === 'price' && prefs.priceChanges.push) shouldShow = true;
            else if (notification.category === 'stock' && prefs.stockUpdates.push) shouldShow = true;

            if (shouldShow) {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
              });
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user?.uid, profile?.preferences]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <Router>
      <CartProvider>
        <div className="min-h-screen text-gray-900 font-sans" dir="rtl">
        <Navbar user={user} profile={profile} />
        <main className="container mx-auto px-4 py-6 md:py-8 max-w-6xl pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Social user={user} profile={profile} />} />
              <Route path="/search" element={<Search />} />
              <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
              <Route path="/profile" element={user ? <ProfilePage user={user} profile={profile} courses={courses} /> : <Navigate to="/auth" />} />
              <Route path="/business/:id" element={<BusinessDetail />} />
              <Route path="/messages" element={user ? <Messaging user={user} /> : <Navigate to="/auth" />} />
              <Route path="/messages/:receiverId" element={user ? <Messaging user={user} /> : <Navigate to="/auth" />} />
              <Route path="/wallet" element={user ? <TokenSystem user={user} profile={profile} /> : <Navigate to="/auth" />} />
              <Route path="/settings" element={user ? <Settings user={user} profile={profile} /> : <Navigate to="/auth" />} />
              <Route path="/shop" element={<Shop user={user} profile={profile} />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/education" element={<Education />} />
              <Route path="/education-profile" element={user ? <EducationProfile user={user} profile={profile} courses={courses} /> : <Navigate to="/auth" />} />
              <Route path="/business-registration" element={user ? <BusinessRegistration user={user} profile={profile} /> : <Navigate to="/auth" />} />
              <Route path="/art" element={<Art />} />
              <Route path="/transactions" element={user ? <TransactionHistory /> : <Navigate to="/auth" />} />
              <Route path="/library" element={<Library />} />
              <Route path="/social" element={<Social user={user} />} />
              <Route path="/apks" element={user ? <APKDashboard user={user} profile={profile} /> : <Navigate to="/auth" />} />
              <Route path="/culture" element={<Culture />} />
              <Route path="/riddles" element={<Riddles />} />
              <Route path="/qa" element={<QA />} />
              <Route path="/notes" element={user ? <Notes /> : <Navigate to="/auth" />} />
              <Route path="/wordbank" element={<WordBank />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/reminders" element={user ? <Reminders /> : <Navigate to="/auth" />} />
              <Route path="/checkout" element={user ? <Checkout /> : <Navigate to="/auth" />} />
            </Routes>
          </AnimatePresence>
        </main>
        <BottomNav />
        </div>
      </CartProvider>
    </Router>
  );
};

export default App;
