import { AxiosError } from "axios";

/** Few values to compare with error code from FusionBrainError instance */
export enum FusionBrainErrorCode{
    EXPIRED,
    UNAUTHORIZED,
    LONG_PROMPT_OR_BAD_REQUEST,
    MODEL_NOT_READY,
    UNSUPPORTED_MEDIA,
    UNEXPECTED
};

/**
 * Class to cover HTTP and other errors which are expected (or not) to happen.
 * Includes read-only field `code`, which can be compared with values from FusionBrainErrorCode enum.
 * If `code` equals to `FusionBrainErrorCode.MODEL_NOT_READY` or `FusionBrainErrorCode.UNEXPECTED`, then also `body` field presented, which contain HTTP response body
 */
export class FusionBrainError extends Error{
    readonly code: FusionBrainErrorCode;
    readonly body?: string;
    /**
     * Constructor which sets predefined error code for instance.
     * @param {string} message              Description of error
     * @param {FusionBrainErrorCode} code   One of the values from FusionBrainErrorCode enum
     */
    constructor(message: string, code: FusionBrainErrorCode, body?: string){
        super(message);
        this.code = code;
        this.body = body;
    }
    
    /**
     * Predefined for any unexpected HTTP errors.
     * Provides info about HTTP error faced and response body, as well as add's error stack for details. Includes `body` field with HTTP response body
     * @param {string} methodName   Method name where error occured
     * @param {AxiosError} err      Axios error object to extract message, response body and error stack
     * @returns {FusionBrainError}
     */
    public static unexpected(methodName: string, err: AxiosError){
        const detailed = new FusionBrainError(`${methodName}: ${err.message}:\n${JSON.stringify(err.response?.data)}`, FusionBrainErrorCode.UNEXPECTED, JSON.stringify(err.response?.data));
        detailed.stack += `Caused by: ${err.stack}`;
        return detailed;
    }

    /**
     * For case when missing api or secret key, or any of them have typo.
     * May appear on any request, except requesting available styles (which has separate URL and doesn't require auth).
     * @param {string} methodName   Method name where error occured
     * @returns {FusionBrainError}
     */
    public static unauthorized(methodName: string){
        return new FusionBrainError(`${methodName}: Request failed with Unauthorized error. Ensure you've provided correct api and secret keys.`, FusionBrainErrorCode.UNAUTHORIZED);
    }

    /**
     * For case when generation task is already expired and removed from server (server replies with 404 code).
     * @param {string} methodName   Method name where error occured
     * @returns {FusionBrainError}
     */
    public static taskExpired(methodName: string){
        return new FusionBrainError(`${methodName}: task is expired and removed already`, FusionBrainErrorCode.EXPIRED);
    }

    /**
     * May appear if text description (prompt + negative prompt) is too long.
     * If it's not the case, then most likely API changed and library is outdated.
     * @param {string} methodName   Method name where error occured
     * @returns {FusionBrainError}
     */
    public static tooLongPromptsOrBadRequest(methodName: string){
        return new FusionBrainError(`${methodName}: most likely prompt (+ negative prompt) are too long. If they're short, then this error may mean that API changed and library needs for update`, FusionBrainErrorCode.LONG_PROMPT_OR_BAD_REQUEST);
    }

    /**
     * Appears during checks of API only when `Content-Type: application/json` were not specified explicitly
     * for multipart form parameter (generation params). Fixed with using Blob in FormData, to make it work properly.
     * If it appears again, then most likely API changed and library is outdated.
     * @param {string} methodName   Method name where error occured
     * @returns {FusionBrainError}
     */
    public static unsupportedMedia(methodName: string){
        return new FusionBrainError(`${methodName}: Seems like API changed and library needs for update`, FusionBrainErrorCode.UNSUPPORTED_MEDIA);
    }

    /**
     * Thrown on `FusionBrain.isReady` call instead of `false` value if second argument provided
     * @param methodName    Method name where error occured
     * @param body          HTTP body from which detected that model is not ready for usage
     * @returns 
     */
    public static modelNotReady(methodName: string, body: string){
        return new FusionBrainError(`${methodName}: requested model is not ready for usage now. See \`body\` field for details`, FusionBrainErrorCode.MODEL_NOT_READY, body);
    }
};