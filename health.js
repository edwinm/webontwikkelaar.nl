import fs from 'fs';

try {
    fs.writeFileSync('dist/health.txt', 'OK');
    console.log('Successfully wrote "OK" to dist/health.txt');
} catch (error) {
    console.error('Error writing to file:', error);
}