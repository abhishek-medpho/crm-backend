import { pool } from '../DB/db.js';
import { getIndianTimeISO } from '../helper/preprocess_data.helper.js';

/**
 * Deletes expired refresh tokens from the database
 * @returns {Promise<number>} Number of tokens deleted
 */
export const cleanupExpiredTokens = async () => {
    try {
        const currentIST = getIndianTimeISO();

        const result = await pool.query(
            'DELETE FROM crm.user_refresh_tokens WHERE expires_at < $1',
            [currentIST]
        );

        const deletedCount = result.rowCount || 0;

        if (deletedCount > 0) {
            console.log(`[Token Cleanup] Deleted ${deletedCount} expired refresh token(s)`);
        }

        return deletedCount;
    } catch (error) {
        console.error('[Token Cleanup] Error during cleanup:', error.message);
        // Don't throw - cleanup failure shouldn't break the app
        return 0;
    }
};
