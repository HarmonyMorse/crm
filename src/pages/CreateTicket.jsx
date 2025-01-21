import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function CreateTicket() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        description: ''
    });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const {
                data: { user }
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('You must be logged in to create a ticket');
            }

            console.log('Attempting to create ticket with user:', user.id);

            // Create the ticket with schema-compliant data
            const { data, error: insertError } = await supabase
                .from('tickets')
                .insert({
                    subject: formData.subject,
                    description: formData.description || null,
                    user_id: user.id
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

            console.log('Successfully created ticket:', data);

            // Redirect to the dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Create New Ticket</h1>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        padding: '8px 16px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Back
                </button>
            </div>

            {error && (
                <div style={{ color: 'red', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="subject" style={{ display: 'block', marginBottom: '8px' }}>
                        Subject *
                    </label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="description" style={{ display: 'block', marginBottom: '8px' }}>
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={5}
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1
                    }}
                >
                    {isSubmitting ? 'Creating...' : 'Create Ticket'}
                </button>
            </form>
        </div>
    );
}

export default CreateTicket; 