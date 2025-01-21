import React, { useState } from 'react';
import { useTicket } from '../../../hooks/useTicket';
import { AuthUser } from '../../../types/auth.types';
import { ITicket, ITicketComment, PriorityLevel, TicketStatus } from '../../../types/ticket.types';

interface TicketDetailProps {
    ticketId: string;
    teamMembers: AuthUser[];
}

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, teamMembers }) => {
    const {
        ticket,
        comments,
        isLoading,
        isLoadingComments,
        error,
        refetch,
        addComment,
        updateComment,
        deleteComment
    } = useTicket(ticketId);

    const [newComment, setNewComment] = useState('');
    const [isInternalComment, setIsInternalComment] = useState(false);

    if (isLoading || isLoadingComments) {
        return (
            <div role="status">
                <p>Loading...</p>
            </div>
        );
    }

    if (error) {
        return <div>Error loading ticket. Please try again later.</div>;
    }

    if (!ticket) {
        return <div>Ticket not found</div>;
    }

    const handleUpdate = async (updates: Partial<ITicket>) => {
        try {
            await refetch();
        } catch (err) {
            console.error('Failed to update ticket:', err);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await addComment.mutateAsync({
                content: newComment,
                is_internal: isInternalComment,
                ticket_id: ticketId
            });
            setNewComment('');
            setIsInternalComment(false);
        } catch (err) {
            console.error('Failed to add comment:', err);
        }
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        handleUpdate({ status: e.target.value as TicketStatus });
    };

    const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        handleUpdate({ priority: e.target.value as PriorityLevel });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900">{ticket.subject}</h2>
                <p className="mt-2 text-gray-600">{ticket.description}</p>
                <div className="mt-4 space-y-4">
                    <div className="flex items-center space-x-4">
                        <label htmlFor="status" className="text-sm font-medium text-gray-700">
                            Status:
                        </label>
                        <select
                            id="status"
                            value={ticket.status}
                            onChange={handleStatusChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            aria-label="Status"
                        >
                            {Object.values(TicketStatus).map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center space-x-4">
                        <label htmlFor="priority" className="text-sm font-medium text-gray-700">
                            Priority:
                        </label>
                        <select
                            id="priority"
                            value={ticket.priority}
                            onChange={handlePriorityChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            aria-label="Priority"
                        >
                            {Object.values(PriorityLevel).map((level) => (
                                <option key={level} value={level}>
                                    {level}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
                <div className="space-y-4">
                    {comments?.map((comment) => (
                        <div
                            key={comment.id}
                            className={`p-4 rounded-lg ${comment.is_internal ? 'bg-yellow-50' : 'bg-gray-50'
                                }`}
                        >
                            <p className="text-gray-900">{comment.content}</p>
                            <div className="mt-2 text-sm text-gray-500">
                                {comment.is_internal && <span className="mr-2">[Internal]</span>}
                                By {comment.created_by}
                            </div>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleAddComment} className="mt-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="comment" className="sr-only">
                                Comment
                            </label>
                            <textarea
                                id="comment"
                                rows={3}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    checked={isInternalComment}
                                    onChange={(e) => setIsInternalComment(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-sm text-gray-600">Internal comment</span>
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            Add Comment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
