import React, { useEffect } from 'react';
import { useAppContext } from './hooks/useAppContext';

// Component Imports
import { NavigationSidebar } from './components/NavigationSidebar';
import { LoginModal } from './components/Login';
import { CreateLeaderboardModal } from './components/CreateLeaderboardModal.jsx';
import { EditLeaderboardModal } from './components/EditLeaderboardModal.jsx';

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

export default function App() {
    const {
        // Destructure all the state and handlers from the context
        user,
        sessionUid,
        isAdmin,
        isUserLoading,
        isGameDataLoading,
        isLoggingIn,
        gameData,
        newsItems,
        page,
        setPage,
        showLoginModal,
        setShowLoginModal,
        showCreateLeaderboardModal,
        setCurrentLeaderboardId,
        activeTeam,
        handleUidLogin,
        handleSignOut,
        handleCreateLeaderboard,
        onLoadPreset,
        submitToAllRelevantLeaderboards,
        ...props 
    } = useAppContext();

    useEffect(() => {
        if (page === 'profile' && user?.isAnonymous) {
            setShowLoginModal(true);
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
                if (user?.isAnonymous) {
                    return <HomePage setPage={setPage} newsItems={newsItems} />;
                }
                return <ProfilePage {...props} gameData={gameData} />;

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
                                        submitToAllRelevantLeaderboards={submitToAllRelevantLeaderboards}
                                    />;
            default:
                return <HomePage setPage={setPage} newsItems={newsItems} />;
        }
    }

    return (
        <div className="bg-slate-900 min-h-screen text-white flex h-screen overflow-hidden">
            <input type="file" ref={props.importFileRef} className="hidden" accept=".json" onChange={props.handleImportData} />
            {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onUidLogin={handleUidLogin} isLoggingIn={isLoggingIn} />}
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
                sessionUid={sessionUid}
                isAdmin={isAdmin}
                page={page}
                setPage={setPage}
                onLoginClick={() => setShowLoginModal(true)}
                onSignOut={handleSignOut}
            />
            
            <main className="flex-grow flex-1 flex flex-col overflow-y-auto">
                {renderPage()}
            </main>
        </div>
    );
}