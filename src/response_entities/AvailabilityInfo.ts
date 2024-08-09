/**
 * Class for model availability response.
 * Known values for status are: ACTIVE, DISABLED_BY_QUEUE
 * You can use `isReady` method to quick check if status is ACTIVE
 */
export class AvailabilityInfo{
    /** DISABLED_BY_QUEUE is taken from docs */
    static readonly DISABLED_BY_QUEUE = "DISABLED_BY_QUEUE";
    /** ACTIVE is taken from availability check during development */
    static readonly ACTIVE: string = "ACTIVE";
    /** Other values of model status are unknown */
    readonly status: string;


    /**
     * Constructor is private because object creation is performed with `create` method with checking necessary fields
     * @param  {string} status 
     */
    private constructor(status: string){
        this.status = status;
    }

    /**
     * Static method to create instance from JSON parsed object
     * Required field is either:
     * - string: status
     * or
     * - string: model_status
     * Field "model_status" mentioned as response to generation request when queue is filled and model not ready to use
     * However "status" is the only field presented in responses of model checks
     * Throws TypeError if missing any necessary fields or have wrong types for them
     * @param {any} jsonObject 
     * @returns {boolean}
     */
    public static create(jsonObject: any): AvailabilityInfo{
        const statusOk = ("status" in jsonObject) && (typeof(jsonObject.status) === "string");
        const modelStatusOk = ("model_status" in jsonObject) && (typeof(jsonObject.model_status) === "string");
        if(statusOk){
            return new AvailabilityInfo(jsonObject.status);
        }else if(modelStatusOk){
            return new AvailabilityInfo(jsonObject.model_status);
        }else{
            throw new TypeError(`
AvailabilityInfo.create: passed object doesn't match required structure:
status (string) - ${statusOk ? "found" : "missing"}
            `.trim());
        }
    }

    /**
     * Shortcut for check if current model status is ACTIVE
     * @returns {boolean}
     */
    public isReady(): boolean{
        return this.status == AvailabilityInfo.ACTIVE;
    }

}