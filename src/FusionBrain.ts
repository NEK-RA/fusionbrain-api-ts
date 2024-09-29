import axios, { AxiosError } from "axios";
import { InitConfig, PromptOptions, Generation } from "./other_types";
import { ModelInfo, StyleInfo, Task } from "./response_entities";
import { FusionBrainError } from "./FusionBrainError";

/**
 * Class to interact with FusionBrain API
 */
export class FusionBrain{
    /** API key, Secret key and endpoint */
    readonly config: InitConfig;

    /**
     * Constructor of object which will interact with FusionBrain API
     * By default only API key and Secret key are required.
     * Ability to set endpoint provided for case if any other service will make compatible API
     * @param {string} apiKey       API key from service
     * @param {string} secretKey    Secret key from service 
     * @param {string} apiEndpoint  Optional custom endpoint, by default set to `https://api-key.fusionbrain.ai`
     */
    public constructor(apiKey: string, secretKey: string, apiEndpoint: string = "https://api-key.fusionbrain.ai"){
        this.config = {
            api: apiKey,
            secret: secretKey,
            endpoint: apiEndpoint 
        };
    }

    /**
     * Check current status of specified model
     * @param {number} model_id         can be obtained from particular ModelInfo object
     * @param {boolean} verbose_false   throw FusionBrainError instead of returning false if model not ready
     * @returns {boolean}               `true` if model is ready for usage, false if `verbose_false` omitted
     * @example
     * if(await client.isReady(model_id)){
     *   // model is ready for work, do what you need
     * }
     * @example
     * try{
     *   if(await client.isReady(model_id)){
     *     // do something
     *   }
     * }catch(err){
     *   if(err.code == FusionBrainErrorCode.MODEL_NOT_READY){
     *     console.log(err.body);
     *   }
     * }
     */
    public async isReady(model_id: number, verbose_false?: boolean): Promise<boolean>{
        try{
            const response = await axios.get(`${this.config.endpoint}/key/api/v1/text2image/availability?model_id=${model_id}`, {
                headers: {
                    "X-Key": `Key ${this.config.api}`,
                    "X-Secret": `Secret ${this.config.secret}`
                }
            });
            const statusOk = ("status" in response.data) && (response.data.status === "ACTIVE");
            const modelStatusOk = ("model_status" in response.data) && (response.data.model_status === "ACTIVE");
            if(statusOk || modelStatusOk){
                return true;
            }else{
                if(verbose_false){
                    throw FusionBrainError.modelNotReady("FusionBrain.checkModel", JSON.stringify(response.data));
                }else{
                    return false;
                }
            }
        }catch(err){
            if(err instanceof AxiosError){
                if(err.response?.status == 401){
                    throw FusionBrainError.unauthorized("FusionBrain.checkModel");
                }else{
                    throw FusionBrainError.unexpected("FusionBrain.checkModel", err);
                }
            }
            throw err;
        }
    }

    /**
     * Request generation of image. With received Task object you can use: `isFinished`, `isCensored`, `isSuccess`.
     * Task is data object and can't update itself, see {@link checkTask} to learn how to get updated status.
     * @param {number} model_id     Numeric id of model, can be obtained from {@link getModels}
     * @param {string} prompt       Describe what you want to see
     * @param {PromptOptions} options      Object, which includes fields: negative, style, width, height, amount* (see {@link PromptOptions} for details)
     * @returns {Generation}        Object with boolean `accepted` field and either `task` if request accepted, or `reason` string if rejected
     * @example
     * let generation = await client.generate(model, "prompt");
     * if(generation.accepted){
     *   console.log(generation.task.uuid);
     * }else{
     *   console.log(generation.reason);
     * }
     */
    public async generate(model_id: number, prompt: string, options?: PromptOptions): Promise<Generation>{
        const params = {
            "type": "GENERATE",
            "style": options?.style ?? "DEFAULT",
            "numImages": options?.amount ?? 1,
            "width": options?.width ?? 768,
            "height": options?.height ?? 768,
            "negativePromptUnclip": options?.negative ?? "",
            "generateParams": {
                "query": prompt
            }
        };
        // May be just nodejs-related
        // axios doesn't support serialization of Blob directly and suggested to use Buffer
        // but with FormData it works properly
        const data = new FormData();
        data.append("params", new Blob(
            [JSON.stringify(params)],
            {type: "application/json"}
        ));
        data.append("model_id", `${model_id}`);
        try{
            const response = await axios.post(`${this.config.endpoint}/key/api/v1/text2image/run`, data, {
                headers: {
                    "X-Key": `Key ${this.config.api}`,
                    "X-Secret": `Secret ${this.config.secret}`,
                    "Content-Type": "multipart/form-data"
                }
            });
            try{
                return {
                    accepted: true, 
                    task: Task.create(response.data)
                };
            }catch(notTask){
                return {
                    accepted: false,
                    reason: JSON.stringify(response.data)
                };
            }
        }catch(err){
            if(err instanceof AxiosError){
                switch(err.response?.status){
                    case 400:
                        throw FusionBrainError.tooLongPromptsOrBadRequest("FusionBrain.generate") 
                    case 401:
                        throw FusionBrainError.unauthorized("FusionBrain.generate");
                    case 415:
                        throw FusionBrainError.unsupportedMedia("FusionBrain.generate");
                    default:
                        throw FusionBrainError.unexpected("FusionBrain.generate", err);
                }
            }
            throw err;
        }
    }

    /**
     * Get the updated status of task
     * @param {string} uuid     Generation unique identifier
     * @returns {Task}          `Task` object with actual info
     * @example
     * let task = await client.generate(...);
     * // wait some time
     * task = await client.checkTask(task.uuid);
     * console.log(task.isSuccess()); // true if status DONE, not censored and contain images
     */
    public async checkTask(uuid: string): Promise<Task> {
        try{
            const response = await axios.get(`${this.config.endpoint}/key/api/v1/text2image/status/${uuid}`, {
                headers: {
                    "X-Key": `Key ${this.config.api}`,
                    "X-Secret": `Secret ${this.config.secret}`
                }
            });
            return Task.create(response.data);
        }catch(err){
            if(err instanceof AxiosError){
                switch(err.response?.status){
                    case 401:
                        throw FusionBrainError.unauthorized("FusionBrain.checkTask");
                    case 404:
                        throw FusionBrainError.taskExpired("FusionBrain.checkTask");
                    default:
                        throw FusionBrainError.unexpected("FusionBrain.checkTask", err);
                }
            }
            throw err;
        }
    }

    /**
     * Fetch available styles, each has `name` field which may be used for generation, `titleEn` as title and `image` as URL to preview
     * @see {@link StyleInfo}
     * @returns {StyleInfo[]}   Array of style objects
     */
    public async getStyles(): Promise<StyleInfo[]>{
        try{
            const response = await axios.get("http://cdn.fusionbrain.ai/static/styles/key");
            if(Array.isArray(response.data)){
                return response.data.map((obj: any) => StyleInfo.create(obj));
            }else{
                throw new TypeError(`FusionBrain.getStyles: Response expected to be array of objects, but non-array object received:\n${JSON.stringify(response.data)}`);
            }
        }catch(err){
            if(err instanceof AxiosError){
                throw FusionBrainError.unexpected("FusionBrain.checkModel", err);
            }
            throw err;
        }
    }

    /**
     * Fetch available models, each has `id` field which is necessary for generation, also `name`, `version` and `type`.
     * @see {@link ModelInfo}
     * @returns {ModelInfo[]}   Array of model objects
     */
    public async getModels(): Promise<ModelInfo[]>{
        try{
            const response = await axios.get(`${this.config.endpoint}/key/api/v1/models`, {
                headers: {
                    "X-Key": `Key ${this.config.api}`,
                    "X-Secret": `Secret ${this.config.secret}`
                }
            });
            if(Array.isArray(response.data)){
                return response.data.map((obj: any) => ModelInfo.create(obj));
            }else{
                throw new TypeError(`FusinBrain.getModels: Response expected to be array of objects, but non-array object received:\n${JSON.stringify(response.data)}`);
            }
        }catch(err){
            if(err instanceof AxiosError){
                if(err.response?.status == 401){
                    throw FusionBrainError.unauthorized("FusionBrain.checkModel");
                }else{
                    throw FusionBrainError.unexpected("FusionBrain.checkModel", err);
                }
            }
            throw err;
        }
    }
}