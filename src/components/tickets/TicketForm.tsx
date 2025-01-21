import React, { useState } from 'react';

const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await onSubmit({
            subject,
            description,
            priority,
            team_id: selectedTeam,
            attachments: files
        });
    } catch (error) {
        setError(error.message);
    } finally {
        setIsSubmitting(false);
    }
};

<button
    type="submit"
    disabled={isSubmitting}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
>
    {isSubmitting ? 'Creating...' : 'Create Ticket'}
</button> 