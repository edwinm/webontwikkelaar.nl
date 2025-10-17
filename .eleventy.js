module.exports = function(eleventyConfig) {
    return {
        dir: {
            input: ".",        // Input directory
            output: "dest",     // Output directory
        },

        // Template formats
        templateFormats: ["liquid"],

        // Default template engine for markdown files
        markdownTemplateEngine: "liquid",

        // Default template engine for HTML files
        htmlTemplateEngine: "liquid"
    };
}