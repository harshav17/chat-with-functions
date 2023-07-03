// app/api/route.ts
import { ChatCompletionResponseMessage, Configuration, OpenAIApi } from 'openai';
import { type NextRequest } from 'next/server'
import * as funcs from '@/utils/funcs';

export const runtime = 'nodejs';
// This is required to enable streaming
export const dynamic = 'force-dynamic';

async function callOpenAI(res: any, writeToStream: (data: any) => Promise<void>, closeWriter: (() => Promise<void>) | undefined) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  console.log("calling openai");
  let functionCalls: any[] = [];
  let currentFunctionCallName = "";

   // Create a new AbortController instance
   const controller = new AbortController();
   const signal = controller.signal;

  // Fetch the response from the OpenAI API with the signal from AbortController
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.MODEL!!,
      messages: res,
      max_tokens: 100,
      stream: true, // For streaming responses
      temperature: 0,
      functions: funcs.functionsForModel,
      function_call: "auto",
    }),
    signal, // Pass the signal to the fetch request
  });

  const reader = openaiRes.body!.getReader();
  const decoder = new TextDecoder("utf-8");
  while(true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log("done");
      break;
    }

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");
    const parsedLines: any = lines
        .map((line) => line.replace("data: ", "").trim()) // Remove the "data: " prefix
        .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
        .map((line) => {
          return JSON.parse(line)
        });
    
    for (const parsedLine of parsedLines) {
      const { content, function_call, finish_reason } = parsedLine.choices[0].delta;
      if (finish_reason) {
        console.log("finish_reason: " + finish_reason);
        break;
      } else if (content) {
        await writeToStream(content);
      } else if (function_call) {
        // collect function call info and recursively call openai
        if (function_call.name) {
          currentFunctionCallName = function_call.name;
        }
        if (function_call.arguments) {
          let existingFunctionCall = functionCalls.find(call => call.name === currentFunctionCallName);
          if (existingFunctionCall) {
            // If a function call with the same name already exists, append the args
            existingFunctionCall.argsString += function_call.arguments;
          } else {
            // Otherwise, create a new function call
            functionCalls.push({
              name: currentFunctionCallName,
              argsString: function_call.arguments || {},
            });
          }
        }
      }
    }
  }

  for (let functionCall of functionCalls) {
    const func =  (funcs as any)[String(functionCall.name)];
    if (func) {
      console.log("args: " + functionCall.argsString);
      const args = JSON.parse(functionCall.argsString);
      const funcRes = await func(args);

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
        content: JSON.stringify(funcRes),
        name: functionCall.name,
      });
      await callOpenAI(res, writeToStream, undefined);
    }
  }

  // close the writer after all recursive calls are done
  if (closeWriter) {
    await closeWriter();
  }
}

export async function POST(request: NextRequest) {
  const res = await request.json();

  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();
  const writePromises: Promise<void>[] = [];

  // callback function to write to the stream
  const writeToStream = async (data: any) => {
    writePromises.push(writer.write(encoder.encode(`data:${data}\n\n`)));
  };

  const closeWriter = async () => {
    console.log("closing writer");
    await Promise.all(writePromises);
    await writer.close();
  };

  callOpenAI(res, writeToStream, closeWriter);

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
      Connection: 'keep-alive',
    },
  });
}

