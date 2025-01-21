import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { supabase } from '../lib/supabase'

describe('Database User Management', () => {
    const testUser = {
        email: 'test.user@gmail.com',
        password: 'test123!@#',
        data: {
            full_name: 'Test User',
            role: 'customer'
        }
    }

    let userId: string | undefined
    let session: any

    // Clean up any existing test user
    beforeAll(async () => {
        // Delete test user if exists
        const { data: existingUser } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: testUser.password,
        })

        if (existingUser?.user) {
            await supabase.auth.admin.deleteUser(existingUser.user.id)
        }
    })

    // Clean up after tests
    afterAll(async () => {
        if (userId) {
            await supabase.auth.admin.deleteUser(userId)
        }
    })

    it('should create a user and sign in', async () => {
        // 1. Create a new user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: testUser.email,
            password: testUser.password,
            options: {
                data: testUser.data
            }
        })

        if (authError) {
            console.error('Auth Error:', authError)
        }

        expect(authError).toBeNull()
        expect(authData.user).toBeDefined()
        userId = authData.user?.id

        // 2. Verify user metadata
        expect(authData.user?.user_metadata).toBeDefined()
        expect(authData.user?.user_metadata.full_name).toBe(testUser.data.full_name)
        expect(authData.user?.user_metadata.role).toBe(testUser.data.role)

        // 3. Sign in to get session
        const { data: { session: newSession }, error: signInError } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: testUser.password,
        })

        if (signInError) {
            console.error('Sign In Error:', signInError)
        }

        expect(signInError).toBeNull()
        expect(newSession).toBeDefined()
        session = newSession
    })

    it('should create a team and assign user', async () => {
        if (!userId || !session) {
            throw new Error('No user ID or session available for test')
        }

        // 1. Create a team
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert({
                name: 'Test Team',
                description: 'A test team',
                lead_user_id: userId
            })
            .select()
            .single()

        if (teamError) {
            console.error('Team Error:', teamError)
        }

        expect(teamError).toBeNull()
        expect(team).toBeDefined()
        expect(team.name).toBe('Test Team')

        // 2. Assign user to team
        const { error: memberError } = await supabase
            .from('user_teams')
            .insert({
                user_id: userId,
                team_id: team.id,
                role: 'lead'
            })

        if (memberError) {
            console.error('Member Error:', memberError)
        }

        expect(memberError).toBeNull()

        // 3. Verify team membership
        const { data: membership, error: membershipError } = await supabase
            .from('user_teams')
            .select('*')
            .eq('user_id', userId)
            .eq('team_id', team.id)
            .single()

        if (membershipError) {
            console.error('Membership Error:', membershipError)
        }

        expect(membershipError).toBeNull()
        expect(membership).toBeDefined()
        expect(membership.role).toBe('lead')
    })

    it('should enforce team role enum constraint', async () => {
        if (!userId) {
            throw new Error('No user ID available for test')
        }

        // Create a test team first
        const { data: team } = await supabase
            .from('teams')
            .insert({
                name: 'Test Team 2',
                description: 'Another test team',
                lead_user_id: userId
            })
            .select()
            .single()

        // Attempt to create a team membership with invalid role
        const { error } = await supabase
            .from('user_teams')
            .insert({
                user_id: userId,
                team_id: team.id,
                role: 'invalid_role'
            })

        expect(error).toBeDefined()
        expect(error?.code).toBe('22P02') // PostgreSQL invalid input syntax error
    })
}) 