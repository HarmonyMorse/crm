import React from 'react';
import { Link } from 'react-router-dom';
import type { ITicket } from '../../types/ticket.types';
import { useTickets } from '../../hooks/useTickets';

export const TicketListPage: React.FC = () => {
    const { tickets } = useTickets();

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
                        <p className="mt-1 text-sm text-gray-500">Manage and track support tickets</p>
                    </div>
                    <Link
                        to="/tickets/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        data-discover="true"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" clipRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                        </svg>
                        New Ticket
                    </Link>
                </div>
                <div className="bg-white shadow rounded-lg">
                    {tickets?.map((ticket: ITicket) => (
                        <div key={ticket.id} className="p-4 border-b last:border-b-0">
                            <Link
                                to={`/tickets/${ticket.id}`}
                                className="block hover:text-blue-600"
                                aria-label={`View ticket: ${ticket.subject}`}
                            >
                                <h3 className="text-lg font-medium text-gray-900">{ticket.subject}</h3>
                                <p className="mt-1 text-sm text-gray-500">{ticket.description}</p>
                                <div className="mt-2 flex items-center space-x-4">
                                    <span className="text-sm text-gray-500">Status: {ticket.status}</span>
                                    <span className="text-sm text-gray-500">Priority: {ticket.priority}</span>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}; 