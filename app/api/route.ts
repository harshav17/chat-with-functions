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
  const writePromises: Promise<void>[] = [];

  const handleOpenaiResponse = async (openaiRes: any) => {
    let functionCalls: any[] = [];
    let currentFunctionCallName = "";
    let isRecursiveCall = false;

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
            writePromises.push(writer.write(encoder.encode(`data:${parsed.choices[0].delta.content}\n\n`)));
            //await writer.write(encoder.encode(`data:${parsed.choices[0].delta.content}\n\n`));
          } else if (parsed.choices[0].delta.function_call) {
            console.log("inside function call" + parsed.choices[0].delta.function_call.name)
            const functionCall = parsed.choices[0].delta.function_call

            if (functionCall.name) {
              currentFunctionCallName = functionCall.name;
            }
            if (functionCall.arguments) {
              console.log("inside function argument" + functionCall.arguments)
              let existingFunctionCall = functionCalls.find(call => call.name === currentFunctionCallName);
              if (existingFunctionCall) {
                // If a function call with the same name already exists, append the args
                existingFunctionCall.argsString += functionCall.arguments;
              } else {
                // Otherwise, create a new function call
                functionCalls.push({
                  name: currentFunctionCallName,
                  argsString: functionCall.arguments || {},
                });
              }
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
      await Promise.all(writePromises);

      for (let functionCall of functionCalls) {
        const func = functionMap[functionCall.name];
        console.log("function call name" + func);
        if (func) {
          console.log("function call args" + functionCall.argsString);
          const args = JSON.parse(functionCall.argsString);
          const result = func(args);

          // TODO respond with better error
          res.push({
            role: "assistant",
            content: "none",
            function_call: {
              name: functionCall.name,
              arguments: JSON.stringify(args),
            },
          });
          res.push({
            role: "function",
            content: JSON.stringify(result),
            name: functionCall.name,
          });
          console.log(res);
          isRecursiveCall = true;
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
              console.log("after recalling openai")
            await handleOpenaiResponse(openaiRes);
          } catch (error) {
            console.error('An error occurred during OpenAI request', error);
            console.log("after error")
            writer.write(encoder.encode('An error occurred during OpenAI request'));
            console.log("after encode")
            writer.close();
            console.log("after write.close()")
          }
        }
      }
      if (!isRecursiveCall) {
        writer.close();
      }
    });
  }

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

    await handleOpenaiResponse(openaiRes);
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
const functionMap: { [key: string]: (args: any) => any } = {
  harshaAge: ({ a, b }: { a: number; b: number }) => harshaAge(a, b),
  // Add more functions here as needed
};

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
    name: 'harshaAge',
    description: 'Given 2 numbers, accurately gives harsha age',
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

function harshaAge(a: number, b: number): number {
  console.log('ageing', a, b)
  return 234;
}