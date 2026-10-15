console.log('edit');

// Slider ranges per setting; the start values come from the page (settings in page.liquid)
const config = {
    spacing: {min: 8, max: 40},
    dotsize: {min: 10, max: 70},
    threshold: {min: 0, max: 60},
    contrast: {min: 10, max: 100},
    zoom: {min: 10, max: 120},
    huespread: {min: 0, max: 180},
    lightness: {min: 30, max: 95},
    chroma: {min: 0, max: 37},
    bands: {min: 1, max: 12},
    fade: {min: 0, max: 100},
};

// https://github.com/edwinm/pringle/tree/main
class Prng {
    constructor(seed = 0) {
        this.seed = seed;
    }

    * [Symbol.iterator]() {
        while (true) {
            yield this.rand();
        }
    }

    prng() {
        this.seed ^= 2747636419;
        this.seed *= 2654435769;
        this.seed &= 0xFFFFFFFF;
        this.seed ^= this.seed >> 16;
        this.seed *= 2654435769;
        this.seed &= 0xFFFFFFFF;
        this.seed ^= this.seed >> 16;
        this.seed *= 2654435769;
        this.seed &= 0xFFFFFFFF;

        return this.seed;
    }

    * iter(count) {
        while (count-- > 0) {
            yield this.rand();
        }
    }

    rand(min, max) {
        if (min === undefined) {
            max = 1;
            min = 0;
        } else if (max === undefined) {
            max = min;
            min = 0;
        }

        return ((this.prng() + 0x80000000) / 0x100000000) * (max - min) + min;
    }
}

import('/assets/header.js').then(({raster}) => edit(raster));


function edit(raster) {
    const box = document.createElement('aside');
    box.style = "position: fixed; width: 100%; bottom: 0; background: lightgrey; color: black; padding: 10px; z-index:1000";

    const button = document.createElement('button');
    button.innerText = `seed ${seed}`;
    button.onclick = () => {
        seed++;
        button.innerText = `seed ${seed}`;
        set(raster);
    };
    box.appendChild(button);

    const controls = document.createElement('div');
    controls.style = "column-width: 300px; column-gap: 1rem";
    box.appendChild(controls);

    for (const j in config) {
        const control = document.createElement('div');
        control.style = "padding: 10px; margin-bottom: 10px; border: 1px solid grey; border-radius: 5px; background: white; break-inside: avoid";

        const text = document.createElement('div');
        text.style = "display: flex; justify-content: space-between;";

        const name = document.createElement('div');
        name.innerText = j;
        text.appendChild(name);

        const value = document.createElement('div');
        value.className = 'value';
        value.innerText = settings[j];
        text.appendChild(value);

        control.appendChild(text);

        const input = document.createElement('input');
        input.type = 'range';
        input.id = j;
        input.min = config[j].min;
        input.max = config[j].max;
        input.value = settings[j];
        input.style = "width: 100%";
        input.oninput = ({target}) => {
            value.innerText = target.value;
            set(raster);
        };
        control.appendChild(input);
        controls.appendChild(control);
    }

    document.body.appendChild(box);

    set(raster);
}

function set(raster) {
    const current = Object.keys(config).reduce((acc, curr) => {
        return { ...acc, [curr]: Number(document.getElementById(curr).value) };
    }, {});

    render(raster, current);
}

function render(raster, current) {
    console.log('render');
    const svg = document.querySelector('svg.header-background');
    svg.outerHTML = raster(new Prng(seed), current, 'header-background');
}
