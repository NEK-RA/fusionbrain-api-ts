import axios, { AxiosError } from "axios";
import { Prompt } from "./Prompt";
import { ModelInfo, StyleInfo, AvailabilityInfo, GenerationTask } from "./response_entities";
import { FusionBrainError, FusionBrainErrorCode } from "./FusionBrainError";

/**
 * Type to store API credentials
 */
type InitConfig = {
    /** API key */
    readonly api: string;
    /** Secret key */
    readonly secret: string;
    /** API endpoint */
    readonly endpoint?: string;
};

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
     * @param {string} apiKey 
     * @param {string} secretKey 
     * @param {string} apiEndpoint - optional, by default set to "https://api-key.fusionbrain.ai"
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
     * @param {number} model_id - can be obtained from particular ModelInfo object
     * @returns {AvailabilityInfo}
     * @example
     * let status = await client.checkModel(4);
     * console.log(status.isReady()); // true if model_status is ACTIVE
     */
    public async checkModel(model_id: number): Promise<AvailabilityInfo>{
        try{
            const response = await axios.get(`${this.config.endpoint}/key/api/v1/text2image/availability?model_id=${model_id}`, {
                headers: {
                    "X-Key": `Key ${this.config.api}`,
                    "X-Secret": `Secret ${this.config.secret}`
                }
            });
            return AvailabilityInfo.create(response.data);
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
     * Request generation of image
     * Requires `Prompt` object which can be created in 2 ways:
     * - `new Prompt(...)` - with all options (model, prompt, etc)
     * - `Prompt.makeDefault(model_id, prompt)` - specify only model and prompt and leave other options with default values
     * With received GenerationTask object you can use:
     * - `isFinished` - checks if request already processed
     * - `isCensored` - checks if finished request censored or not
     * - `isSuccess` - checks if successfuly finished, were not censored and contain images in response
     * WARNING: GenerationTask is data object and can't update itself, @see {@link checkTask} to learn how to get updated status of task
     * @param {Prompt} options 
     * @returns {GenerationTask}
     */
    public async generate(options: Prompt): Promise<GenerationTask | AvailabilityInfo>{
        const params = {
            "type": "GENERATE",
            "style": options.style,
            "numImages": options.amount,
            "width": options.width,
            "height": options.height,
            "negativePromptUnclip": options.negativePrompt,
            "generateParams": {
                "query": options.prompt
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
        data.append("model_id", `${options.model_id}`);
        try{
            const response = await axios.post(`${this.config.endpoint}/key/api/v1/text2image/run`, data, {
                headers: {
                    "X-Key": `Key ${this.config.api}`,
                    "X-Secret": `Secret ${this.config.secret}`,
                    "Content-Type": "multipart/form-data"
                }
            });
            try{
                return GenerationTask.create(response.data);
            }catch(notGenerationTask){
                try{
                    return AvailabilityInfo.create(response.data);
                }catch(notAvailabilityInfo){
                    throw new FusionBrainError(`${(notGenerationTask as Error).message}\n${notAvailabilityInfo}`, FusionBrainErrorCode.UNEXPECTED);
                }
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
     * @param {string} uuid 
     * @returns {GenerationTask}
     * @example
     * let task = await client.generate(...);
     * // wait some time
     * task = await client.checkTask(task.uuid);
     * console.log(task.isSuccess()); // true if status DONE, not censored and contain images
     */
    public async checkTask(uuid: string): Promise<GenerationTask> {
        try{
            const response = await axios.get(`${this.config.endpoint}/key/api/v1/text2image/status/${uuid}`, {
                headers: {
                    "X-Key": `Key ${this.config.api}`,
                    "X-Secret": `Secret ${this.config.secret}`
                }
            });
            return GenerationTask.create(response.data);
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
     * Fetch available styles, @see {@link StyleInfo}
     * @returns {StyleInfo[]}
     */
    public async getStyles(): Promise<StyleInfo[]>{
        try{
            const response = await axios.get("http://cdn.fusionbrain.ai/static/styles/api");
            if(Array.isArray(response.data)){
                return response.data.map(obj => StyleInfo.create(obj));
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
     * Fetch available models, @see {@link ModelInfo}
     * @returns {ModelInfo[]}
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
                return response.data.map(obj => ModelInfo.create(obj));
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