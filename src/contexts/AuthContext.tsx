import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'

interface AuthContextType {
    session: Session | null
    user: User | null
    signIn: (data: { email: string; password: string }) => Promise<{ error: Error | null }>
    signUp: (data: { email: string; password: string }) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    resetPassword: (data: { password: string; token: string }) => Promise<{ error: Error | null }>
    sendResetEmail: (email: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (data: { email: string; password: string }) => {
        const { error } = await supabase.auth.signInWithPassword(data)
        return { error }
    }

    const signUp = async (data: { email: string; password: string }) => {
        const { error } = await supabase.auth.signUp(data)
        return { error }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    const resetPassword = async (data: { password: string; token: string }) => {
        const { error } = await supabase.auth.updateUser({
            password: data.password
        })
        return { error }
    }

    const sendResetEmail = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`
        })
        return { error }
    }

    const value = {
        session,
        user,
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