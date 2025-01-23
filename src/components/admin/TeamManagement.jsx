import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Pencil, Trash2, X, Check } from 'lucide-react'

export default function TeamManagement() {
    const [teams, setTeams] = useState([])
    const [newTeamName, setNewTeamName] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [editingTeam, setEditingTeam] = useState(null)
    const [editName, setEditName] = useState('')

    useEffect(() => {
        fetchTeams()
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
            setTeams(data || [])
        } catch (err) {
            setError('Failed to fetch teams')
            console.error('Error fetching teams:', err)
        } finally {
            setLoading(false)
        }
    }

    async function createTeam(e) {
        e.preventDefault()
        if (!newTeamName.trim()) return

        try {
            const { data, error } = await supabase
                .from('teams')
                .insert([{ name: newTeamName.trim() }])
                .select()
                .single()

            if (error) throw error

            setTeams(prevTeams => [...prevTeams, { ...data, team_members: [] }])
            setNewTeamName('')
            setError(null)
        } catch (err) {
            setError(err.message === 'duplicate key value violates unique constraint "teams_name_key"'
                ? 'A team with this name already exists'
                : 'Failed to create team')
            console.error('Error creating team:', err)
        }
    }

    async function updateTeam(teamId) {
        if (!editName.trim() || editName === teams.find(t => t.id === teamId)?.name) {
            cancelEdit()
            return
        }

        try {
            const { data, error } = await supabase
                .from('teams')
                .update({ name: editName.trim() })
                .eq('id', teamId)
                .select()
                .single()

            if (error) throw error

            setTeams(prevTeams => prevTeams.map(team =>
                team.id === teamId
                    ? { ...team, name: data.name }
                    : team
            ))
            setError(null)
            cancelEdit()
        } catch (err) {
            setError(err.message === 'duplicate key value violates unique constraint "teams_name_key"'
                ? 'A team with this name already exists'
                : 'Failed to update team')
            console.error('Error updating team:', err)
        }
    }

    async function deleteTeam(teamId) {
        if (!window.confirm('Are you sure you want to delete this team? This will remove all agent assignments.')) {
            return
        }

        try {
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamId)

            if (error) throw error

            setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId))
            setError(null)
        } catch (err) {
            setError('Failed to delete team')
            console.error('Error deleting team:', err)
        }
    }

    function startEdit(team) {
        setEditingTeam(team.id)
        setEditName(team.name)
        setError(null)
    }

    function cancelEdit() {
        setEditingTeam(null)
        setEditName('')
        setError(null)
    }

    if (loading) {
        return <div>Loading teams...</div>
    }

    return (
        <div className="space-y-6">
            <form onSubmit={createTeam} className="flex gap-4 items-end">
                <div className="flex-1">
                    <label htmlFor="teamName" className="block text-sm font-medium mb-2">
                        Team Name
                    </label>
                    <Input
                        id="teamName"
                        type="text"
                        value={newTeamName}
                        onChange={(e) => {
                            setError(null)
                            setNewTeamName(e.target.value)
                        }}
                        placeholder="Enter team name"
                    />
                    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                </div>
                <Button type="submit">Create Team</Button>
            </form>

            <div className="grid gap-4">
                {teams.map((team) => (
                    <Card key={team.id}>
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex-1">
                                {editingTeam === team.id ? (
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="max-w-xs"
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => updateTeam(team.id)}
                                            title="Save"
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={cancelEdit}
                                            title="Cancel"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <h3 className="font-medium">{team.name}</h3>
                                        <span className="text-sm text-muted-foreground">
                                            {team.team_members?.length || 0} members
                                        </span>
                                    </div>
                                )}
                            </div>
                            {editingTeam !== team.id && (
                                <div className="flex gap-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => startEdit(team)}
                                        title="Edit team"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => deleteTeam(team.id)}
                                        title="Delete team"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {teams.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                        No teams created yet
                    </p>
                )}
            </div>
        </div>
    )
}