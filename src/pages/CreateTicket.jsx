import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';

const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
const STATUS_OPTIONS = ['open', 'pending', 'resolved'];

function CreateTicket() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'low',
        status: 'open',
        tags: []
    });
    const [tagInput, setTagInput] = useState('');
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleTagInputChange = (e) => {
        setTagInput(e.target.value);
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(tagInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, tagInput.trim()]
                }));
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.title.trim()) {
            errors.title = 'Title is required';
        }

        if (!PRIORITY_OPTIONS.includes(formData.priority)) {
            errors.priority = 'Invalid priority value';
        }

        if (!STATUS_OPTIONS.includes(formData.status)) {
            errors.status = 'Invalid status value';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const {
                data: { user }
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('You must be logged in to create a ticket');
            }

            // First, ensure user exists in our users table
            const { data: existingUser, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single();

            if (!existingUser) {
                // User doesn't exist in our users table, create them
                const { error: createUserError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        email: user.email,
                        role: 'customer'  // Default role for new users
                    });

                if (createUserError) {
                    console.error('Error creating user:', createUserError);
                    throw new Error('Failed to create user profile');
                }
            }

            // Now create the ticket
            const { error: insertError } = await supabase
                .from('tickets')
                .insert({
                    title: formData.title,
                    description: formData.description || null,
                    priority: formData.priority,
                    status: formData.status,
                    tags: formData.tags,
                    customer_id: user.id
                })
                .select('*')
                .single();

            if (insertError) {
                console.error('Insert error details:', {
                    message: insertError.message,
                    details: insertError.details,
                    hint: insertError.hint
                });
                throw insertError;
            }

            // Redirect to the dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-background text-foreground">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">Create New Ticket</h1>
                <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                >
                    Back
                </Button>
            </div>

            {error && (
                <div className="bg-red-900/20 text-red-400 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2 text-foreground">
                        Title *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className={`w-full p-2 bg-background border rounded-md text-foreground ${fieldErrors.title ? 'border-red-500' : 'border-input'
                            }`}
                    />
                    {fieldErrors.title && (
                        <p className="text-red-400 text-sm mt-1">{fieldErrors.title}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2 text-foreground">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={5}
                        className="w-full p-2 bg-background border border-input rounded-md text-foreground"
                    />
                </div>

                <div>
                    <label htmlFor="priority" className="block text-sm font-medium mb-2 text-foreground">
                        Priority
                    </label>
                    <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className={`w-full p-2 bg-background border rounded-md text-foreground ${fieldErrors.priority ? 'border-red-500' : 'border-input'
                            }`}
                    >
                        {PRIORITY_OPTIONS.map(option => (
                            <option key={option} value={option} className="bg-background">
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </option>
                        ))}
                    </select>
                    {fieldErrors.priority && (
                        <p className="text-red-400 text-sm mt-1">{fieldErrors.priority}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium mb-2 text-foreground">
                        Status
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className={`w-full p-2 bg-background border rounded-md text-foreground ${fieldErrors.status ? 'border-red-500' : 'border-input'
                            }`}
                    >
                        {STATUS_OPTIONS.map(option => (
                            <option key={option} value={option} className="bg-background">
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </option>
                        ))}
                    </select>
                    {fieldErrors.status && (
                        <p className="text-red-400 text-sm mt-1">{fieldErrors.status}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="tags" className="block text-sm font-medium mb-2 text-foreground">
                        Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.tags.map(tag => (
                            <span
                                key={tag}
                                className="bg-primary/20 text-primary-foreground px-2 py-1 rounded-md text-sm flex items-center"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-2 text-primary-foreground hover:text-primary"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        id="tags"
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Type a tag and press Enter"
                        className="w-full p-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="default"
                    className="w-full"
                >
                    {isSubmitting ? 'Creating...' : 'Create Ticket'}
                </Button>
            </form>
        </div>
    );
}

export default CreateTicket; 