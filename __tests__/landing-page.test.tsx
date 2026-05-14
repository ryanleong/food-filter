import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FeaturesSection from '@/components/landing/FeaturesSection';

// ─── HeroSection ────────────────────────────────────────────────────────────

describe('HeroSection', () => {
  it('renders the "Mind Your Food" headline', () => {
    render(<HeroSection />);
    expect(screen.getByText('Mind Your Food')).toBeInTheDocument();
  });

  it('renders a "Get Started" link that points to /login', () => {
    render(<HeroSection />);
    const link = screen.getByRole('link', { name: 'Get Started' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });
});

// ─── HowItWorksSection ──────────────────────────────────────────────────────

describe('HowItWorksSection', () => {
  it('renders the "How It Works" heading', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
  });

  it('renders the "Add your restrictions" step', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('Add your restrictions')).toBeInTheDocument();
  });

  it('renders the "Scan any menu" step', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('Scan any menu')).toBeInTheDocument();
  });

  it('renders the "See what\'s safe" step', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("See what's safe")).toBeInTheDocument();
  });
});

// ─── FeaturesSection ────────────────────────────────────────────────────────

describe('FeaturesSection', () => {
  it('renders the "Everything you need to eat safely" heading', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Everything you need to eat safely')).toBeInTheDocument();
  });

  it('renders the "AI Ingredient Detection" feature card', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('AI Ingredient Detection')).toBeInTheDocument();
  });

  it('renders the "Personal Blacklist" feature card', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Personal Blacklist')).toBeInTheDocument();
  });

  it('renders the "Scan History" feature card', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Scan History')).toBeInTheDocument();
  });

  it('renders the "Works Anywhere" feature card', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Works Anywhere')).toBeInTheDocument();
  });
});
