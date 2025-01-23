import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'

export default function AgentAssignment() {
    const [teams, setTeams] = useState([])
    const [agents, setAgents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedAgent, setSelectedAgent] = useState('')
    const [selectedTeam, setSelectedTeam] = useState('')

    useEffect(() => {
        Promise.all([fetchTeams(), fetchAgents()])
            .finally(() => setLoading(false))
    }, [])

    async function fetchTeams() {
        try {
            const { data, error } = await supabase
                .from('teams')
                .select(`
                    id,
                    name,
                    team_members (
                        user:users (
                            id,
                            name,
                            email
                        )
                    )
                `)
                .order('name')

            if (error) throw error
            setTeams(data)
        } catch (err) {
            setError('Failed to fetch teams')
            console.error('Error fetching teams:', err)
        }
    }

    async function fetchAgents() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'agent')
                .order('name')

            if (error) throw error
            setAgents(data)
        } catch (err) {
            setError('Failed to fetch agents')
            console.error('Error fetching agents:', err)
        }
    }

    async function assignToTeam(e) {
        e.preventDefault()
        if (!selectedAgent || !selectedTeam) return

        try {
            // Check if agent is already in the team
            const team = teams.find(t => t.id === selectedTeam)
            if (team.team_members.some(tm => tm.user.id === selectedAgent)) {
                setError('Agent is already assigned to this team')
                return
            }

            // First update the user's role to agent if they aren't already
            const { error: roleError } = await supabase
                .from('users')
                .update({ role: 'agent' })
                .eq('id', selectedAgent)

            if (roleError) throw roleError

            // Then assign them to the team
            const { error: teamError } = await supabase
                .from('team_members')
                .insert([{
                    team_id: selectedTeam,
                    user_id: selectedAgent
                }])

            if (teamError) throw teamError

            // Refresh data
            await Promise.all([fetchTeams(), fetchAgents()])
            setSelectedAgent('')
            setSelectedTeam('')
            setError(null)
        } catch (err) {
            setError('Failed to assign agent to team')
            console.error('Error assigning agent:', err)
        }
    }

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="space-y-6">
            <form onSubmit={assignToTeam} className="space-y-4">
                <div>
                    <label htmlFor="agentSelect" className="block text-sm font-medium mb-2">
                        Select User to Make Agent
                    </label>
                    <select
                        id="agentSelect"
                        value={selectedAgent}
                        onChange={(e) => {
                            setError(null)
                            setSelectedAgent(e.target.value)
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                    >
                        <option value="">Select a user</option>
                        {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                                {agent.name || agent.email}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="teamSelect" className="block text-sm font-medium mb-2">
                        Assign to Team
                    </label>
                    <select
                        id="teamSelect"
                        value={selectedTeam}
                        onChange={(e) => {
                            setError(null)
                            setSelectedTeam(e.target.value)
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                    >
                        <option value="">Select a team</option>
                        {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit">Assign to Team</Button>
            </form>

            <div className="grid gap-4">
                {teams.map((team) => (
                    <Card key={team.id}>
                        <CardContent className="p-4">
                            <h3 className="font-medium mb-2">{team.name}</h3>
                            <div className="space-y-2">
                                {team.team_members.map(({ user }) => (
                                    <div key={user.id} className="text-sm">
                                        {user.name || user.email}
                                    </div>
                                ))}
                                {team.team_members.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        No agents assigned
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
} 