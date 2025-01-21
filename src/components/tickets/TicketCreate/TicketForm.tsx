import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../../../hooks/useTickets';
import { PriorityLevel, TicketStatus } from '../../../types/ticket.types';
import { useDropzone } from 'react-dropzone';

export const TicketForm: React.FC = () => {
    const navigate = useNavigate();
    const { createTicket } = useTickets();
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<PriorityLevel>(PriorityLevel.Medium);
    const [teamId, setTeamId] = useState('1');
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: (acceptedFiles) => {
            setFiles(acceptedFiles);
        }
    });

    const isFormValid = () => {
        return subject.trim() !== '' && description.trim() !== '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid()) return;

        setError(null);
        setIsSubmitting(true);

        try {
            await createTicket.mutateAsync({
                subject,
                description,
                priority,
                team_id: teamId,
                status: TicketStatus.New
            });
            navigate('/tickets');
        } catch (err) {
            setError('Error creating ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} role="form" className="space-y-6">
            <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                    Subject
                </label>
                <input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    aria-required="true"
                    aria-invalid={subject.trim() === ''}
                    className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    aria-required="true"
                    aria-invalid={description.trim() === ''}
                    rows={4}
                    className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md"
                />
            </div>

            <div>
                <p className="text-sm font-medium text-gray-700">Priority</p>
                <div className="mt-2 space-x-4">
                    {Object.values(PriorityLevel).map((level) => (
                        <label key={level} className="inline-flex items-center">
                            <input
                                type="radio"
                                name="priority"
                                value={level}
                                checked={priority === level}
                                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-600">{level}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-sm font-medium text-gray-700">Assign to team</p>
                <div className="mt-2">
                    <label className="inline-flex items-center">
                        <input
                            type="radio"
                            name="team"
                            value="1"
                            checked={teamId === '1'}
                            onChange={(e) => setTeamId(e.target.value)}
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-600">Customer Support</span>
                    </label>
                </div>
            </div>

            <div {...getRootProps()} className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <input {...getInputProps()} aria-label="File upload" />
                    <div className="flex text-sm text-gray-600">
                        <p className="pl-1">Drag & drop files here, or click to select files</p>
                    </div>
                    {files.length > 0 && (
                        <div className="mt-2">
                            {files.map((file) => (
                                <p key={file.name} className="text-sm text-gray-500">
                                    {file.name}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4" role="alert">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                aria-disabled={!isFormValid() || isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </button>
        </form>
    );
}; 