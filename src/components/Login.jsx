import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../firebase';

export const LoginModal = ({ onClose, onUidLogin, isLoggingIn }) => {
    const [activeTab, setActiveTab] = useState('uid'); // 'uid' or 'email'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [uid, setUid] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (action) => {
        setLoading(true);
        setError('');
        try {
            await action();
            onClose();
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSignUp = () => handleAuthAction(() => createUserWithEmailAndPassword(auth, email, password));
    const handleEmailLogin = () => handleAuthAction(() => signInWithEmailAndPassword(auth, email, password));
    const handleUidQuickLogin = () => {
        if (!uid || !/^\d{9}$/.test(uid)) {
            setError('Please enter a valid 9-digit Genshin Impact UID.');
            return;
        }
        setError('');
        onUidLogin(uid); // This will be handled by App.jsx
    };
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="w-full max-w-sm bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl border border-[var(--color-border-primary)] p-8 space-y-6" onClick={(e) => e.stopPropagation()}>
                <div>
                    <div className="flex border-b border-slate-700 mb-4">
                        <button onClick={() => setActiveTab('uid')} className={`flex-1 py-2 text-sm font-bold ${activeTab === 'uid' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}>Quick Login</button>
                        <button onClick={() => setActiveTab('email')} className={`flex-1 py-2 text-sm font-bold ${activeTab === 'email' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}>Account</button>
                    </div>
                </div>
            
                {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm text-center">{error}</p>}

                {activeTab === 'uid' && (
                    <div className="space-y-4">
                        <p className="text-xs text-center text-slate-400">Enter your UID to quickly join leaderboards and use the calculator with your builds.</p>
                        <input type="text" placeholder="Enter 9-digit UID..." value={uid} onChange={(e) => setUid(e.target.value)} disabled={isLoggingIn} />
                        <button onClick={handleUidQuickLogin} disabled={isLoggingIn || !uid} className="btn btn-primary w-full disabled:opacity-50">
                            {isLoggingIn ? 'Syncing...' : 'Login & Sync Profile'}
                        </button>
                    </div>
                )}

                {activeTab === 'email' && (
                     <div className="space-y-4">
                        <p className="text-xs text-center text-slate-400">Create or log in to an account to save presets and link your UID permanently. (Required for Admins)</p>
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                        <div className="flex gap-3">
                            <button onClick={handleEmailLogin} disabled={loading || !email || !password} className="btn btn-primary w-full disabled:opacity-50">Log In</button>
                            <button onClick={handleEmailSignUp} disabled={loading || !email || !password} className="btn btn-secondary w-full disabled:opacity-50">Sign Up</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};