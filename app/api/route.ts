// app/api/route.ts
import { Configuration, OpenAIApi } from 'openai';
import { type NextRequest } from 'next/server'

export const runtime = 'nodejs';
// This is required to enable streaming
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const res = await request.json()
    console.log(res)

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  try {
    const openaiRes = await openai.createChatCompletion(
      {
        model: 'gpt-4-0613',
        max_tokens: 100,
        temperature: 0,
        stream: true,
        messages: res,
        functions: functionsForModel,
        function_call: "auto",
      },
      { responseType: 'stream' }
    );

    let functionName: string = "";

    // @ts-ignore
    openaiRes.data.on('data', async (data: Buffer) => {
      const lines = data
        .toString()
        .split('\n')
        .filter((line: string) => line.trim() !== '');
      for (const line of lines) {
        const message = line.replace(/^data: /, '');
        if (message === '[DONE]') {
          console.log('Stream completed');
          return;
        }
        try {
          const parsed = JSON.parse(message);
          if (parsed.choices[0].delta.content) {
            await writer.write(encoder.encode(`data:${parsed.choices[0].delta.content}\n\n`));
          } else if (parsed.choices[0].delta.function_call) {
            console.log("inside function call" + parsed.choices[0].delta.function_call.name)
            const functionCall = parsed.choices[0].delta.function_call

            if (functionCall.name) {
              console.log("inside function name")
              functionName = functionCall.name
            }
          }
        } catch (error) {
          console.error('Could not JSON parse stream message', message, error);
        }
      }
    });

    // @ts-ignore
    openaiRes.data.on('end', async () => {
      console.log('Stream ended');

      if (functionName === 'add') {
        const sum = add(1, 2)

        await writer.write(encoder.encode(`data:${sum}\n\n`));
      }

      writer.close();
    });

  } catch (error) {
    console.error('An error occurred during OpenAI request', error);
    writer.write(encoder.encode('An error occurred during OpenAI request'));
    writer.close();
  }

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}

type ChatFunction = {
    name: string,
    description: string,
    parameters: {
        type: string,
        properties: any,
        required: string[],
    },
}

const functionsForModel: ChatFunction[] = [
    {
        name: 'add',
        description: 'Adds two numbers together',
        parameters: {
            type: 'object',
            properties: {
                a: {
                    type: 'number',
                },
                b: {
                    type: 'number',
                },
            },
            required: ['a', 'b'],
        },
    },
]

function add(a: number, b: number): number {
  console.log('Adding', a, b)
    return a + b
}