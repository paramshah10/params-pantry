import { Dispatch, SetStateAction, useState } from 'react';
import ImageUploading, { ImageListType } from 'react-images-uploading';

const EditIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
      width="25" height="25"
      viewBox="0 0 50 50"
      style={{
        fill: '#000000',
      }}
    >
      <path
        d="M 43.125 2 C 41.878906 2 40.636719 2.488281 39.6875 3.4375 L 38.875 4.25 L 45.75 11.125 C 45.746094
        11.128906 46.5625 10.3125 46.5625 10.3125 C 48.464844 8.410156 48.460938 5.335938 46.5625 3.4375 C 45.609375
        2.488281 44.371094 2 43.125 2 Z M 37.34375 6.03125 C 37.117188 6.0625 36.90625 6.175781 36.75 6.34375 L
        4.3125 38.8125 C 4.183594 38.929688 4.085938 39.082031 4.03125 39.25 L 2.03125 46.75 C 1.941406 47.09375
        2.042969 47.457031 2.292969 47.707031 C 2.542969 47.957031 2.90625 48.058594 3.25 47.96875 L 10.75 45.96875
        C 10.917969 45.914063 11.070313 45.816406 11.1875 45.6875 L 43.65625 13.25 C 44.054688 12.863281 44.058594
        12.226563 43.671875 11.828125 C 43.285156 11.429688 42.648438 11.425781 42.25 11.8125 L 9.96875 44.09375 L
        5.90625 40.03125 L 38.1875 7.75 C 38.488281 7.460938 38.578125 7.011719 38.410156 6.628906 C 38.242188
        6.246094 37.855469 6.007813 37.4375 6.03125 C 37.40625 6.03125 37.375 6.03125 37.34375 6.03125 Z"
      />
    </svg>
  );
};

interface EditImageModalProps {
  setRenderModal: Dispatch<SetStateAction<boolean>>
  updateFirebaseImage: (image) => Promise<boolean>
}

const EditImageModal = ({ setRenderModal, updateFirebaseImage }: EditImageModalProps) => {
  const [images, setImages] = useState([]);
  const [imageUploaded, setImageUploaded] = useState(false);

  const onChange = (
    imageList: ImageListType,
  ) => {
    setImages(imageList as never[]);
    setImageUploaded(true);
  };

  const onFirebaseImageUpload = async (imageURL: string) => {
    const firebaseUploaded = await updateFirebaseImage(imageURL);

    setRenderModal(!firebaseUploaded);
  };

  return (
    // Modal Opaque Background
    <div
      className='fixed w-full h-full top-0 bg-white/50 z-50 cursor-pointer flex justify-center items-center'
      onClick={(e) => {
        // only if the clicked target is the current element. i.e. don't close the modal
        // when clicking on the child components
        if (e.target === e.currentTarget) setRenderModal(false);
      }}
    >
      {/* Modal box */}
      <div className='cursor-default w-5/12 drop-shadow-md'>
        {/* Modal content box */}
        <div className='rounded bg-white p-6 mx-auto w-10/12'>
          <ImageUploading
            value={images}
            onChange={onChange}
          >
            {({
              imageList,
              onImageUpload,
              onImageRemove,
              isDragging,
              dragProps,
            }) => (
              <>
                <div
                  className={
                    `w-full flex justify-center items-center cursor-pointer select-none \
                    ${imageUploaded ? '' : 'h-56 border rounded border-dashed border-blue-400 border-2'}`
                  }
                  style={isDragging ? { color: 'red' } : undefined}
                  onClick={onImageUpload}
                  {...dragProps}
                >
                  {
                    imageUploaded ?
                      <img src={imageList[0].dataURL} alt="Recipe image you just uploaded" className='max-h-[48rem]'/> :
                      'Click or Drop Image here'
                  }
                </div>
                {
                  imageUploaded ?
                    <div className='grid grid-cols-2 gap-12 m-12 h-8 text-white'>
                      <button className='rounded drop-shadow-md border border-black bg-blue-500' onClick={() => onFirebaseImageUpload(imageList[0].dataURL)}>Upload</button>
                      <button className='rounded drop-shadow-md border border-black bg-red-500' onClick={() => { onImageRemove(0); setImageUploaded(false); }}>Remove</button>
                    </div>
                    :
                    <></>
                }
              </>
            )}
          </ImageUploading>
        </div>
      </div>
    </div>
  );
};

interface EditPictureButtonProps {
  updateFirebaseImage: (file) => Promise<boolean>
}

export default function EditPictureButton(props: EditPictureButtonProps) {
  const [renderModal, setRenderModal] = useState(false);

  return (
    <>
      <div
        className='absolute z-30 right-24 top-24 rounded-full cursor-pointer bg-white p-3'
        onClick={() => setRenderModal(!renderModal)}>
        <EditIcon />
      </div>
      {
        renderModal ?
          <EditImageModal setRenderModal={setRenderModal} updateFirebaseImage={props.updateFirebaseImage} />
          : <></>
      }
    </>
  );
}
