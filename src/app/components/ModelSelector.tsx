'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Zap, Brain } from 'lucide-react';

export type LLMProvider = 'auto' | 'gemini' | 'openai' | 'claude';

interface ModelSelectorProps {
    value?: LLMProvider;
    onChange?: (provider: LLMProvider) => void;
    className?: string;
}

const providers = [
    {
        id: 'auto' as const,
        name: 'Auto',
        icon: Zap,
        description: 'Smart fallback (Gemini → GPT → Claude)',
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: 'gemini' as const,
        name: 'Gemini Pro',
        icon: Sparkles,
        description: 'Google Gemini 2.0',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'openai' as const,
        name: 'ChatGPT',
        icon: Brain,
        description: 'GPT-4 Turbo',
        color: 'from-green-500 to-emerald-500'
    },
    {
        id: 'claude' as const,
        name: 'Claude',
        icon: Brain,
        description: 'Claude Sonnet 3.5',
        color: 'from-orange-500 to-red-500'
    }
];

export default function ModelSelector({ value, onChange, className = '' }: ModelSelectorProps) {
    const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('auto');
    const [isOpen, setIsOpen] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('creo_llm_provider') as LLMProvider;
        if (stored && providers.find(p => p.id === stored)) {
            setSelectedProvider(stored);
        }
    }, []);

    // Use controlled value if provided
    const currentProvider = value ?? selectedProvider;
    const currentProviderData = providers.find(p => p.id === currentProvider) || providers[0];

    const handleSelect = (provider: LLMProvider) => {
        setSelectedProvider(provider);
        localStorage.setItem('creo_llm_provider', provider);
        setIsOpen(false);
        onChange?.(provider);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Selected Provider Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
            >
                <currentProviderData.icon className="w-4 h-4" />
                <span className="font-medium">{currentProviderData.name}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-72 rounded-xl bg-zinc-900/95 border border-white/10 shadow-2xl backdrop-blur-xl z-20 overflow-hidden">
                        <div className="p-2 space-y-1">
                            {providers.map((provider) => {
                                const Icon = provider.icon;
                                const isSelected = currentProvider === provider.id;

                                return (
                                    <button
                                        key={provider.id}
                                        onClick={() => handleSelect(provider.id)}
                                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isSelected
                                                ? 'bg-white/10 border border-white/20'
                                                : 'hover:bg-white/5 border border-transparent'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg bg-gradient-to-br ${provider.color}`}>
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">{provider.name}</span>
                                                {isSelected && (
                                                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-400 mt-0.5">{provider.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer Hint */}
                        <div className="px-4 py-2 bg-white/5 border-t border-white/10">
                            <p className="text-xs text-zinc-500">
                                {currentProvider === 'auto'
                                    ? '⚡ Smart fallback enabled - automatically tries all models'
                                    : `💡 Single provider mode - uses ${currentProviderData.name} only`}
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
