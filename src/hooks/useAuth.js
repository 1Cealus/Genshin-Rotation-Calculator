import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, signInAnonymously } from '../firebase';

const ADMIN_UID = "RHK4HK166oe3kiCz3iEnybYcest1";

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isUserLoading, setIsUserLoading] = useState(true);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setIsAdmin(currentUser.uid === ADMIN_UID && !currentUser.isAnonymous);
                setIsUserLoading(false);
            } else {
                signInAnonymously(auth).catch(error => {
                    console.error("Anonymous sign-in failed", error);
                    setIsUserLoading(false);
                });
            }
        });
        return () => unsubAuth();
    }, []);

    const handleSignOut = () => {
        signOut(auth);
    };

    return { user, isAdmin, isUserLoading, handleSignOut };
};