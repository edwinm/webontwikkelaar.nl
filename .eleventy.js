import {Prng} from "pringle";
import {raster, rasterHue, headerTint, specialDayStyle, specialThemeColor} from "./assets/header.js";

function getSeed(date = new Date()) {
    const d = date.getDate();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return Number(`${d}${m}${y}`);
}

export default function(eleventyConfig) {
    const seed = getSeed();
    eleventyConfig.addGlobalData("seed", seed);

    // UTC date (YYYY-MM-DD) of this build, used client-side to detect a stale page
    eleventyConfig.addGlobalData("buildDate", new Date().toISOString().slice(0, 10));

    eleventyConfig.on('eleventy.after', async () => {
        if (process.env.NODE_ENV !== 'development') {
            setTimeout(() => {
                process.exit(0); // horse remedy against hanging 11ty
            }, 60_000)
        }
    });

    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy({ "assets-root": "/" });

    // Unix timestamp in ms to Dutch short date filter
    eleventyConfig.addFilter("dutchShortDate", function(timestamp) {
        const date = new Date(timestamp);

        return date.toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'short',
            timeZone: 'Europe/Amsterdam'
        }).replace('.', '');
    });

    eleventyConfig.addFilter("englishShortDate", function(timestamp) {
        const date = new Date(timestamp);

        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            timeZone: 'Europe/Amsterdam'
        }).replace('.', '');
    });

    // Unix timestamp in ms to Dutch long date filter
    eleventyConfig.addFilter("dutchLongDate", function(timestamp) {
        const date = new Date(timestamp);

        return date.toLocaleString('nl-NL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Europe/Amsterdam'
        });
    });

    eleventyConfig.addFilter("englishLongDate", function(timestamp) {
        const date = new Date(timestamp);

        return date.toLocaleString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Europe/Amsterdam'
        });
    });

    eleventyConfig.addFilter("dateRange", function(timestamp1, timestamp2, locale = 'nl-NL') {
        const date1 = new Date(timestamp1);
        const date2 = new Date(timestamp2);

        const month1 = date1.toLocaleDateString(locale, { month: 'short', timeZone: 'Europe/Amsterdam' }).replace('.', '');
        const month2 = date2.toLocaleDateString(locale, { month: 'short', timeZone: 'Europe/Amsterdam' }).replace('.', '');
        const day1 = date1.toLocaleDateString(locale, { day: 'numeric', timeZone: 'Europe/Amsterdam' });
        const day2 = date2.toLocaleDateString(locale, { day: 'numeric', timeZone: 'Europe/Amsterdam' });

        if (month1 === month2) {
            if (day1 === day2) {
                return `${day1} ${month1}`;
            } else {
                return `${day1}&ndash;${day2} ${month1}`;
            }
        } else {
            return `${day1} ${month1}&ndash;${day2} ${month2}`;
        }
    });

    eleventyConfig.addFilter("ymdDate", function(timestamp) {
        return new Intl.DateTimeFormat('sv-SE').format(new Date(timestamp));
    });

    eleventyConfig.addFilter("isoDate", function(timestamp) {
        return new Date(timestamp).toISOString();
    });

    eleventyConfig.addFilter("duration", (seconds) => {
      const s = parseInt(seconds, 10);
      if (isNaN(s)) {
        return "";
      }

      const h = Math.floor(s / 3600);
      const m = Math.round((s % 3600) / 60);

      return h > 0
        ? `${h}:${String(m).padStart(2, "0")}m`
        : `${m}m`;
    });

    eleventyConfig.addFilter("json", function(data) {
        return JSON.stringify(data, null, 2);
    });

    eleventyConfig.addShortcode('raster', (className, settings) => raster(new Prng(seed), settings, className));
    eleventyConfig.addShortcode('rasterHue', settings => rasterHue(new Prng(seed), settings));
    // mode is 'light' or 'dark'
    eleventyConfig.addShortcode('headerTint', (settings, mode) => headerTint(new Prng(seed), settings)[mode]);
    eleventyConfig.addShortcode('specialDayStyle', specialDay => specialDayStyle(specialDay));
    // mode is 'light' or 'dark'
    eleventyConfig.addShortcode('specialThemeColor', (specialDay, mode) => specialThemeColor(specialDay, mode));

    return {
        dir: {
            input: ".",        // Input directory
            output: "dist",     // Output directory
        },

        // Template formats
        templateFormats: ["liquid"],

        // Default template engine for markdown files
        markdownTemplateEngine: "liquid",

        // Default template engine for HTML files
        htmlTemplateEngine: "liquid"
    };
}

