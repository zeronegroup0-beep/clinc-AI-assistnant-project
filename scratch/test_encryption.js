require('dotenv').config();
const { encrypt, decrypt } = require('../utils/encryption');

const plainText = "This is a highly sensitive medical record.";

console.log("Original Text:", plainText);

try {
    const encryptedText = encrypt(plainText);
    console.log("Encrypted Text:", encryptedText);

    const decryptedText = decrypt(encryptedText);
    console.log("Decrypted Text:", decryptedText);

    if (plainText === decryptedText) {
        console.log("✅ Encryption and decryption successful and symmetric!");
    } else {
        console.error("❌ Decrypted text does not match original text!");
    }
} catch (error) {
    console.error("❌ Error during encryption test:", error.message);
}
