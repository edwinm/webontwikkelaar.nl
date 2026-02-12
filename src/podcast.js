import crypto from "node:crypto";

const apiKey = process.env.PodcastApiKey;
const apiSecret = process.env.PodcastApiSecret;
const apiHeaderTime = Math.floor(Date.now() / 1000);

const hash = crypto
    .createHash("sha1")
    .update(apiKey + apiSecret + apiHeaderTime)
    .digest("hex");

const response = await fetch(
    "https://api.podcastindex.org/api/1.0/episodes/byfeedid?id=522889&newest=true",
    {
        headers: {
            "User-Agent": "webontwikkelaar.nl/1.0",
            "X-Auth-Key": apiKey,
            "X-Auth-Date": String(apiHeaderTime),
            Authorization: hash,
        },
    }
);

const data = await response.json();
console.log(data);