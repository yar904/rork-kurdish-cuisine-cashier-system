declare const process: {
  env: Record<string, string | undefined>;
};

declare const console: Console;

declare interface Console {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
}
