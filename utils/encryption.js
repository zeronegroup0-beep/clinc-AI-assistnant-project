const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
// In production, ensure ENCRYPTION_KEY is exactly 32 bytes (256 bits) long.
// If it's a hex string, it should be 64 characters.
const getEncryptionKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY is not set in environment variables');
    }
    // We assume the key is provided as a 64-character hex string (32 bytes)
    // If you prefer a regular string, you can hash it or ensure it's 32 chars.
    return Buffer.from(key, 'hex');
};

/**
 * Encrypts a given text.
 * @param {string} text - The text to encrypt.
 * @returns {string} The encrypted text in the format "iv:encryptedData".
 */
const encrypt = (text) => {
    if (!text) return text;
    
    // Generate a random initialization vector (IV) for each encryption
    const iv = crypto.randomBytes(16);
    const key = getEncryptionKey();

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return the IV along with the encrypted data so it can be decrypted later
    return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts a given text.
 * @param {string} encryptedText - The text to decrypt in the format "iv:encryptedData".
 * @returns {string} The original decrypted text.
 */
const decrypt = (encryptedText) => {
    if (!encryptedText) return encryptedText;

    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
        throw new Error('Invalid encrypted text format. Expected "iv:encryptedData"');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};

module.exports = {
    encrypt,
    decrypt
};
