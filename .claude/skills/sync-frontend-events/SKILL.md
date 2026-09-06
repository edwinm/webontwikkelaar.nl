---
name: sync-frontend-events
description: Sync upcoming Dutch/Flemish frontend events (AmsterdamJS, Fronteers, Meetup) into datasrc/conferences.json. Use when asked to sync, refresh, or update the conferences/events list for webontwikkelaar.nl.
---

Scrape upcoming events from the sources below, add any new ones to the conferences data file of the webontwikkelaar.nl site, and prune events that have already finished.

All paths in this skill are relative to the repository root.

## Sources
1. https://guild.host/amsterdamjs/events
2. https://www.fronteers.nl/nl/activiteiten/
3. https://www.meetup.com/react-amsterdam/
4. https://www.meetup.com/javascript-developers-zuid-holland/
5. https://www.meetup.com/front-end-focus/events/

## Data file
Events live in a plain JSON file in this repo — there is no database, and Supabase is no longer used. Do not use the Supabase MCP tools.

- File: `datasrc/conferences.json`
- Shape: a single JSON array of objects, each with exactly these keys, in this order:
  - `id` (integer, unique — assign `max(existing id) + 1`, incrementing for each new event)
  - `created_at` (string, ISO 8601 UTC, e.g. `"2026-09-07T05:12:33.412000+00:00"` — use the current time of the run)
  - `title` (string)
  - `start_date` (string, `YYYY-MM-DD`)
  - `end_date` (string, `YYYY-MM-DD`)
  - `city` (string)
  - `url` (string)
- Formatting: 2-space indent, keys in the order above, file ends with a trailing newline. Match the existing style exactly so the diff stays small.
- Companion file `datasrc/cities.json` maps city names to coordinates. The site build (`_data/feeds.js`) joins on an exact `name` match, so `city` MUST be spelled exactly as it appears there (Dutch spellings: `Den Haag`, `Antwerpen`, `Brussel`, `Gent`, `Brugge`, `'s-Hertogenbosch`). A city that is not in `cities.json` builds without a map marker, so check before inserting and pick the closest correct spelling.

## Steps

1. Scrape all sources and extract every upcoming event (title, date, location, URL). Always retrieve the raw page text (markdown) for each source, not only a structured/JSON extraction — the raw text is the evidence every later step is checked against.
2. Verify every candidate against the raw page before it is allowed any further. Structured extraction is not trusted on its own: on a page whose events are all in the past, the extractor has been observed inventing plausible-looking events out of nothing. Discard a candidate unless its title AND its date AND its URL all appear in that source's raw page text. Then reject any candidate that:
   - has a `start_date` in the past (before today) — an upcoming-events sync never adds one;
   - has a URL that looks synthetic rather than copied: sequential or repeating digits (`.../events/1234567/`), a round placeholder id, `example.com`, or a numeric id differing by one from another candidate's;
   - sits under a "Past events" heading on the source page, or in a "Similar events nearby" / "You may also like" / "Related" block — those belong to other groups and are not sources for this sync;
   - cannot be confirmed by opening its own event page when anything above is ambiguous.
   Log every candidate rejected here and say which rule caught it. A source legitimately having zero upcoming events is a normal, expected result — report "0 upcoming" and move on. Never fill an empty result with anything.
3. Read `datasrc/conferences.json` and parse it. Note the highest existing `id` — take it now, across ALL entries including past ones, before the pruning in step 7 removes any. New ids continue from that number so an id is never reused.
4. Compare scraped events against the file. Match by URL first; if the URL is missing or differs, match by title similarity + date. Skip any event already present.
5. Filter out any event that is online or whose location is outside the Netherlands or Flanders (the Dutch-speaking part of Belgium). Only keep in-person events in cities such as Amsterdam, Utrecht, Rotterdam, Den Haag, Eindhoven, Groningen, Nijmegen, Tilburg, Breda, Leiden, Delft, Haarlem, Arnhem, Enschede, Dordrecht, Nieuwegein, and Flemish cities such as Antwerpen, Gent, Brugge, Leuven, Mechelen, and Hasselt. Skip online events, events in other countries (UK, Germany, France, etc.), and events in Wallonia/Brussels unless explicitly in a Flemish venue.
   - `title`: if the event is a meetup (borrel, lunchmeeting, community night, or any informal gathering), prefix the title with `"Meetup: "` — unless it already starts with `"Meetup:"`.
   - `start_date` and `end_date`: use the event date (set both equal for single-day events).
   - `city`: extract the city name from the location string, spelled as in `cities.json`.
   - `url`: the event URL.
6. Before adding, validate that each new entry has all of the following fields present and non-empty: `title`, `start_date`, `end_date`, `city`, and `url`. If any is missing, skip the entry and log it as invalid — do not add it.
7. Update the file in one atomic write, doing both of these:
   - **Prune past entries.** Remove every entry whose `end_date` is strictly before today (`YYYY-MM-DD` strings compare correctly as plain strings, so `end_date < today` is the test). An event ending today is NOT past — keep it; the site still shows it. This is the only case in which existing entries may be removed.
   - **Append the new entries** to the end of the remaining array, leaving the surviving entries otherwise untouched and in their current relative order.

   Write via a temp file moved into place, then re-parse the result and confirm: it is valid JSON, the count equals `surviving + added`, no remaining entry has `end_date < today`, and every id is still unique. Report the pruned entries by title and date so the removal is visible in the run log.
8. Leave the change uncommitted in the working tree. Do not run `git commit` or `git push`; Edwin reviews and commits the diff himself. Do not add Claude as a contributor anywhere: no `Co-Authored-By: Claude` trailer, no "Generated with Claude Code" line, and no mention of Claude or any AI assistant in a commit message, PR description, or in the data file itself.

## Success criteria
- Only in-person events located in the Netherlands or Flanders are added. Online events are skipped.
- No duplicates are created.
- Every added event is traceable to text that actually appeared on one of the five source pages; nothing is added that could not be quoted back from a raw scrape.
- No added event has a date in the past, and no added event came from a "Past events" or "Similar events nearby" block.
- All meetup-type events have titles starting with `"Meetup:"`.
- Every added entry has a unique `id` and non-empty `title`, `start_date`, `end_date`, `city`, and `url`; every `city` matches a `name` in `cities.json`.
- The file still parses as JSON and keeps its existing formatting; surviving entries are unchanged apart from the removal of past ones.
- Every entry whose `end_date` is before today has been removed, entries ending today are kept, and no id is reused by a new entry.
- Nothing credits Claude as a contributor — no co-author trailer, no generated-by line, no mention of an AI assistant.
- Log a summary of how many events were found, skipped (duplicates, wrong location, or invalid/missing fields), added, and pruned as past — plus the resulting `git diff --stat` for the file.
