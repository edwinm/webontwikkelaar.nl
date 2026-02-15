import Parser from 'rss-parser';
import {writeJson, readJsonIfNew} from './file.js'
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import crypto from "node:crypto";
import 'dotenv/config';

const CACHE_FILE_NAME = 'cache/fetched-data-cache.json';
const CACHE_FILE_EXP = 60 * 60; // 1 hour

const parseXML = promisify(parseString);

const parser = new Parser({
    timeout: 10_000,
});

export default async function() {
    const fileData = await readJsonIfNew(CACHE_FILE_NAME, CACHE_FILE_EXP);

    if (fileData) {
        console.log('>> Using data from cache');
        return fileData;
    }

    console.log('>> Fetching all urls');

    const podcastList = {
        "Syntax": 522889,
        "PodRocket": 1329334,
        "Frontend coffee break" :5592508,
        "Front-end fire": 6545102,
        "Shoptalk": 165630,
        "Modern web": 174866,
        "JS Party": 403674,
        "Off the main thread": 6698247,
        "Changelog News": 6299937,
        "DejaVue": 6849531,
        "TypeScript.fm": 7184981,
    }

    const conferences = await getConferences();

    const cities = getCities(conferences);

    const videos = await getVideos();
    const posts = await getBlogs();

    const podcasts = await getPodcasts(podcastList);

    const lastUpdated = new Date();

    const data = {
        conferences,
        cities,
        videos,
        posts,
        podcasts,
        lastUpdated,
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
        const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${idData.id}`,
            {signal: AbortSignal.timeout(40_000)});
        const text = await response.text();
        const result = await parseXML(text);
        return result;
    });

    const videos = await Promise.allSettled(videoPromises);

    const allItems = videos.reduce((acc, video)=>{
        if (video.status === 'rejected' || video.value.feed.entry.length === 0) {
            return acc;
        }

        video.value.feed.entry.forEach((entry) => {
            entry.dateValue = Date.parse(entry.published);
        })

        const newestVideo = video.value.feed.entry.reduce((newest, item) => item.dateValue > newest.dateValue ? item : newest);

        const normalizedVideo = {
            ...newestVideo,
            link: newestVideo.link[0].$.href,
            author: newestVideo.author[0].name,
            thumbnail: newestVideo["media:group"][0]["media:thumbnail"][0].$,
            description: newestVideo["media:group"][0]["media:description"][0],
            starRating: newestVideo["media:group"][0]["media:community"][0]["media:starRating"][0].$,
            statistics: newestVideo["media:group"][0]["media:community"][0]["media:statistics"][0].$,
        };

        return [...acc, normalizedVideo];
    }, []);

    const allItemsSorted = allItems.sort((a, b) => b.dateValue - a.dateValue);

    return allItemsSorted.slice(0, 12);
}

async function getConferences() {
    const today = new Intl.DateTimeFormat('sv-SE').format(new Date());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const supabase = createClient(process.env.SupabaseUrl, process.env.SupabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    });

    const { data: conferences } = await supabase
        .from('conferences_with_location')
        .select()
        .gte('end_date', today)
        .order('start_date', { ascending: true })
        .limit(10)
        .abortSignal(controller.signal);

    clearTimeout(timeout);

    const conferencesWithSlug = conferences.map((conference) =>
        ({...conference, slug: toSlug(conference.city)}))

    return conferencesWithSlug;
}

function getCities(conferences) {
    const cities = [...new Set(conferences.map((c) => c.city))];

    const citiesLoc = cities.map((city) => {
        const conference = conferences.find((conf) => conf.city === city);
        const slug = toSlug(city);
        return ({
            city,
            slug,
            latitude: conference.latitude,
            longitude: conference.longitude,
        });
    });

    return citiesLoc;
}

function toSlug(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // strip diacritics
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')    // non-alphanumeric → single hyphen
        .replace(/^-|-$/g, '');          // trim leading/trailing hyphens
}

async function readOPML(filepath) {
    const opmlText = await readFile(filepath, 'utf-8');
    const result = await parseXML(opmlText);

    return result;
}

async function getPodcasts(podcastList) {
    const apiKey = process.env.PodcastApiKey;
    const apiSecret = process.env.PodcastApiSecret;
    const apiHeaderTime = Math.floor(Date.now() / 1000);

    const hash = crypto
        .createHash("sha1")
        .update(apiKey + apiSecret + apiHeaderTime)
        .digest("hex");

    const podcastIds = Object.values(podcastList).join();

    const response = await fetch(
        `https://api.podcastindex.org/api/1.0/episodes/byfeedid?id=${podcastIds}&max=12`,
        {
            headers: {
                "User-Agent": "webontwikkelaar.nl/1.0",
                "X-Auth-Key": apiKey,
                "X-Auth-Date": String(apiHeaderTime),
                Authorization: hash,
            },
        }
    );

    const podcastData = await response.json();

    podcastData.items.forEach((podcast) => {
       podcast.creator =  Object.keys(podcastList).find((key) => podcastList[key] === podcast.feedId);
       podcast.dateValue = podcast.datePublished * 1000;
    });

    return podcastData;
}