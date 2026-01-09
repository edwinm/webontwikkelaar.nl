import Parser from 'rss-parser';
import { promises as fs } from 'fs';

const CACHE_FILE_NAME = 'fetched-data-cache.json';
const CACHE_FILE_EXP = 60 * 60; // 1 hour

const parser = new Parser();

const blogs = ['https://www.w3.org/news/feed/', 'http://feeds.feedburner.com/EsnextNews']

export default async function() {
    const fileData = await readJsonIfNew(CACHE_FILE_NAME, CACHE_FILE_EXP);

    console.log('fileData', fileData);

    if (fileData) {
        console.log('return from cache');
        return fileData;
    }

    const data = {
        posts: await getBlogs(),
        lastUpdated: new Date()
    };

    await writeJson(CACHE_FILE_NAME, data);

    return data;
}

async function getBlogs() {
    const feedPromises = blogs.map(blog => parser.parseURL(blog))

    const feeds = await Promise.all(feedPromises);

    return feeds;
}

async function isFileOlder(filePath, seconds) {
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

async function readJsonIfNew(filePath, seconds) {
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

async function writeJson(filePath, data) {
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonString, 'utf8');
}