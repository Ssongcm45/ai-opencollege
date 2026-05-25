"use client";
import "@toast-ui/editor/dist/toastui-editor.css";
import { useEffect, useRef } from "react";

interface Props {
  name: string;
  defaultValue?: string;
}

export function TuiEditor({ name, defaultValue = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const destroyedRef = useRef(false);

  useEffect(() => {
    destroyedRef.current = false;

    import("@toast-ui/editor").then(({ default: Editor }) => {
      if (destroyedRef.current || !containerRef.current) return;

      const editor = new Editor({
        el: containerRef.current,
        initialValue: defaultValue || "",
        previewStyle: "tab",
        height: "500px",
        initialEditType: "wysiwyg",
        toolbarItems: [
          ["heading", "bold", "italic", "strike"],
          ["hr", "quote"],
          ["ul", "ol", "task"],
          ["table", "link"],
          ["code", "codeblock"]
        ]
      });

      if (inputRef.current) inputRef.current.value = defaultValue || "";

      editor.on("change", () => {
        if (inputRef.current) {
          inputRef.current.value = editor.getHTML();
        }
      });

      editorRef.current = editor;
    });

    return () => {
      destroyedRef.current = true;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

  return (
    <div className="editor-wrap">
      <div ref={containerRef} />
      <input type="hidden" name={name} ref={inputRef} defaultValue={defaultValue} />
    </div>
  );
}
