const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
console.log('ENV ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? 'exists' : 'missing');

try {
    console.log('Loading app...');
    const app = require('../app');
    console.log('App loaded successfully.');
    const PORT = 5000;
    const server = app.listen(PORT, () => {
        console.log(`Server listening successfully on port ${PORT}`);
    });
} catch (err) {
    console.error('Crash error:', err);
}
