"use client";

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const PricingTabs = () => {
    const [activeTab, setActiveTab] = useState('R2');

    const tabs = [
        {
            name: 'Workers',
            content: [
                { value: '$0.30', unit: '/ million requests' },
                { value: '$0.02', unit: '/ million CPU ms' },
            ]
        },
        {
            name: 'Durable Objects',
            content: [
                { value: '$12.50', unit: '/ million GB-s' },
            ]
        },
        {
            name: 'R2',
            isSpecialLayout: true,
            content: [
                { value: '$0.015', unit: '/ GB-month', label: 'Storage' },
                { value: '$4.50', unit: '/ million Class A requests' },
                { value: '$0.38', unit: '/ million Class B requests' },
                { value: '$0.01', unit: '/ GB-month', label: 'IA Storage' },
            ]
        },
        {
            name: 'Workers KV',
            content: [
                 { value: '$0.15', unit: '/ million reads' },
                 { value: '$1.00', unit: '/ million writes' },
            ]
        },
    ];

    const activeTabData = tabs.find(tab => tab.name === activeTab);

    return (
        <div className="mt-auto pt-8">
            <div className="border-b border-border-light">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ease-out focus:outline-none
                                ${activeTab === tab.name
                                    ? 'border-primary text-foreground-primary'
                                    : 'border-transparent text-foreground-secondary hover:text-foreground-primary hover:border-gray-300'
                                }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-6 min-h-[148px]">
                {activeTabData && (
                    <>
                        {activeTabData.isSpecialLayout ? (
                            <div className="space-y-3">
                                <div className="bg-accent/60 p-4 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-left">
                                    <div>
                                        <p className="text-xl font-semibold text-foreground-primary">{activeTabData.content[0].value}<span className="text-sm font-normal text-foreground-secondary">{activeTabData.content[0].unit}</span></p>
                                    </div>
                                    <div>
                                        <p className="text-xl font-semibold text-foreground-primary">{activeTabData.content[1].value}<span className="text-sm font-normal text-foreground-secondary">{activeTabData.content[1].unit}</span></p>
                                    </div>
                                </div>
                                <div className="bg-accent/60 p-4 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-left">
                                     <div>
                                        <p className="text-xl font-semibold text-foreground-primary">{activeTabData.content[2].value}<span className="text-sm font-normal text-foreground-secondary">{activeTabData.content[2].unit}</span></p>
                                    </div>
                                     <div>
                                        <p className="text-xl font-semibold text-foreground-primary">{activeTabData.content[3].value}<span className="text-sm font-normal text-foreground-secondary">{activeTabData.content[3].unit}</span></p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-left">
                                {activeTabData.content.map((item, index) => (
                                    <div key={index}>
                                        <p className="text-xl font-semibold text-foreground-primary">{item.value}<span className="text-sm font-normal text-foreground-secondary">{item.unit}</span></p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const PricingSection = () => {
    return (
        <section className="relative px-4 py-16 md:py-24 text-center">
            <div className="container mx-auto max-w-[1216px]">
                <h3 className="text-3xl md:text-5xl font-semibold text-foreground-primary tracking-tight">Pay only when your code runs</h3>
                <p className="mt-2 text-foreground-secondary text-base md:text-lg">(Not to keep servers warm.)</p>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-stretch">
                    <div className="border border-border-light rounded-2xl p-6 md:p-8 text-left flex flex-col justify-center bg-background-secondary">
                        <h5 className="text-xl md:text-2xl font-semibold text-foreground-primary">Wall Clock vs. CPU Time</h5>
                        <p className="mt-2 text-foreground-secondary text-body leading-relaxed">
                            Never pay for idle time waiting for slow APIs, LLMs, or humans. This project of fluent charges only for compute, not wall time, even during long agent workflows or hibernating WebSockets.
                        </p>
                    </div>

                    <div className="border border-border-light rounded-2xl p-6 md:p-8 bg-background-secondary">
                        <div className="flex justify-around items-end h-[240px]">
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-xs text-foreground-secondary">300ms</p>
                                <div className="relative w-16 h-[160px] border border-dashed border-gray-400 rounded-sm flex flex-col">
                                    <div className="flex-grow bg-gray-100/0"></div>
                                    <div className="bg-primary/20 border-t border-primary text-primary font-bold text-[10px] flex items-center justify-center h-4">
                                        1ms
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-foreground-primary">LLM Call</p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-xs text-foreground-secondary">500.5ms</p>
                                <div className="relative w-16 h-[200px] border border-dashed border-gray-400 rounded-sm flex flex-col">
                                    <div className="flex-grow bg-gray-100/0"></div>
                                    <div className="bg-primary/20 border-t border-primary text-primary font-bold text-[10px] flex items-center justify-center h-3">
                                        0.5ms
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-foreground-primary">API Call</p>
                            </div>
                             <div className="flex flex-col items-center gap-2">
                                <p className="text-xs text-foreground-secondary invisible">0</p>
                                <div className="relative w-16 h-[120px] border border-dashed border-gray-400 rounded-sm flex flex-col">
                                    <div className="flex-grow bg-gray-100/0"></div>
                                    <div className="bg-primary/20 border-t border-primary text-primary font-bold text-[10px] flex items-center justify-center h-5">
                                        0.75ms
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-foreground-primary">WebSocket</p>
                            </div>
                        </div>
                         <div className="flex justify-center items-center gap-6 mt-4 text-xs text-foreground-secondary">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary"></div>
                                <span>Paid</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm border border-dashed border-gray-400"></div>
                                <span>Free</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    <div className="border border-border-light rounded-2xl p-8 flex flex-col bg-background-secondary">
                        <h4 className="text-4xl font-semibold text-foreground-primary text-left">Free</h4>
                        <p className="text-foreground-secondary text-left">No credit card needed</p>
                        <div className="my-8 grid grid-cols-2 gap-x-4 gap-y-6 text-left">
                            <div><p className="text-2xl font-semibold text-foreground-primary">100,000</p><p className="text-foreground-secondary">/ daily requests</p></div>
                            <div><p className="text-2xl font-semibold text-foreground-primary">1 million</p><p className="text-foreground-secondary">/ KV daily reads</p></div>
                            <div><p className="text-2xl font-semibold text-foreground-primary">25</p><p className="text-foreground-secondary">/ AI daily requests</p></div>
                            <div><p className="text-2xl font-semibold text-foreground-primary">10GB</p><p className="text-foreground-secondary">/ R2 Storage</p></div>
                            <div><p className="text-2xl font-semibold text-foreground-primary">5 GB</p><p className="text-foreground-secondary">/ SQL Stored Data</p></div>
                            <div><p className="text-2xl font-semibold text-foreground-primary">1 GB</p><p className="text-foreground-secondary">/ Stored Data (KV)</p></div>
                        </div>
                        <a href="#" className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-medium px-6 py-2.5 transition-opacity hover:opacity-90">
                            See more <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>

                    <div className="border border-border-light rounded-2xl p-8 flex flex-col bg-background-secondary">
                        <div className="flex-grow">
                            <h4 className="text-4xl font-semibold text-foreground-primary text-left">Paid</h4>
                            <p className="text-foreground-secondary text-left">Starts at $5/month</p>
                            <PricingTabs />
                        </div>
                        <a href="#" className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-border-medium text-foreground-primary font-medium px-6 py-2.5 transition-colors hover:bg-secondary">
                            See more <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PricingSection;