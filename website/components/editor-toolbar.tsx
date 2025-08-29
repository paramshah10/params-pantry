import { Editor } from '@tiptap/react';
import { ReactNode } from 'react';

// TypeScript interfaces for component props
interface EditorToolbarProps {
  editor: Editor | null;
  onSave: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

interface FormatButtonProps {
  editor: Editor | null;
  format: 'bold' | 'italic' | 'bulletList' | 'orderedList' | 'heading';
  level?: 1 | 2 | 3 | 4 | 5 | 6; // for headings - TipTap Level type
  icon: ReactNode;
  label: string;
}

// Reusable FormatButton component for formatting actions
const FormatButton = ({ editor, format, level, icon, label }: FormatButtonProps) => {
  if (!editor) return null;

  // Determine if the format is currently active using TipTap's isActive methods
  const isActive = () => {
    switch (format) {
      case 'bold':
        return editor.isActive('bold');
      case 'italic':
        return editor.isActive('italic');
      case 'bulletList':
        return editor.isActive('bulletList');
      case 'orderedList':
        return editor.isActive('orderedList');
      case 'heading':
        return editor.isActive('heading', { level });
      default:
        return false;
    }
  };

  // Handle format button click
  const handleClick = () => {
    switch (format) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'heading':
        if (level) {
          editor.chain().focus().toggleHeading({ level }).run();
        }
        break;
    }
  };

  const active = isActive();

  return (
    <button
      onClick={handleClick}
      className={`
        p-1.5 sm:p-2 rounded-md border transition-all duration-200 
        text-xs sm:text-sm min-w-[32px] sm:min-w-[36px] h-8 sm:h-9
        flex items-center justify-center
        ${active 
          ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-sm' 
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
      `}
      disabled={!editor.can().chain().focus().run()}
      title={label}
      aria-label={label}
      aria-pressed={active}
    >
      {icon}
    </button>
  );
};

// SaveButton component with loading and disabled states
const SaveButton = ({ onSave, isSaving, hasUnsavedChanges }: {
  onSave: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}) => {
  // Determine button state and styling
  const getButtonState = () => {
    if (isSaving) {
      return {
        className: 'bg-blue-500 text-white cursor-wait',
        disabled: true,
        ariaLabel: 'Saving content in progress'
      };
    }
    
    if (hasUnsavedChanges) {
      return {
        className: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        disabled: false,
        ariaLabel: 'Save unsaved changes'
      };
    }
    
    return {
      className: 'bg-gray-300 text-gray-500 cursor-not-allowed',
      disabled: true,
      ariaLabel: 'No changes to save'
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="flex items-center space-x-2">
      {/* Visual indicator for unsaved changes */}
      {hasUnsavedChanges && !isSaving && (
        <div className="flex items-center text-xs text-orange-600">
          <div className="w-2 h-2 bg-orange-500 rounded-full mr-1 animate-pulse"></div>
          Unsaved
        </div>
      )}
      
      {/* Save progress indicator */}
      {isSaving && (
        <div className="flex items-center text-xs text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
          Saving
        </div>
      )}
      
      {/* Save button */}
      <button
        onClick={onSave}
        disabled={buttonState.disabled}
        className={`
          px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 
          focus:outline-none ${buttonState.className}
        `}
        aria-label={buttonState.ariaLabel}
        title={
          isSaving 
            ? 'Saving your changes...' 
            : hasUnsavedChanges 
              ? 'Click to save your changes' 
              : 'No changes to save'
        }
      >
        {isSaving ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving...
          </div>
        ) : hasUnsavedChanges ? (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save
          </div>
        ) : (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </div>
        )}
      </button>
    </div>
  );
};

// Main EditorToolbar component
const EditorToolbar = ({ editor, onSave, isSaving, hasUnsavedChanges }: EditorToolbarProps) => {
  if (!editor) return null;

  return (
    <div 
      className="
        sticky top-0 z-20 
        border-b border-gray-200 bg-white/95 backdrop-blur-sm 
        px-3 sm:px-4 py-2 sm:py-3
        shadow-sm
      "
      role="toolbar"
      aria-label="Text formatting toolbar"
      data-testid="editor-toolbar"
    >
      {/* Mobile-first responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        {/* Formatting controls */}
        <div className="flex items-center overflow-x-auto pb-1 sm:pb-0" role="group" aria-label="Text formatting options">
          <div className="flex items-center space-x-1 sm:space-x-2 min-w-max">
            {/* Text formatting group */}
            <div className="flex items-center space-x-1 border-r border-gray-300 pr-2" role="group" aria-label="Text style">
              <FormatButton
                editor={editor}
                format="bold"
                icon={<strong className="text-sm">B</strong>}
                label="Bold"
              />
              <FormatButton
                editor={editor}
                format="italic"
                icon={<em className="text-sm">I</em>}
                label="Italic"
              />
            </div>

            {/* Headings group - responsive visibility */}
            <div className="flex items-center space-x-1 border-r border-gray-300 pr-2" role="group" aria-label="Headings">
              <FormatButton
                editor={editor}
                format="heading"
                level={1}
                icon={<span className="text-xs sm:text-sm font-bold">H1</span>}
                label="Heading 1"
              />
              <FormatButton
                editor={editor}
                format="heading"
                level={2}
                icon={<span className="text-xs sm:text-sm font-bold">H2</span>}
                label="Heading 2"
              />
              {/* Hide H3 on very small screens */}
              <div className="hidden xs:block">
                <FormatButton
                  editor={editor}
                  format="heading"
                  level={3}
                  icon={<span className="text-xs sm:text-sm font-bold">H3</span>}
                  label="Heading 3"
                />
              </div>
            </div>

            {/* Lists group */}
            <div className="flex items-center space-x-1" role="group" aria-label="Lists">
              <FormatButton
                editor={editor}
                format="bulletList"
                icon={
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                }
                label="Bullet List"
              />
              <FormatButton
                editor={editor}
                format="orderedList"
                icon={
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M3 4a1 1 0 000 2h.01a1 1 0 100-2H3zM6 4a1 1 0 011-1h9a1 1 0 110 2H7a1 1 0 01-1-1zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H3zm3 0a1 1 0 011-1h9a1 1 0 110 2H7a1 1 0 01-1-1zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H3zm3 0a1 1 0 011-1h9a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                }
                label="Numbered List"
              />
            </div>
          </div>
        </div>

        {/* Save button - responsive positioning */}
        <div className="flex justify-end sm:justify-start" role="group" aria-label="Save actions">
          <SaveButton
            onSave={onSave}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;