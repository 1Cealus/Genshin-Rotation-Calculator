// src/components/NavigationSidebar.jsx
import React, { useState } from 'react';

const NavItem = ({ icon, text, isCollapsed, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center h-12 px-4 rounded-lg transition-colors duration-200 ${
            isActive
                ? 'bg-[var(--color-accent-primary)] text-white'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border-primary)] hover:text-white'
        }`}
    >
        {icon}
        {!isCollapsed && <span className="ml-4 font-semibold whitespace-nowrap">{text}</span>}
    </button>
);

export const NavigationSidebar = ({ user, isAdmin, page, setPage, onLoginClick, onSignOut }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const navItems = [
        { name: 'home', label: 'Home', icon: <IconHome />, adminOnly: false },
        { name: 'calculator', label: 'Calculator', icon: <IconCalc />, adminOnly: false },
        { name: 'characters', label: 'Characters', icon: <IconCharacters />, adminOnly: false },
        { name: 'weapons', label: 'Weapons', icon: <IconWeapons />, adminOnly: false },
        { name: 'artifacts', label: 'Artifacts', icon: <IconArtifacts />, adminOnly: false },
        { name: 'enemies', label: 'Enemies', icon: <IconEnemies />, adminOnly: false },
        { name: 'admin', label: 'Admin', icon: <IconAdmin />, adminOnly: true },
    ];

    return (
        <aside
            onMouseEnter={() => setIsCollapsed(false)}
            onMouseLeave={() => setIsCollapsed(true)}
            className={`flex flex-col bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-primary)] p-4 transition-all duration-300 ease-in-out ${
                isCollapsed ? 'w-20' : 'w-64'
            }`}
        >
            <nav className="flex-grow space-y-2">
                {navItems.map(item => {
                    if (item.adminOnly && !isAdmin) return null;
                    return (
                        <NavItem
                            key={item.name}
                            icon={item.icon}
                            text={item.label}
                            isCollapsed={isCollapsed}
                            isActive={page === item.name}
                            onClick={() => setPage(item.name)}
                        />
                    );
                })}
            </nav>

            <div className="mt-auto">
                 {user ? (
                    user.isAnonymous ? (
                        <NavItem
                            icon={<IconLogin />}
                            text="Login / Sign Up"
                            isCollapsed={isCollapsed}
                            onClick={onLoginClick}
                        />
                    ) : (
                         <div className={`p-2 rounded-lg ${isCollapsed ? '' : 'bg-[var(--color-bg-primary)]'}`}>
                             {!isCollapsed && (
                                <div className="text-xs text-center text-white truncate mb-2">{user.email}</div>
                             )}
                            <NavItem
                                icon={<IconLogout />}
                                text="Sign Out"
                                isCollapsed={isCollapsed}
                                onClick={onSignOut}
                            />
                        </div>
                    )
                ) : (
                    <div className="h-12 bg-[var(--color-border-primary)] animate-pulse rounded-lg"></div>
                )}
            </div>
        </aside>
    );
};

// --- SVG Icons ---
const IconHome = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
const IconCalc = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5Z"/><path d="M3 10H21"/><path d="M16 3V7"/><path d="M8 3V7"/></svg>;
const IconCharacters = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconWeapons = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14.5 3.5-2 2L15 8l2-2-2.5-2.5Z"/><path d="m3 21 6-6"/><path d="m8 16 1-1"/><path d="m12.5 11.5 2-2L17 12l-2 2-2.5-2.5Z"/><path d="M18 7s-2 2-4 4"/><path d="m21 21-9-9"/></svg>;
const IconArtifacts = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
const IconEnemies = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 0-10 10c0 5 4.5 10 10 10s10-5 10-10A10 10 0 0 0 12 2Z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>;
const IconAdmin = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
const IconLogin = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>;
const IconLogout = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;