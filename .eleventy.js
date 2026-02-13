export default function(eleventyConfig) {
    eleventyConfig.on('eleventy.after', async () => {
        setTimeout(() => {
            process.exit(0); // horse remedy against hanging 11ty
        }, 60_000)
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

    // Unix timestamp in ms to Dutch long date filter
    eleventyConfig.addFilter("dutchLongDate", function(timestamp) {
        const date = new Date(timestamp);

        return date.toLocaleString('nl-NL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Europe/Amsterdam'
        });
    });

    eleventyConfig.addFilter("dateRange", function(timestamp1, timestamp2) {
        const date1 = new Date(timestamp1);
        const date2 = new Date(timestamp2);

        const month1 = date1.toLocaleDateString('nl-NL', { month: 'short', timeZone: 'Europe/Amsterdam' }).replace('.', '');
        const month2 = date2.toLocaleDateString('nl-NL', { month: 'short', timeZone: 'Europe/Amsterdam' }).replace('.', '');
        const day1 = date1.toLocaleDateString('nl-NL', { day: 'numeric', timeZone: 'Europe/Amsterdam' });
        const day2 = date2.toLocaleDateString('nl-NL', { day: 'numeric', timeZone: 'Europe/Amsterdam' });

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
        console.log(timestamp);
        if(!timestamp) return "-";
        return new Intl.DateTimeFormat('sv-SE').format(new Date(timestamp));
    });

    eleventyConfig.addFilter("duration", (seconds) => {
      const s = parseInt(seconds, 10);
      if (isNaN(s)) return "";

      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;

      const pad = (n) => String(n).padStart(2, "0");

      return h > 0
        ? `${h}:${pad(m)}:${pad(sec)}`
        : `${m}:${pad(sec)}`;
    });

    eleventyConfig.addFilter("json", function(data) {
        return JSON.stringify(data, null, 2);
    });

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

