console.log('edit');

const config = {
    num: 12,
    minsize: 5,
    maxsize: 30,
    border: 3,
    lightness: 73,
    chroma: 24,
    deviation: 10,
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

edit();


function edit() {
    const box = document.createElement('aside');
    box.style = "position: fixed; width: 100%; bottom: 0; background: lightgrey; padding: 10px; z-index:1000";

    const button = document.createElement('button');
    button.innerText = `seed ${seed}`;
    button.onclick = () => {
        seed++;
        button.innerText = `seed ${seed}`;
        set();
    };
    box.appendChild(button);

    const controls = document.createElement('div');
    controls.style = "column-width: 300px; column-gap: 1rem";
    box.appendChild(controls);

    for (j in config) {
        const control = document.createElement('div');
        control.style = "padding: 10px; margin-bottom: 10px; border: 1px solid grey; border-radius: 5px; background: white; break-inside: avoid";

        const text = document.createElement('div');
        text.style = "display: flex; justify-content: space-between;";

        const name = document.createElement('div');
        name.innerText = j;
        text.appendChild(name);

        const value = document.createElement('div');
        value.className = 'value';
        value.innerText = config[j];
        text.appendChild(value);

        control.appendChild(text);

        const input = document.createElement('input');
        input.type = 'range';
        input.id = j;
        input.value = config[j];
        input.style = "width: 100%";
        input.oninput = ({target}) => {
            value.innerText = target.value;
            set();
        };
        control.appendChild(input);
        controls.appendChild(control);
    }

    document.body.appendChild(box);

    set();
}

function set() {
    const settings = Object.keys(config).reduce((acc, curr) => {
        return { ...acc, [curr]: document.getElementById(curr).value };
    }, {});

    render(settings);
}

function render(settings) {
    console.log('render');
    const prng = new Prng(seed);

    const svg = document.querySelector('svg.header-background');
    const height = 100;
    const width = 500; // 100 * w / h;
    svg.replaceChildren();
    for (let j = 0; j < settings.num; j++) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

        const pow = 3; // V = (4/3)πr³
        const r = Math.pow(prng.rand(Math.pow(settings.minsize, 1/pow), Math.pow(settings.maxsize, 1/pow)), pow);
        const cyv = (settings.maxsize - r) / (settings.maxsize - settings.minsize);
        const cx = width * j /settings.num + prng.rand(-settings.deviation, settings.deviation) * 5;
        const cy= height/2 + (height/2 - r) * prng.rand(-cyv, cyv);

        // const color = `oklch(${settings.lightness}% ${settings.chroma}% ${prng.rand(360)} / ${settings.alpha / 100})`;
        const color = `oklch(${settings.lightness}% ${settings.chroma}% ${prng.rand(360)})`;

        Object.entries({
            cx,
            cy,
            r,
            fill: 'none',
            stroke: color,
            'stroke-width': settings.border,
            'class': 'circle'
        }).forEach(([k, v]) => circle.setAttribute(k, v));

        svg.appendChild(circle);
    }
}


