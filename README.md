## Demo
[Checkout it out!](https://www.loom.com/share/7ba244f2ca3046b4b549d025ab52d6ad)

## Getting Started

Create .env.local in the root folder. Place the following vars.
```
OPENAI_API_KEY=<>
MODEL=<gpt-3.5-turbo-0613 OR gpt-4-0613>
```

First, run the development server:

```bash
npm run dev
```

## Create functions the GPT can use
Checkout [utils/funcs.ts](utils/funcs.ts) to see the currently available functions. Here's a hopefully up to date list. See demo above for usage hints.

1. `addDecimalValues`:
Adds two decimal values.

2. `addHexadecimalValues`:
Adds two hexadecimal values.

3. `getCurrentWeather`:
Given a lat and long, gets the current weather.
This uses OpenWeather API. Navigate to [OpenWeather](https://home.openweathermap.org/users/sign_in) to get yourself an account. Grab the API key and paste it in `.env.local`.
```
OPEN_WEATHER_API_KEY=<>
```

4. Want to write your own? All your need to do is the following...

    1. Navigate to [utils/funcs.ts](utils/funcs.ts) and write a new function.
    2. Make sure add `export` keyword to the function.
    3. Define function definition in `functionsForModel` property inside [utils/funcs.ts](utils/funcs.ts).
    4. Chat away!