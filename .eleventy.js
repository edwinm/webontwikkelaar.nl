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

