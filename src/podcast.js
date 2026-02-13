import crypto from "node:crypto";

const apiKey = process.env.PodcastApiKey;
const apiSecret = process.env.PodcastApiSecret;
const apiHeaderTime = Math.floor(Date.now() / 1000);


// Syntax 522889
// PodRocket 1329334
// Frontend coffee break 5592508
// Front-end fire 6545102
// Shoptalk 165630
// Modern web 174866
// Frontend happy hour x
// JS Party 403674
// Off the main thread 6698247

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

const data = await response.json();
console.log(data);