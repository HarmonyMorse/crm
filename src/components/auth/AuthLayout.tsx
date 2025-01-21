import React, { FC, ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

const AuthLayout: FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="fixed inset-0 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
                    <div>
                        <h1 className="text-center text-3xl font-extrabold text-gray-900">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-2 text-center text-sm text-gray-600">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout; 