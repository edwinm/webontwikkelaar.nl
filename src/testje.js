import {readJson, writeJson} from "../_data/file.js";
import Parser from 'rss-parser';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const parseXML = promisify(parseString);

const id = "UCsBjURrPoezykLs9EqgamOA";
// const data = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);

const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
const text = await response.text();
const result = await parseXML(text);

const processed = result.feed.entry.map((entry) => {
    return {
        title: entry.title,
        link: entry.link[0].$.href,
        author: entry.author[0].name,
        published: entry.published,
        pubDate:Date.parse(entry.published),
        thumbnail: entry["media:group"][0]["media:thumbnail"][0].$,
        description: entry["media:group"][0]["media:description"][0],
        starRating: entry["media:group"][0]["media:community"][0]["media:starRating"][0].$,
        statistics: entry["media:group"][0]["media:community"][0]["media:statistics"][0].$,

    }
})

console.log('data', JSON.stringify(processed, null, 2));