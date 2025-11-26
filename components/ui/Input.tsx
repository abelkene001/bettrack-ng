// components/ui/Input.tsx
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface BaseInputProps {
    label?: string;
    error?: string;
    helperText?: string;
}

type InputProps = BaseInputProps & InputHTMLAttributes<HTMLInputElement>;
type TextAreaProps = BaseInputProps &
    TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = "", ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-white/90 mb-2">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`w-full px-4 py-3 bg-white/5 border ${error ? "border-red-500" : "border-white/10"
                        } rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${className}`}
                    {...props}
                />
                {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-white/50">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ label, error, helperText, className = "", rows = 4, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-white/90 mb-2">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    rows={rows}
                    className={`w-full px-4 py-3 bg-white/5 border ${error ? "border-red-500" : "border-white/10"
                        } rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none ${className}`}
                    {...props}
                />
                {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-white/50">{helperText}</p>
                )}
            </div>
        );
    }
);

TextArea.displayName = "TextArea";

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, className = "", ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-white/90 mb-2">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    className={`w-full px-4 py-3 bg-white/5 border ${error ? "border-red-500" : "border-white/10"
                        } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${className}`}
                    {...props}
                >
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            className="bg-[#14141f] text-white"
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
            </div>
        );
    }
);

Select.displayName = "Select";
