import Parser from 'rss-parser';
import {writeJson, readJsonIfNew} from './cache.js'
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const CACHE_FILE_NAME = 'fetched-data-cache.json';
const CACHE_FILE_EXP = 60 * 60; // 1 hour

const parseXML = promisify(parseString);

const parser = new Parser();

// const blogs = ['https://www.w3.org/news/feed/', 'http://feeds.feedburner.com/EsnextNews']

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
    const opml = await readOPML('feeds.opml');
    const blogs = opml.opml.body[0].outline[0].outline.map(outline => outline.$.xmlUrl);

    const feedPromises = blogs.map(blog => parser.parseURL(blog))

    const feeds = await Promise.allSettled(feedPromises);

    const processed = feeds.reduce((acc, feed)=>{
        if (feed.status === 'rejected' || feed.value.items.length === 0) {
            return acc;
        }

        // assuming first item is most recent item
        const item = feed.value.items[0];

        item.feedTitle = feed.title;
        item.language = feed.language;
        item.dateValue = Date.parse(item.pubDate);

        acc.push(item);

        return acc;
    }, []);

    const processedSorted = processed.sort((a, b) => b.dateValue - a.dateValue);

    return processedSorted.slice(0, 24);
}

async function readOPML(filepath) {
    const opmlText = await readFile(filepath, 'utf-8');
    const result = await parseXML(opmlText);

    return result;
}