import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card } from '../ui/card';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        fetchCurrentUser();
        fetchUsers();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }
        } catch (err) {
            console.error('Error fetching current user:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUserRole = async (userId, newRole) => {
        // Prevent changing own role
        if (userId === currentUserId) {
            setError("You cannot change your own role");
            return;
        }

        try {
            const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;
            await fetchUsers();
        } catch (err) {
            console.error('Error updating user role:', err);
            setError(err.message);
        }
    };

    if (loading) {
        return <div>Loading users...</div>;
    }

    if (error) {
        return <div className="text-red-500">Error: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">User Management</h2>

            <div className="grid gap-4">
                {users.map((user) => (
                    <Card key={user.id} className="p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-medium">{user.name || 'No name'}</h3>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <select
                                    className="border rounded-md p-2"
                                    value={user.role}
                                    onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                                    disabled={user.id === currentUserId}
                                >
                                    <option value="customer">Customer</option>
                                    <option value="agent">Agent</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <span className="text-sm text-muted-foreground">
                                    Created: {new Date(user.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
} 