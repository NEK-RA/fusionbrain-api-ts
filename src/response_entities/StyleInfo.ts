/**
 * Class for entries in response about available styles
 */
export class StyleInfo{
    /** name to be used as value in requests */
    readonly name: string;
    /** title goes in russian, titleEn in english */
    readonly title: string;
    readonly titleEn: string;
    /** image is url to cover/preview of style */
    readonly image: string;

    /**
     * Constructor is private, because object creation is performed with `create` method with checking necessary fields
     * @param {string} name 
     * @param {string} title 
     * @param {string} titleEn 
     * @param {string} image 
     */
    private constructor(name: string, title: string, titleEn: string, image: string){
        this.name = name;
        this.title = title;
        this.titleEn = titleEn;
        this.image = image;
    }

    /**
     * Static method to create instance from JSON parsed object
     * Required fields are strings: name, title, titleEn, image
     * Throws TypeError if any of necessary fields are missing or have wrong types
     * @param {any} jsonObject 
     * @returns {StyleInfo}
     */
    public static create(jsonObject: any){
        const nameOk = ("name" in jsonObject) && (typeof(jsonObject.name) === "string");
        const titleOk = ("title" in jsonObject) && (typeof(jsonObject.title) === "string");
        const titleEnOk = ("titleEn" in jsonObject) && (typeof(jsonObject.titleEn) === "string");
        const imageOk = ("image" in jsonObject) && (typeof(jsonObject.image) === "string");

        if(nameOk && titleOk && titleEnOk && imageOk){
            return new StyleInfo(
                jsonObject.name,
                jsonObject.title,
                jsonObject.titleEn,
                jsonObject.image
            )
        }else{
            throw new TypeError(`
StyleInfo.create: passed object doesn't match required structure:
name (string) - ${nameOk ? "found" : "missing"}
title (string) - ${titleOk ? "found" : "missing"}
titleEn (string) - ${titleEnOk ? "found" : "missing"}
image (string) - ${imageOk ? "found" : "missing"}
`.trim());
        }
    }
}