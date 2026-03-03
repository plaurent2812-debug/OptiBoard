"use client";

import { useChat } from '@ai-sdk/react';
import {
    type UIMessage,
    DefaultChatTransport,
    isTextUIPart,
    isToolUIPart
} from 'ai';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Bot, Send, User } from 'lucide-react';
import Link from 'next/link';

export default function ChatAssistant() {
    const [input, setInput] = useState('');
    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({ api: '/api/chat' }),
    });

    const isLoading = status === 'submitted' || status === 'streaming';
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        sendMessage({ text: input });
        setInput('');
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="flex items-center gap-3 p-4 border-b border-border/50 bg-background sticky top-0 z-20">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 shrink-0 hover:bg-muted text-muted-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight leading-tight">Assistant OptiPro</h1>
                        <p className="text-xs text-muted-foreground font-medium">Posez-moi vos questions</p>
                    </div>
                </div>
            </header>

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-48">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 shadow-sm border border-primary/20">
                            <Bot className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Bonjour !</h2>
                        <p className="text-muted-foreground text-sm font-medium">
                            Je suis votre assistant IA personnel. Je connais vos chantiers, vos frais et vos factures. Demandez-moi par exemple :
                        </p>
                        <div className="flex flex-col gap-2 mt-6 w-full max-w-sm">
                            <Button variant="outline" className="justify-start text-xs font-semibold h-10 rounded-xl whitespace-normal break-words h-auto py-2.5 px-4" onClick={() => setInput("Quels sont mes chantiers en cours ?")}>
                                &quot;Quels sont mes chantiers en cours ?&quot;
                            </Button>
                            <Button variant="outline" className="justify-start text-xs font-semibold h-10 rounded-xl whitespace-normal break-words h-auto py-2.5 px-4" onClick={() => setInput("Fais le point sur ma trésorerie totale")}>
                                &quot;Fais le point sur ma trésorerie totale&quot;
                            </Button>
                        </div>
                    </div>
                ) : (
                    messages.map((m: UIMessage) => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center border-[1.5px] justify-center shrink-0 ${m.role === 'user' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white border-border shadow-sm'}`}>
                                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
                                </div>
                                <div className={`flex flex-col gap-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    {/* Map over parts for rendering */}
                                    {m.parts.map((part, i) => {
                                        if (isTextUIPart(part)) {
                                            return (
                                                <Card key={i} className={`px-4 py-2.5 rounded-2xl border-none shadow-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-white border border-border rounded-tl-sm'}`}>
                                                    <p className={`text-sm font-medium leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'text-white' : 'text-foreground'}`}>{part.text}</p>
                                                </Card>
                                            );
                                        }
                                        if (isToolUIPart(part)) {
                                            // In AI SDK v6, ToolUIPart IS the UIToolInvocation (spread)
                                            if (part.state === 'input-streaming' || part.state === 'input-available') {
                                                return (
                                                    <div key={i} className="flex flex-col gap-1 items-start mt-1">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary px-2.5 py-1 rounded-md border border-border/50 animate-pulse">
                                                            Recherche dans la base de données...
                                                        </span>
                                                    </div>
                                                );
                                            }
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-20 pb-4 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                <form
                    onSubmit={handleSubmit}
                    className="flex gap-2 max-w-xl mx-auto items-end bg-white border border-border rounded-2xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all"
                >
                    <textarea
                        className="flex-1 bg-transparent px-3 py-2 text-sm font-medium outline-none resize-none min-h-[44px] max-h-32 placeholder:text-muted-foreground scrollbar-hide"
                        placeholder="Demandez ce que vous voulez à OptiPro..."
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        rows={1}
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="rounded-xl w-11 h-11 shrink-0 bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-5 h-5" />
                        <span className="sr-only">Envoyer</span>
                    </Button>
                </form>
            </div>
        </div>
    );
}
