import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'

export default function TeamManagement() {
    const [teams, setTeams] = useState([])
    const [newTeamName, setNewTeamName] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchTeams()
    }, [])

    async function fetchTeams() {
        try {
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .order('name')

            if (error) throw error
            setTeams(data)
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

            setTeams([...teams, data])
            setNewTeamName('')
        } catch (err) {
            setError(err.message === 'duplicate key value violates unique constraint "teams_name_key"'
                ? 'A team with this name already exists'
                : 'Failed to create team')
            console.error('Error creating team:', err)
        }
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
                            <div>
                                <h3 className="font-medium">{team.name}</h3>
                                {/* We'll add member count here later */}
                            </div>
                            {/* We'll add team actions here later */}
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