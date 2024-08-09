/**
 * Set of arguments for image generation
 */
export class Prompt{
    /** Numeric ID of model, can be obtained from particular ModelInfo object in array fetched by `FusionBrain.getModels` method */
    model_id: number;
    /** Style for generation, can be obtained from particular StyleInfo object in array fetched by `FusionBrain.getStyles` method */
    style: string;
    /** Text prompt */
    prompt: string;
    /** Negative prompt */
    negativePrompt: string;
    /** Width and height of image, multiples of 64 are recommended for each side for better results */
    width: number;
    height: number;
    /** According to docs, only 1 is possible for now */
    amount: number;

    /**
     * Full constructor for prompt, allows to specify all available options like size, style, etc
     * @param {number} model_id 
     * @param {string} style 
     * @param {string} prompt 
     * @param {string} negativePrompt 
     * @param {number} width 
     * @param {number} height 
     * @param {number} amount - optional, according to docs it's always 1, but left possible to specify if anything will change 
     */
    public constructor(model_id: number, style: string, prompt: string, negativePrompt: string, width: number, height: number, amount: number = 1){
        this.model_id = model_id;
        this.prompt = prompt;
        this.style = style;
        this.negativePrompt = negativePrompt;
        this.width = width;
        this.height = height;
        this.amount = amount;
    }

    public static makeDefault(model_id: number, prompt: string): Prompt{
        return new Prompt(
            model_id, 
            "DEFAULT",
            prompt,
            "",
            1024,
            1024
        );
    }
    
}