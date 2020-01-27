export class Exception extends Error {
    code: string;
    details?: unknown;

    constructor(spec: ExceptionSpec) {
        super(spec.message || spec.code);
        this.code = spec.code;
        this.details = spec.details;
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
        };
    }
}

export interface ExceptionSpec {
    code: string;
    message?: string;
    details?: unknown;
}
