import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleIcon, CloseIcon, SendIcon, SparklesIcon, HeartIcon } from './Icons';
import { suggestRecipe } from '../services/geminiService';
import { ChatMessage, RecipeSuggestion } from '../types';

interface ChatbotProps {
    onSaveRecipe: (recipe: RecipeSuggestion) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ onSaveRecipe }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const recipeSuggestion = await suggestRecipe(input);
            const newModelMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                content: `¡Aquí tienes una receta encantadora que preparé para ti!`,
                recipe: recipeSuggestion,
                state: 'awaiting_feedback',
            };
            setMessages(prev => [...prev, newModelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                content: (error as Error).message,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFeedback = (messageId: string, choice: 'yes' | 'change' | 'no') => {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        const recipeToSave = messages[messageIndex].recipe;
        
        // Remove feedback state from the message
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, state: null } : m));

        if (choice === 'yes' && recipeToSave) {
            onSaveRecipe(recipeToSave);
            setMessages(prev => [...prev, {id: Date.now().toString(), role: 'model', content: "¡Maravilloso! La he guardado en tu recetario. ¡Que la disfrutes! ❤️"}]);
        } else if (choice === 'change') {
            setMessages(prev => [...prev, {id: Date.now().toString(), role: 'model', content: "¡Claro! ¿Qué te gustaría cambiar?"}]);
        } else if (choice === 'no') {
            setMessages(prev => [...prev, {id: Date.now().toString(), role: 'model', content: "No hay problema. ¡Avísame si quieres otra idea!"}]);
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-40">
            {isOpen ? (
                <div className="w-[calc(100vw-2.5rem)] h-[70vh] max-w-md bg-brand-cream rounded-2xl shadow-2xl flex flex-col animate-slide-in">
                    <header className="p-4 bg-white/50 flex justify-between items-center rounded-t-2xl border-b border-brand-orange">
                        <div className="flex items-center gap-2">
                             <SparklesIcon className="w-6 h-6 text-brand-pink-dark"/>
                             <h3 className="font-bold text-lg text-brand-text">Asistente AI de Gaba</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-brand-text hover:text-brand-pink-dark">
                            <CloseIcon className="w-6 h-6"/>
                        </button>
                    </header>
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs md:max-w-sm rounded-2xl p-3 ${msg.role === 'user' ? 'bg-brand-pink text-white rounded-br-none' : 'bg-white text-brand-text rounded-bl-none'}`}>
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                        {msg.recipe && (
                                            <div className="mt-2 p-3 bg-brand-bg rounded-lg border border-brand-orange">
                                                <h4 className="font-bold font-serif text-brand-text">{msg.recipe.title}</h4>
                                                <p className="text-sm mt-1 text-brand-text">¡He incluido los ingredientes y los pasos para ti!</p>
                                            </div>
                                        )}
                                        {msg.state === 'awaiting_feedback' && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <button onClick={() => handleFeedback(msg.id, 'yes')} className="text-sm flex-grow px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition">Sí, ¡guárdala!</button>
                                                <button onClick={() => handleFeedback(msg.id, 'change')} className="text-sm flex-grow px-3 py-1 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition">Cambiar algo</button>
                                                <button onClick={() => handleFeedback(msg.id, 'no')} className="text-sm flex-grow px-3 py-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition">No, gracias</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                 <div className="flex justify-start">
                                    <div className="max-w-xs md:max-w-sm rounded-2xl p-3 bg-white text-brand-text rounded-bl-none">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-brand-pink rounded-full animate-pulse"></div>
                                            <div className="w-2 h-2 bg-brand-pink rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                            <div className="w-2 h-2 bg-brand-pink rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                        </div>
                                    </div>
                                 </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <div className="p-4 border-t border-brand-orange">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                                placeholder="Pide una receta..."
                                className="w-full p-3 border border-brand-orange rounded-full bg-white focus:ring-2 focus:ring-brand-pink focus:outline-none"
                                disabled={isLoading}
                            />
                            <button onClick={handleSend} disabled={isLoading} className="p-3 bg-brand-pink-dark text-white rounded-full disabled:bg-gray-400 hover:bg-opacity-80 transition-all">
                                <SendIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsOpen(true)} 
                    className="p-4 bg-brand-pink-dark rounded-full text-white shadow-lg transform hover:scale-110 transition-transform"
                >
                    <ChatBubbleIcon className="w-8 h-8"/>
                </button>
            )}
            <style>{`.animate-slide-in { animation: slideIn 0.3s ease-out forwards; } @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
    );
};

export default Chatbot;