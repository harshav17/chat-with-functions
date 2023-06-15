## Demo
[Checkout it out!](https://www.loom.com/share/514ccedabecb414f80e79c1627c15df7?sid=3f6965ca-5413-441d-9b56-311349570d2a)

## Getting Started

Create .env.local in the root folder. Place the following vars
```
OPENAI_API_KEY=<>
MODEL=<>
```

First, run the development server:

```bash
npm run dev
```

## Create functions the GPT can use
Checkout utils/funcs.ts to see the currently available functions. 

1. `harshaAge`:
Get harsha's age. fun func to show case augementing GPT with data it doesn't have.

2. `getCurrentWeather`:
Given a lat and long, gets the current weather.
This uses OpenWeather API. Navigate to [OpenWeather](https://home.openweathermap.org/users/sign_in) to get yourself an account. Grab the API key and paste it in `.env.local`.
```
OPEN_WEATHER_API_KEY=<>
```

3. Want to write your own? All your need to do is the following...

    1. Navigate to `utils/funcs.ts` and write a new function.
    2. Make sure add `export` keyword to the function.
    3. Define function definition in `functionsForModel` property inside `utils/funcs.ts`.
    4. Chat away!