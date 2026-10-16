export type StorageAdapter = {
  // Returns null when nothing was saved yet. Throws when storage is not readable.
  read: () => string | null;
  // Throws when storage is not writable.
  write: (text: string) => void;
};

export const createMemoryStorage = (initialText: string | null = null): StorageAdapter => {
  let text = initialText;
  return {
    read: () => text,
    write: (nextText) => {
      text = nextText;
    },
  };
};

export const createLocalStorageAdapter = (key: string): StorageAdapter => ({
  read: () => localStorage.getItem(key),
  write: (text) => localStorage.setItem(key, text),
});
