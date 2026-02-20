import crypto from "node:crypto";

const apiKey = process.env.PodcastApiKey;
const apiSecret = process.env.PodcastApiSecret;
const apiHeaderTime = Math.floor(Date.now() / 1000);

const hash = crypto
    .createHash("sha1")
    .update(apiKey + apiSecret + apiHeaderTime)
    .digest("hex");

const response = await fetch(
    "https://api.podcastindex.org/api/1.0/episodes/byfeedid?id=522889,1329334,5592508,6545102,165630,174866,403674,6698247",
    {
        headers: {
            "User-Agent": "webontwikkelaar.nl/1.0",
            "X-Auth-Key": apiKey,
            "X-Auth-Date": String(apiHeaderTime),
            Authorization: hash,
        },
    }
);

const data = await response.text();  // or .json()
console.log(data);