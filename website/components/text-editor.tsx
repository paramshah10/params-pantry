import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from '../pages/_app';
import EditorToolbar from './editor-toolbar';
import EditorErrorBoundary from './editor-error-boundary';

// TypeScript interfaces for component props and state
interface TextEditorProps {
  editorContent: string;
  isAuthenticated: boolean;
  recipeName: string;
  onContentSave?: (content: string) => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: string) => void;
}

interface TextEditorState {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  isInitializing: boolean;
  showUnsavedWarning: boolean;
}

const TextEditor = ({
  editorContent,
  isAuthenticated,
  recipeName,
  onContentSave,
  onSaveSuccess,
  onSaveError
}: TextEditorProps) => {
  // Get Firebase instance from context and router
  const { firebase } = useContext(AppContext);
  const router = useRouter();

  // State management for tracking content changes, save status, and loading states
  const [editorState, setEditorState] = useState<TextEditorState>({
    hasUnsavedChanges: false,
    isSaving: false,
    isLoading: false,
    error: null,
    retryCount: 0,
    isInitializing: true,
    showUnsavedWarning: false,
  });

  const [initialContent, setInitialContent] = useState<string>('');

  // Refs for debounced auto-save and authentication tracking
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>('');
  const previousAuthStateRef = useRef<boolean>(isAuthenticated);

  // Save method with enhanced error handling and retry logic
  const saveContent = useCallback(async (content: string, isRetry: boolean = false): Promise<boolean> => {
    // Enhanced validation checks
    if (!firebase) {
      const errorMessage = 'Database connection not available. Please refresh the page and try again.';
      setEditorState(prev => ({
        ...prev,
        error: errorMessage,
        errorType: 'unknown',
      }));
      if (onSaveError) {
        onSaveError(errorMessage);
      }
      return false;
    }

    if (!recipeName) {
      const errorMessage = 'Recipe name is missing. Please refresh the page and try again.';
      setEditorState(prev => ({
        ...prev,
        error: errorMessage,
        errorType: 'validation',
      }));
      if (onSaveError) {
        onSaveError(errorMessage);
      }
      return false;
    }

    if (!isAuthenticated) {
      const errorMessage = 'You must be signed in to save content. Please sign in and try again.';
      setEditorState(prev => ({
        ...prev,
        error: errorMessage,
        errorType: 'auth',
      }));
      if (onSaveError) {
        onSaveError(errorMessage);
      }
      return false;
    }

    // Content validation
    if (!content || content.trim().length === 0) {
      const errorMessage = 'Cannot save empty content. Please add some content and try again.';
      setEditorState(prev => ({
        ...prev,
        error: errorMessage,
        errorType: 'validation',
      }));
      if (onSaveError) {
        onSaveError(errorMessage);
      }
      return false;
    }

    // Check content size (prevent saving extremely large content)
    if (content.length > 1000000) { // 1MB limit
      const errorMessage = 'Content is too large to save. Please reduce the content size and try again.';
      setEditorState(prev => ({
        ...prev,
        error: errorMessage,
        errorType: 'validation',
      }));
      if (onSaveError) {
        onSaveError(errorMessage);
      }
      return false;
    }

    // Don't save if content hasn't changed since last save
    if (content === lastSavedContentRef.current) {
      return true;
    }

    setEditorState(prev => ({
      ...prev,
      isSaving: true,
      error: null,
      errorType: null,
      retryCount: isRetry ? prev.retryCount + 1 : prev.retryCount,
    }));

    try {
      // Add timeout to prevent hanging requests
      const savePromise = firebase.put({
        path: `recipes/${recipeName}`,
        data: { content },
      });

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Save operation timed out after 30 seconds')), 30000);
      });

      // Race between save and timeout
      const success = await Promise.race([savePromise, timeoutPromise]);

      if (success) {
        lastSavedContentRef.current = content;
        setInitialContent(content);
        setEditorState(prev => ({
          ...prev,
          isSaving: false,
          hasUnsavedChanges: false,
          error: null,
          errorType: null,
          retryCount: 0, // Reset retry count on success
        }));

        // Call success callback
        if (onSaveSuccess) {
          onSaveSuccess();
        }

        return true;
      } else {
        throw new Error('Failed to save content to Firebase - server returned false');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred during save');

      setEditorState(prev => ({
        ...prev,
        isSaving: false,
        error: err.message,
      }));

      // Call error callback with detailed error information
      if (onSaveError) {
        onSaveError(err.message);
      }

      // Log detailed error for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.error('Save error details:', {
          error: err,
          recipeName,
          contentLength: content.length,
          retryCount: isRetry ? editorState.retryCount + 1 : editorState.retryCount,
        });
      }

      return false;
    }
  }, [firebase, recipeName, isAuthenticated, onSaveSuccess, onSaveError, editorState.retryCount]);

  // Debounced auto-save to prevent excessive API calls
  const debouncedAutoSave = useCallback((content: string) => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (3 seconds delay)
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (isAuthenticated && content !== lastSavedContentRef.current) {
        saveContent(content);
      }
    }, 3000);
  }, [saveContent]); // Removed isAuthenticated dependency to prevent recreation on auth changes

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    editorProps: {
      attributes: {
        class: [
          'recipe-editor-content',
          'prose prose-slate max-w-none',
          'sm:prose-sm md:prose-base lg:prose-lg xl:prose-xl',
          'prose-headings:font-bold prose-headings:text-gray-900',
          'prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6',
          'prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5',
          'prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4',
          'prose-p:text-gray-800 prose-p:leading-relaxed prose-p:mb-4',
          'prose-ul:my-4 prose-ol:my-4',
          'prose-li:text-gray-800 prose-li:leading-relaxed',
          'prose-strong:text-gray-900 prose-strong:font-semibold',
          'prose-em:text-gray-700 prose-em:italic',
          'focus:outline-none text-left min-h-[200px] w-full',
          ...(isAuthenticated
            ? [
                'cursor-text border-2 border-transparent hover:border-gray-200',
                'focus-within:border-blue-300 rounded-lg p-4 sm:p-6',
                'transition-all duration-200 bg-white shadow-sm hover:shadow-md'
              ]
            : [
                'cursor-default bg-gray-50 border border-gray-200 rounded-lg',
                'p-4 sm:p-6 text-gray-700 shadow-sm'
              ]
          )
        ].filter(Boolean).join(' '),
        'aria-label': isAuthenticated ? 'Recipe content editor' : 'Recipe content (read-only)',
        'aria-readonly': isAuthenticated ? 'false' : 'true',
        role: 'textbox',
        'aria-multiline': 'true',
        'data-testid': isAuthenticated ? 'recipe-editor' : 'recipe-viewer',
      },
    },
    editable: isAuthenticated, // Authentication-based editing capability
    injectCSS: false,
    // Enhanced content preservation - parse HTML properly
    parseOptions: {
      preserveWhitespace: 'full',
    },
    // Content change detection using TipTap's onUpdate callback
    onUpdate: ({ editor }: { editor: Editor }) => {
      const currentContent = editor.getHTML();
      const hasChanges = currentContent !== initialContent;

      setEditorState(prev => ({
        ...prev,
        hasUnsavedChanges: hasChanges,
      }));

      // Call the optional callback for content changes
      if (onContentSave && hasChanges) {
        onContentSave(currentContent);
      }

      // Trigger debounced auto-save for authenticated users
      if (isAuthenticated && hasChanges) {
        debouncedAutoSave(currentContent);
      }
    },
  });

  // Enhanced content loading with better preservation and error recovery
  useEffect(() => {
    if (editor && !editorState.isInitializing) {
      // Only reload content if the editorContent actually changed, not just authentication state
      const currentContent = editor.getHTML();
      const hasCurrentContent = currentContent && currentContent !== '<p></p>' && currentContent.trim() !== '';

      // Don't reload content if:
      // 1. We have current content in the editor AND
      // 2. The editorContent prop hasn't actually changed from what we last loaded
      if (hasCurrentContent && editorContent === lastSavedContentRef.current) {
        // Just update the editable state without reloading content
        return;
      }

      setEditorState(prev => ({ ...prev, isLoading: true }));

      try {
        // Enhanced content preservation - handle different content formats
        const contentToSet = editorContent || '';

        // Validate content before setting it
        if (contentToSet && typeof contentToSet !== 'string') {
          throw new Error('Invalid content format - content must be a string');
        }

        // If content is empty, set a placeholder for better UX
        if (!contentToSet.trim()) {
          const placeholderContent = isAuthenticated
            ? '<p>Start writing your recipe here...</p>'
            : '<p><em>No recipe content available.</em></p>';
          editor.commands.setContent(placeholderContent);
        } else {
          // Try to parse and validate HTML content before setting
          try {
            // Create a temporary div to test if HTML is valid
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = contentToSet;

            // Check if the content was parsed correctly
            if (tempDiv.innerHTML !== contentToSet) {
              console.warn('Content may contain invalid HTML, attempting to clean it');
            }

            // Preserve existing formatting by setting content with proper parsing
            editor.commands.setContent(contentToSet, {
              emitUpdate: false,
            });
          } catch (parseError) {
            console.warn('Failed to parse HTML content, falling back to plain text:', parseError);
            // Fallback: treat as plain text and wrap in paragraph
            const fallbackContent = `<p>${contentToSet.replace(/\n/g, '</p><p>')}</p>`;
            editor.commands.setContent(fallbackContent, {
              emitUpdate: false,
            });
          }
        }

        setInitialContent(contentToSet);
        lastSavedContentRef.current = contentToSet;

        setEditorState(prev => ({
          ...prev,
          isLoading: false,
          hasUnsavedChanges: false,
          error: null,
        }));
      } catch (error) {
        console.error('Content loading error:', error);
        const err = error instanceof Error ? error : new Error('Unknown content loading error');

        // Provide fallback functionality when content fails to load
        try {
          // Try to set a basic fallback content
          const fallbackContent = isAuthenticated
            ? '<p>Content failed to load. You can start writing your recipe here...</p>'
            : '<p><em>Content failed to load. Please refresh the page to try again.</em></p>';

          editor.commands.setContent(fallbackContent, {
            emitUpdate: false,
          });

          setInitialContent('');
          lastSavedContentRef.current = '';

          setEditorState(prev => ({
            ...prev,
            isLoading: false,
            hasUnsavedChanges: false,
            error: `Failed to load recipe content: ${err.message}. You can continue editing, but please refresh the page to ensure all content is loaded properly.`,
          }));
        } catch (fallbackError) {
          // If even the fallback fails, show a critical error
          console.error('Critical editor error - fallback also failed:', fallbackError);
          setEditorState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Critical error: Editor failed to initialize properly. Please refresh the page or try a different browser.',
          }));
        }
      }
    }
  }, [editor, editorContent]);

  // Handle editor initialization
  useEffect(() => {
    if (editor) {
      setEditorState(prev => ({ ...prev, isInitializing: false }));
    }
  }, [editor]);

  // Update editor editable state when authentication changes
  useEffect(() => {
    if (editor) {
      // Check if authentication state changed
      const authStateChanged = previousAuthStateRef.current !== isAuthenticated;

      if (authStateChanged) {
        // Clear any pending auto-save when authentication state changes
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
          autoSaveTimeoutRef.current = null;
        }

        // Update the previous auth state
        previousAuthStateRef.current = isAuthenticated;
      }

      editor.setEditable(isAuthenticated);

      // If user just signed out and has unsaved changes, preserve the content
      if (!isAuthenticated && editorState.hasUnsavedChanges) {
        // Keep the current content in the editor, just make it read-only
        // Don't reset to initial content when signing out
        console.log('User signed out with unsaved changes - preserving content in read-only mode');
      }
    }
  }, [editor, isAuthenticated, editorState.hasUnsavedChanges]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Navigation warning when users try to navigate away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editorState.hasUnsavedChanges && isAuthenticated) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but we still need to set returnValue
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        e.returnValue = message;
        return message;
      }
    };

    const handleRouteChange = () => {
      if (editorState.hasUnsavedChanges && isAuthenticated) {
        const confirmLeave = window.confirm(
          'You have unsaved changes that will be lost. Do you want to save before leaving?'
        );

        if (!confirmLeave) {
          router.events.emit('routeChangeError');
          throw 'Route change aborted by user';
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [editorState.hasUnsavedChanges, isAuthenticated, router.events]);

  // Handle discard changes functionality
  const handleDiscardChanges = useCallback(() => {
    if (!editor) return;

    // Reset content to initial state
    editor.commands.setContent(initialContent, {
      emitUpdate: false,
    });

    // Reset state
    setEditorState(prev => ({
      ...prev,
      hasUnsavedChanges: false,
      showUnsavedWarning: false,
      error: null,
    }));

    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  }, [editor, initialContent]);

  // Handle save and continue functionality
  const handleSaveAndContinue = useCallback(async () => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    const success = await saveContent(currentContent);

    if (success) {
      setEditorState(prev => ({
        ...prev,
        showUnsavedWarning: false,
      }));
    }
  }, [editor, saveContent]);

  // Retry functionality for failed save operations
  const handleRetry = useCallback(async () => {
    if (!editor || editorState.retryCount >= 3) {
      return; // Max retry attempts reached
    }

    const currentContent = editor.getHTML();
    await saveContent(currentContent, true);
  }, [editor, editorState.retryCount, saveContent]);

  // Manual save capability with user-triggered save action
  const handleManualSave = useCallback(async () => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    await saveContent(currentContent);
  }, [editor, saveContent]);

  // Enhanced error boundary fallback component with more recovery options
  const ErrorFallback = (
    <div
      className="bg-red-50 border border-red-200 rounded-lg p-6 m-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Text Editor Error
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>
              The text editor failed to load properly. This might be due to a browser compatibility issue or temporary problem.
            </p>
            <p className="mt-2">
              You can try refreshing the page or use a different browser. The recipe content is still safe and accessible.
            </p>
            {/* Fallback content display */}
            {editorContent && (
              <div className="mt-3 p-3 bg-white border border-red-200 rounded">
                <p className="text-xs text-red-600 mb-2 font-medium">Recipe content (read-only fallback):</p>
                <div
                  className="text-sm text-gray-800 max-h-32 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: editorContent }}
                />
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Reload the page to fix the editor"
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                // Try to navigate back to recipes list as a fallback
                router.push('/recipes');
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Go back to recipes list"
            >
              Back to Recipes
            </button>
            {/* Show contact support option for critical errors */}
            <button
              onClick={() => {
                const subject = encodeURIComponent('Text Editor Error Report');
                const body = encodeURIComponent(`I encountered an error with the text editor on recipe: ${recipeName}\n\nPlease help resolve this issue.`);
                window.open(`mailto:support@example.com?subject=${subject}&body=${body}`, '_blank');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Contact support for help"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <EditorErrorBoundary
      fallback={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Text Editor Error:', error, errorInfo);
        // Could also send error to monitoring service here
      }}
    >
      <div
        className="
          recipe-editor-container
          w-full max-w-none
          px-4 sm:px-6 lg:px-8
          py-4 sm:py-6
        "
        role="region"
        aria-label={isAuthenticated ? 'Recipe editor' : 'Recipe content'}
        data-testid="text-editor-container"
      >
        {/* Initialization loading state */}
        {editorState.isInitializing && (
          <div
            className="flex items-center justify-center p-8"
            role="status"
            aria-live="polite"
            aria-label="Initializing text editor"
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Initializing editor...</p>
            </div>
          </div>
        )}

        {/* Content loading state */}
        {!editorState.isInitializing && editorState.isLoading && (
          <div
            className="flex items-center justify-center p-4"
            role="status"
            aria-live="polite"
            aria-label="Loading recipe content"
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">Loading content...</span>
          </div>
        )}

        {/* Enhanced error state with retry functionality */}
        {editorState.error && (
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  {editorState.error}
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  <p>{editorState.error}</p>
                  {editorState.retryCount > 0 && (
                    <p className="mt-1 text-xs">
                      Retry attempt
                      {' '}
                      {editorState.retryCount}
                      {' '}
                      of 3
                    </p>
                  )}
                </div>
                <div className="mt-3 flex space-x-3">
                  {/* Dismiss error button */}
                  <button
                    onClick={() => setEditorState(prev => ({ ...prev, error: null }))}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="Dismiss error message"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Editor mode indicator for screen readers */}
        <div className="sr-only" aria-live="polite">
          {isAuthenticated ? 'Editor mode: You can edit this recipe content' : 'View mode: This recipe content is read-only'}
        </div>

        {/* Conditionally render toolbar based on authentication status */}
        {isAuthenticated && (
          <EditorToolbar
            editor={editor}
            onSave={handleManualSave}
            isSaving={editorState.isSaving}
            hasUnsavedChanges={editorState.hasUnsavedChanges}
          />
        )}

        {/* Main editor content */}
        <div
          className={`relative ${!isAuthenticated ? 'bg-gray-50 rounded-lg border border-gray-200' : ''}`}
          data-testid="editor-content-wrapper"
        >
          {/* Read-only overlay indicator */}
          {!isAuthenticated && (
            <div className="absolute top-2 right-2 z-10">
              <div className="flex items-center bg-white border border-gray-300 rounded-full px-2 py-1 shadow-sm">
                <svg
                  className="w-3 h-3 text-gray-500 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span className="text-xs text-gray-600 font-medium">View only</span>
              </div>
            </div>
          )}

          <EditorContent editor={editor} />
        </div>

        {/* Enhanced unsaved changes warning banner */}
        {isAuthenticated && editorState.hasUnsavedChanges && !editorState.isSaving && (
          <div
            className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4 mx-5"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-orange-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-orange-800">
                  You have unsaved changes
                </h3>
                <div className="mt-1 text-sm text-orange-700">
                  <p>Your changes will be lost if you navigate away without saving.</p>
                </div>
                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={handleSaveAndContinue}
                    disabled={editorState.isSaving}
                    className="bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    aria-label="Save changes and continue"
                  >
                    {editorState.isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleDiscardChanges}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="Discard unsaved changes"
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save status indicators for authenticated users */}
        {isAuthenticated && (
          <div className="flex items-center justify-between mt-2 px-5">
            <div className="flex items-center space-x-4">
              {/* Saving indicator */}
              {editorState.isSaving && (
                <div
                  className="flex items-center text-sm text-blue-600"
                  role="status"
                  aria-live="polite"
                  aria-label="Saving content"
                >
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                  Saving...
                </div>
              )}

              {/* Enhanced unsaved changes indicator with pulsing animation */}
              {editorState.hasUnsavedChanges && !editorState.isSaving && (
                <div
                  className="flex items-center text-sm text-orange-600"
                  role="status"
                  aria-live="polite"
                  aria-label="You have unsaved changes"
                >
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                  Unsaved changes
                </div>
              )}

              {/* Saved indicator with checkmark */}
              {!editorState.hasUnsavedChanges && !editorState.isSaving && lastSavedContentRef.current && (
                <div
                  className="flex items-center text-sm text-green-600"
                  role="status"
                  aria-live="polite"
                  aria-label="Content saved successfully"
                >
                  <svg
                    className="w-3 h-3 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Saved
                </div>
              )}
            </div>

            {/* Manual save button */}
            {editorState.hasUnsavedChanges && (
              <button
                onClick={handleManualSave}
                disabled={editorState.isSaving}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={editorState.isSaving ? 'Saving content in progress' : 'Save changes now'}
              >
                {editorState.isSaving ? 'Saving...' : 'Save Now'}
              </button>
            )}
          </div>
        )}

        {/* Read-only indicator for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mt-4 px-5">
            <div
              className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg p-3"
              role="status"
              aria-label="This content is in read-only mode"
            >
              <div className="flex items-center space-x-2 text-gray-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  Read-only mode - Sign in to edit this recipe
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </EditorErrorBoundary>
  );
};

export default TextEditor;
