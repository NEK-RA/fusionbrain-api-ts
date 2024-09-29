# fusionbrain-api-ts

A JavaScript/TypeScript client library for https://fusionbrain.ai/ using their official API

<p align=center>
  <img src="./dancing_cat.webp" width=300px>
</p>

## Disclaimer

Official API docs presented at https://fusionbrain.ai/docs/en/doc/api-dokumentaciya/. As there mentioned in August 2024:

> At the moment, this section is functioning in **beta**.

It means anything can change at any moment and there's no guarantees that changes won't break the package.

There is missing some info in docs as well, but this will be described in [Nuances](#nuances)

# Installation

You can install with:

```bash
npm install fusionbrain-api
```

The only runtime dependency is [axios](https://npm.im/axios) package, which was chosen due to compatibility with both browsers and NodeJS environment.

# Usage

Before the start, to use API you need to:
- sign up at [website](https://fusionbrain.ai/en/)
- visit [API section](https://fusionbrain.ai/en/keys/) and create pair of API key and Secret key. You can [check details](https://fusionbrain.ai/docs/en/doc/poshagovaya-instrukciya-po-upravleniu-api-kluchami/) if needed.
- save keys pair, you will need to specify them to use library

## Complete example

```js
// NodeJS part is only to save image to file
// import { writeFile } from "node:fs/promises";
// import { FusionBrain } from "fusionbrain-api";
const { writeFile } = require("node:fs/promises");
const { FusionBrain } = require("fusionbrain-api");

const pause = (ms) => new Promise(r => setTimeout(r, ms));

const fb = new FusionBrain("api key", "secret key");

(async() => {
    // load and show models
    const models = await fb.getModels();
    console.log(`Models: ${models.map(item => item.name).join(", ")}`);

    // load and show styles
    let styles = await fb.getStyles();
    console.log(`Styles: ${styles.map(item => item.name).join(", ")}`);
    
    // check model readiness
    let kandinsky = models[0].id;
    if(await fb.isReady(kandinsky)){
        // save prompt as constant to use later as filename
        const prompt = "Dancing cat";
        // request generation and show task uuid
        let generation = await fb.generate(kandinsky, prompt, {
            style: styles[1].name
        });
        if(generation.accepted === true){
            let task = generation.task;
            console.log(`Task uuid: ${task.uuid}`);
            // wait for ~15 seconds then check periodicaly
            await pause(10 * 1000);
            while(!task.isFinished()){
                await pause(5 * 1000);
                task = await fb.checkTask(task.uuid);
            }
    
            // when generation finished and success, save it to file
            if(task.isSuccess()){
                let imgBuf = Buffer.from(task.images[0], "base64");
                await writeFile(`${prompt} (${models[0].name}, ${styles[1].titleEn}, ${task.uuid}).jpg`, imgBuf);
            }
        }else{
            console.log(`Generation rejected with next response:\n${generation.reason}`);
        }
    }
})();
```

## Create API client

```js
import { FusionBrain } from "fusionbrain-api"

const client = new FusionBrain("API key", "Secret key");
```

If you have compatible API endpoint, you can specify it as 3rd argument:

```js
import { FusionBrain } from "fusionbrain-api"

const client = new FusionBrain("API key", "Secret key", "Custom endpoint");
```

## Fetch available models

```js
// assuming you've created client
const models = await client.getModels();
```

Right now (August 2024) there's only one model (previous versions of Kandinsky not provided), so reply is:

```json
[
  {
    "id": 4,
    "name": "Kandinsky",
    "version": 3.1,
    "type": "TEXT2IMAGE"
  }
]
```

This covered with `ModelInfo` class in case you will need it typed for any reasons. Model's `id` is the only part of these objects required for image generation.

## Fetch available styles

```js
// assuming you've created client
const models = await client.getStyles();
```

Right now (August 2024) they are:

```json
[
  {
    "name": "KANDINSKY",
    "title": "Кандинский",
    "titleEn": "Kandinsky",
    "image": "https://cdn.fusionbrain.ai/static/download/img-style-kandinsky.png"
  },
  {
    "name": "UHD",
    "title": "Детальное фото",
    "titleEn": "Detailed photo",
    "image": "https://cdn.fusionbrain.ai/static/download/img-style-detail-photo.png"
  },
  {
    "name": "ANIME",
    "title": "Аниме",
    "titleEn": "Anime",
    "image": "https://cdn.fusionbrain.ai/static/download/img-style-anime.png"
  },
  {
    "name": "DEFAULT",
    "title": "Свой стиль",
    "titleEn": "No style",
    "image": "https://cdn.fusionbrain.ai/static/download/img-style-personal.png"
  }
]
```

These are covered with `StyleInfo` class in case you will need it typed for any reasons. Part which participate in generation is `name` field. Field `title` goes in Russian, while `titleEn` goes in english. Field `image` is provided for case if you going to make custom frontend and show preview of style.

## Check model availability

API docs mention that model may be unavailable due to high demand and it's the only value shown for status. During development it was always available (status `ACTIVE`), so other states are almost unknown.

```js
// assuming you've created client and got models list
const kandinsky = models[0].id;
if(await client.isReady(kandinsky)){
  // do whatever you want
}
```

By default it returns just `true` (if status is `ACTIVE`) or `false` in other cases. If you need more details, then pass `true` as second argument:

```js
// assuming you've created client and got models list
const kandinsky = models[0].id;
try{
  if(await client.isReady(kandinsky)){
    // do whatever you want
  }
}catch(err){
  if(err.code == FusionBrainErrorCode.MODEL_NOT_READY){
    console.log(err.body);
  }
}
```

In this case `FusionBrainError` will be thrown with response body in `body` field of error object.

## Image generation

Short form:

```js
// assuming you've created client and got models list
const kandinsky = models[0].id;
let generation = await client.generate(kandinsky, "Dancing cat");
```

In this case you need to specify only model and prompt. Other options are default: no style, 768x768 size, empty negative prompt. If you need to provide style, size and negative prompt - you need to pass an object with necessary options as third argument:

```js
// assuming you've created client and got models list
const kandinsky = models[0].id;
let generation = await client.generate(kandinsky, "Dancing cat", {
  style: "UHD",
  negative: "blur",
  width: 1024,
  heigh: 512
});
```

**Notice:** despite the fact that prompt options provide ability to specify amount of images, only 1 is possible as of August 2024. [See the docs for `numImages` info](#disclaimer) before using it.

`generate` method can return `Generation` object which has `accepted` field and depending on it's value there will be `task` field (if `true`) or `reason` (if false):

```js
// generation variable is result of previous `generate`:
if(generation.accepted === true){
  // here is `task` field available
  console.log(generation.task.uuid);
}else{
  // here is `reason` field available
  console.log(generation.reason);
}

```

## Get image result

Generation takes some time, so at first you receive taks's `uuid` and then use it later to fetch actual task status

```js
// assuming you've requested generation and it was accepted
let task = generation.task;
task = await client.checkTask(task.uuid);
// see if you received requested image
if(task.isSuccess()){
    doSomething(task.images[0]);
}
```

Method `isSuccess` checks few moments:

- if field `status` is `"DONE"`
- if field `censored` is `false`
- if field `images` presented in response

Images are provided as array of base64 encoded `image/jpeg` pictures. You can use them further to show via HTML:

```js
function makeImgTag(base64img){
    return `<img src="data:image/jpeg;base64,${base64img}">`
}
```

Or save to disk:

```js
import * as fs from "node:fs/promises";
// created client, created task
// waited for completion, checked for success
let imgBuf = Buffer.from(task.images[0], "base64");
await fs.writeFile(`${task.uuid}.jpg`, imgBuf);
```

**Notice**: generation result deleted from server after first fetch of final result. On next check `FusionBrainError` will be thrown because request for task status will return HTTP status code 404. See more in [nuances](#nuances)

## About errors

There's presented `FusionBrainError` class, which has `code` field and it's value is one of `FusionBrainErrorCode` enum values.

### Expected errors

- **Unauthorized** (HTTP status 401), value of `code` field equals to `FusionBrainErrorCode.UNAUTHORIZED`. It may appear on any request except fetching styles (which has separate URL without authentication)
- **Generation expired** (HTTP status 404), value of `code` field equals to `FusionBrainErrorCode.EXPIRED`. It may appear on `checkTask` usage if you have already received final result before
- **Too long prompts or Bad request** (HTTP status 400), value of `code` field equals to `FusionBrainErrorCode.LONG_PROMPT_OR_BAD_REQUEST`. It may appear on `generate` usage, if text description (prompt + negative prompt) are too long. **In any other case this is unexpected**

### Unexpected errors

These are mentioned in docs, but not expected to appear in current implementation:

- **Bad request** (mentined above). Unexpected everywhere except `generation` request. If prompts are short and this error appears, then it's unexpected case
- **Unsupported media** (HTTP status 415). Unexpected everywhere. Appeared during development when there were not explicitly specified `Content-Type` header for generation params in multipart from of POST request. Value of `code` field equals to `FusionBrainErrorCode.UNEXPECTED`
- **Any other error** - no other error expected to be caused by client side

# Nuances

## Rate limits

Docs has no info about that, so unknown.

## Image expiration

The most important in terms of usage is how long generation exist on service. Docs doesn't contain any info about this. During development I've figured out few moments:

- Generation rarely takes less than 15 seconds, usually it's close to 30 seconds, and sometimes goes longer
- When you receive finished generation (status either DONE or FAIL) it's no more presented on server. So any further check of status will give `404 Not Found`
- Maximum time which you can wait to be 100% sure that you will fetch finished generation is unknown. I've made few attempts to figure this out by running and waiting some time. 
  - At one attempt I've faced expiration after 500 seconds, however another generation one was presented after 490 seconds. 
  - At another attempt I've faced expiration after 340 seconds already
  - At next attempt expiration was faced after 290 seconds 

So seems like expiration time may vary and it's better to check periodicaly, rather than waiting for long time expecting that "it will definitely be ready after that much time".

## Amount of images

Right now (August 2024) according to docs:

> You can only request 1 image at a time for the same request.

Interesting thing is that this option presented at all, because the only possible value for now is 1. Moreover it is not required for successfull generation. 

Since it's presented, probably it may be changed in near future. That's why I've left ability to specify amount of images, if FusionBrain will provide ability to request more than 1 image at once without breaking changes in other parts of API.