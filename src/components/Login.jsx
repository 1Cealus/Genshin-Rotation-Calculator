// src/components/Login.jsx
import React, { useState } from 'react';
// UPDATED: All firebase imports now come from the central firebase.js file
import { 
    auth,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInAnonymously 
} from '../firebase';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (action) => {
        setLoading(true);
        setError('');
        try {
            await action();
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = () => handleAuthAction(() => createUserWithEmailAndPassword(auth, email, password));
    const handleLogin = () => handleAuthAction(() => signInWithEmailAndPassword(auth, email, password));
    const handleAnonymous = () => handleAuthAction(() => signInAnonymously(auth));
    
    return (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
            <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 rounded-xl shadow-lg border-2 border-cyan-500">
                <h1 className="text-3xl font-bold text-center text-cyan-400">Genshin Calculator</h1>
                <p className="text-center text-gray-300">
                    Sign in to save your builds, or continue anonymously.
                </p>
                
                {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm text-center">{error}</p>}

                <div className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        disabled={loading}
                    />
                </div>
                
                <div className="space-y-3">
                    <div className="flex gap-3">
                         <button onClick={handleLogin} disabled={loading || !email || !password} className="flex-1 w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold transition disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>
                        <button onClick={handleSignUp} disabled={loading || !email || !password} className="flex-1 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </button>
                    </div>
                     <button onClick={handleAnonymous} disabled={loading} className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold transition disabled:bg-gray-500">
                        {loading ? 'Please wait...' : 'Continue Anonymously'}
                    </button>
                </div>
            </div>
        </div>
    );
};
