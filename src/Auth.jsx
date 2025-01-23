import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AuthComponent() {
    const [session, setSession] = useState(null)
    const [error, setError] = useState(null)

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
                    // Create or update the user record in our database
                    const { error: upsertError } = await supabase
                        .from('users')
                        .upsert({
                            id: session.user.id,
                            email: session.user.email,
                            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
                            role: 'customer' // All new signups are customers by default
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

    return (
        <div>
            {error && (
                <div className="bg-red-900/20 text-red-400 p-4 rounded-md mb-4">
                    {error}
                </div>
            )}
            {!session ? (
                <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    providers={[]}
                />
            ) : (
                <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
            )}
        </div>
    )
}