import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const TextEditor = ({ editorContent }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: editorContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-slate sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none text-left',
      },
    },
    injectCSS: false,
  });

  // Get content from texteditor
  // editor?.getHTML();

  return (
    <div className='pl-8 justify-left items-left '>
      <EditorContent editor={editor}/>
    </div>
  );
};

export default TextEditor;
