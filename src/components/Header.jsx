import React from 'react';

// The NavButton component is now simplified.
// It uses the `.nav-btn` base class from index.css and then toggles the active/inactive classes.
const NavButton = ({ onClick, pageName, currentPage }) => {
    const isActive = pageName === currentPage;
    
    // Classes for active and inactive states are now simpler.
    const activeClasses = "text-white border-[var(--color-accent-primary)]";
    const inactiveClasses = "text-[var(--color-text-secondary)] border-transparent hover:text-white";

    return (
        <button onClick={onClick} className={`nav-btn ${isActive ? activeClasses : inactiveClasses}`}>
            {pageName.charAt(0).toUpperCase() + pageName.slice(1)}
        </button>
    );
};

export const Header = ({ user, isAdmin, page, setPage, onLoginClick, onSignOut }) => {
    return (
        <header className="bg-[var(--color-bg-secondary)]/80 backdrop-blur-lg sticky top-0 z-40 border-b border-[var(--color-border-primary)] shadow-md">
            <nav className="container mx-auto px-4 lg:px-6 py-2 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold text-white cursor-pointer" onClick={() => setPage('home')}>
                        GenshinCalc
                    </h1>
                    <div className="hidden md:flex items-center gap-2">
                        {/* Using the updated NavButton component */}
                        <NavButton onClick={() => setPage('home')} pageName="home" currentPage={page} />
                        <NavButton onClick={() => setPage('calculator')} pageName="calculator" currentPage={page} />
                        {isAdmin && <NavButton onClick={() => setPage('admin')} pageName="admin" currentPage={page} />}
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
                        <div className="h-10 w-24 bg-[var(--color-border-primary)] animate-pulse rounded-md"></div>
                    )}
                </div>
            </nav>
        </header>
    );
};