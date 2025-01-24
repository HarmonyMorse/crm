import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function UserSettings() {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        async function fetchUserProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                const { data, error } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                setName(data.name || '');
            } catch (err) {
                console.error('Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchUserProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('users')
                .update({ name: name.trim() })
                .eq('id', user.id);

            if (error) throw error;
            setSuccessMessage('Name updated successfully');
        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-foreground">Loading profile settings...</div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
                    <p className="text-muted-foreground">
                        Update your profile information
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                            Display Name
                        </label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-900/20 text-red-400 p-4 rounded-md">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-900/20 text-green-400 p-4 rounded-md">
                            {successMessage}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={saving || !name.trim()}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
            </div>
        </div>
    );
} 