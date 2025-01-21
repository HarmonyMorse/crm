import React from 'react';
import { Link } from 'react-router-dom';
import { TicketList } from '../../components/tickets/TicketList/TicketList';

export const TicketListPage = () => {
    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage and track support tickets
                        </p>
                    </div>
                    <Link
                        to="/tickets/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg
                            className="-ml-1 mr-2 h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        New Ticket
                    </Link>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <TicketList />
                </div>
            </div>
        </div>
    );
}; 