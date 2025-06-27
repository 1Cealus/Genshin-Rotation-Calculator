import React from 'react';

export const Header = ({ user, isAdmin, setPage, onLoginClick, onSignOut }) => {
    return (
        <header className="bg-[var(--color-bg-secondary)]/80 backdrop-blur-lg sticky top-0 z-40 border-b border-[var(--color-border-primary)] shadow-md">
            <nav className="container mx-auto px-4 lg:px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold text-white cursor-pointer" onClick={() => setPage('home')}>
                        GenshinCalc
                    </h1>
                    <div className="hidden md:flex items-center gap-1">
                        <button onClick={() => setPage('home')} className="text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] px-3 py-2 rounded-md transition-colors">Home</button>
                        <button onClick={() => setPage('calculator')} className="text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] px-3 py-2 rounded-md transition-colors">Calculator</button>
                         {isAdmin && <button onClick={() => setPage('admin')} className="text-sm font-medium text-[var(--color-accent-primary)] hover:bg-[var(--color-bg-primary)] px-3 py-2 rounded-md transition-colors">Admin</button>}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {user ? (
                        user.isAnonymous ? (
                            <button onClick={onLoginClick} className="btn btn-primary">Login / Sign Up</button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-white hidden sm:block">{user.email}</span>
                                <button onClick={onSignOut} className="btn btn-secondary">Sign Out</button>
                            </div>
                        )
                    ) : (
                        // A loading skeleton for when user state is being determined
                        <div className="h-10 w-24 bg-[var(--color-border-primary)] animate-pulse rounded-md"></div>
                    )}
                </div>
            </nav>
        </header>
    );
};