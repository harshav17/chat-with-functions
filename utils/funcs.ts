import { HfInference } from '@huggingface/inference'
const hf = new HfInference(process.env.HF_API_KEY)
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import {
    getSignedUrl,
  } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.REGION!;
const s3Client = new S3Client({ region: REGION });

type weatherProps = {
    lat: number;
    lon: number;
}
export async function getCurrentWeather(props: weatherProps) {
    const { lat, lon } = props;
    const URL = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${process.env.OPEN_WEATHER_API_KEY}`
    console.log(URL)
    const res = await fetch(URL)
    const data = await res.json();
    return JSON.stringify({
        temp: data.current.temp,
        feels_like: data.current.feels_like,
        humidity: data.current.humidity,
        wind_speed: data.current.wind_speed,
    });
}

type decimalProps = {
    value1: number;
    value2: number;
}
export function addDecimalValues(props: decimalProps) {
    const { value1, value2 } = props;
    let result = value1 + value2;
    console.log(value1 + " + " + value2 + " = " + result + " (decimal)");

    return value1 + " + " + value2 + " = " + result + " (decimal)";
}


type hexadecimalProps = {
    value1: string;
    value2: string;
}
export function addHexadecimalValues(props: hexadecimalProps) {
    const { value1, value2 } = props;
    let decimal1 = parseInt(value1, 16);
    let decimal2 = parseInt(value2, 16);

    let result = (decimal1 + decimal2).toString(16);
    console.log(value1 + " + " + value2 + " = " + result + " (hex)");
    
    return value1 + " + " + value2 + " = " + result + " (hex)";
}

/**
 * goes to backend quotes store and gets a bunch of quotes
 * @returns 
 */
export async function getQuotes() {
    const URL = `${process.env.BACKEND_URL}/quotes`;
    const res = await fetch(URL)
    const data = await res.json();
    return data;
}

type generateImageProps = {
    prompt: string;
    negativePrompt: string;
}

export async function generateImage(props: generateImageProps) {
    const { prompt, negativePrompt } = props;
    console.log("prompt: " + prompt);
    console.log("negativePrompt: " + negativePrompt);
    const blob = await hf.textToImage({
        inputs: prompt,
        model: 'stabilityai/stable-diffusion-2',
        parameters: {
          negative_prompt: negativePrompt,
        }
    });

    const filename = "page1.png";
    const uploadedImage = await uploadImageToS3(filename, blob);
    const url = await createPresignedUrlWithClient({ region: REGION, bucket: process.env.AWS_BUCKET_NAME ?? "", key: filename })
    console.log(url);
    return url;
}

async function uploadImageToS3(filename: string, blob: Blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME ?? "",
        Key: filename,
        Body: buffer,
    });

    return s3Client.send(command);
}

type presignedURLProps = {
    region: string;
    bucket: string;
    key: string;
}
const createPresignedUrlWithClient = ({ bucket, key }: presignedURLProps) => {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const functionsForModel: ChatFunction[] = [
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
    },
    {
        name: "addDecimalValues",
        description: "Add two decimal values",
        parameters: {
            type: "object",
            properties: {
                value1: {
                    type: "number",
                    description: "The first decimal value to add. For example, 5",
                },
                value2: {
                    type: "number",
                    description: "The second decimal value to add. For example, 10",
                },
            },
            required: ["value1", "value2"],
        },
    },
    {
        name: "addHexadecimalValues",
        description: "Add two hexadecimal values",
        parameters: {
            type: "object",
            properties: {
                value1: {
                    type: "string",
                    description: "The first hexadecimal value to add. For example, 5",
                },
                value2: {
                    type: "string",
                    description: "The second hexadecimal value to add. For example, A",
                },
            },
            required: ["value1", "value2"],
        },
    },
    {
        name: "getQuotes",
        description: "Get computer science quotes",
        parameters: {
            type: "object",
            properties: {
                value1: {
                    type: "string",
                    description: "Type of quote to get. For example, 'all'",
                },
            },
            required: [],
        },
    },
    {
        name: "generateImage",
        description: "Generate an image from a prompt",
        parameters: {
            type: "object",
            properties: {
                prompt: {
                    type: "string",
                    description: "Prompt to generate image from. This prompt needs to as detailed as possible. Multiple sentences are preferred.",
                },
                negativePrompt: {
                    type: "string",
                    description: "Negative prompt to generate image from. For example, 'a dog'",
                },
            },
            required: ["prompt"],
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
    } | undefined,
}