import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Paperclip, SendHorizontal, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (payload?: ChatSendPayload) => void | Promise<void>;
  onFileSelect?: (file: File | null) => void;
  selectedFile?: File | null;
  disabled?: boolean;
  isSending?: boolean;
}

export interface ChatSendPayload {
  message: string;
  file: File | null;
  formData: FormData;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onFileSelect,
  selectedFile,
  disabled,
  isSending,
}: ChatInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileKind = useMemo(() => {
    if (!selectedFile) return "none";
    if (selectedFile.type.startsWith("image/")) return "image";
    if (selectedFile.type.startsWith("video/")) return "video";
    return "other";
  }, [selectedFile]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const buildPayload = useCallback((): ChatSendPayload => {
    const data = new FormData();
    if (value.trim()) data.append("message", value.trim());
    if (selectedFile) data.append("file", selectedFile);

    return {
      message: value,
      file: selectedFile || null,
      formData: data,
    };
  }, [selectedFile, value]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (!disabled) {
          onSend(buildPayload());
        }
      }
    },
    [buildPayload, disabled, onSend]
  );

  const handleClearFile = useCallback(() => {
    onFileSelect?.(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [onFileSelect]);

  return (
    <div className="space-y-2">
      {selectedFile && previewUrl && (fileKind === "image" || fileKind === "video") && (
        <div className="relative w-fit">
          {fileKind === "image" ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-[120px] max-w-[120px] rounded-xl object-cover shadow-sm"
            />
          ) : (
            <video
              src={previewUrl}
              muted
              playsInline
              className="max-h-[120px] max-w-[120px] rounded-xl object-cover shadow-sm"
            />
          )}
          <button
            type="button"
            onClick={handleClearFile}
            className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-white shadow-sm transition hover:bg-slate-900"
            aria-label="Eliminar archivo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*,video/*"
          onChange={(event) => onFileSelect?.(event.target.files?.[0] || null)}
          disabled={disabled}
          className="sr-only"
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <label
              htmlFor={inputId}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
              aria-label="Adjuntar archivo"
            >
              <Paperclip className="h-4.5 w-4.5" />
            </label>
          </TooltipTrigger>
          <TooltipContent side="top">Adjuntar archivo</TooltipContent>
        </Tooltip>

        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="min-h-[40px] flex-1 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
          disabled={disabled}
        />

        <Button
          onClick={() => onSend(buildPayload())}
          disabled={disabled || isSending}
          size="icon"
          className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700"
          aria-label="Enviar mensaje"
        >
          {isSending ? "..." : <SendHorizontal className="h-4.5 w-4.5" />}
        </Button>
      </div>
    </div>
  );
}
