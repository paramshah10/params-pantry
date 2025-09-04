import { useState, useContext } from 'react';
import { AppContext } from '../pages/_app';
import DeleteConfirmationModal from './delete-confirmation-modal';

interface DeleteButtonProps {
  recipeName: string;
  onDeleteSuccess: () => void;
  onDeleteError: (error: string) => void;
}

const DeleteIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
};

const DeleteButton = ({ recipeName, onDeleteSuccess, onDeleteError }: DeleteButtonProps) => {
  const { firebase } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    if (!isDeleting) {
      setIsModalOpen(false);
    }
  };

  const handleConfirm = async () => {
    if (!firebase) {
      onDeleteError('Firebase not initialized');
      return;
    }

    setIsDeleting(true);

    try {
      // First, try to get the recipe to check if it exists and has an image
      const recipeData = await firebase.get(`recipes/${recipeName}`);

      if (!recipeData) {
        setIsDeleting(false);
        setIsModalOpen(false);
        onDeleteError('Recipe not found');
        return;
      }

      // Delete recipe data from Firestore
      const recipeDeleted = await firebase.delete(`recipes/${recipeName}`);

      if (!recipeDeleted) {
        setIsDeleting(false);
        onDeleteError('Failed to delete recipe data. Please check your permissions and try again.');
        return;
      }

      // Delete associated image if it exists
      // The image location is typically the recipe name
      let imageDeleted = true;
      if (recipeData.image) {
        imageDeleted = await firebase.deleteImage(recipeName);
        // Note: We don't fail the entire operation if image deletion fails
        // as the recipe data is already deleted
        if (!imageDeleted) {
          console.warn(`Failed to delete image for recipe: ${recipeName}`);
        }
      }

      setIsDeleting(false);
      setIsModalOpen(false);
      onDeleteSuccess();
    } catch (error) {
      setIsDeleting(false);

      // Handle different types of errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
          onDeleteError('You don\'t have permission to delete this recipe.');
        } else if (errorMessage.includes('network') || errorMessage.includes('offline')) {
          onDeleteError('Network error. Please check your connection and try again.');
        } else if (errorMessage.includes('not-found')) {
          onDeleteError('Recipe not found.');
        } else {
          onDeleteError(`Failed to delete recipe: ${error.message}`);
        }
      } else {
        onDeleteError('An unexpected error occurred while deleting the recipe.');
      }
    }
  };

  return (
    <>
      <button
        className={`
          flex items-center justify-center gap-2 px-6 py-3 
          rounded drop-shadow-md border border-red-600 
          bg-red-500 text-white font-medium
          transition-colors duration-200
          ${isDeleting
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:bg-red-600 focus:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
    }
        `}
        onClick={handleDeleteClick}
        disabled={isDeleting}
        aria-label={`Delete recipe ${recipeName}`}
        type="button"
      >
        <DeleteIcon />
        {isDeleting ? 'Deleting...' : 'Delete Recipe'}
      </button>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        recipeName={recipeName}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default DeleteButton;
