import { promises as fs } from 'fs';

export async function isFileOlder(filePath, seconds) {
    try {
        const stats = await fs.stat(filePath);
        const fileAge = Date.now() - stats.mtime.getTime();
        const exp = seconds * 1000; // milliseconds
        return fileAge > exp;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return true; // File doesn't exist, treat as "old"
        }
        throw error;
    }
}

export async function readJsonIfNew(filePath, seconds) {
    const isOld = await isFileOlder(filePath, seconds);

    if (!isOld) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null; // File doesn't exist
            }
            throw error;
        }
    }

    return null; // File is old
}

export async function writeJson(filePath, data) {
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonString, 'utf8');
}