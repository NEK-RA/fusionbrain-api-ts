import { AxiosError } from "axios";

/** Few values to compare with error code from FusionBrainError instance */
export enum FusionBrainErrorCode{
    EXPIRED,
    UNAUTHORIZED,
    LONG_PROMPT_OR_BAD_REQUEST,
    UNSUPPORTED_MEDIA,
    UNEXPECTED
};

/**
 * Class to cover HTTP errors which are expected (or not) to happen.
 * Includes read-only field `code`, which can be compared with values from FusionBrainErrorCode enum. 
 * @see {@link FusionBrainErrorCode}
 */
export class FusionBrainError extends Error{
    readonly code: FusionBrainErrorCode;

    /**
     * Constructor which sets predefined error code for instance.
     * @param {string} message 
     * @param {FusionBrainErrorCode} code - one of the values from FusionBrainErrorCode enum
     */
    constructor(message: string, code: FusionBrainErrorCode){
        super(message);
        this.code = code;
    }
    
    /**
     * Predefined for any unexpected HTTP errors.
     * Provides info about HTTP error faced and response body, as well as add's error stack for details.
     * @param {string} methodName 
     * @param {AxiosError} err 
     * @returns {FusionBrainError}
     */
    public static unexpected(methodName: string, err: AxiosError){
        const detailed = new FusionBrainError(`${methodName}: ${err.message}:\n${JSON.stringify(err.response?.data)}`, FusionBrainErrorCode.UNEXPECTED);
        detailed.stack += `Caused by: ${err.stack}`;
        return detailed;
    }

    /**
     * For case when missing api or secret key, or any of them have typo.
     * May appear on any request, except requesting available styles (which has separate URL and doesn't require auth).
     * @param {string} methodName 
     * @returns {FusionBrainError}
     */
    public static unauthorized(methodName: string){
        return new FusionBrainError(`${methodName}: Request failed with Unauthorized error. Ensure you've provided correct api and secret keys.`, FusionBrainErrorCode.UNAUTHORIZED);
    }

    /**
     * For case when generation task is already expired and removed from server (server replies with 404 code).
     * @param {string} methodName 
     * @returns {FusionBrainError}
     */
    public static taskExpired(methodName: string){
        return new FusionBrainError(`${methodName}: task is expired and removed already`, FusionBrainErrorCode.EXPIRED);
    }

    /**
     * May appear if text description (prompt + negative prompt) is too long.
     * If it's not the case, then most likely API changed and library is outdated.
     * @param {string} methodName 
     * @returns {FusionBrainError}
     */
    public static tooLongPromptsOrBadRequest(methodName: string){
        return new FusionBrainError(`${methodName}: most likely prompt (+ negative prompt) are too long. If they're short, then this error may mean that API changed and library needs for update`, FusionBrainErrorCode.LONG_PROMPT_OR_BAD_REQUEST);
    }

    /**
     * Appeared during checks of API only when `Content-Type: application/json` were not specified explicitly
     * for multipart form parameter (generation params). Fixed with using Blob, to make it work properly.
     * If it appears again, then most likely API changed and library is outdated.
     * @param {string} methodName 
     * @returns {FusionBrainError}
     */
    public static unsupportedMedia(methodName: string){
        return new FusionBrainError(`${methodName}: Seems like API changed and library needs for update`, FusionBrainErrorCode.UNSUPPORTED_MEDIA);
    }

};