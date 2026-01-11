import React from 'react';

export default function HomePage() {
  return (
    <div className="text-center">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
        Welcome to SkillMirror
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-gray-300">
        Manage all your skills, tasks, and submissions in one place.
      </p>
      <button className="mt-6 bg-primary hover:bg-secondary text-white px-6 py-3 rounded-lg transition-colors">
        Get Started
      </button>
    </div>
  );
}
