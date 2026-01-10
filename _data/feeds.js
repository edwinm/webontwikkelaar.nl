import Parser from 'rss-parser';
import {writeJson, readJsonIfNew} from './cache.js'

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

