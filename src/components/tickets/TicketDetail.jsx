import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/button';
import AgentAssignment from './AgentAssignment';
import { CustomerInfoModal } from '../ui/CustomerInfoModal';

const PRIORITY_COLORS = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-green-400'
};

const STATUS_COLORS = {
    open: 'bg-green-500/10 text-green-400',
    pending: 'bg-yellow-500/10 text-yellow-400',
    resolved: 'bg-blue-500/10 text-blue-400'
};

function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [history, setHistory] = useState([]);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [newNote, setNewNote] = useState('');
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch ticket data and user role
    useEffect(() => {
        const fetchTicketData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                // Get user role
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (userError) throw userError;
                setUserRole(userData.role);

                // Fetch ticket with customer info
                const { data: ticketData, error: ticketError } = await supabase
                    .from('tickets')
                    .select(`
                        *,
                        customer:users!tickets_customer_id_fkey(
                            email,
                            name,
                            created_at
                        ),
                        assigned_agent:users!tickets_assigned_agent_id_fkey(
                            email,
                            name
                        ),
                        assigned_team:teams!tickets_assigned_team_id_fkey(
                            name
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (ticketError) throw ticketError;
                setTicket(ticketData);

                // Fetch ticket history
                const { data: historyData, error: historyError } = await supabase
                    .from('ticket_history')
                    .select(`
                        *,
                        user:users(
                            email,
                            name
                        )
                    `)
                    .eq('ticket_id', id)
                    .order('created_at', { ascending: true });

                if (historyError) throw historyError;
                setHistory(historyData);

                // Fetch notes (only for agents/admins)
                if (userData.role !== 'customer') {
                    const { data: notesData, error: notesError } = await supabase
                        .from('notes')
                        .select(`
                            *,
                            user:users(
                                email,
                                name
                            )
                        `)
                        .eq('ticket_id', id)
                        .order('created_at', { ascending: true });

                    if (notesError) throw notesError;
                    setNotes(notesData);
                }
            } catch (err) {
                console.error('Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTicketData();

        // Set up realtime subscriptions
        const ticketChannel = supabase
            .channel('ticket_detail')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tickets',
                    filter: `id=eq.${id}`
                },
                () => fetchTicketData()
            )
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'ticket_history',
                    filter: `ticket_id=eq.${id}`
                },
                () => fetchTicketData()
            )
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notes',
                    filter: `ticket_id=eq.${id}`
                },
                () => fetchTicketData()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(ticketChannel);
        };
    }, [id]);

    const handleStatusChange = async (newStatus) => {
        if (!ticket || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { error: updateError } = await supabase
                .from('tickets')
                .update({ status: newStatus })
                .eq('id', ticket.id);

            if (updateError) throw updateError;

            // Add to ticket history
            const { error: historyError } = await supabase
                .from('ticket_history')
                .insert({
                    ticket_id: ticket.id,
                    message: `Status changed to ${newStatus}`,
                    message_type: 'system'
                });

            if (historyError) throw historyError;
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('notes')
                .insert({
                    ticket_id: ticket.id,
                    user_id: user.id,
                    note_detail: newNote.trim()
                });

            if (error) throw error;
            setNewNote('');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('ticket_history')
                .insert({
                    ticket_id: ticket.id,
                    user_id: user.id,
                    message: newComment.trim(),
                    message_type: userRole === 'customer' ? 'customer' : 'agent'
                });

            if (error) throw error;
            setNewComment('');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-foreground">Loading ticket details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 text-red-400 p-4 rounded-md">
                Error: {error}
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="text-foreground">Ticket not found.</div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        {ticket.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <CustomerInfoModal customer={ticket.customer} />
                            <span>
                                Opened by: {ticket.customer.name || ticket.customer.email}
                            </span>
                        </div>
                        <span>
                            Created: {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                </Button>
            </div>

            {/* Priority and Tags */}
            <div className="flex gap-4 text-sm">
                <span className={PRIORITY_COLORS[ticket.priority]}>
                    Priority: {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </span>
                {(ticket.assigned_agent || ticket.assigned_team) && (
                    <span className="text-muted-foreground">
                        Assigned to: {ticket.assigned_agent
                            ? (ticket.assigned_agent.name || ticket.assigned_agent.email)
                            : `Team ${ticket.assigned_team.name}`}
                    </span>
                )}
            </div>

            {/* Status and Assignment Section */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Status Controls */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    {userRole !== 'customer' ? (
                        <div className="flex gap-2">
                            <Button
                                variant={ticket.status === 'open' ? 'default' : 'outline'}
                                onClick={() => handleStatusChange('open')}
                                disabled={isSubmitting}
                            >
                                Open
                            </Button>
                            <Button
                                variant={ticket.status === 'pending' ? 'default' : 'outline'}
                                onClick={() => handleStatusChange('pending')}
                                disabled={isSubmitting}
                            >
                                Pending
                            </Button>
                            <Button
                                variant={ticket.status === 'resolved' ? 'default' : 'outline'}
                                onClick={() => handleStatusChange('resolved')}
                                disabled={isSubmitting}
                            >
                                Resolved
                            </Button>
                        </div>
                    ) : (
                        <div className={`px-2 py-1 rounded-full text-xs inline-block ${STATUS_COLORS[ticket.status]}`}>
                            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </div>
                    )}
                </div>

                {/* Agent/Team Assignment */}
                {userRole === 'admin' && (
                    <AgentAssignment
                        ticketId={ticket.id}
                        currentAgentId={ticket.assigned_agent_id}
                        currentTeamId={ticket.assigned_team_id}
                        onAssign={() => { }} // The realtime subscription will handle the update
                    />
                )}
            </div>

            {/* Ticket Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {/* Main Info */}
                    <div className="border border-border rounded-lg p-4 space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground mb-2">Details</h2>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[ticket.status]}`}>
                                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Priority</span>
                                    <span className={PRIORITY_COLORS[ticket.priority]}>
                                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                    </span>
                                </div>
                                {ticket.tags && ticket.tags.length > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tags</span>
                                        <div className="flex gap-1">
                                            {ticket.tags.map(tag => (
                                                <span
                                                    key={tag}
                                                    className="bg-primary/20 text-primary-foreground px-2 py-1 rounded text-xs"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
                            <p className="text-muted-foreground whitespace-pre-wrap">
                                {ticket.description || 'No description provided.'}
                            </p>
                        </div>
                    </div>

                    {/* Conversation */}
                    <div className="border border-border rounded-lg p-4">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Conversation</h2>
                        <div className="space-y-4 mb-4">
                            {history.map(entry => (
                                <div
                                    key={entry.id}
                                    className={`p-3 rounded-lg ${entry.message_type === 'customer'
                                        ? 'bg-blue-500/10 text-blue-400'
                                        : entry.message_type === 'agent'
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'bg-muted/50 text-muted-foreground'
                                        }`}
                                >
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>
                                            {entry.message_type === 'system'
                                                ? 'System'
                                                : entry.user?.name || entry.user?.email}
                                        </span>
                                        <span>{new Date(entry.created_at).toLocaleString()}</span>
                                    </div>
                                    <div>{entry.message}</div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddComment} className="space-y-2">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full p-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground"
                                rows={3}
                            />
                            <Button
                                type="submit"
                                disabled={isSubmitting || !newComment.trim()}
                            >
                                Send
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Internal Notes (Agents/Admins Only) */}
                {userRole !== 'customer' && (
                    <div className="border border-border rounded-lg p-4">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Internal Notes</h2>
                        <div className="space-y-4 mb-4">
                            {notes.map(note => (
                                <div key={note.id} className="bg-muted/50 p-3 rounded-lg">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>{note.user?.name || note.user?.email}</span>
                                        <span>{new Date(note.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="text-foreground whitespace-pre-wrap">
                                        {note.note_detail}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddNote} className="space-y-2">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Add an internal note..."
                                className="w-full p-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground"
                                rows={3}
                            />
                            <Button
                                type="submit"
                                disabled={isSubmitting || !newNote.trim()}
                            >
                                Add Note
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TicketDetail;
