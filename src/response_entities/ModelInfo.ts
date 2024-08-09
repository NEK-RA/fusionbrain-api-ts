/**
 * Class for entries in response about available models
 */
export class ModelInfo{
    /** Model id */
    readonly id: number;
    /** Model name */
    readonly name: string;
    /** Model version, both docs and actual responses give float number */
    readonly version: number;
    /** Model type, "TEXT2IMAGE" is the only one value mentioned in docs */
    readonly type: string;

    /**
     * Constructor is private, because object creation is performed with `create` method with checking necessary fields
     * @param {number} id 
     * @param {string} name 
     * @param {number} version 
     * @param {string} type 
     */
    private constructor(id: number, name: string, version: number, type: string){
        this.id = id;
        this.name = name;
        this.version = version;
        this.type = type;
    }

    /**
     * Static method to create instance from JSON parsed object
     * Required fields are:
     * - number: id, version 
     * - string: name, type
     * Throws TypeError if any of necessary fields are missing or have wrong types
     * @param {any} jsonObject 
     * @returns {ModelInfo}
     */
    public static create(jsonObject: any): ModelInfo{
        const idOk = ("id" in jsonObject) && (typeof(jsonObject.id) === "number");
        const nameOk = ("name" in jsonObject) && (typeof(jsonObject.name) === "string");
        const versionOk = ("version" in jsonObject) && (typeof(jsonObject.version) === "number");
        const typeOk = ("type" in jsonObject) && (typeof(jsonObject.type) === "string");
        if(idOk && nameOk && versionOk && typeOk){
            return new ModelInfo(
                jsonObject.id,
                jsonObject.name,
                jsonObject.number,
                jsonObject.type
            );
        }else{
            throw new TypeError(`
ModelInfo.create: passed object doesn't match required structure:
id (number) - ${idOk ? "found" : "missing"}
name (string) - ${nameOk ? "found" : "missing"}
version (number) - ${versionOk ? "found" : "missing"}
type (string) - ${typeOk ? "found" : "missing"}
            `.trim());
        }
    }
}