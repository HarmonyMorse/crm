import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { toast } from '../components/ui/use-toast';

export default function MassFilter() {
    const [query, setQuery] = useState('');
    const [tickets, setTickets] = useState([]);
    const [selectedTickets, setSelectedTickets] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedFilters, setParsedFilters] = useState(null);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [bulkUpdates, setBulkUpdates] = useState({
        status: null,
        priority: null,
        tags: '',
        assigned_team_id: null,
    });
    const [updating, setUpdating] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('You must be logged in to filter tickets');
            }

            console.log('Sending request with query:', query);
            const { data: functionResponse, error: invokeError } = await supabase.functions.invoke('filter-tickets', {
                body: {
                    query,
                    userId: user.id
                },
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

            // Parse the JSON string response
            const parsedResponse = typeof functionResponse === 'string'
                ? JSON.parse(functionResponse)
                : functionResponse;

            // Extract data and parsedFilters from the parsed response
            const { data, parsedFilters, metrics, error: responseError } = parsedResponse;

            // Only throw an error if we have an explicit error and no data
            if (responseError && !data) {
                console.error('Response indicates failure:', parsedResponse);
                throw new Error(responseError);
            }

            setTickets(data || []);
            setParsedFilters(parsedFilters || {});
            setSelectedTickets(new Set((data || []).map(ticket => ticket.id)));

            // Log metrics if available
            if (metrics) {
                console.log('Filter metrics:', metrics);
            }
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
        }
        setLoading(false);
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

    const handleBulkUpdate = async () => {
        if (selectedTickets.size === 0) {
            toast({
                title: "No tickets selected",
                description: "Please select at least one ticket to update.",
                variant: "destructive",
            });
            return;
        }

        setUpdating(true);
        try {
            // Clean up updates object to only include fields that were changed
            const updates = Object.entries(bulkUpdates).reduce((acc, [key, value]) => {
                if (value) {
                    if (key === 'tags') {
                        // Split tags by comma and trim whitespace
                        acc[key] = value.split(',').map(tag => tag.trim());
                    } else {
                        acc[key] = value;
                    }
                }
                return acc;
            }, {});

            if (Object.keys(updates).length === 0) {
                toast({
                    title: "No updates specified",
                    description: "Please specify at least one field to update.",
                    variant: "destructive",
                });
                return;
            }

            const { error } = await supabase.functions.invoke('bulk-update-tickets', {
                body: {
                    tickets: Array.from(selectedTickets).map(id => ({ id })),
                    updates,
                    reason: 'Bulk update from Mass Filter UI'
                }
            });

            if (error) throw error;

            toast({
                title: "Success!",
                description: `Updated ${selectedTickets.size} tickets successfully.`,
            });

            // Clear selections and close dialog
            setUpdateDialogOpen(false);
            setBulkUpdates({
                status: null,
                priority: null,
                tags: '',
                assigned_team_id: null,
            });

            // Refresh the tickets list
            handleSubmit(new Event('submit'));

        } catch (err) {
            console.error('Bulk update error:', err);
            toast({
                title: "Update failed",
                description: err.message || "Failed to update tickets. Please try again.",
                variant: "destructive",
            });
        } finally {
            setUpdating(false);
        }
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
                <>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-muted-foreground">
                            {selectedTickets.size} of {tickets.length} tickets selected
                        </p>
                        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    disabled={selectedTickets.size === 0}
                                    variant="default"
                                >
                                    Update Selected Tickets
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Bulk Update Tickets</DialogTitle>
                                    <DialogDescription>
                                        Update the selected fields for {selectedTickets.size} ticket{selectedTickets.size !== 1 ? 's' : ''}. Leave fields unchanged to keep their current values.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={bulkUpdates.status}
                                            onValueChange={(value) => setBulkUpdates(prev => ({ ...prev, status: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={null}>No change</SelectItem>
                                                <SelectItem value="open">Open</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="resolved">Resolved</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="priority">Priority</Label>
                                        <Select
                                            value={bulkUpdates.priority}
                                            onValueChange={(value) => setBulkUpdates(prev => ({ ...prev, priority: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select priority..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={null}>No change</SelectItem>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                                        <Input
                                            id="tags"
                                            value={bulkUpdates.tags}
                                            onChange={(e) => setBulkUpdates(prev => ({ ...prev, tags: e.target.value }))}
                                            placeholder="e.g., urgent, needs-review"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setUpdateDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleBulkUpdate}
                                        disabled={updating}
                                    >
                                        {updating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            'Update Tickets'
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

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
                </>
            )}
        </div>
    );
} 