import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { Button } from './button'
import { ThemeToggle } from './theme-toggle'

export default function Navbar() {
    const [userRole, setUserRole] = useState(null)
    const location = useLocation()

    useEffect(() => {
        async function getUserRole() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                setUserRole(profile?.role)
            }
        }
        getUserRole()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <nav className="border-b">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/dashboard"
                            className={`text-sm font-medium ${location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                            Dashboard
                        </Link>
                        {userRole === 'admin' && (
                            <Link
                                to="/admin"
                                className={`text-sm font-medium ${location.pathname === '/admin' ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                                Admin Portal
                            </Link>
                        )}
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/settings"
                            className={`text-sm font-medium ${location.pathname === '/settings' ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                            Settings
                        </Link>
                        <ThemeToggle />
                        <Button variant="ghost" onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    )
} 