type ClipboardLike = {
  writeText(text: string): Promise<void>;
};

type DocumentLike = {
  execCommand?(command: string): boolean;
};

type CopyTextOptions = {
  clipboard?: ClipboardLike | null;
  document?: DocumentLike | null;
  onBeforeExecCommand?: () => void;
  onAfterExecCommand?: () => void;
};

export async function copyTextWithFallback(
  text: string,
  { clipboard, document, onBeforeExecCommand, onAfterExecCommand }: CopyTextOptions = {}
): Promise<boolean> {
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy copy path when clipboard access is denied.
    }
  }

  onBeforeExecCommand?.();
  const copied = document?.execCommand?.('copy') ?? false;
  onAfterExecCommand?.();

  return copied;
}
