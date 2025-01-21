import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'

interface AuthContextType {
    session: Session | null
    user: User | null
    loading: boolean
    error: Error | null
    signIn: (credentials: { email: string; password: string }) => Promise<{ error: Error | null }>
    signUp: (credentials: { email: string; password: string }) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    resetPassword: (data: { password: string; token: string }) => Promise<{ error: Error | null }>
    sendResetEmail: (email: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (credentials: { email: string; password: string }) => {
        try {
            setError(null)
            const { error } = await supabase.auth.signInWithPassword(credentials)
            if (error) throw error
            return { error: null }
        } catch (err) {
            const error = err as Error
            setError(error)
            return { error }
        }
    }

    const signUp = async (credentials: { email: string; password: string }) => {
        try {
            setError(null)
            const { error } = await supabase.auth.signUp(credentials)
            if (error) throw error
            return { error: null }
        } catch (err) {
            const error = err as Error
            setError(error)
            return { error }
        }
    }

    const signOut = async () => {
        try {
            setError(null)
            const { error } = await supabase.auth.signOut()
            if (error) throw error
        } catch (err) {
            const error = err as Error
            setError(error)
        }
    }

    const resetPassword = async (data: { password: string; token: string }) => {
        try {
            setError(null)
            const { error } = await supabase.auth.updateUser({
                password: data.password
            })
            if (error) throw error
            return { error: null }
        } catch (err) {
            const error = err as Error
            setError(error)
            return { error }
        }
    }

    const sendResetEmail = async (email: string) => {
        try {
            setError(null)
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`
            })
            if (error) throw error
            return { error: null }
        } catch (err) {
            const error = err as Error
            setError(error)
            return { error }
        }
    }

    const value = {
        session,
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        sendResetEmail
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
} 