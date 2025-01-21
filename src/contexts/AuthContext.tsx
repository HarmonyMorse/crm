import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthContextType, AuthError, AuthUser, UserRole } from '../types/auth.types'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<AuthError | null>(null)

    // Handle session changes
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleSession(session)
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Handle session update
    const handleSession = (session: Session | null) => {
        if (session?.user) {
            // Get user's role and team_id from profiles table
            supabase
                .from('profiles')
                .select('role, team_id')
                .eq('id', session.user.id)
                .single()
                .then(({ data, error: profileError }) => {
                    if (profileError) {
                        console.error('Error fetching user profile:', profileError)
                        setUser(session.user as AuthUser)
                    } else {
                        setUser({
                            ...session.user,
                            role: data?.role as UserRole,
                            team_id: data?.team_id
                        })
                    }
                })
        } else {
            setUser(null)
        }
    }

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true)
            setError(null)
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
        } catch (err) {
            setError({ message: err.message, code: err.code })
            throw err
        } finally {
            setLoading(false)
        }
    }

    // Sign up with email and password
    const signUp = async (email: string, password: string) => {
        try {
            setLoading(true)
            setError(null)
            const { error } = await supabase.auth.signUp({ email, password })
            if (error) throw error
        } catch (err) {
            setError({ message: err.message, code: err.code })
            throw err
        } finally {
            setLoading(false)
        }
    }

    // Sign out
    const signOut = async () => {
        try {
            setLoading(true)
            setError(null)
            const { error } = await supabase.auth.signOut()
            if (error) throw error
        } catch (err) {
            setError({ message: err.message, code: err.code })
            throw err
        } finally {
            setLoading(false)
        }
    }

    // Reset password
    const resetPassword = async (email: string) => {
        try {
            setLoading(true)
            setError(null)
            const { error } = await supabase.auth.resetPasswordForEmail(email)
            if (error) throw error
        } catch (err) {
            setError({ message: err.message, code: err.code })
            throw err
        } finally {
            setLoading(false)
        }
    }

    // Update password
    const updatePassword = async (password: string) => {
        try {
            setLoading(true)
            setError(null)
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
        } catch (err) {
            setError({ message: err.message, code: err.code })
            throw err
        } finally {
            setLoading(false)
        }
    }

    const value = {
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 