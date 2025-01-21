import React, { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import AuthError from './AuthError';
import AuthLayout from './AuthLayout';

interface RegistrationFormData {
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
}

const RegistrationForm: FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<RegistrationFormData>();

    const password = watch('password');

    const validatePassword = (value: string) => {
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
        if (!/[!@#$%^&*]/.test(value)) return 'Password must contain at least one special character';
        return true;
    };

    const onSubmit = async (data: RegistrationFormData) => {
        try {
            setError(null);
            setIsLoading(true);
            const { error: signUpError } = await signUp(data);
            if (signUpError) throw new Error(signUpError.message);
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Start your journey with us today"
        >
            {error && <AuthError message={error} />}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address'
                                }
                            })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="you@example.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            {...register('password', {
                                required: 'Password is required',
                                validate: validatePassword
                            })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="••••••••"
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            {...register('confirmPassword', {
                                required: 'Please confirm your password',
                                validate: value => value === password || 'Passwords do not match'
                            })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <div className="flex items-center">
                        <input
                            id="acceptTerms"
                            type="checkbox"
                            {...register('acceptTerms', {
                                required: 'You must accept the terms and conditions'
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                            I accept the{' '}
                            <a href="/terms" className="text-blue-600 hover:text-blue-500">
                                terms and conditions
                            </a>
                        </label>
                    </div>
                    {errors.acceptTerms && (
                        <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
                    )}
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors"
                    >
                        {isLoading ? (
                            <LoadingSpinner size="sm" className="text-white" />
                        ) : (
                            'Create account'
                        )}
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <a
                            href="/auth/login"
                            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                        >
                            Sign in
                        </a>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
};

export default RegistrationForm; 