import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Loader2 } from 'lucide-react';

export default function MassFilter() {
    const [query, setQuery] = useState('');
    const [tickets, setTickets] = useState([]);
    const [selectedTickets, setSelectedTickets] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedFilters, setParsedFilters] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            console.log('Sending request with query:', query);
            const { data: functionResponse, error: invokeError } = await supabase.functions.invoke('filter-tickets', {
                body: { query },
            });

            console.log('Full response object:', { functionResponse, invokeError });

            if (invokeError) {
                console.error('Invoke error details:', {
                    message: invokeError.message,
                    details: invokeError.details,
                    hint: invokeError.hint,
                    code: invokeError.code,
                    stack: invokeError.stack
                });
                throw invokeError;
            }

            if (!functionResponse) {
                console.error('No response received');
                throw new Error('No response received from the server');
            }

            // Extract data and parsedFilters from the function response
            const { data, parsedFilters, success, error: responseError } = functionResponse;

            // Only throw an error if we have an explicit error and no data
            if (responseError && !data) {
                console.error('Response indicates failure:', functionResponse);
                throw new Error(responseError);
            }

            setTickets(data || []);
            setParsedFilters(parsedFilters || {});
            setSelectedTickets(new Set((data || []).map(ticket => ticket.id)));
        } catch (err) {
            console.error('Detailed error in handleSubmit:', {
                name: err.name,
                message: err.message,
                stack: err.stack,
                cause: err.cause
            });

            let errorMessage = 'An unexpected error occurred';
            if (err.message.includes('FetchError')) {
                errorMessage = 'Failed to connect to the server. Please check your internet connection.';
            } else if (err.message.includes('TypeError')) {
                errorMessage = 'There was a problem processing the response from the server.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setTickets([]);
            setParsedFilters(null);
            setSelectedTickets(new Set());
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedTickets(new Set(tickets.map(ticket => ticket.id)));
        } else {
            setSelectedTickets(new Set());
        }
    };

    const handleSelectTicket = (ticketId) => {
        const newSelected = new Set(selectedTickets);
        if (newSelected.has(ticketId)) {
            newSelected.delete(ticketId);
        } else {
            newSelected.add(ticketId);
        }
        setSelectedTickets(newSelected);
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Mass Filter Tickets</h1>

            <Card className="p-6 mb-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            placeholder="e.g., Find all pending tickets about billing from last week"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Filtering...
                            </>
                        ) : (
                            'Filter Tickets'
                        )}
                    </Button>
                </form>

                {error && (
                    <div className="mt-4 p-4 bg-destructive/15 text-destructive rounded-md">
                        {error}
                    </div>
                )}

                {parsedFilters && (
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">Applied Filters:</h3>
                        <pre className="bg-muted p-4 rounded-md overflow-auto">
                            {JSON.stringify(parsedFilters, null, 2)}
                        </pre>
                    </div>
                )}
            </Card>

            {tickets.length > 0 && (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-4">
                                        <Checkbox
                                            checked={tickets.length > 0 && selectedTickets.size === tickets.length}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Select all tickets"
                                        />
                                    </th>
                                    <th className="p-4 text-left">ID</th>
                                    <th className="p-4 text-left">Title</th>
                                    <th className="p-4 text-left">Status</th>
                                    <th className="p-4 text-left">Priority</th>
                                    <th className="p-4 text-left">Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        className="border-b hover:bg-muted/50 cursor-pointer"
                                        onClick={() => handleSelectTicket(ticket.id)}
                                    >
                                        <td className="p-4">
                                            <Checkbox
                                                checked={selectedTickets.has(ticket.id)}
                                                onCheckedChange={() => handleSelectTicket(ticket.id)}
                                                aria-label={`Select ticket ${ticket.id}`}
                                            />
                                        </td>
                                        <td className="p-4">{ticket.id}</td>
                                        <td className="p-4">{ticket.title}</td>
                                        <td className="p-4">{ticket.status}</td>
                                        <td className="p-4">{ticket.priority}</td>
                                        <td className="p-4">{new Date(ticket.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
} 