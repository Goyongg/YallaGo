// pick specific fields to keep from a document
export function pickFields(doc: any, allowedFields: string[]): any {
    if (!doc) return null;
    const redacted: any = {};
    for (const field of allowedFields) {
        if (doc.hasOwnProperty(field)) {
            redacted[field] = doc[field];
        }
    }

    return redacted;
}

// omit specific fields from a document
export function omitFields(doc: any, fieldsToOmit: string[]) : any {
    if (!doc) return null;

    const result = { ...doc };

    for (const field of fieldsToOmit) {
        if (doc.hasOwnProperty(field)) {
            delete result[field];
        }
    }

    return result;
}