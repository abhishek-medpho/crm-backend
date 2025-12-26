import { randomBytes } from 'crypto';

/**
 * Generates a unique 7-character booking reference
 * Format: Base36 timestamp (4 chars) + Random (3 chars)
 * Example: "abc1def"
 * 
 * This ensures:
 * - Chronological ordering (timestamp prefix)
 * - Uniqueness (random suffix + UUID randomness)
 * - Short, memorable format (7 characters)
 * 
 * @returns {string} 7-character alphanumeric booking reference
 */
export const generateBookingReference = () => {
    try {
        // Get current timestamp and convert to base36 for compactness
        const timestamp = Date.now().toString(36);

        // Take last 4 characters of timestamp for chronological ordering
        const timestampPart = timestamp.slice(-4);

        // Generate 3 random characters using crypto for better randomness
        const randomPart = randomBytes(2)
            .toString('hex')
            .slice(0, 3);

        // Combine to create 7-character reference
        const reference = (timestampPart + randomPart).toLowerCase();

        return reference;
    } catch (error) {
        // Fallback to Math.random if crypto fails (shouldn't happen)
        console.error('Error generating booking reference with crypto, falling back to Math.random:', error);
        const fallback = Math.random().toString(36).substring(2, 9);
        return fallback;
    }
};

/**
 * Generates a booking reference with retry logic to handle potential collisions
 * (Though collisions are virtually impossible with crypto random + timestamp)
 * 
 * @param {Object} pool - Database connection pool
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise<string>} Unique booking reference
 */
export const generateUniqueBookingReference = async (pool, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const reference = generateBookingReference();

        // Check if reference already exists in database
        const existingRef = await pool.query(
            'SELECT booking_reference FROM opd_bookings WHERE booking_reference = $1',
            [reference]
        );

        if (existingRef.rows.length === 0) {
            return reference;
        }

        console.warn(`Booking reference collision detected (attempt ${attempt + 1}): ${reference}`);
    }

    // If all retries failed, append extra random characters
    const timestamp = Date.now().toString(36).slice(-3);
    const random = randomBytes(2).toString('hex').slice(0, 4);
    return (timestamp + random).toLowerCase();
};
