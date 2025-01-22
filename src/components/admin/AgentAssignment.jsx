import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'

export default function AgentAssignment() {
    const [teams, setTeams] = useState([])
    const [agents, setAgents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [newAgentEmail, setNewAgentEmail] = useState('')
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

    async function createAgent(e) {
        e.preventDefault()
        if (!newAgentEmail.trim() || !selectedTeam) return

        try {
            // First create the user with agent role
            const { data: userData, error: userError } = await supabase
                .from('users')
                .insert([{
                    email: newAgentEmail.trim(),
                    role: 'agent',
                    name: newAgentEmail.split('@')[0] // Temporary name from email
                }])
                .select()
                .single()

            if (userError) throw userError

            // Then assign them to the selected team
            const { error: teamError } = await supabase
                .from('team_members')
                .insert([{
                    team_id: selectedTeam,
                    user_id: userData.id
                }])

            if (teamError) throw teamError

            // Refresh data
            await Promise.all([fetchTeams(), fetchAgents()])
            setNewAgentEmail('')
            setSelectedTeam('')
        } catch (err) {
            setError(err.message === 'duplicate key value violates unique constraint "users_email_key"'
                ? 'An agent with this email already exists'
                : 'Failed to create agent')
            console.error('Error creating agent:', err)
        }
    }

    async function assignToTeam(agentId, teamId) {
        try {
            const { error } = await supabase
                .from('team_members')
                .insert([{
                    team_id: teamId,
                    user_id: agentId
                }])

            if (error) throw error
            await fetchTeams()
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
            <form onSubmit={createAgent} className="space-y-4">
                <div>
                    <label htmlFor="agentEmail" className="block text-sm font-medium mb-2">
                        New Agent Email
                    </label>
                    <Input
                        id="agentEmail"
                        type="email"
                        value={newAgentEmail}
                        onChange={(e) => {
                            setError(null)
                            setNewAgentEmail(e.target.value)
                        }}
                        placeholder="agent@example.com"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="teamSelect" className="block text-sm font-medium mb-2">
                        Assign to Team
                    </label>
                    <select
                        id="teamSelect"
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
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
                <Button type="submit">Create Agent</Button>
            </form>

            <div className="grid gap-4">
                {teams.map((team) => (
                    <Card key={team.id}>
                        <CardContent className="p-4">
                            <h3 className="font-medium mb-2">{team.name}</h3>
                            <div className="space-y-2">
                                {team.team_members.map(({ user }) => (
                                    <div key={user.id} className="text-sm">
                                        {user.name} ({user.email})
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