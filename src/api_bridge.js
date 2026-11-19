// src/api_bridge.js
// This module connects the frontend Memory Dashboard to the backend API.

const API_BASE = '/api';

/**
 * Fetches the memory log for a specific player and NPC.
 * This is what the "Press M" Memory panel will use.
 * @param {string} playerId - The ID of the logged-in player.
 * @param {string} npcId - The ID of the NPC (e.g., 'chef_mario').
 */
export async function fetchNPCMemory(playerId, npcId) {
    try {
        const response = await fetch(`${API_BASE}/memory/${playerId}/${npcId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch memory from backend');
        }

        const data = await response.json();
        return data.facts; // Returns an array of facts the NPC remembers
        
    } catch (error) {
        console.warn('Backend not connected. Using mock memory for demo.', error.message);
        
        // Fallback for demo purposes if backend is down
        return [
            { fact_key: "Name", fact_value: "Joshoua" },
            { fact_key: "Favorite Food", fact_value: "Hot dogs" }
        ];
    }
}
