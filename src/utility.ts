export function isGuid(input: string): boolean {
    return input.match(/^[0-9a-z]{8}-([0-9a-z]{4}-){3}[0-9a-z]{12}$/)
        != null;
}