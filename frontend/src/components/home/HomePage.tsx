import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Bot, 
  Ticket, 
  Clock, 
  BarChart3, 
  Bell,
  ArrowRight,
  CheckCircle,
  Users,
  Zap,
  Star,
  MessageSquare
} from 'lucide-react';

export function HomePage() {
  const features = [
    {
      icon: Bot,
      title: 'AI Chatbot',
      description: 'File complaints instantly through our intelligent chatbot that understands natural language.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Ticket,
      title: 'Smart Ticketing',
      description: 'Automatic categorization and priority assignment using advanced AI algorithms.',
      color: 'from-gray-600 to-gray-700'
    },
    {
      icon: Clock,
      title: 'Real-Time Tracking',
      description: 'Monitor your complaint status with live updates and progress notifications.',
      color: 'from-orange-400 to-orange-500'
    },
    {
      icon: BarChart3,
      title: 'Admin Dashboard',
      description: 'Comprehensive management tools for monitoring, assigning, and resolving complaints efficiently.',
      color: 'from-gray-700 to-gray-800'
    },
    {
      icon: Bell,
      title: 'Instant Notifications',
      description: 'Get notified via email, SMS, and in-app alerts for every status update.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Zap,
      title: 'Smart Assignment',
      description: 'AI-powered ticket routing to the right team based on expertise and workload.',
      color: 'from-gray-600 to-gray-700'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Report Complaint',
      description: 'Use our chatbot or form to describe your issue in natural language.',
      icon: MessageSquare
    },
    {
      number: '02',
      title: 'AI Processing',
      description: 'Our AI categorizes and assigns priority to ensure proper routing.',
      icon: Bot
    },
    {
      number: '03',
      title: 'Track & Resolve',
      description: 'Monitor progress in real-time until your complaint is fully resolved.',
      icon: CheckCircle
    }
  ];

  const testimonials = [
    {
      name: 'Amit Kumar',
      role: 'Customer',
      content: 'Resolved my billing issue in just 2 hours! The AI chatbot understood my problem immediately.',
      rating: 5
    },
    {
      name: 'Shivam Jha',
      role: 'Business Owner',
      content: 'The admin dashboard gives us complete visibility into all complaints. Game-changer for our support team.',
      rating: 4
    },
    {
      name: 'Sonali Singh', 
      role: 'Support Manager',
      content: 'Smart assignment feature has reduced our response time by 60%. Highly recommend!',
      rating: 5
    },
     {
      name: 'Ravi Patel',
      role: 'Support Manager',
      content: 'Smart assignment feature has reduced our response time by 60%. Highly recommend!',
      rating: 4
    },
     {
      name: 'Rajesh Sharma',
      role: 'Support Manager',
      content: 'Smart assignment feature has reduced our response time by 60%. Highly recommend!',
      rating: 5
    },
     {
      name: 'Khushi Verma',
      role: 'Support Manager',
      content: 'Smart assignment feature has reduced our response time by 60%. Highly recommend!',
      rating: 4
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-gray-800/95">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">QuickFix</h1>
                <p className="text-xs text-gray-400">AI-Powered Support</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-orange-400 font-medium transition-colors duration-200">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-orange-400 font-medium transition-colors duration-200">How It Works</a>
              <a href="#testimonials" className="text-gray-300 hover:text-orange-400 font-medium transition-colors duration-200">Reviews</a>
              <a href="#testimonials" className="text-gray-300 hover:text-orange-400 font-medium transition-colors duration-200">About us</a>

              <div className="flex gap-3">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-orange-400 font-medium transition-colors duration-200 px-4 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/login"
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transform hover:scale-105 transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            </nav>

            <Link
              to="/login"
              className="md:hidden bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors duration-200"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Resolve Complaints Faster with
              <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent"> AI-Powered Support</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              Log complaints easily, track status in real-time, and get faster resolutions with our intelligent ticketing system powered by advanced AI and natural language processing.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/login"
                className="bg-orange-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:border-orange-500 hover:text-orange-400 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                Login to Account
              </Link>
            </div>

            {/* Demo Accounts Info */}
            {/* <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-lg max-w-2xl mx-auto">
              <h3 className="font-semibold text-white mb-4">Try Demo Accounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"> */}
                {/* <div className="text-center p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="font-medium text-orange-400">User Account</div>
                  <div className="text-gray-300 mt-1">user@example.com</div>
                  <div className="text-gray-400">password</div>
                </div> */}
                {/* <div className="text-center p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="font-medium text-orange-400">Agent Account</div>
                  <div className="text-gray-300 mt-1">agent@example.com</div>
                  <div className="text-gray-400">agent</div>
                </div> */}
                {/* <div className="text-center p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="font-medium text-orange-400">Admin Account</div>
                  <div className="text-gray-300 mt-1">admin@example.com</div>
                  <div className="text-gray-400">admin</div>
                </div> */}
              {/* </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to manage complaints efficiently with the power of artificial intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gray-700 border border-gray-600 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:border-orange-500/50 transition-all duration-300 h-full">
                  <div className={`bg-gradient-to-r ${feature.color} p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Simple 3-step process to get your complaints resolved quickly and efficiently
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center group">
                  <div className="relative mb-6">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <step.icon className="w-8 h-8" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-gray-800 text-orange-400 font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center border-2 border-orange-500">
                      {step.number}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-orange-500/30 to-gray-600/30 transform -translate-x-1/2"></div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              See how QuickFix has transformed customer support for businesses and individuals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-700 border border-gray-600 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:border-orange-500/50 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-orange-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-2 rounded-full">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Support?</h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using QuickFix to deliver exceptional customer support with AI
          </p>
          <Link
            to="/login"
            className="bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-2 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">QuickFix</h3>
                  <p className="text-sm text-gray-400">AI-Powered Support</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                Revolutionizing customer support with intelligent complaint management, 
                AI-powered categorization, and real-time tracking for faster resolutions.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-orange-400">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-orange-400 transition-colors duration-200">Features</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors duration-200">Pricing</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors duration-200">API Docs</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors duration-200">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-orange-400">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-orange-400 transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors duration-200">Contact Us</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors duration-200">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 QuickFix. All rights reserved. Powered by AI for better customer support.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}