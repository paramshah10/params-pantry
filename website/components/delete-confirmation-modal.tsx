interface DeleteConfirmationModalProps {
  isOpen: boolean;
  recipeName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteConfirmationModal = ({
  isOpen,
  recipeName,
  onConfirm,
  onCancel,
  isDeleting
}: DeleteConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    // Modal Opaque Background
    <div
      className="fixed w-full h-full top-0 bg-white/50 z-50 cursor-pointer flex justify-center items-center"
      onClick={e => {
        // only if the clicked target is the current element. i.e. don't close the modal
        // when clicking on the child components
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      {/* Modal box */}
      <div className="cursor-default w-5/12 drop-shadow-md">
        {/* Modal content box */}
        <div className="rounded bg-white p-6 mx-auto w-10/12">
          {/* Modal header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Delete Recipe
            </h2>
            <p className="text-gray-600">
              Are you sure you want to delete "
              {recipeName}
              "?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone.
            </p>
          </div>

          {/* Loading state */}
          {isDeleting && (
            <div className="text-center mb-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
              <p className="text-sm text-gray-600 mt-2">Deleting recipe...</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              className={`rounded drop-shadow-md border border-gray-300 bg-gray-100 text-gray-700 py-2 px-4 
                ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
              onClick={onCancel}
              disabled={isDeleting}
              aria-label={`Cancel deletion of ${recipeName}`}
            >
              Cancel
            </button>
            <button
              className={`rounded drop-shadow-md border border-red-600 bg-red-500 text-white py-2 px-4 
                ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
              onClick={onConfirm}
              disabled={isDeleting}
              aria-label={`Confirm deletion of ${recipeName}`}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
