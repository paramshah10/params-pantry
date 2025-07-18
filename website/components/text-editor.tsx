import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

const TextEditor = ({ editorContent }: { editorContent: any }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-slate sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none text-left',
      },
    },
    injectCSS: false,
  });

  // Get content from texteditor
  // editor?.getHTML();

  useEffect(() => {
    editor?.commands.setContent(editorContent);
  }, [editorContent]);

  return (
    <div className='pl-8 justify-left items-left '>
      <EditorContent editor={editor}/>
    </div>
  );
};

export default TextEditor;
