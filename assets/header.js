const WIDTH = 1600;
const HEIGHT = 320;

const round = v => Math.round(v * 10) / 10;

// 2D value noise with a seeded permutation table
function valueNoise(prng) {
    const values = new Float32Array(256);
    const perm = new Uint8Array(512);
    for (let i = 0; i < 256; i++) {
        values[i] = prng.rand();
        perm[i] = i;
    }
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(prng.rand(i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 256; i++) {
        perm[i + 256] = perm[i];
    }

    const at = (x, y) => values[perm[perm[x & 255] + (y & 255)]];
    const smooth = t => t * t * (3 - 2 * t);
    const noise = (x, y) => {
        const xi = Math.floor(x), yi = Math.floor(y);
        const u = smooth(x - xi), w = smooth(y - yi);
        const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
        return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
    };

    // Two rotated octaves, so the lattice of the value noise doesn't show
    return (x, y) => noise(x * 0.8 - y * 0.6, x * 0.6 + y * 0.8) * 0.65 +
        noise((x * 0.26 + y * 0.97) * 2 + 17.3, (y * 0.26 - x * 0.97) * 2 + 31.7) * 0.35;
}

// The random choices behind a raster, so rasterHue() can make the same ones as raster()
function draw(prng, settings) {
    const noise = valueNoise(prng);
    const scale = settings.zoom / 10000 * prng.rand(0.7, 1.4);
    const ox = prng.rand(50), oy = prng.rand(50);
    const hue = prng.rand(360);
    const hueSpread = settings.huespread * (prng.rand() < 0.5 ? -1 : 1);
    return {noise, scale, ox, oy, hue, hueSpread};
}

// Hue in the middle of the raster, for colors that go with it
export function rasterHue(prng, settings) {
    const {hue, hueSpread} = draw(prng, settings);
    const bands = Math.max(1, Math.round(settings.bands));
    return round((hue + (bands > 1 ? hueSpread / 2 : 0) + 360) % 360);
}

// oklch to an sRGB hex color (https://bottosson.github.io/posts/oklab/), clamped to the gamut
function oklchToHex(lightness, chroma, hue) {
    const a = chroma * Math.cos(hue * Math.PI / 180);
    const b = chroma * Math.sin(hue * Math.PI / 180);
    const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    const linear = [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ];
    return "#" + linear.map(v => {
        const srgb = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
        return Math.round(Math.min(1, Math.max(0, srgb)) * 255).toString(16).padStart(2, "0");
    }).join("");
}

// Background of header and footer (and the theme-color) in the hue of the raster, for light and dark mode.
// In hex, because not every browser takes oklch() for the theme-color.
export function headerTint(prng, settings) {
    const hue = rasterHue(prng, settings);
    return {light: oklchToHex(0.95, 0.03, hue), dark: oklchToHex(0.23, 0.02, hue)};
}

export function raster(prng, settings, className) {
    const spacing = Number(settings.spacing);
    const dotsize = settings.dotsize / 100;
    const threshold = settings.threshold / 100;
    const contrast = Math.max(0.01, settings.contrast / 100);
    const bands = Math.max(1, Math.round(settings.bands));

    const {noise, scale, ox, oy, hue, hueSpread} = draw(prng, settings);

    const groups = Array.from({length: bands}, () => "");

    for (let j = 0; j <= HEIGHT / spacing; j++) {
        for (let i = -1; i <= WIDTH / spacing; i++) {
            const x = (i + (j % 2 ? 1 : 0.5)) * spacing;
            const y = (j + 0.5) * spacing;
            const v = Math.min(1, Math.max(0, (noise(x * scale + ox, y * scale + oy) - threshold) / contrast));
            const r = spacing * dotsize * v * v * (3 - 2 * v);
            if (r < 0.8) {
                continue;
            }
            const band = Math.max(0, Math.min(bands - 1, Math.floor(x / WIDTH * bands)));
            groups[band] += `<circle cx="${round(x)}" cy="${round(y)}" r="${round(r)}"/>`;
        }
    }

    const dots = groups.map((circles, band) => {
        const h = (hue + hueSpread * band / Math.max(1, bands - 1) + 360) % 360;
        return `<g fill="oklch(${settings.lightness}% ${settings.chroma / 100} ${h.toFixed(1)})">${circles}</g>`;
    }).join("\n");

    // Fade out to the left, so the title stays readable
    return `<svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 ${WIDTH} ${HEIGHT}"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            class="${className}"
        >
        <defs>
            <linearGradient id="header-fade"><stop offset="0" stop-color="#fff" stop-opacity="${settings.fade / 100}"/><stop offset=".55" stop-color="#fff"/></linearGradient>
            <mask id="header-mask"><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#header-fade)"/></mask>
        </defs>
        <g mask="url(#header-mask)">
        ${dots}
        </g>
        </svg>`;
}
