import Parser from 'rss-parser';
import {writeJson, readJsonIfNew} from './cache.js'

const CACHE_FILE_NAME = 'fetched-data-cache.json';
const CACHE_FILE_EXP = 60 * 60; // 1 hour

const parser = new Parser();

const blogs = ['https://www.w3.org/news/feed/', 'http://feeds.feedburner.com/EsnextNews']

export default async function() {
    const fileData = await readJsonIfNew(CACHE_FILE_NAME, CACHE_FILE_EXP);

    if (fileData) {
        console.log('>> Using data from cache');
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

    const processed = feeds.reduce((acc, feed)=>{
        if (feed.items.length === 0) {
            return acc;
        }

        // assuming first item is most recent item
        const item = feed.items[0];

        item.feedTitle = feed.title;
        item.language = feed.language;
        item.dateValue = Date.parse(item.pubDate);

        acc.push(item);

        return acc;
    }, []);

    const processedSorted = processed.sort((a, b) => a.dateValue - b.dateValue);

    return processedSorted;
}

