export default function(eleventyConfig) {

    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy({ "assets-root": "/" });

    // Unix timestamp in ms to Dutch short date filter
    eleventyConfig.addFilter("dutchShortDate", function(timestamp) {
        const date = new Date(timestamp);

        return date.toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'short'
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
            hour12: false
        });
    });

    eleventyConfig.addFilter("ymdDate", function(str) {
        return new Intl.DateTimeFormat('sv-SE').format(new Date());
    });

    eleventyConfig.addFilter("stringify", function(str) {
        return JSON.stringify(str, null, 2);
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

