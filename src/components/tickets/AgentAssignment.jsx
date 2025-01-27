import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../lib/supabaseClient';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../ui/select';

export default function AgentAssignment({ ticketId, currentAgentId, currentTeamId, onAssign }) {
    const [agents, setAgents] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch agents
                const { data: agentsData, error: agentsError } = await supabase
                    .from('users')
                    .select('id, name, email')
                    .eq('role', 'agent')
                    .order('name');

                if (agentsError) throw agentsError;
                setAgents(agentsData);

                // Fetch teams
                const { data: teamsData, error: teamsError } = await supabase
                    .from('teams')
                    .select('id, name')
                    .order('name');

                if (teamsError) throw teamsError;
                setTeams(teamsData);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load agents and teams');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleAssign = async (value) => {
        try {
            let updates;
            let message;

            if (value === 'unassigned') {
                updates = {
                    assigned_agent_id: null,
                    assigned_team_id: null
                };
                message = 'Ticket unassigned';
            } else {
                const [type, id] = value.split(':');
                updates = {
                    assigned_agent_id: type === 'agent' ? id : null,
                    assigned_team_id: type === 'team' ? id : null
                };

                if (type === 'agent') {
                    const agent = agents.find(a => a.id === id);
                    message = `Ticket assigned to agent ${agent?.name || agent?.email || 'Unknown'}`;
                } else {
                    const team = teams.find(t => t.id === id);
                    message = `Ticket assigned to team ${team?.name || 'Unknown'}`;
                }
            }

            // Update ticket
            const { error: updateError } = await supabase
                .from('tickets')
                .update(updates)
                .eq('id', ticketId);

            if (updateError) throw updateError;

            // Add to ticket history
            const { error: historyError } = await supabase
                .from('ticket_history')
                .insert({
                    ticket_id: ticketId,
                    message,
                    message_type: 'system'
                });

            if (historyError) throw historyError;

            // Notify parent component
            onAssign(updates);
        } catch (err) {
            console.error('Error assigning ticket:', err);
            setError('Failed to assign ticket');
        }
    };

    const getCurrentValue = () => {
        if (!currentAgentId && !currentTeamId) return 'unassigned';
        if (currentAgentId) return `agent:${currentAgentId}`;
        if (currentTeamId) return `team:${currentTeamId}`;
        return 'unassigned';
    };

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading...</div>;
    }

    if (error) {
        return <div className="text-sm text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">Assign To</label>
            <Select
                value={getCurrentValue()}
                onValueChange={handleAssign}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="unassigned">
                        Unassigned
                    </SelectItem>
                    <SelectGroup>
                        <SelectLabel>Agents</SelectLabel>
                        {agents.map((agent) => (
                            <SelectItem key={agent.id} value={`agent:${agent.id}`}>
                                {agent.name || agent.email}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectGroup>
                        <SelectLabel>Teams</SelectLabel>
                        {teams.map((team) => (
                            <SelectItem key={team.id} value={`team:${team.id}`}>
                                {team.name}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}

AgentAssignment.propTypes = {
    ticketId: PropTypes.string.isRequired,
    currentAgentId: PropTypes.string,
    currentTeamId: PropTypes.string,
    onAssign: PropTypes.func.isRequired
}; 