import React, { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import AuthError from './AuthError';
import AuthLayout from './AuthLayout';

interface ResetPasswordFormData {
    email?: string;
    password?: string;
    confirmPassword?: string;
}

const PasswordReset: FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);
    const { resetPassword, sendResetEmail } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<ResetPasswordFormData>();

    const password = watch('password');

    const validatePassword = (value: string | undefined) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
        if (!/[!@#$%^&*]/.test(value)) return 'Password must contain at least one special character';
        return true;
    };

    const onSubmit = async (data: ResetPasswordFormData) => {
        try {
            setError(null);
            setIsLoading(true);

            if (token) {
                // Reset password with token
                const { error: resetError } = await resetPassword({ ...data, token });
                if (resetError) throw new Error(resetError.message);
                navigate('/auth/login');
            } else {
                // Send reset email
                const { error: emailError } = await sendResetEmail(data.email!);
                if (emailError) throw new Error(emailError.message);
                setIsEmailSent(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process request');
        } finally {
            setIsLoading(false);
        }
    };

    if (isEmailSent) {
        return (
            <AuthLayout
                title="Check your email"
                subtitle="We've sent you instructions to reset your password"
            >
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Didn't receive the email?{' '}
                        <button
                            onClick={() => setIsEmailSent(false)}
                            className="text-blue-600 hover:text-blue-500 font-medium"
                        >
                            Try again
                        </button>
                    </p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title={token ? 'Reset your password' : 'Forgot your password?'}
            subtitle={
                token
                    ? 'Enter your new password below'
                    : "Enter your email and we'll send you instructions to reset your password"
            }
        >
            {error && <AuthError message={error} />}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                    {!token && (
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
                    )}

                    {token && (
                        <>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    New password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    {...register('password', {
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
                                    Confirm new password
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
                        </>
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
                        ) : token ? (
                            'Reset password'
                        ) : (
                            'Send reset instructions'
                        )}
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Remember your password?{' '}
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

export default PasswordReset; 