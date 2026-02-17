"use client";
import React, { useState, useRef } from "react";
import { Send, Paperclip, Loader2, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MessageInputProps {
  onSendMessage: (content: string, type: "TEXT" | "LINK" | "IMAGE" | "FILE", file?: File) => void;
  isSending: boolean;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, isSending, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (disabled || isSending) return;

    // Send file if selected
    if (selectedFile) {
      onSendMessage("", selectedFile.type.startsWith("image/") ? "IMAGE" : "FILE", selectedFile);
      clearFile();
      return;
    }

    // Send text message
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // Detect if it's a URL
    const isLink = /^https?:\/\/.+/.test(trimmedMessage);
    onSendMessage(trimmedMessage, isLink ? "LINK" : "TEXT");
    setMessage("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-zinc-800 bg-[#18181b] px-6 py-4">
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-3 flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-16 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-16 h-16 bg-zinc-700 rounded flex items-center justify-center">
              <Paperclip className="h-6 w-6 text-zinc-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-100 truncate">{selectedFile.name}</p>
            <p className="text-xs text-zinc-400">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFile}
            className="h-8 w-8 p-0 text-zinc-500 hover:bg-red-600/20 hover:text-red-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-3">
        {/* File Attach Button */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending || !!selectedFile}
          className="h-8 w-8 p-0 text-zinc-400 hover:bg-blue-600 hover:text-white transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedFile ? <ImageIcon className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
        </Button>

        {/* Text Input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={selectedFile ? "Add a caption (optional)" : "Type a message..."}
          disabled={disabled || isSending}
          className={cn(
            "flex-1 min-h-[44px] max-h-[120px] resize-none bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-400",
            "focus-visible:border-blue-600 focus-visible:ring-blue-600 focus-visible:ring-1 focus-visible:ring-offset-0"
          )}
          rows={1}
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={disabled || isSending || (!message.trim() && !selectedFile)}
          size="sm"
          className={cn(
            "flex-shrink-0 bg-blue-700 hover:bg-blue-600 text-white",
            (disabled || (!message.trim() && !selectedFile)) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Hint Text */}
      <p className="text-xs text-zinc-500 mt-2">
        Press <kbd className="px-1 py-0.5 bg-zinc-700 rounded text-zinc-300">Enter</kbd> to send,{" "}
        <kbd className="px-1 py-0.5 bg-zinc-700 rounded text-zinc-300">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
}
