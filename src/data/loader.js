// src/data/loader.js
import { getFirestore, collection, getDocs } from "firebase/firestore";

// This will cache the data after the first successful fetch
let gameDataCache = null;
let dataPromise = null;

const collectionsToFetch = [
  'characters',
  'weapons',
  'buffs',
  'enemies',
  'artifact_sets',
  'artifact_stats',
  'main_stat_values'
];

// Helper to convert a Firestore collection snapshot to a key-value object
const snapshotToObjects = (snapshot) => {
    const data = {};
    if (snapshot.empty) {
        console.warn(`Warning: Firestore collection returned no documents.`);
        return data;
    }
    snapshot.forEach(doc => {
        data[doc.id] = doc.data();
    });
    return data;
};

// Main fetch function
async function fetchGameData(db) {
    if (!db) {
        throw new Error("Firestore is not initialized. Cannot fetch game data.");
    }
    
    const appId = 'default-app-id'; // Using 'default-app-id' as specified in your upload script
    const dataPath = `artifacts/${appId}/public/data`;
    
    console.log("Fetching game data from Firestore path:", dataPath);

    const promises = collectionsToFetch.map(name => 
        getDocs(collection(db, `${dataPath}/${name}`))
    );

    const snapshots = await Promise.all(promises);

    const fetchedData = {
        characterData: snapshotToObjects(snapshots[0]),
        weaponData: snapshotToObjects(snapshots[1]),
        buffData: snapshotToObjects(snapshots[2]),
        enemyData: snapshotToObjects(snapshots[3]),
        artifactSets: snapshotToObjects(snapshots[4]),
        artifactStats: snapshotToObjects(snapshots[5]),
        mainStatValues: snapshotToObjects(snapshots[6]),
    };

    console.log("Successfully fetched all game data.");
    return fetchedData;
}

/**
 * Fetches game data from Firestore. Caches the result after the first successful call.
 * @param {Firestore} db The Firestore database instance.
 * @returns {Promise<Object>} A promise that resolves with the game data.
 */
export function getGameData(db) {
    if (gameDataCache) {
        return Promise.resolve(gameDataCache);
    }
    if (!dataPromise) {
        dataPromise = fetchGameData(db).then(data => {
            gameDataCache = data; // Cache the data
            return data;
        }).catch(error => {
            console.error("Failed to fetch game data from Firestore:", error);
            dataPromise = null; // Reset promise on error to allow retrying
            throw error; // Re-throw to be caught by the caller
        });
    }
    return dataPromise;
}