// From: https://forum.unity.com/threads/how-does-unityengine-random-initialize-the-state-parameters-of-xorshift-in-random-initstate.1042252/
const createRNG = (seed) => {
    let a = seed >>> 0;
    let b = (Math.imul(a, 1812433253) + 1);
    let c = (Math.imul(b, 1812433253) + 1);
    let d = (Math.imul(c, 1812433253) + 1);
    
    const next = () => {
        const t1 = a ^ (a << 11);
        const t2 = t1 ^ (t1 >>> 8);
        a = b; b = c; c = d;
        d = d ^ (d >>> 19) ^ t2;
        return d;
    };
    
    const random = () => {
        const value = next() << 9 >>> 0;
        return (value / 4294967295);
    };
    // In Unity, random range uses 1.0 - value for some reason.
    const randomRange = () => {
        return 1.0 - random();
    };
    
    return {
        random,
        randomRange
    };
};

const WIND_PERIOD = 1000 / 8;
const WEATHER_PERIOD = 666;
const DAY_LENGTH = 1800;
const INTRO_TIME = 2040;

const weathers = {
    "Clear": { windMin: 0.1, windMax: 0.6 },
    "Rain": { windMin: 0.5, windMax: 1.0 },
    "Misty": { windMin: 0.1, windMax: 0.3 },
    "ThunderStorm": { windMin: 0.8, windMax: 1.0 },
    "LightRain": { windMin: 0.1, windMax: 0.6 },
    "DeepForest Mist": { windMin: 0.1, windMax: 0.6 },
    "SwampRain": { windMin: 0.1, windMax: 0.3 },
    "SnowStorm": { windMin: 0.8, windMax: 1.0 },
    "Snow": { windMin: 0.1, windMax: 0.6 },
    "Heath clear": { windMin: 0.4, windMax: 0.8 },
    "Twilight Snowstorm": { windMin: 0.7, windMax: 1.0 },
    "Twilight Snow": { windMin: 0.3, windMax: 0.6 },
    "Twilight Clear": { windMin: 0.2, windMax: 0.6 },
    "Ashrain": { windMin: 0.1, windMax: 0.5 },
    "Darklands dark": { windMin: 0.1, windMax: 0.6 }
};

const data = {
    intro: [
        { weight: 1, name: "ThunderStorm" }, 
    ],
    meadows: [
        { weight: 5.0, name: "Clear" },  
        { weight: 0.2, name: "Rain"}, 
        { weight: 0.2, name: "Misty" },
        { weight: 0.2, name: "ThunderStorm" },
        { weight: 0.2, name: "LightRain" },  
    ],
    blackforest: [
        { weight: 2.0, name: "DeepForest Mist" },  
        { weight: 0.1, name: "Rain"}, 
        { weight: 0.1, name: "Misty" },
        { weight: 0.1, name: "ThunderStorm" },
    ],
    swamp: [
        { weight: 1.0, name: "SwampRain" },
    ],
    mountain: [
        { weight: 1.0, name: "SnowStorm" },
        { weight: 5.0, name: "Snow" },
    ],
    plains: [
        { weight: 2.0, name: "Heath clear" },
        { weight: 0.4, name: "Misty" },
        { weight: 0.4, name: "LightRain" },
    ],
    ocean: [
        { weight: 0.1, name: "Rain" },
        { weight: 0.1, name: "LightRain" },
        { weight: 0.1, name: "Misty" },
        { weight: 1.0, name: "Clear" },
        { weight: 0.1, name: "ThunderStorm" },
    ],
    deepnorth: [
        { weight: 0.5, name: "Twilight Snowstorm" },
        { weight: 1.0, name: "Twilight Snow" },
        { weight: 1.0, name: "Twilight Clear" },
    ],
    ashlands: [
        { weight: 1.0, name: "Ashrain" },
    ],
    mistlands: [
        { weight: 1.0, name: "Darklands dark" },
    ],
};

const getWeather = (weathers, roll) => {
    const total = weathers.reduce((prev, curr) => prev + curr.weight, 0);
    const weight = total * roll;
    let sum = 0;
    for (let i = 0; i < weathers.length; i++) {
        sum += weathers[i].weight;
        if (weight < sum) return weathers[i].name;
    }
    return weathers[weathers.length - 1].name;
};

const addOctave = (time, octave, wind) => {
    const period = Math.floor(time / (WIND_PERIOD * 8 / octave));
    const rng = createRNG(period);
    wind.angle += rng.random() * 2 * Math.PI / octave;
    wind.intensity += (rng.random() - 0.5) / octave;
};

const getGlobalWind = (time) => {
    const wind = {
        angle: 0,
        intensity: 0.5
    };
    addOctave(time, 1, wind);
    addOctave(time, 2, wind);
    addOctave(time, 4, wind);
    addOctave(time, 8, wind);
    wind.intensity = Math.min(1, Math.max(0, wind.intensity));
    wind.angle = wind.angle * 180 / Math.PI;
    while (wind.angle > 180) wind.angle -= 360;
    return wind;
};

const secondsToTime = (secs) => {
    if (secs <= INTRO_TIME) return "Intro";
    secs = secs % DAY_LENGTH;
    const realSecs = secs * 24 * 3600 / DAY_LENGTH;
    const hours = Math.floor(realSecs / 3600);
    const minutes = Math.floor((realSecs - 3600 * hours) / 60);
    return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
};

const getBiome = (biome, weatherPeriod) => weatherPeriod < 3 ? data.intro : data[biome]; 

const getRng = (seed) => {
    const rng = createRNG(seed);
    return rng.randomRange();
};

const angle = (value) => {
    if (value < -22.5) value += 360;
    let min = -22.5;
    let max = 22.5;
    if (value > min && value <= max) return "North";
    min += -45;
    max += 45;
    if (value > min && value <= max) return "NE";
    min += -45;
    max += 45;
    if (value > min && value <= max) return "East";
    min += -45;
    max += 45;
    if (value > min && value <= max) return "SE";
    min += -45;
    max += 45;
    if (value > min && value <= max) return "South";
    min += -45;
    max += 45;
    if (value > min && value <= max) return "SW";
    min += -45;
    max += 45;
    if (value > min && value <= max) return "West";
    min += -45;
    max += 45;
    if (value > min && value <= max) return "NW";
    return "ERROR";
};

const percent = (value) => (100 * value).toFixed(0) + "&nbsp;%";

const addCell = (id, value) => $("#" + id).append("<td>" + value + "</td>");

const forecastWind = (day) => {
    const startTime = Math.max(INTRO_TIME - WIND_PERIOD, day * DAY_LENGTH);
    const endTime = (day + 1) * DAY_LENGTH;
    let index = 1;
    for (let time = startTime; time < endTime; index++) {
        const windPeriod = Math.floor(time / WIND_PERIOD);
        const wind = getGlobalWind(time);
        const weatherPeriod = Math.floor(time / WEATHER_PERIOD);
        const weatherRoll = getRng(weatherPeriod);
        
        let header = secondsToTime(time);
        if (index === (day === 1 ? 2 : 1)) header = "Day " + day;
        addCell("wind_time", header);
        addCell("wind_angle", angle(wind.angle));
        addCell("wind_degrees", wind.angle.toFixed(0) + "&#176;");
        addCell("wind_intensity", percent(wind.intensity));
        Object.keys(data).forEach(biome => {
            const weather = getWeather(getBiome(biome, weatherPeriod), weatherRoll);
            const { windMin, windMax } = weathers[weather];
            const intensity = windMin + (windMax - windMin) * wind.intensity;
            addCell("wind_" + biome, percent(intensity));
        });
        
        if (time < INTRO_TIME) time = INTRO_TIME;
        else time = Math.min((windPeriod + 1) * WIND_PERIOD, (weatherPeriod + 1) * WEATHER_PERIOD);
    }
    $("#wind_time_" + (day === 1 ? 2 : 1)).text("Day " + day);
};

const forecastWeather = (day) => {
    const startTime = Math.max(INTRO_TIME - WEATHER_PERIOD, day * DAY_LENGTH);
    const endTime = (day + 1) * DAY_LENGTH;
    let index = 1;
    for (let time = startTime; time < endTime; index++) {
        const weatherPeriod = Math.floor(time / WEATHER_PERIOD);
        const roll = getRng(weatherPeriod);
        let header = secondsToTime(time);
        if (index === (day === 1 ? 2 : 1)) header = "Day " + day;
        addCell("weather_time", header);
        addCell("weather_debug",  roll.toFixed(2));
        Object.keys(data).forEach(biome => {
            const weather = getWeather(getBiome(biome, weatherPeriod), roll);
            addCell("weather_" + biome,  weather);
        });
        if (time < INTRO_TIME) time = INTRO_TIME;
        else time = (weatherPeriod + 1) * WEATHER_PERIOD
    }
};

const forecast = () => {
    $("tr").find("td").not(':first-child').remove();
    const day = Math.max(0, Number($("#day").val()));
    forecastWeather(day);
    forecastWind(day);
};

$(document).ready(function () {
    $("#run").on('click', forecast)
    $("#day").on('change', forecast)
    forecast();
});
