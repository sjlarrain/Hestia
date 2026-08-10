// Vitest runs outside Next's RSC compiler, where the real `server-only`
// package throws unconditionally on import. Aliased in here (vitest.config.ts)
// so server-side lib modules can still be unit tested directly.
export {};
