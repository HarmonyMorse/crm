import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newUser, setNewUser] = useState({ email: '', role: 'customer', name: '' });
    const [dialogOpen, setDialogOpen] = useState(false);
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

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // First create the auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: newUser.email,
                email_confirm: true,
                user_metadata: { name: newUser.name }
            });

            if (authError) throw authError;

            // Then create the user record in our users table
            const { error: dbError } = await supabase
                .from('users')
                .insert([
                    {
                        id: authData.user.id,
                        email: newUser.email,
                        role: newUser.role,
                        name: newUser.name
                    }
                ]);

            if (dbError) throw dbError;

            setDialogOpen(false);
            setNewUser({ email: '', role: 'customer', name: '' });
            await fetchUsers();
        } catch (err) {
            console.error('Error creating user:', err);
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
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">User Management</h2>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>Add User</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Name
                                </label>
                                <Input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Role
                                </label>
                                <select
                                    className="w-full border rounded-md p-2"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="customer">Customer</option>
                                    <option value="agent">Agent</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full">
                                Create User
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

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