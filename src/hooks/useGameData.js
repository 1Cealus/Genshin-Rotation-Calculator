import { useState, useEffect } from 'react';
import { db, collection, onSnapshot } from '../firebase';
import { isFirebaseConfigValid } from '../config.js';
import { getGameData } from '../data/loader.js';
import { useModal } from '../context/ModalContext.jsx';

export const useGameData = () => {
    const { showModal } = useModal();
    const [gameData, setGameData] = useState(null);
    const [newsItems, setNewsItems] = useState([]);
    const [isGameDataLoading, setIsGameDataLoading] = useState(true);

    useEffect(() => {
        if (!isFirebaseConfigValid) {
            showModal({ title: 'Configuration Error', message: 'Firebase configuration is missing or invalid.' });
            setIsGameDataLoading(false);
            return;
        }
        getGameData(db).then(data => {
            setGameData(data);
            setIsGameDataLoading(false);
        }).catch(err => {
            setIsGameDataLoading(false);
            showModal({ title: 'Data Loading Error', message: 'A critical error occurred while loading game data.' });
        });

        const unsubNews = onSnapshot(collection(db, 'news'), (snapshot) => {
            const news = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.date.seconds - a.date.seconds);
            setNewsItems(news);
        });

        return () => unsubNews();
    }, []);

    return { gameData, newsItems, isGameDataLoading };
};