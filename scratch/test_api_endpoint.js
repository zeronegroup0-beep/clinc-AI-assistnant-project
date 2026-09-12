require('dotenv').config();
const app = require('../app');

const server = app.listen(5099, async () => {
    try {
        console.log('Testing /api/chat over HTTP on port 5099...');
        const response = await fetch('http://localhost:5099/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'السلام عليكم أنا اسمي مروان',
                sessionId: 'http_test_1'
            })
        });

        const data = await response.json();
        console.log('HTTP Status:', response.status);
        console.log('HTTP Response:', data);

        if (data.success && data.reply.includes('أستاذ مروان')) {
            console.log('✅ API Endpoint /api/chat works perfectly!');
        } else {
            console.error('❌ API Endpoint check failed');
        }
    } catch (err) {
        console.error('Error during HTTP test:', err);
    } finally {
        server.close();
    }
});
