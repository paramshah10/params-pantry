import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const TextEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: '<p>Hello World! 🌎️</p>',
  })

  // Get content from texteditor
  // editor?.getHTML();

  return (
    <div>
      <EditorContent editor={editor} />
    </div>
  )
};

export default TextEditor;
