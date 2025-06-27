import React from 'react';

export const HomePage = ({ setPage, newsItems }) => {
    const FeatureCard = ({ title, description, icon }) => (
        <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg border border-[var(--color-border-primary)] transition-all duration-300 hover:border-[var(--color-accent-primary)] hover:shadow-2xl hover:shadow-[var(--color-accent-primary)]/10">
            <div className="text-[var(--color-accent-primary)] mb-4">{icon}</div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
        </div>
    );

    const NewsItem = ({title, date, content}) => (
         <div className="border-b border-[var(--color-border-primary)] py-5">
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">{new Date(date.seconds * 1000).toLocaleDateString()}</p>
            <h4 className="font-semibold text-lg text-white">{title}</h4>
            <div className="text-sm text-[var(--color-text-secondary)] mt-2 space-y-2" dangerouslySetInnerHTML={{ __html: content }}></div>
        </div>
    )

    return (
        <div style={{'--pattern-color': '#161B22', background: 'radial-gradient(circle, transparent 20%, var(--color-bg-primary) 20.5%), repeating-radial-gradient(circle, var(--pattern-color) 0, var(--pattern-color) 4px, transparent 4.5px, transparent 12px, var(--pattern-color) 12.5px, var(--pattern-color) 16px, transparent 16.5px, transparent 20px)', backgroundSize: '200px 200px, 40px 40px'}}>
            <div className="container mx-auto px-4 lg:px-6 py-12">
                {/* Hero Section */}
                <div className="text-center py-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-[var(--color-accent-primary)]">
                        The Ultimate Genshin Impact Rotation Calculator
                    </h1>
                    <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-8">
                        Craft, analyze, and optimize your team compositions with unparalleled precision. Go beyond the numbers and unlock your team's true potential.
                    </p>
                    <button onClick={() => setPage('calculator')} className="btn btn-primary px-8 py-3 text-base">
                        Launch Calculator
                    </button>
                </div>

                {/* Features Section */}
                <div className="grid md:grid-cols-3 gap-8 my-16">
                    <FeatureCard title="In-Depth Stat Calculation" description="Accounts for character stats, weapons, artifacts (main/sub/sets), constellations, and talent levels." icon={<IconCalc />} />
                    <FeatureCard title="Complex Buff Management" description="Simulate any combination of buffs with extreme precision as each action will be configurable with its own set of buffs." icon={<IconBuffs />} />
                    <FeatureCard title="Flexible Rotation Builder" description="Build complex action sequences with our powerful notation system or a simple point-and-click interface." icon={<IconRotation />} />
                </div>

                {/* News Section */}
                <div className="max-w-3xl mx-auto bg-[var(--color-bg-secondary)]/80 backdrop-blur-md border border-[var(--color-border-primary)] rounded-lg p-6">
                     <h2 className="text-2xl font-bold text-white mb-4">News & Updates</h2>
                     {newsItems && newsItems.length > 0 ? (
                        newsItems.map(item => <NewsItem key={item.id} {...item} />)
                     ) : (
                        <p className="text-[var(--color-text-secondary)]">No news right now. Check back later!</p>
                     )}
                </div>
            </div>
        </div>
    );
};

// SVG Icons for Feature Cards
const IconCalc = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5Z"/><path d="M3 10H21"/><path d="M16 3V7"/><path d="M8 3V7"/></svg>;
const IconBuffs = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
const IconRotation = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M1 20v-6a8 8 0 0 1 8-8h11"/><polyline points="1 14 1 20 7 20"/></svg>;
