import React, { ChangeEvent } from 'react';
import { TicketStatus, PriorityLevel } from '../../types/ticket.types';
import type { ITicket } from '../../types/ticket.types';

interface TicketDetailProps {
    ticket: ITicket;
    onStatusChange: (status: TicketStatus) => void;
    onPriorityChange: (priority: PriorityLevel) => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({
    ticket,
    onStatusChange,
    onPriorityChange
}) => {
    const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
        onStatusChange(e.target.value as TicketStatus);
    };

    const handlePriorityChange = (e: ChangeEvent<HTMLSelectElement>) => {
        onPriorityChange(e.target.value as PriorityLevel);
    };

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
                <label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status
                </label>
                <select
                    id="status"
                    value={ticket.status}
                    onChange={handleStatusChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    aria-label="Ticket status"
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
                    Priority
                </label>
                <select
                    id="priority"
                    value={ticket.priority}
                    onChange={handlePriorityChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    aria-label="Ticket priority"
                >
                    {Object.values(PriorityLevel).map((priority) => (
                        <option key={priority} value={priority}>
                            {priority}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}; 