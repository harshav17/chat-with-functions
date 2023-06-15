

/**
 * gives the current age of a person born on may 17th 1986, accurate to the millisecond
 */
export function harshaAge(): string {
    const birthDate = new Date(1986, 4, 17); // The month is zero-based, hence 4 represents May
    const now = new Date();

    const diffInSeconds = Math.abs(now.getTime() - birthDate.getTime()) / 1000;
    const years = Math.floor(diffInSeconds / (3600 * 24 * 365.25)); // Calculate years considering leap years
    const days = Math.floor((diffInSeconds / (3600 * 24)) % 365.25); // Calculate remaining days
    const hours = Math.floor((diffInSeconds / 3600) % 24); // Calculate remaining hours

    return `Age is ${years} years, ${days} days and ${hours} hours.`;
}

export async function getCurrentWeather(lat: number, lon: number) {
    const res = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=37.7749&lon=-122.4194&appid=ed6c827dfcd357db6df1144a1087a6e0`)
    const data = await res.json();
    return data;
}


export const functionsForModel: ChatFunction[] = [
    {
        name: 'harshaAge',
        description: 'Gives the current age of a Harsha',
        parameters: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
    {
        name: 'getCurrentWeather',
        description: 'Gives the current weather at a location',
        parameters: {
            type: 'object',
            properties: {
                lat: {
                    type: 'number',
                },
                lon: {
                    type: 'number',
                },
            },
            required: ['lat', 'lon'],
        },
    }
]

type ChatFunction = {
    name: string,
    description: string,
    parameters: {
        type: string,
        properties: any,
        required: string[],
    },
}