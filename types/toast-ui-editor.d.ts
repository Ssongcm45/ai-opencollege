declare module "@toast-ui/editor" {
  interface EditorOptions {
    el: HTMLElement;
    initialValue?: string;
    previewStyle?: "tab" | "vertical";
    height?: string;
    initialEditType?: "markdown" | "wysiwyg";
    useCommandShortcut?: boolean;
    toolbarItems?: Array<string[]>;
  }

  export default class Editor {
    constructor(options: EditorOptions);
    getHTML(): string;
    getMarkdown(): string;
    on(event: string, callback: () => void): void;
    destroy(): void;
  }
}

declare module "@toast-ui/editor/dist/toastui-editor.css" {
  const content: string;
  export default content;
}
