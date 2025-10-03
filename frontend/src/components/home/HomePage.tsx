import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, MessageSquare, BarChart3, Shield, CheckCircle, Star, Play } from 'lucide-react';

export function HomePage() {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">QuickFix</span>
              <span className="text-sm text-gray-500 ml-1">AI-Powered Support</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium">How It Works</a>
              <a href="#reviews" className="text-gray-600 hover:text-gray-900 font-medium">Reviews</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium">About us</a>
              <Link
                to="/login"
                className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              The agentic AI solution for modern{' '}
              <span className="text-orange-500">customer service</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              With QuickFix, AI agents and human agents work as one—resolving every issue, 
              instantly and intelligently.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                to="/login"
                className="bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Try it free
              </Link>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:border-orange-500 hover:text-orange-500 transition-all duration-200 flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Book a demo
              </button>
            </div>

            {/* Trust Bar */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-6">TRUSTED BY 73,000+ BUSINESSES WORLDWIDE</p>
              <div className="relative overflow-hidden">
                <div className="flex animate-scroll gap-8 items-center opacity-60">
                  {/* First set of logos */}
                  <img src="https://dam.freshworks.com/m/172addb8908823a/original/bridgestone-logo.webp" alt="Bridgestone" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/6b09343713112137/original/Tata-Digital-Trustbar-logo.webp" alt="Tata Digital" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/678dcfe0f3352df6/original/S-P-GLobal-Trustbar-logo.webp" alt="S&P Global" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/692895b671757fd/original/Klarna-Trustbar-Logo.webp" alt="Klarna" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/686b5fb695a93fdf/original/Forbes-Trustbar-logo.webp" alt="Forbes" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/65934d5b088a71e4/original/Pepsico-Trustbar-logo.webp" alt="PepsiCo" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/716392be1c61bd75/original/Ingram-Trustbar-logo.webp" alt="Ingram Micro" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/770b19ddd352c7cf/original/pearson-Trustbar-logo.webp" alt="Pearson" className="h-8 grayscale flex-shrink-0" />
                  
                  {/* Duplicate set for seamless loop */}
                  <img src="https://dam.freshworks.com/m/172addb8908823a/original/bridgestone-logo.webp" alt="Bridgestone" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/6b09343713112137/original/Tata-Digital-Trustbar-logo.webp" alt="Tata Digital" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/678dcfe0f3352df6/original/S-P-GLobal-Trustbar-logo.webp" alt="S&P Global" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/692895b671757fd/original/Klarna-Trustbar-Logo.webp" alt="Klarna" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/686b5fb695a93fdf/original/Forbes-Trustbar-logo.webp" alt="Forbes" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/65934d5b088a71e4/original/Pepsico-Trustbar-logo.webp" alt="PepsiCo" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/716392be1c61bd75/original/Ingram-Trustbar-logo.webp" alt="Ingram Micro" className="h-8 grayscale flex-shrink-0" />
                  <img src="https://dam.freshworks.com/m/770b19ddd352c7cf/original/pearson-Trustbar-logo.webp" alt="Pearson" className="h-8 grayscale flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Value Proposition */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Seamless support. Smarter agents. Faster resolutions.
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Unify every channel, cut the noise, and give agents an easy-to-use platform to 
              resolve requests without missing a beat. With QuickFix, you don't just keep up, you stay ahead.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Turn email tickets into instant resolutions</h3>
              <p className="text-gray-600">
                Answer email queries with Email AI agents that read every incoming email ticket, 
                understand the request, respond with the right solution, and auto-resolve the ticket.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Auto-resolve issues with conversational AI agents</h3>
              <p className="text-gray-600">
                Deploy intelligent chatbots that understand context, provide accurate solutions, 
                and escalate to human agents when needed.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Empower support teams with intelligent assistance</h3>
              <p className="text-gray-600">
                Give your human agents AI-powered insights, suggested responses, 
                and automated workflows to resolve issues faster.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Meet Freddy AI
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
              From AI agents that resolve routine queries instantly to AI-powered assistance 
              for human agents, Freddy AI combines automation and intelligence to help your 
              team work more efficiently, scale effortlessly, and deliver great experiences across every channel.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-orange-500 font-semibold hover:text-orange-600"
            >
              Learn more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">83%</div>
              <div className="text-gray-600">Reduction in response times</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">&lt;2 mins</div>
              <div className="text-gray-600">Average conversational resolution time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">97%</div>
              <div className="text-gray-600">Omnichannel first contact resolution rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">60%</div>
              <div className="text-gray-600">Improved agent productivity with Freddy AI Copilot</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              The full customer service experience
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Everything you need to support customers and empower teams—all in one place, available out of the box
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <MessageSquare className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat and voice</h3>
              <p className="text-gray-600">Connect seamlessly across chat and voice channels</p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <Users className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Self-service</h3>
              <p className="text-gray-600">Empower customers with comprehensive self-service options</p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <BarChart3 className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unified context</h3>
              <p className="text-gray-600">Get complete customer context across all touchpoints</p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <CheckCircle className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced workflows</h3>
              <p className="text-gray-600">Automate complex processes with intelligent workflows</p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <BarChart3 className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics and insights</h3>
              <p className="text-gray-600">Make data-driven decisions with powerful analytics</p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all">
              <Shield className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Security & compliance</h3>
              <p className="text-gray-600">Enterprise-grade security and compliance features</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Join 73,000+ companies uncomplicating customer service
            </h2>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-orange-500 font-semibold hover:text-orange-600"
            >
              View all customer stories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white p-12 rounded-2xl shadow-lg max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-xl text-gray-700 mb-8 italic">
              "I want the ability to get one view of how we support our customers—not just the 
              number of tickets, but any information on how we interact with them. You've got to 
              bring everything into one platform. QuickFix allows us to do that."
            </blockquote>
            <div className="text-gray-900 font-semibold">Tony Barbone</div>
            <div className="text-gray-600">Chief Revenue Officer</div>
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <span className="bg-orange-100 text-orange-800 text-sm font-semibold px-3 py-1 rounded-full">
              TOP-RATED
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            The experts agree
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Recognized by G2 and TrustRadius for delivering modern, AI-powered customer service that drives results.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            <div className="bg-gray-100 h-24 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 font-semibold">G2 Leader</span>
            </div>
            <div className="bg-gray-100 h-24 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 font-semibold">TrustRadius</span>
            </div>
            <div className="bg-gray-100 h-24 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 font-semibold">Capterra</span>
            </div>
            <div className="bg-gray-100 h-24 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 font-semibold">GetApp</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-orange-500 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Get started with QuickFix
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">Free to try. Fast to scale.</h3>
              <p className="text-white/90 mb-6">
                Experience the power of QuickFix with a free trial. No credit card needed. 
                Set up in minutes and see immediate value.
              </p>
              <Link
                to="/login"
                className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
              >
                Try it free
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">See rapid impact in action</h3>
              <p className="text-white/90 mb-6">
                Let our product experts show you how QuickFix can solve your specific challenges. 
                Get a personalized walkthrough tailored to your needs.
              </p>
              <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Book a demo
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">Learn, explore, get inspired</h3>
              <p className="text-white/90 mb-6">
                Check out the interactive product tour to explore QuickFix's capabilities.
              </p>
              <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Take the tour
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Logo and Description */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">QuickFix</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                AI-powered complaint management system that revolutionizes customer support with 
                intelligent automation, real-time analytics, and seamless resolution workflows.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.404-5.958 1.404-5.958s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Products */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">QuickFix Helpdesk</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">AI Chat Support</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Analytics Dashboard</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Mobile App</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">API & Integrations</a></li>
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Solutions</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Customer Support</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">IT Service Management</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Enterprise</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Small Business</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">E-commerce</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Press & News</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Security</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Legal Links */}
              <div className="flex flex-wrap gap-6">
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">Cookie Policy</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">Accessibility</a>
              </div>

              {/* Copyright */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  © 2025 QuickFix Inc. All Rights Reserved
                </p>
              </div>

              {/* App Store Links - LARGER ICONS */}
              <div className="flex justify-end space-x-4">
                <a href="#" className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-3">
                  <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on App Store" className="h-12" />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-3">
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" className="h-12" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}