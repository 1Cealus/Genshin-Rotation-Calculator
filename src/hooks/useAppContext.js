import { useAuth } from './useAuth';
import { useGameData } from './useGameData';
import { useAppCore } from './useAppCore';

export const useAppContext = () => {
    const { user, isAdmin, isUserLoading, handleSignOut } = useAuth();
    const { gameData, newsItems, isGameDataLoading } = useGameData();
    const coreApp = useAppCore({ user, gameData, isUserLoading, isGameDataLoading, isAdmin });

    return {
        // From useAuth
        user,
        isAdmin,
        isUserLoading,
        handleSignOut,
        
        // From useGameData
        gameData,
        newsItems,
        isGameDataLoading,

        // From useAppCore
        ...coreApp,
    };
};