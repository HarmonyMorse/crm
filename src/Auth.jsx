import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { Button } from './components/ui/button'

export default function AuthComponent() {
    const [session, setSession] = useState(null)
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)

            // When a user signs up or signs in, create/verify their database record
            if (_event === 'SIGNED_IN' && session) {
                try {
                    // Check if user already exists
                    const { data: existingUser } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    // Create or update the user record in our database
                    const { error: upsertError } = await supabase
                        .from('users')
                        .upsert({
                            id: session.user.id,
                            email: session.user.email,
                            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
                            role: existingUser?.role || 'customer' // Preserve existing role or set to customer for new users
                        })

                    if (upsertError) {
                        console.error('Error upserting user:', upsertError)
                        setError('Failed to complete signup. Please try again.')
                    }
                } catch (err) {
                    console.error('Error in auth state change:', err)
                    setError('An error occurred during signup.')
                }
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleTestUserSignIn = async (email) => {
        setIsLoading(true)
        setError(null)
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: '12qw!@QW'
            })
            if (error) throw error
        } catch (err) {
            console.error('Error signing in:', err)
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto p-6">
            {error && (
                <div className="bg-red-900/20 text-red-400 p-4 rounded-md mb-4">
                    {error}
                </div>
            )}
            {!session ? (
                <>
                    <div className="mb-8 space-y-4">
                        <h2 className="text-lg font-semibold text-center mb-4">Quick Sign In (Test Users)</h2>
                        <div className="grid gap-2">
                            <Button
                                onClick={() => handleTestUserSignIn('admin@mycrm.com')}
                                disabled={isLoading}
                                variant="outline"
                            >
                                Sign in as Admin
                            </Button>
                            <Button
                                onClick={() => handleTestUserSignIn('agent@mycrm.com')}
                                disabled={isLoading}
                                variant="outline"
                            >
                                Sign in as Agent
                            </Button>
                            <Button
                                onClick={() => handleTestUserSignIn('customer1@mycrm.com')}
                                disabled={isLoading}
                                variant="outline"
                            >
                                Sign in as Customer
                            </Button>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Auth
                            supabaseClient={supabase}
                            appearance={{ theme: ThemeSupa }}
                            providers={[]}
                        />
                    </div>
                </>
            ) : (
                <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
            )}
        </div>
    )
}