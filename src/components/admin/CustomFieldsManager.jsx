import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';

const FIELD_TYPES = ['text', 'number', 'date', 'boolean', 'select'];

export default function CustomFieldsManager() {
    const [fields, setFields] = useState([]);
    const [newField, setNewField] = useState({
        name: '',
        field_type: 'text',
        required: false,
        options: []
    });
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadFields();
    }, []);

    const loadFields = async () => {
        const { data, error } = await supabase
            .from('custom_field_definitions')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            setError(error.message);
        } else {
            setFields(data);
        }
    };

    const handleNewFieldChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewField(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFieldTypeChange = (value) => {
        setNewField(prev => ({
            ...prev,
            field_type: value
        }));
    };

    const handleOptionChange = (e) => {
        const options = e.target.value.split(',').map(opt => opt.trim());
        setNewField(prev => ({
            ...prev,
            options
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const fieldData = {
                name: newField.name,
                field_type: newField.field_type,
                required: newField.required,
                options: newField.field_type === 'select' ? newField.options : null
            };

            const { error } = await supabase
                .from('custom_field_definitions')
                .insert(fieldData);

            if (error) throw error;

            setNewField({
                name: '',
                field_type: 'text',
                required: false,
                options: []
            });

            await loadFields();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (fieldId, currentActive) => {
        try {
            const { error } = await supabase
                .from('custom_field_definitions')
                .update({ active: !currentActive })
                .eq('id', fieldId);

            if (error) throw error;
            await loadFields();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Custom Fields Manager</h2>

            {error && (
                <div className="bg-red-900/20 text-red-400 p-4 rounded-md">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Field Name
                        </label>
                        <Input
                            name="name"
                            value={newField.name}
                            onChange={handleNewFieldChange}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Field Type
                        </label>
                        <Select
                            value={newField.field_type}
                            onValueChange={handleFieldTypeChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select field type" />
                            </SelectTrigger>
                            <SelectContent>
                                {FIELD_TYPES.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="required"
                        checked={newField.required}
                        onChange={handleNewFieldChange}
                        className="rounded border-input"
                    />
                    <label className="text-sm font-medium">
                        Required Field
                    </label>
                </div>

                {newField.field_type === 'select' && (
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Options (comma-separated)
                        </label>
                        <Input
                            value={newField.options.join(', ')}
                            onChange={handleOptionChange}
                            placeholder="Option 1, Option 2, Option 3"
                            required
                        />
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isSubmitting}
                >
                    Add Field
                </Button>
            </form>

            <div className="border rounded-lg divide-y">
                {fields.map(field => (
                    <div key={field.id} className="p-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-medium">{field.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                Type: {field.field_type}
                                {field.required && ' • Required'}
                                {field.field_type === 'select' && ` • Options: ${field.options.join(', ')}`}
                            </p>
                        </div>
                        <Button
                            variant={field.active ? 'default' : 'outline'}
                            onClick={() => handleToggleActive(field.id, field.active)}
                        >
                            {field.active ? 'Active' : 'Inactive'}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}