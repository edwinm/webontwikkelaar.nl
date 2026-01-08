import Parser from 'rss-parser';

const parser = new Parser();

const blogs = ['https://www.w3.org/news/feed/', 'http://feeds.feedburner.com/EsnextNews']

export default async function() {
    return {
        posts: await getBlogs(),
        lastUpdated: new Date()
    }
}

async function getBlogs() {

    const feedPromises = blogs.map(blog => parser.parseURL(blog))

    const feeds = await Promise.all(feedPromises);

    console.log(JSON.stringify(feeds));

    return feeds;
}