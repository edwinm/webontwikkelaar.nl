import Parser from 'rss-parser';
import {writeJson, readJsonIfNew} from './file.js'
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const CACHE_FILE_NAME = 'fetched-data-cache.json';
const CACHE_FILE_EXP = 60 * 60; // 1 hour

const parseXML = promisify(parseString);

const parser = new Parser();

export default async function() {
    const fileData = await readJsonIfNew(CACHE_FILE_NAME, CACHE_FILE_EXP);

    if (fileData) {
        console.log('>> Using data from cache');
        return fileData;
    }

    const data = {
        videos: await getVideos(),
        posts: await getBlogs(),
        lastUpdated: getDutchDate(),
    };

    console.log('write cache');

    await writeJson(CACHE_FILE_NAME, data);

    console.log('done write cache');

    return data;
}

function getDutchDate() {
    const date = new Date();

    return date.toLocaleString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

async function getBlogs() {
    const opml = await readOPML('src/feeds.opml');
    const blogs = opml.opml.body[0].outline[0].outline.map(outline => outline.$.xmlUrl);

    const feedPromises = blogs.map(blog => parser.parseURL(blog))

    const feeds = await Promise.allSettled(feedPromises);


    const processed = feeds.reduce((acc, feed)=>{
        if (feed.status === 'rejected' || feed.value.items.length === 0) {
            return acc;
        }

        const items = feed.value.items;

        items.forEach((item) => {
            item.dateValue = Date.parse(item.pubDate)
        });

        const newestItem = items.reduce((newest, item) => item.dateValue > newest.dateValue ? item : newest);

        newestItem.feedTitle = feed.value.title;
        newestItem.language = feed.value.language;

        acc.push(newestItem);

        return acc;
    }, []);

    const processedSorted = processed.sort((a, b) => b.dateValue - a.dateValue);

    return processedSorted.slice(0, 12);
}

async function getVideos() {
    const response = await readFile("youtube-ids.json", 'utf-8');
    const ids = JSON.parse(response);

    console.log('ids', ids);

    const videoPromises = ids.map(async (idData) => {
        const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${idData.id}`);
        const text = await response.text();
        const result = await parseXML(text);
        return result;
    });

    const videos = await Promise.allSettled(videoPromises);

    console.log('videos', videos);

    const allItems = videos.reduce((acc, video)=>{
        if (video.status === 'rejected' || video.value.feed.entry.length === 0) {
            return acc;
        }

        const processed = video.value.feed.entry.map((entry) => {
            return {
                title: entry.title,
                link: entry.link[0].$.href,
                author: entry.author[0].name,
                published: entry.published,
                dateValue: Date.parse(entry.published),
                thumbnail: entry["media:group"][0]["media:thumbnail"][0].$,
                description: entry["media:group"][0]["media:description"][0],
                starRating: entry["media:group"][0]["media:community"][0]["media:starRating"][0].$,
                statistics: entry["media:group"][0]["media:community"][0]["media:statistics"][0].$,
            }
        })

        return acc.concat(processed);
    }, []);

    const allItemsSorted = allItems.sort((a, b) => b.dateValue - a.dateValue);

    console.log('sorted', allItemsSorted.slice(0, 12));

    return allItemsSorted.slice(0, 12);
}

async function readOPML(filepath) {
    const opmlText = await readFile(filepath, 'utf-8');
    const result = await parseXML(opmlText);

    return result;
}