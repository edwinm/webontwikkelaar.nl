import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

// Run as: node --env-file=.env src/claude-test.js

// Docs: https://github.com/anthropics/anthropic-sdk-typescript

const ConferenceSchema = z.object({
    name: z
        .string()
        .describe("The official title of the conference"),

    description: z
        .string()
        .describe("(Duthc) Een korte samenvatting van waar de conferentie over gaat"),

    starting_date: z
        .string()
        .describe("Event start date in ISO 8601 format (YYYY-MM-DD)"),

    end_date: z
        .string()
        .describe("End date of the event in ISO 8601 format (YYYY-MM-DD)"),

    city: z
        .string()
        .describe("(Duthc) De stad waar de conferentie plaatsvindt, of 'online' voor virtuele evenementen"),

    venue_address: z
        .string()
        .nullable()
        .describe("The full address of the venue, or null for online events"),

    url: z
        .url()
        .describe("Official conference website (URL)"),
});

const ConferencesSchema = z.object({
    conferences: z
        .array(ConferenceSchema)
        .describe("List of conferences and meetups with fixed dates"),
});

const client = new Anthropic({
    apiKey: process.env.AnthropicApiKey, // This is the default and can be omitted
});

const prompt = `Please provide me with a list of all web development conferences in the Netherlands and Belgium between January 2026 and July 2026.

Topics to be covered: CSS, JavaScript, TypeScript, frontend frameworks, build tools, backend tools and frameworks, UI/UX, accessibility,
anything related to web development.`;

const response = await client.beta.messages.parse({
    // model: "claude-sonnet-4-5",
    model: "claude-opus-4-1",
    max_tokens: 4096,
    temperature: 0.1,
    betas: ["structured-outputs-2025-11-13"],
    messages: [{ role: 'user', content: prompt }],
    output_format: betaZodOutputFormat(ConferencesSchema),
});

console.log('output', response.parsed_output);

console.log('usage', response.usage);

