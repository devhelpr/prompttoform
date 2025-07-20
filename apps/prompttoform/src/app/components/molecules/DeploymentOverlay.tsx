import React, { useEffect, useRef } from 'react';

interface DeploymentOverlayProps {
  isVisible: boolean;
  message: string;
  isSuccess?: boolean;
  siteUrl?: string;
  onClose?: () => void;
}

export function DeploymentOverlay({
  isVisible,
  message,
  isSuccess = false,
  siteUrl,
  onClose,
}: DeploymentOverlayProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isVisible) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isVisible]);

  const handleClose = () => {
    onClose?.();
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black backdrop:bg-opacity-50 rounded-lg p-0 border-0 shadow-xl max-w-md w-full mx-4"
      onClose={handleClose}
    >
      <div className="p-8">
        <div className="text-center">
          {!isSuccess ? (
            // Deployment in progress
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Deploying to Netlify
              </h3>
              <p className="text-gray-600">{message}</p>
            </>
          ) : (
            // Deployment successful
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Deployment Successful!
              </h3>
              <p className="text-gray-600 mb-4">{message}</p>
              {siteUrl && (
                <div className="mb-4">
                  <a
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 underline break-all"
                  >
                    {siteUrl}
                  </a>
                </div>
              )}
              <button
                onClick={handleClose}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
