import { Task } from "./response_entities";

/**
 * Type to store API credentials
 */
export type InitConfig = {
    /** API key */
    readonly api: string;
    /** Secret key */
    readonly secret: string;
    /** API endpoint */
    readonly endpoint?: string;
};

/**
 * Type to store additional prompt options
 */
export type PromptOptions = {
    /** Style for generation, can be obtained from particular StyleInfo object in array fetched by `FusionBrain.getStyles` method */
    style?: string;
    /** Negative prompt */
    negative?: string;
    /** Width and height of image, multiples of 64 are recommended for each side for better results */
    width?: number;
    height?: number;
    /** According to docs, only 1 is possible for now. Provided for case if FusionBrain will allow it without breaking changes */
    amount?: number;
}

/**
 * Generation task union type for cases when it's accepted and rejected
 */
export type Generation = {accepted: true, task: Task} | {accepted: false, reason: string};