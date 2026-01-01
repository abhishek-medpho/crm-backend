import { type ButtonHTMLAttributes } from 'react';

export type ButtonState = 'idle' | 'loading' | 'success' | 'error';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    state?: ButtonState;
    loadingText?: string;
    successText?: string;
    errorText?: string;
    children: React.ReactNode;
    className?: string;
}

export default function LoadingButton({
    state = 'idle',
    loadingText = 'Processing...',
    successText,
    errorText,
    children,
    className = '',
    disabled,
    ...props
}: LoadingButtonProps) {
    const isDisabled = disabled || state === 'loading' || state === 'success';

    const getButtonText = () => {
        switch (state) {
            case 'loading':
                return loadingText;
            case 'success':
                return successText || children;
            case 'error':
                return errorText || children;
            default:
                return children;
        }
    };

    const getButtonClasses = () => {
        const baseClasses = className || 'w-full py-3 px-4 rounded-lg font-semibold shadow-lg transition-all duration-200';

        if (state === 'error') {
            return `${baseClasses} animate-shake`;
        }

        return baseClasses;
    };

    return (
        <button
            {...props}
            disabled={isDisabled}
            className={getButtonClasses()}
        >
            <span className="flex items-center justify-center gap-2">
                {/* Loading Spinner */}
                {state === 'loading' && (
                    <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                )}

                {/* Success Checkmark */}
                {state === 'success' && (
                    <svg
                        className="h-5 w-5 animate-scaleIn"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                )}

                {/* Error Icon */}
                {state === 'error' && (
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                )}

                <span>{getButtonText()}</span>
            </span>
        </button>
    );
}
