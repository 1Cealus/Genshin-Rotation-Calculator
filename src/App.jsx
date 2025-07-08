import React, { useEffect, useState } from 'react';
import { useAppContext } from './hooks/useAppContext';

// Component Imports
import { NavigationSidebar } from './components/NavigationSidebar';
import { LoginModal } from './components/Login';
import { CreateLeaderboardModal } from './components/CreateLeaderboardModal.jsx';

// Page Imports
import { HomePage } from './pages/HomePage';
import { CalculatorPage } from './pages/CalculatorPage';
import { AdminPage } from './pages/AdminPage';
import { CharacterArchivePage } from './pages/CharacterArchivePage';
import { WeaponArchivePage } from './pages/WeaponArchivePage';
import { ArtifactArchivePage } from './pages/ArtifactArchivePage';
import { EnemyArchivePage } from './pages/EnemyArchivePage';
import { MastersheetPage } from './pages/MastersheetPage';
import { LeaderboardListPage } from './pages/LeaderboardListPage.jsx';
import { LeaderboardDetailPage } from './pages/LeaderboardDetailPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';

const LoadingScreen = ({ text }) => (<div className="bg-slate-900 min-h-screen flex items-center justify-center text-white text-xl">{text}</div>);

const LogViewer = ({ logs, setLogs, isAdmin }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    if (!isAdmin) return null;

    return (
        <div className={`fixed bottom-4 right-4 w-full max-w-2xl bg-black/80 backdrop-blur-sm border-2 border-slate-700 rounded-lg shadow-2xl z-50 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'h-12' : 'h-72'}`}>
            <div className="flex justify-between items-center p-2 border-b border-slate-600 flex-shrink-0">
                <h4 className="font-bold text-sm text-yellow-300">Live Logs</h4>
                <div className="flex items-center gap-2">
                    <button onClick={() => setLogs([])} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">Clear</button>
                    <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded w-20">
                        {isCollapsed ? 'Expand' : 'Collapse'}
                    </button>
                </div>
            </div>
            {!isCollapsed && (
                <div className="overflow-y-auto p-2 text-xs font-mono space-y-1">
                    {logs.length > 0 ? logs.map((log, i) => <div key={i}>{log}</div>) : <p className="text-slate-500">No log entries yet.</p>}
                </div>
            )}
        </div>
    );
};


export default function App() {
    const {
        user,
        isAdmin,
        isUserLoading,
        isGameDataLoading,
        gameData,
        newsItems,
        page,
        setPage,
        showLoginModal,
        setShowLoginModal,
        showCreateLeaderboardModal,
        setCurrentLeaderboardId,
        activeTeam,
        handleSignOut,
        handleCreateLeaderboard,
        onLoadPreset,
        submitToAllRelevantLeaderboards,
        // Profile props
        profiles,
        activeProfile,
        setActiveProfileUid,
        handleProfileLookup,
        handleCloseProfile,
        isFetchingProfile,
        // Logging props
        logs,
        setLogs,
        ...props 
    } = useAppContext();

    useEffect(() => {
        if (page === 'profile' && user?.isAnonymous) {
            // Logic for anonymous users if needed
        }
    }, [page, user, setShowLoginModal]);

    if (isUserLoading || isGameDataLoading) {
        return <LoadingScreen text="Loading..." />;
    }

    const renderPage = () => {
        switch(page) {
            case 'home':
                return <HomePage setPage={setPage} newsItems={newsItems} />;
            case 'profile':
                return <ProfilePage 
                            profiles={profiles}
                            activeProfile={activeProfile}
                            setActiveProfileUid={setActiveProfileUid}
                            handleProfileLookup={handleProfileLookup}
                            handleCloseProfile={handleCloseProfile}
                            isFetchingProfile={isFetchingProfile}
                            gameData={gameData}
                            updateCharacterBuild={props.updateCharacterBuild}
                        />;
            case 'calculator':
                return gameData && <CalculatorPage 
                                        user={user} 
                                        gameData={gameData} 
                                        activeTeam={activeTeam} 
                                        isAdmin={isAdmin}
                                        onSaveToMastersheet={props.onSaveToMastersheet}
                                        setShowCreateLeaderboardModal={props.setShowCreateLeaderboardModal}
                                        {...props} 
                                    />;
            case 'admin':
                return isAdmin && <AdminPage newsItems={newsItems}/>;
            case 'characters':
                return gameData && <CharacterArchivePage gameData={gameData} />;
            case 'weapons':
                return gameData && <WeaponArchivePage gameData={gameData} />;
            case 'artifacts':
                return gameData && <ArtifactArchivePage gameData={gameData} />;
            case 'enemies':
                return gameData && <EnemyArchivePage gameData={gameData} />;
            case 'mastersheet':
                return gameData && <MastersheetPage gameData={gameData} onLoadPreset={onLoadPreset} setPage={setPage} isAdmin={isAdmin} />;
            case 'leaderboards':
                return gameData && <LeaderboardListPage gameData={gameData} setPage={setPage} setLeaderboardId={setCurrentLeaderboardId} />;
            case 'leaderboardDetail':
                return gameData && <LeaderboardDetailPage 
                                        leaderboardId={props.currentLeaderboardId} 
                                        gameData={gameData} 
                                        setPage={setPage} 
                                        user={user} 
                                        isAdmin={isAdmin} 
                                        activeProfileUid={props.activeProfileUid}
                                        submitToAllRelevantLeaderboards={submitToAllRelevantLeaderboards}
                                        handleProfileLookup={handleProfileLookup}
                                    />;
            default:
                return <HomePage setPage={setPage} newsItems={newsItems} />;
        }
    }

    return (
        <div className="bg-slate-900 min-h-screen text-white flex h-screen overflow-hidden">
            <input type="file" ref={props.importFileRef} className="hidden" accept=".json" onChange={props.handleImportData} />
            {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onUidLogin={handleProfileLookup} isLoggingIn={props.isLoggingIn} />}
            {showCreateLeaderboardModal && isAdmin && (
                <CreateLeaderboardModal
                    isOpen={showCreateLeaderboardModal}
                    onClose={() => props.setShowCreateLeaderboardModal(false)}
                    onCreate={handleCreateLeaderboard}
                    team={activeTeam}
                    gameData={gameData}
                />
            )}
            
            <NavigationSidebar 
                user={user}
                activeProfile={activeProfile}
                isAdmin={isAdmin}
                page={page}
                setPage={setPage}
                onLoginClick={() => setShowLoginModal(true)}
                onSignOut={handleSignOut}
            />
            
            <main className="flex-grow flex-1 flex flex-col overflow-y-auto">
                {renderPage()}
            </main>
            
            <LogViewer logs={logs} setLogs={setLogs} isAdmin={isAdmin} />
        </div>
    );
}