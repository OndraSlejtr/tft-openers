type StorageErrorBannerProps = {
  message: string;
  onDismiss: () => void;
};

export const StorageErrorBanner = ({ message, onDismiss }: StorageErrorBannerProps) => (
  <div role="alert" className="mb-4 flex items-start justify-between gap-4 rounded border border-red-500/50 bg-red-950/60 p-3 text-sm">
    <p>{message}</p>
    <button type="button" onClick={onDismiss} className="shrink-0 text-gray-300 hover:text-white">
      Dismiss
    </button>
  </div>
);
