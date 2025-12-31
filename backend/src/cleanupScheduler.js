import { cleanupExpiredTokens } from './utils/tokenCleanup.util.js';

// Run cleanup every 24 hours (in milliseconds)
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Starts the token cleanup scheduler
 * Runs cleanup every 24 hours
 */
export const startTokenCleanupScheduler = () => {
    console.log('[Token Cleanup Scheduler] Starting scheduled cleanup (runs every 24 hours)');

    // Run cleanup immediately on startup
    cleanupExpiredTokens()
        .then(count => {
            if (count > 0) {
                console.log(`[Token Cleanup Scheduler] Initial cleanup complete`);
            }
        })
        .catch(err => console.error('[Token Cleanup Scheduler] Initial cleanup failed:', err));

    // Schedule periodic cleanup
    setInterval(() => {
        console.log('[Token Cleanup Scheduler] Running scheduled cleanup...');
        cleanupExpiredTokens()
            .catch(err => console.error('[Token Cleanup Scheduler] Scheduled cleanup failed:', err));
    }, CLEANUP_INTERVAL_MS);
};
