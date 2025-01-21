import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { TicketDetail } from '../../components/tickets/TicketDetail/TicketDetail';

// Mock team members data - in a real app, this would come from an API
const mockTeamMembers = [
    {
        id: '1',
        email: 'agent1@example.com',
        role: 'agent'
    },
    {
        id: '2',
        email: 'agent2@example.com',
        role: 'agent'
    },
    {
        id: '3',
        email: 'lead@example.com',
        role: 'team_lead'
    }
];

export const TicketDetailPage = () => {
    const { ticketId } = useParams<{ ticketId: string }>();
    const navigate = useNavigate();

    if (!ticketId) {
        return (
            <div className="min-h-screen bg-gray-100 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Ticket not found
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            The ticket you're looking for doesn't exist.
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/tickets"
                                className="text-blue-600 hover:text-blue-500"
                            >
                                ← Back to tickets
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="border-b border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4">
                        <div className="flex items-center space-x-2 text-sm">
                            <Link
                                to="/tickets"
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Tickets
                            </Link>
                            <svg
                                className="h-5 w-5 text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="text-gray-700">Ticket Details</span>
                        </div>
                    </div>
                </div>
            </div>

            <TicketDetail ticketId={ticketId} teamMembers={mockTeamMembers} />
        </div>
    );
}; 