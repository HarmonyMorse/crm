import React from 'react';

export const LoadingSpinner = () => {
    return (
        <div role="status" className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="sr-only">Loading...</span>
        </div>
    );
}; 