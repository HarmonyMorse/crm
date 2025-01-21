import React from 'react';
import { Link } from 'react-router-dom';
import { useTickets } from '../../../hooks/useTickets';
import { ITicket, ITicketFilter } from '../../../types/ticket.types';

export interface TicketListProps {
    tickets?: ITicket[];
    filters?: ITicketFilter;
}

export const TicketList: React.FC<TicketListProps> = ({ filters }) => {
    const { tickets, isLoading, error } = useTickets({ params: filters });

    if (isLoading) {
        return (
            <div role="status">
                <p>Loading...</p>
            </div>
        );
    }

    if (error) {
        return <div>Error loading tickets. Please try again later.</div>;
    }

    if (!tickets?.length) {
        return (
            <div>
                <p>No tickets found</p>
                <p>Try adjusting your filters or create a new ticket.</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
                <div key={ticket.id} className="py-4">
                    <Link
                        to={`/tickets/${ticket.id}`}
                        className="block hover:bg-gray-50"
                    >
                        <h3 className="text-lg font-medium text-gray-900">
                            {ticket.subject}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {ticket.description}
                        </p>
                        <div className="mt-2 flex space-x-4 text-sm">
                            <p className="text-gray-600">Status: {ticket.status}</p>
                            <p className="text-gray-600">Priority: {ticket.priority}</p>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    );
};
