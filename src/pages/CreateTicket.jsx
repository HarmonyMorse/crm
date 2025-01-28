import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { generateEmbeddings } from '../utils/embeddings';

const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
const STATUS_OPTIONS = ['open', 'pending', 'resolved'];

function CreateTicket() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'low',
        status: 'open',
        tags: [],
        custom_fields: {}
    });
    const [tagInput, setTagInput] = useState('');
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customFields, setCustomFields] = useState([]);

    useEffect(() => {
        loadCustomFields();
    }, []);

    const loadCustomFields = async () => {
        const { data, error } = await supabase
            .from('custom_field_definitions')
            .select('*')
            .eq('active', true);

        // Sort data manually if needed
        const sortedData = data ? data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) : [];

        if (error) {
            setError(error.message);
        } else {
            setCustomFields(sortedData);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleCustomFieldChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            custom_fields: {
                ...prev.custom_fields,
                [fieldName]: {
                    type: customFields.find(f => f.name === fieldName).field_type,
                    value
                }
            }
        }));
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

        // Validate required custom fields
        customFields.forEach(field => {
            if (field.required && !formData.custom_fields[field.name]?.value) {
                errors[`custom_${field.name}`] = `${field.name} is required`;
            }
        });

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

            const { data: existingUser } = await supabase
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

            // Create the ticket
            const { data: newTicket, error: insertError } = await supabase
                .from('tickets')
                .insert({
                    title: formData.title,
                    description: formData.description || null,
                    priority: formData.priority,
                    status: formData.status,
                    tags: formData.tags,
                    customer_id: user.id,
                    custom_fields: formData.custom_fields
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

            // Generate embeddings for the new ticket
            await generateEmbeddings(
                newTicket.id,
                newTicket.title,
                newTicket.description || ''
            );

            // Redirect to the dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderCustomField = (field) => {
        const value = formData.custom_fields[field.name]?.value || '';
        const error = fieldErrors[`custom_${field.name}`];

        switch (field.field_type) {
            case 'text':
                return (
                    <Input
                        value={value}
                        onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                        className={error ? 'border-red-500' : ''}
                    />
                );
            case 'number':
                return (
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                        className={error ? 'border-red-500' : ''}
                    />
                );
            case 'date':
                return (
                    <Input
                        type="date"
                        value={value}
                        onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                        className={error ? 'border-red-500' : ''}
                    />
                );
            case 'boolean':
                return (
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleCustomFieldChange(field.name, e.target.checked)}
                        className={`rounded border-input ${error ? 'border-red-500' : ''}`}
                    />
                );
            case 'select':
                return (
                    <Select
                        value={value}
                        onValueChange={(value) => handleCustomFieldChange(field.name, value)}
                    >
                        <SelectTrigger className={error ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options.map(option => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            default:
                return null;
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
                    <label className="block text-sm font-medium mb-1" htmlFor="title">
                        Title
                    </label>
                    <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className={fieldErrors.title ? 'border-red-500' : ''}
                    />
                    {fieldErrors.title && (
                        <p className="text-sm text-red-400 mt-1">{fieldErrors.title}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="description">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full p-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="priority">
                            Priority
                        </label>
                        <Select
                            id="priority"
                            value={formData.priority}
                            onValueChange={(value) => handleChange({ target: { name: 'priority', value } })}
                        >
                            <SelectTrigger className={fieldErrors.priority ? 'border-red-500' : ''} aria-label="Priority">
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                {PRIORITY_OPTIONS.map(option => (
                                    <SelectItem key={option} value={option}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {fieldErrors.priority && (
                            <p className="text-sm text-red-400 mt-1">{fieldErrors.priority}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="status">
                            Status
                        </label>
                        <Select
                            id="status"
                            value={formData.status}
                            onValueChange={(value) => handleChange({ target: { name: 'status', value } })}
                        >
                            <SelectTrigger className={fieldErrors.status ? 'border-red-500' : ''} aria-label="Status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map(option => (
                                    <SelectItem key={option} value={option}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {fieldErrors.status && (
                            <p className="text-sm text-red-400 mt-1">{fieldErrors.status}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.tags.map(tag => (
                            <span
                                key={tag}
                                className="bg-primary/20 text-primary-foreground px-2 py-1 rounded text-sm flex items-center gap-1"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="text-primary-foreground/80 hover:text-primary-foreground"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                    <Input
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Type a tag and press Enter"
                    />
                </div>

                {customFields.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Custom Fields</h3>
                        {customFields.map(field => (
                            <div key={field.id}>
                                <label className="block text-sm font-medium mb-1">
                                    {field.name}
                                    {field.required && ' *'}
                                </label>
                                {renderCustomField(field)}
                                {fieldErrors[`custom_${field.name}`] && (
                                    <p className="text-sm text-red-400 mt-1">
                                        {fieldErrors[`custom_${field.name}`]}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isSubmitting}
                >
                    Create Ticket
                </Button>
            </form>
        </div>
    );
}

export default CreateTicket; 