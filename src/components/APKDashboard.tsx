import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDocs, limit } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { APKFile, APKVersion, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, File, History, Trash2, Download, Plus, Package, Info, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface APKDashboardProps {
  user: any;
  profile: UserProfile | null;
}

const APKDashboard: React.FC<APKDashboardProps> = ({ user, profile }) => {
  const [apks, setApks] = useState<APKFile[]>([]);
  const [selectedApk, setSelectedApk] = useState<APKFile | null>(null);
  const [versions, setVersions] = useState<APKVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);

  // Form states
  const [apkName, setApkName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [description, setDescription] = useState('');
  const [versionName, setVersionName] = useState('');
  const [versionCode, setVersionCode] = useState(1);
  const [changelog, setChangelog] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'apks'),
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as APKFile));
      setApks(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!selectedApk) {
      setVersions([]);
      return;
    }

    const q = query(
      collection(db, 'apk_versions'),
      where('apkFileId', '==', selectedApk.id),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as APKVersion));
      setVersions(data);
    });

    return () => unsubscribe();
  }, [selectedApk]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileId = Math.random().toString(36).substring(7);
      const storageRef = ref(storage, `apks/${user.uid}/${fileId}.apk`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload failed:", error);
          setUploading(false);
          alert("آپلود با خطا مواجه شد. لطفا دوباره تلاش کنید.");
        }, 
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const now = new Date().toISOString();

          if (showUploadModal) {
            // New APK
            const apkRef = await addDoc(collection(db, 'apks'), {
              ownerId: user.uid,
              name: apkName,
              packageName: packageName,
              description: description,
              createdAt: now,
              updatedAt: now,
              currentVersionId: ''
            });

            const versionRef = await addDoc(collection(db, 'apk_versions'), {
              apkFileId: apkRef.id,
              versionCode: versionCode,
              versionName: versionName,
              downloadUrl: downloadUrl,
              size: file.size,
              changelog: changelog,
              uploadedAt: now
            });

            await updateDoc(doc(db, 'apks', apkRef.id), {
              currentVersionId: versionRef.id
            });

            setShowUploadModal(false);
          } else if (showVersionModal && selectedApk) {
            // New Version
            const versionRef = await addDoc(collection(db, 'apk_versions'), {
              apkFileId: selectedApk.id,
              versionCode: versionCode,
              versionName: versionName,
              downloadUrl: downloadUrl,
              size: file.size,
              changelog: changelog,
              uploadedAt: now
            });

            await updateDoc(doc(db, 'apks', selectedApk.id), {
              currentVersionId: versionRef.id,
              updatedAt: now
            });

            setShowVersionModal(false);
          }

          setUploading(false);
          resetForm();
        }
      );
    } catch (error) {
      console.error("Error saving APK metadata:", error);
      setUploading(false);
    }
  };

  const resetForm = () => {
    setApkName('');
    setPackageName('');
    setDescription('');
    setVersionName('');
    setVersionCode(1);
    setChangelog('');
    setFile(null);
  };

  const handleDeleteApk = async (apk: APKFile) => {
    if (!window.confirm(`آیا از حذف ${apk.name} اطمینان دارید؟ تمام نسخه‌ها حذف خواهند شد.`)) return;

    try {
      // Delete all versions
      const q = query(collection(db, 'apk_versions'), where('apkFileId', '==', apk.id));
      const versionsSnap = await getDocs(q);
      
      for (const vDoc of versionsSnap.docs) {
        await deleteDoc(doc(db, 'apk_versions', vDoc.id));
      }

      await deleteDoc(doc(db, 'apks', apk.id));
      if (selectedApk?.id === apk.id) setSelectedApk(null);
    } catch (error) {
      console.error("Error deleting APK:", error);
    }
  };

  const handleDeleteVersion = async (version: APKVersion) => {
    if (!window.confirm(`آیا از حذف نسخه ${version.versionName} اطمینان دارید؟`)) return;

    try {
      await deleteDoc(doc(db, 'apk_versions', version.id));
      
      // If this was the current version, update the APK record to the next latest
      if (selectedApk?.currentVersionId === version.id) {
        const q = query(
          collection(db, 'apk_versions'),
          where('apkFileId', '==', selectedApk.id),
          orderBy('uploadedAt', 'desc'),
          limit(1)
        );
        const latestSnap = await getDocs(q);
        if (!latestSnap.empty) {
          await updateDoc(doc(db, 'apks', selectedApk.id), {
            currentVersionId: latestSnap.docs[0].id
          });
        }
      }
    } catch (error) {
      console.error("Error deleting version:", error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Back Button */}
      <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-md py-2 px-4 -mx-4 border-b border-gray-100 flex items-center justify-between">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all font-bold text-sm group"
        >
          <div className="p-1.5 bg-gray-100 rounded-full group-hover:bg-blue-50 transition-colors">
            <Package size={18} className="rotate-180" />
          </div>
          بازگشت
        </button>
        <div className="text-xs font-bold text-gray-400">مدیریت APK</div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مدیریت APK</h1>
          <p className="text-gray-500 mt-1">فایل‌های اندرویدی خود را آپلود و مدیریت کنید</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          آپلود برنامه جدید
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* APK List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-blue-500" size={24} />
            برنامه‌های من
          </h2>
          {apks.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">هنوز برنامه‌ای آپلود نکرده‌اید</p>
            </div>
          ) : (
            apks.map((apk) => (
              <motion.div
                key={apk.id}
                layoutId={apk.id}
                onClick={() => setSelectedApk(apk)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all cursor-pointer group",
                  selectedApk?.id === apk.id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                      <File className={selectedApk?.id === apk.id ? "text-blue-500" : "text-gray-400"} size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{apk.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{apk.packageName}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteApk(apk);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Details & Version History */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedApk ? (
              <motion.div
                key={selectedApk.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden"
              >
                <div className="p-8 border-b border-gray-50 bg-gradient-to-br from-white to-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <File className="text-white" size={32} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedApk.name}</h2>
                        <p className="text-gray-500 font-mono text-sm">{selectedApk.packageName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowVersionModal(true)}
                      className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-all"
                    >
                      <Plus size={18} />
                      نسخه جدید
                    </button>
                  </div>
                  <p className="mt-6 text-gray-600 leading-relaxed">
                    {selectedApk.description || 'توضیحاتی ثبت نشده است.'}
                  </p>
                </div>

                <div className="p-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <History className="text-blue-500" size={20} />
                    تاریخچه نسخه‌ها
                  </h3>
                  <div className="space-y-4">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            selectedApk.currentVersionId === version.id ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"
                          )}>
                            {selectedApk.currentVersionId === version.id ? <CheckCircle size={20} /> : <Info size={20} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">نسخه {version.versionName}</span>
                              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">کد: {version.versionCode}</span>
                              {selectedApk.currentVersionId === version.id && (
                                <span className="text-[10px] px-2 py-0.5 bg-green-500 text-white rounded-full font-bold">فعال</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>{formatSize(version.size)}</span>
                              <span>•</span>
                              <span>{new Date(version.uploadedAt).toLocaleDateString('fa-IR')}</span>
                            </div>
                            {version.changelog && (
                              <p className="text-xs text-gray-400 mt-2 italic">تغییرات: {version.changelog}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={version.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                            title="دانلود"
                          >
                            <Download size={20} />
                          </a>
                          <button
                            onClick={() => handleDeleteVersion(version)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="حذف این نسخه"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
                <Package size={64} className="mb-4 opacity-20" />
                <p>برای مشاهده جزئیات و تاریخچه، یک برنامه را انتخاب کنید</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Upload Modal */}
      {(showUploadModal || showVersionModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {showUploadModal ? 'آپلود برنامه جدید' : `آپلود نسخه جدید برای ${selectedApk?.name}`}
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setShowVersionModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="p-6 space-y-4">
              {showUploadModal && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">نام برنامه</label>
                      <input
                        type="text"
                        value={apkName}
                        onChange={(e) => setApkName(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="مثلا: اینستاگرام"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">نام پکیج</label>
                      <input
                        type="text"
                        value={packageName}
                        onChange={(e) => setPackageName(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                        placeholder="com.example.app"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">توضیحات</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                      placeholder="توضیحات برنامه..."
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">نام نسخه</label>
                  <input
                    type="text"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="1.0.0"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">کد نسخه</label>
                  <input
                    type="number"
                    value={versionCode}
                    onChange={(e) => setVersionCode(parseInt(e.target.value))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">لیست تغییرات</label>
                <textarea
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all h-20 resize-none"
                  placeholder="چه چیزهایی در این نسخه تغییر کرده؟"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">فایل APK</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept=".apk"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className={cn(
                    "w-full p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all",
                    file ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50 group-hover:border-blue-400 group-hover:bg-blue-50"
                  )}>
                    {file ? (
                      <>
                        <CheckCircle className="text-green-500" size={32} />
                        <span className="text-sm font-bold text-green-700">{file.name}</span>
                        <span className="text-xs text-green-600">{formatSize(file.size)}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="text-gray-400 group-hover:text-blue-500" size={32} />
                        <span className="text-sm font-bold text-gray-700">انتخاب فایل APK</span>
                        <span className="text-xs text-gray-500">حداکثر حجم مجاز: ۱۰۰ مگابایت</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-blue-600">در حال آپلود...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-blue-600"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
              >
                {uploading ? 'در حال آپلود...' : 'شروع آپلود'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default APKDashboard;
