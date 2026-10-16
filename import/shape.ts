export class ImportError extends Error {
  constructor(message: string) {
    super(`Import failed: ${message}`);
    this.name = "ImportError";
  }
}

export const expectRecord = (value: unknown, path: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ImportError(`expected an object at ${path}`);
  }
  return value as Record<string, unknown>;
};

export const expectArray = (value: unknown, path: string): unknown[] => {
  if (!Array.isArray(value)) throw new ImportError(`expected an array at ${path}`);
  return value;
};

export const expectString = (value: unknown, path: string): string => {
  if (typeof value !== "string") throw new ImportError(`expected a string at ${path}`);
  return value;
};

export const expectNumber = (value: unknown, path: string): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ImportError(`expected a number at ${path}`);
  }
  return value;
};

export const toIconPath = (gamePath: string, path: string): string => {
  if (!gamePath.endsWith(".tex")) throw new ImportError(`unexpected icon path "${gamePath}" at ${path}`);
  return gamePath.toLowerCase().replace(/\.tex$/, ".png");
};

export const expectBoolean = (value: unknown, path: string): boolean => {
  if (typeof value !== "boolean") throw new ImportError(`expected a boolean at ${path}`);
  return value;
};
