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

            // If this is a new sign up, create a user record
            if (_event === 'SIGNED_IN' && session) {
                try {
                    // Check if user already exists in public.users
                    const { data: existingUser } = await supabase
                        .from('users')
                        .select('id')
                        .eq('id', session.user.id)
                        .single()

                    if (!existingUser) {
                        // Create new user record
                        const { error: insertError } = await supabase
                            .from('users')
                            .insert([{
                                id: session.user.id,
                                email: session.user.email,
                                name: session.user.user_metadata?.name || session.user.email.split('@')[0],
                                role: 'customer' // Default role for new signups
                            }])

                        if (insertError) {
                            console.error('Error creating user record:', insertError)
                            setError('Failed to complete signup. Please try again.')
                        }
                    }
                } catch (err) {
                    console.error('Error in auth state change:', err)
                    setError('An error occurred during signup.')
                }
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // If you prefer a fully custom UI, you can create your own forms for sign in/sign up.
    // For demonstration, we'll use the Supabase UI components here.
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
                    providers={[]}  // Optional: remove or add as needed
                />
            ) : (
                <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
            )}
        </div>
    )
}