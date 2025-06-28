import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../firebase';

export const LoginModal = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
    
    // UPDATED: Kept only the email/password handlers
    const handleEmailSignUp = () => handleAuthAction(() => createUserWithEmailAndPassword(auth, email, password));
    const handleEmailLogin = () => handleAuthAction(() => signInWithEmailAndPassword(auth, email, password));
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="w-full max-w-sm bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl border border-[var(--color-border-primary)] p-8 space-y-6" onClick={(e) => e.stopPropagation()}>
                <div>
                    <h1 className="text-3xl font-bold text-center text-white">Account</h1>
                    <p className="text-center text-sm text-[var(--color-text-secondary)] mt-2">
                        Create an account to save and sync your data.
                    </p>
                </div>
            
                {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm text-center">{error}</p>}

                <div className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                </div>
            
                <div className="space-y-3">
                    <div className="flex gap-3">
                        <button onClick={handleEmailLogin} disabled={loading || !email || !password} className="btn btn-primary w-full disabled:opacity-50">Log In</button>
                        <button onClick={handleEmailSignUp} disabled={loading || !email || !password} className="btn btn-secondary w-full disabled:opacity-50">Sign Up</button>
                    </div>
                </div>

                <button onClick={onClose} className="w-full text-center text-xs text-[var(--color-text-secondary)] hover:text-white pt-2">
                    Continue as Guest
                </button>
            </div>
        </div>
    );
};