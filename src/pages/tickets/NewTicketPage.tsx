import React from 'react';
import { Link } from 'react-router-dom';
import { TicketForm } from '../../components/tickets/TicketCreate/TicketForm';

export const NewTicketPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <div className="border-b border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4">
                        <div className="flex items-center space-x-2 text-sm">
                            <Link
                                to="/tickets"
                                className="text-gray-500 hover:text-gray-700"
                                aria-label="Back to Tickets"
                            >
                                Back to Tickets
                            </Link>
                            <svg
                                className="h-5 w-5 text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="text-gray-700">New Ticket</span>
                        </div>
                    </div>
                </div>
            </div>

            <main role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Create New Ticket
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Fill out the form below to create a new support ticket.
                            </p>
                        </div>

                        <TicketForm />
                    </div>
                </div>
            </main>
        </div>
    );
}; 