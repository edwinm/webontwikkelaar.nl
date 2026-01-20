import {readJson, writeJson} from "../_data/file.js";

const urls = await readJson('src/youtube.json');

const result = await Promise.all(urls.map(async (url)=>{
    const channel = url.match(/@([a-z0-9_\-]+)/i)[1];

    const fetchUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${channel}&key=${process.env.YouTubeApiKey}`

    const response = await fetch(fetchUrl);
    const channelData = await response.json();

    const id = channelData.items[0].id;

    return {channel, id};
}));

console.log('result', result);

await writeJson("cache/youtube-ids.json", result);