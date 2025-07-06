import React from 'react';
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

const LoadingScreen = ({ text }) => (<div className="bg-brand-dark min-h-screen flex items-center justify-center text-white text-xl">{text}</div>);

export default function App() {
    const {
        // State
        user, sessionUid, isAdmin, isUserLoading, isGameDataLoading, isLoggingIn,
        gameData, newsItems,
        page, showLoginModal, showCreateLeaderboardModal,
        currentLeaderboardId, activeTeam,
        
        // UI State Setters
        setPage, setShowLoginModal, setShowCreateLeaderboardModal, setCurrentLeaderboardId,
        
        // Handlers
        handleUidLogin, handleSignOut, handleCreateLeaderboard,
        
        // Pass-through props for pages
        ...props
    } = useAppContext();

    if (isUserLoading || isGameDataLoading) {
        return <LoadingScreen text="Loading..." />;
    }

    const renderPage = () => {
        switch(page) {
            case 'home': return <HomePage setPage={setPage} newsItems={newsItems} />;
            case 'calculator': return gameData && <CalculatorPage {...props} />;
            case 'admin': return isAdmin && <AdminPage newsItems={newsItems}/>;
            case 'characters': return gameData && <CharacterArchivePage gameData={gameData} />;
            case 'weapons': return gameData && <WeaponArchivePage gameData={gameData} />;
            case 'artifacts': return gameData && <ArtifactArchivePage gameData={gameData} />;
            case 'enemies': return gameData && <EnemyArchivePage gameData={gameData} />;
            case 'mastersheet': return gameData && <MastersheetPage gameData={gameData} onLoadPreset={props.handleLoadPreset} setPage={setPage} isAdmin={isAdmin} />;
            case 'leaderboards': return gameData && <LeaderboardListPage gameData={gameData} setPage={setPage} setLeaderboardId={setCurrentLeaderboardId} />;
            case 'leaderboardDetail': return gameData && <LeaderboardDetailPage leaderboardId={currentLeaderboardId} gameData={gameData} setPage={setPage} user={user} isAdmin={isAdmin} />;
            default: return <HomePage setPage={setPage} newsItems={newsItems} />;
        }
    }

    return (
        <div className="bg-brand-dark min-h-screen text-white flex h-screen overflow-hidden">
            <input type="file" ref={props.importFileRef} className="hidden" accept=".json" onChange={props.handleImportData} />
            {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onUidLogin={handleUidLogin} isLoggingIn={isLoggingIn} />}
            {showCreateLeaderboardModal && isAdmin && (
                <CreateLeaderboardModal
                    isOpen={showCreateLeaderboardModal}
                    onClose={() => setShowCreateLeaderboardModal(false)}
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