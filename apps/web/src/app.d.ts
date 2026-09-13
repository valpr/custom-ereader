/// <reference types="@sveltejs/kit" />
/// <reference types="wicg-file-system-access" />
/// <reference types="webappsec-credential-management" />

// See https://kit.svelte.dev/docs/types#the-app-namespace
// for information about these interfaces.
// Stock SvelteKit scaffold: kept intentionally empty for future
// Locals/Platform/Session types.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare namespace App {
  // interface Locals {}
  // interface Platform {}
  // interface Session {}
  // interface Stuff {}
}

declare global {
  interface HTMLElement {
    scrollIntoViewIfNeeded(arg?: boolean): void;
  }
  interface Navigator {
    msMaxTouchPoints: number;
    standalone: boolean | undefined;
  }
}

export {};
