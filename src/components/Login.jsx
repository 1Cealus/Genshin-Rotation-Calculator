import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from '../firebase';

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

    const handleGoogleSignIn = () => {
        const provider = new GoogleAuthProvider();
        handleAuthAction(() => signInWithPopup(auth, provider));
    };
    
    const handleEmailSignUp = () => handleAuthAction(() => createUserWithEmailAndPassword(auth, email, password));
    const handleEmailLogin = () => handleAuthAction(() => signInWithEmailAndPassword(auth, email, password));
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="w-full max-w-4xl bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl border border-[var(--color-border-primary)] flex overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Left Side - Image */}
                <div className="hidden md:block w-1/2 bg-cover bg-center" style={{backgroundImage: "url('https://rerollcdn.com/GENSHIN/UI/wish-splash-art-2.png')"}}>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 p-8 space-y-6 flex flex-col justify-center">
                    <div>
                        <h1 className="text-3xl font-bold text-center text-white">Welcome</h1>
                        <p className="text-center text-sm text-[var(--color-text-secondary)] mt-2">
                            Sign in to save and sync your builds.
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
                        <div className="flex items-center gap-2">
                            <hr className="w-full border-t border-[var(--color-border-primary)]" />
                            <span className="text-xs text-[var(--color-text-secondary)]">OR</span>
                            <hr className="w-full border-t border-[var(--color-border-primary)]" />
                        </div>
                        <button onClick={handleGoogleSignIn} disabled={loading} className="btn btn-secondary w-full flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,36.128,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                            Sign in with Google
                        </button>
                    </div>
                    <button onClick={onClose} className="w-full text-center text-xs text-[var(--color-text-secondary)] hover:text-white pt-2">
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};
