import Parser from 'rss-parser';
import {writeJson, readJsonIfNew} from './file.js'
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const CACHE_FILE_NAME = 'cache/fetched-data-cache.json';
const CACHE_FILE_EXP = 60 * 60; // 1 hour

const parseXML = promisify(parseString);

const parser = new Parser();

export default async function() {
    const fileData = await readJsonIfNew(CACHE_FILE_NAME, CACHE_FILE_EXP);

    if (fileData) {
        console.log('>> Using data from cache');
        return fileData;
    }

    console.log('>> Fetching all urls');

    const data = {
        videos: await getVideos(),
        posts: await getBlogs(),
        conferences: await getConferences(),
        lastUpdated: new Date(),
    };

    await writeJson(CACHE_FILE_NAME, data);

    return data;
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
            const pubDate = (item.pubDate || item.isoDate || item["dc:date"])?.trim();
            item.dateValue = Date.parse(pubDate);
        });

        const newestItem = items.reduce((newest, item) => item.dateValue > newest.dateValue ? item : newest);

        if (newestItem.title.trim() === "") {
            return acc; // Skip items without title
        }

        newestItem.feedTitle = feed.value.title;
        newestItem.language = feed.value.language;
        newestItem["content"] = "";
        newestItem["contentSnippet"] = "";
        newestItem["content:encoded"] = "";
        newestItem["content:encodedSnippet"] = "";

        acc.push(newestItem);

        return acc;
    }, []);

    const processedSorted = processed.toSorted((a, b) => (b.dateValue || 0) - (a.dateValue || 0));

    const sliced = processedSorted.slice(0, 12);

    return sliced;
}

async function getVideos() {
    const response = await readFile("cache/youtube-ids.json", 'utf-8');
    const ids = JSON.parse(response);

    const videoPromises = ids.map(async (idData) => {
        const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${idData.id}`);
        const text = await response.text();
        const result = await parseXML(text);
        return result;
    });

    const videos = await Promise.allSettled(videoPromises);

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

    return allItemsSorted.slice(0, 12);
}

async function getConferences() {
    const today = new Intl.DateTimeFormat('sv-SE').format(new Date());

    const supabase = createClient(process.env.SupabaseUrl, process.env.SupabaseAnonKey);

    const { data, error } = await supabase
        .from('conferences_with_location')
        .select()
        .gte('end_date', today)
        .order('start_date', { ascending: true })
        .limit(10);

    return data;
}

async function readOPML(filepath) {
    const opmlText = await readFile(filepath, 'utf-8');
    const result = await parseXML(opmlText);

    return result;
}