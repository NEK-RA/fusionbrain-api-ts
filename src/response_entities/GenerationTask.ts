/**
 * Class for the responses of generation request and check status of task request.
 * You can use: 
 * - `isFinished` to check if generation finished (statuses DONE and FAIL)
 * - `isCensored` to check if prompt was censored or not
 * - `isSuccess` to check if you've got what you wanted (status DONE, not censored, contain images)
 */
export class GenerationTask{
    /** Statuses of generation task */
    public static readonly INITIAL: string = "INITIAL";
    public static readonly PROCESSING: string = "PROCESSING";
    public static readonly DONE: string = "DONE";
    public static readonly FAIL: string = "FAIL";

    /** Job's unique ID */
    readonly uuid: string;
    /** Current Job status */
    readonly status: string;
    /** Array of base64 images (without prefix of "image/jpeg;base64") */
    readonly images?: string[];
    /** Description of error if status FAIL */
    readonly errorDescription?: string;
    /** Is image censored or not */
    readonly censored?: boolean;
    /** Generation duration */
    readonly generationTime?: number;

    private constructor(uuid: string, status: string, images?: string[], errorDescription?: string, censored?: boolean, generationTime?: number){
        this.uuid = uuid;
        this.status = status;
        this.images = images;
        this.errorDescription = errorDescription;
        this.censored = censored;
        this.generationTime = generationTime;
    }

    /**
     * Static method to create instance from JSON parsed object
     * Required fields are:
     * - string: uuid, status
     * These are the only 2 fields returned by generation request
     * 
     * Unnecessary fields are:
     * - string[]: images
     * - string: errorDescription
     * - boolean: censored
     * - number: generationTime
     * Censored value appears on all requests to check generation task status
     * Other fields appears in response depending on status:
     * - DONE: brings images and generationTime
     * - FAIL: brings errorDescription instead
     * Throws TypeError if missing necessary fields or have wrong types for them
     * @param {any} jsonObject 
     * @returns {GenerationTask}
     */
    public static create(jsonObject: any): GenerationTask{
        const data = {
            uuid: "",
            status: "",
            images: undefined,
            errorDescription: undefined,
            censored: undefined,
            generationTime: undefined
        };
        // necessary part
        const uuidOk = ("uuid" in jsonObject) && (typeof(jsonObject.uuid) == "string");
        const statusOk = ("status" in jsonObject) && (typeof(jsonObject.status) == "string");
        if(!(uuidOk && statusOk)){
            throw new TypeError(`
GenerationTask.create: passed object doesn't match required structure:
uuid (string) - ${uuidOk ? "found" : "missing"}
status (string) - ${statusOk ? "found" : "missing"}
            `.trim());
        }
        data.uuid = jsonObject.uuid;
        data.status = jsonObject.status;
        // unnecessary part
        if("images" in jsonObject){
            const imgArray = Array.isArray(jsonObject.images);
            if(imgArray && jsonObject.images.length > 0){
                if(typeof(jsonObject.images[0]) === "string"){
                    data.images = jsonObject.images;
                }
            }
        }
        if("errorDescription" in jsonObject && typeof(jsonObject.errorDescription) === "string"){
            data.errorDescription = jsonObject.errorDescription;
        }
        if("censored" in jsonObject && typeof(jsonObject.censored) === "boolean"){
            data.censored = jsonObject.censored;
        }
        if("generationTime" in jsonObject && typeof(jsonObject.generationTime) === "number"){
            data.generationTime = jsonObject.generationTime;
        }

        return new GenerationTask(
            data.uuid,
            data.status,
            data.images,
            data.errorDescription,
            data.censored,
            data.generationTime
        )
    }

    /**
     * Check if status is DONE or FAIL
     * @returns {boolean}
     */
    public isFinished(): boolean{
        return this.status == GenerationTask.DONE || this.status == GenerationTask.FAIL;
    }

    /**
     * Check if censored set to true
     * @returns {boolean}
     */
    public isCensored(): boolean{
        return this.isFinished() && this.censored == true;
    }

    /**
     * Check if generation successful
     * When request is censored, FusionBrain still generate some neutral image (i.e. flower)
     * As result there will have both status DONE and image provided
     * So still need to check for `censored` field
     * @returns {boolean}
     */
    public isSuccess(): boolean{
        const done = this.status == GenerationTask.DONE;
        const notCensored = !this.isCensored();
        const gotImages = this.images != undefined;
        if(done && notCensored && gotImages){
            return this.images.length > 0;
        }
        return false;
    }
}