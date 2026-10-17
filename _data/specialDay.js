// Special days on which the header gets its own color instead of the random hue of the day.
// The site is built every morning, so the date of the build is the date the page is shown.

const TIMEZONE = 'Europe/Amsterdam';

// Date as YYYY-MM-DD, calculated in UTC, so there are no daylight saving surprises
const day = (year, month, date, offset = 0) =>
    new Date(Date.UTC(year, month - 1, date + offset)).toISOString().slice(0, 10);

// Easter Sunday, anonymous Gregorian algorithm (Meeus/Jones/Butcher)
function easter(year, offset = 0) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const date = (h + l - 7 * m + 114) % 31 + 1;
    return day(year, month, date, offset);
}

// The nth weekday (0 = Sunday) of a month
function nthWeekday(year, month, weekday, n, offset = 0) {
    const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    return day(year, month, 1 + (weekday - first + 7) % 7 + (n - 1) * 7, offset);
}

function kingsDay(year) {
    const sunday = new Date(Date.UTC(year, 3, 27)).getUTCDay() === 0;
    return day(year, 4, sunday ? 26 : 27);
}

// First match wins. `dates` returns the first and last day of the period in a year.
const SPECIAL_DAYS = [
    {name: 'Nieuwjaarsdag', color: '#C9A227', dates: y => [day(y, 1, 1), day(y, 1, 1)]},
    {name: 'Carnaval', color: '#2B8A3E', dates: y => [easter(y, -49), easter(y, -47)]},
    {name: 'Valentijnsdag', color: '#D6336C', dates: y => [day(y, 2, 14), day(y, 2, 14)]},
    {name: 'Pasen', color: '#F2C94C', dates: y => [easter(y), easter(y, 1)]},
    {name: 'Koningsdag', color: '#F36C21', dates: y => [kingsDay(y), kingsDay(y)]},
    {name: 'Dodenherdenking', color: '#3A3A3A', dates: y => [day(y, 5, 4), day(y, 5, 4)]},
    {name: 'Bevrijdingsdag', color: '#AE1C28', dates: y => [day(y, 5, 5), day(y, 5, 5)]},
    {name: 'Moederdag', color: '#E64980', dates: y => [nthWeekday(y, 5, 0, 2), nthWeekday(y, 5, 0, 2)]},
    {name: 'Global Accessibility Awareness Day', color: '#1971C2', dates: y => [nthWeekday(y, 5, 4, 3), nthWeekday(y, 5, 4, 3)]},
    {name: 'Feest van de Vlaamse Gemeenschap', color: '#FFE600', dates: y => [day(y, 7, 11), day(y, 7, 11)]},
    {name: 'Belgische nationale feestdag', color: '#EF3340', dates: y => [day(y, 7, 21), day(y, 7, 21)]},
    // From the Saturday a week before the Canal Parade (first Saturday of August) up to the Sunday after it
    {
        name: 'Pride Amsterdam',
        colors: ['#E40303', '#FF8C00', '#FFED00', '#008026', '#24408E', '#732982'],
        dates: y => [nthWeekday(y, 8, 6, 1, -7), nthWeekday(y, 8, 6, 1, 1)],
    },
    {name: 'Prinsjesdag', color: '#C9A227', dates: y => [nthWeekday(y, 9, 2, 3), nthWeekday(y, 9, 2, 3)]},
    {name: 'Halloween', color: '#E8590C', dates: y => [day(y, 10, 31), day(y, 10, 31)]},
    // Also Sint-Maarten in the Netherlands, but the poppy wins
    {name: 'Wapenstilstand', color: '#C8102E', dates: y => [day(y, 11, 11), day(y, 11, 11)]},
    {name: 'Koningsfeest', color: '#FDDA24', dates: y => [day(y, 11, 15), day(y, 11, 15)]},
    {name: 'Sinterklaas', color: '#B3122E', dates: y => [day(y, 12, 5), day(y, 12, 6)]},
    {name: 'Kerst', color: '#1E5631', dates: y => [day(y, 12, 24), day(y, 12, 26)]},
    {name: 'Oudejaarsdag', color: '#1B1F3B', dates: y => [day(y, 12, 31), day(y, 12, 31)]},
];

// Not exported: Eleventy only uses the default export of a data file when it's the only export
function findSpecialDay(today) {
    const year = Number(today.slice(0, 4));
    const match = SPECIAL_DAYS.find(({dates}) => {
        const [from, to] = dates(year);
        return from <= today && today <= to;
    });
    if (!match) {
        return null;
    }
    const {dates, ...specialDay} = match;
    return specialDay;
}

export default function () {
    // HEADER_DATE=YYYY-MM-DD overrides the date, for testing
    const today = process.env.HEADER_DATE ||
        new Intl.DateTimeFormat('sv-SE', {timeZone: TIMEZONE}).format(new Date());
    return findSpecialDay(today);
}
