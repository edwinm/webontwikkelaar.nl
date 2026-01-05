module.exports = function(eleventyConfig) {

    eleventyConfig.addPassthroughCopy("assets");

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