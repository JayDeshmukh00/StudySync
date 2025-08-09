import React from 'react';

const FeatureCard = ({ title, description, onClick }) => (
    <div onClick={onClick} className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-blue-800/30 cursor-pointer transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-1">
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
);

export const FeaturesPage = ({ onFeatureSelect }) => (
    <div className="animate-fade-in">
      <h2 className="text-4xl font-bold text-center mb-12">Features Hub</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard
          title="AI Study Planner"
          description="Generate personalized study plans from your course materials."
          onClick={() => onFeatureSelect('dashboard')}
        />
        {/* --- ADDED: Aura Reader Card --- */}
        <FeatureCard
          title="Aura Reader"
          description="An interactive PDF reader with AI-powered highlighting and notes."
          onClick={() => onFeatureSelect('auraReader')}
        />
        <FeatureCard
          title="AI Study Buddy"
          description="Get instant explanations and ask questions about your PDF content."
          onClick={() => onFeatureSelect('dashboard')}
        />
        <FeatureCard
          title="My Topic Calendar"
          description="Visualize your study schedule and track your progress."
          onClick={() => onFeatureSelect('calendar')}
        />
        <FeatureCard
          title="AI-Powered Flashcards"
          description="Create and review flashcards to reinforce your learning."
          onClick={() => onFeatureSelect('flashcards')}
        />
        <FeatureCard
          title="Collaborative Study Sessions"
          description="Join or create study groups to learn with your peers."
          onClick={() => onFeatureSelect('studysessions')}
        />
        <FeatureCard
          title="Mind Map Generator"
          description="Generate mind maps to visualize and connect your study topics."
          onClick={() => onFeatureSelect('mindmap')}
        />
      </div>
    </div>
);
