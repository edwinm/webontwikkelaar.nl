// Downloads the external video and podcast images at build time, resizes them
// and stores them in dist/feed-img, so visitors never load them from a third party.
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const OUTPUT_DIR = 'dist/feed-img';
const URL_PATH = '/feed-img';
const PLACEHOLDER = '/assets/feed-placeholder.svg';

const MAX_BYTES = 15 * 1024 * 1024;
const TIMEOUT = 20_000;
const CONCURRENCY = 6;
// Unused images are kept this long, for HTML that is still cached somewhere
const KEEP_UNUSED_MS = 2 * 24 * 60 * 60 * 1000;

const VIDEO_SIZE = { width: 480, height: 360 };
const PODCAST_SIZE = { width: 280, height: 280 };

export async function localizeFeedImages({ videos = [], podcasts = [] }, userAgent) {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const jobs = [
        ...videos.map((video) => ({
            sourceUrl: video.thumbnail?.url,
            size: VIDEO_SIZE,
            assign: (url) => { video.localThumbnail = url; },
        })),
        ...podcasts.map((podcast) => ({
            sourceUrl: podcast.image || podcast.feedImage,
            size: PODCAST_SIZE,
            assign: (url) => { podcast.localImage = url; },
        })),
    ];

    const used = new Set();

    await runLimited(jobs, CONCURRENCY, async (job) => {
        const fileName = await localizeImage(job.sourceUrl, job.size, userAgent);
        if (fileName) {
            used.add(fileName);
            job.assign(`${URL_PATH}/${fileName}`);
        } else {
            job.assign(PLACEHOLDER);
        }
    });

    await removeUnused(used);
}

// Returns the local file name, or null when the image could not be made
async function localizeImage(sourceUrl, { width, height }, userAgent) {
    if (!sourceUrl) {
        return null;
    }

    const hash = crypto.createHash('sha1').update(`${sourceUrl} ${width}x${height}`).digest('hex').slice(0, 16);
    const fileName = `${hash}.webp`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    try {
        // Already made by an earlier build: mark it as used now
        const now = new Date();
        await fs.utimes(filePath, now, now);
        return fileName;
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    try {
        const response = await fetch(sourceUrl, {
            signal: AbortSignal.timeout(TIMEOUT),
            headers: { 'User-Agent': userAgent },
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        if (Number(response.headers.get('content-length')) > MAX_BYTES) {
            throw new Error('Image too large');
        }

        const input = Buffer.from(await response.arrayBuffer());
        if (input.length > MAX_BYTES) {
            throw new Error('Image too large');
        }

        // Write to a temporary file first, so a failed build never leaves a broken image
        const tempPath = `${filePath}.tmp`;
        await sharp(input)
            .resize(width, height, { fit: 'cover' })
            .webp({ quality: 75 })
            .toFile(tempPath);
        await fs.rename(tempPath, filePath);

        return fileName;
    } catch (error) {
        console.error(`Failed localizing image ${sourceUrl}`, error.message);
        return null;
    }
}

async function removeUnused(used) {
    const files = await fs.readdir(OUTPUT_DIR);
    let removed = 0;

    for (const file of files) {
        if (used.has(file)) {
            continue;
        }

        const filePath = path.join(OUTPUT_DIR, file);
        const stats = await fs.stat(filePath);

        if (Date.now() - stats.mtime.getTime() > KEEP_UNUSED_MS) {
            await fs.rm(filePath, { force: true });
            removed++;
        }
    }

    console.log(`${used.size} feed images, ${removed} unused removed`);
}

async function runLimited(items, limit, worker) {
    let index = 0;
    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (index < items.length) {
            await worker(items[index++]);
        }
    });
    await Promise.all(runners);
}
