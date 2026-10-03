// Password rules - shared by every form (browser) and endpoint (server), so
// they can't drift apart. Browser-safe: just numbers.

// New passwords: at least this many characters. (Existing shorter
// passwords still work for logging in - this applies when one is set.)
export const MIN_PASSWORD_LENGTH = 5;
export const PASSWORD_TOO_SHORT = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;

// bcrypt "cost" for new password hashes - each +1 doubles the work to
// guess one. Stored inside each hash, so older (cheaper) hashes still check.
export const BCRYPT_ROUNDS = 10;
