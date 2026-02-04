import fs from 'fs';

try {
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist', { recursive: true });
    }

    fs.writeFileSync('dist/health.txt', 'OK');
    console.log('Successfully wrote "OK" to dist/health.txt');
} catch (error) {
    console.error('Error writing to file:', error);
}