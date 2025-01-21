import { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'agent' | 'team_lead' | 'customer'

export interface AuthUser extends User {
    role?: UserRole
    team_id?: string
}

export interface AuthError {
    message: string
    code?: string
}

export interface AuthState {
    user: AuthUser | null
    loading: boolean
    error: AuthError | null
}

export interface AuthContextType extends AuthState {
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<void>
    updatePassword: (password: string) => Promise<void>
} 