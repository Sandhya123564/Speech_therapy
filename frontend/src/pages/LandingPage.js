import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Stethoscope, Users, ArrowRight, MessageCircle, Target, BarChart3, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";

const LandingPage = () => {
  const [hoveredRole, setHoveredRole] = useState(null);

  const roles = [
    {
      id: "patient",
      title: "I'm a Patient",
      description: "I want to practice speech exercises and track my progress",
      icon: User,
      color: "#2D4A3E",
    },
    {
      id: "parent",
      title: "I'm a Parent/Caregiver",
      description: "I'm helping someone with their speech therapy journey",
      icon: Users,
      color: "#E07A5F",
    },
    {
      id: "therapist",
      title: "I'm a Therapist",
      description: "I want to monitor patients and manage therapy plans",
      icon: Stethoscope,
      color: "#3B82F6",
    },
  ];

  const features = [
    {
      icon: MessageCircle,
      title: "AI Speech Assessment",
      description: "Our intelligent assistant helps identify speech difficulties through a friendly conversation",
    },
    {
      icon: Target,
      title: "Personalized Therapy",
      description: "Get a customized therapy plan based on your unique speech profile and goals",
    },
    {
      icon: BarChart3,
      title: "Adaptive Training",
      description: "Exercises automatically adjust to your performance, ensuring optimal progress",
    },
    {
      icon: CheckCircle,
      title: "Track Progress",
      description: "Monitor improvements with detailed analytics and celebrate your achievements",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#2D4A3E] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="font-['Fraunces'] text-xl font-semibold text-[#1F2937]">FluentAI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-[#2D4A3E] hover:bg-[#2D4A3E]/10 rounded-full px-6" data-testid="login-btn">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full px-6" data-testid="register-btn">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 hero-gradient">
        <div className="max-w-7xl mx-auto">
          <div className="tetris-grid items-center">
            {/* Hero Text */}
            <div className="col-span-1 md:col-span-7 space-y-6 animate-fade-in">
              <span className="inline-block text-sm font-medium text-[#E07A5F] uppercase tracking-wider">
                AI-Powered Speech Therapy
              </span>
              <h1 className="font-['Fraunces'] text-4xl md:text-6xl font-semibold tracking-tight leading-tight text-[#1F2937]">
                Find your voice,<br />
                <span className="text-[#2D4A3E]">naturally.</span>
              </h1>
              <p className="text-lg md:text-xl text-[#4B5563] leading-relaxed max-w-xl">
                An intelligent speech therapy platform that guides you through personalized exercises, 
                adapts to your progress, and helps you achieve your communication goals.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/register">
                  <Button 
                    className="bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
                    data-testid="hero-get-started-btn"
                  >
                    Start Your Journey
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button 
                    variant="outline" 
                    className="border-2 border-[#2D4A3E] text-[#2D4A3E] hover:bg-[#2D4A3E] hover:text-white rounded-full px-8 py-6 text-lg"
                    data-testid="hero-learn-more-btn"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="col-span-1 md:col-span-5 animate-fade-in stagger-2">
              <div className="relative">
                <div className="absolute inset-0 bg-[#2D4A3E]/10 rounded-3xl transform rotate-3" />
                <img
                  src="https://images.unsplash.com/photo-1752652016199-a9ca574e08cb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw0fHxzcGVlY2glMjB0aGVyYXBpc3QlMjBoZWxwaW5nJTIwY2hpbGR8ZW58MHx8fHwxNzczMTUwNDIzfDA&ixlib=rb-4.1.0&q=85"
                  alt="Speech therapy session"
                  className="relative rounded-3xl shadow-xl w-full object-cover aspect-[4/3]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-['Fraunces'] text-3xl md:text-5xl font-medium tracking-tight text-[#1F2937] mb-4">
              Who are you?
            </h2>
            <p className="text-lg text-[#4B5563]">
              Choose your role to get started with a personalized experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role, index) => (
              <Link
                key={role.id}
                to={`/register?role=${role.id}`}
                className={`animate-slide-up stagger-${index + 1}`}
                onMouseEnter={() => setHoveredRole(role.id)}
                onMouseLeave={() => setHoveredRole(null)}
                data-testid={`role-card-${role.id}`}
              >
                <div
                  className={`card-feature p-8 cursor-pointer transform transition-all duration-300 ${
                    hoveredRole === role.id ? "bg-white shadow-hover scale-[1.02]" : ""
                  }`}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${role.color}15` }}
                  >
                    <role.icon className="w-8 h-8" style={{ color: role.color }} />
                  </div>
                  <h3 className="font-['Fraunces'] text-xl font-medium text-[#1F2937] mb-2">
                    {role.title}
                  </h3>
                  <p className="text-[#4B5563]">{role.description}</p>
                  <div
                    className={`mt-6 flex items-center gap-2 font-medium transition-all duration-300 ${
                      hoveredRole === role.id ? "translate-x-2" : ""
                    }`}
                    style={{ color: role.color }}
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F9F9F7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-['Fraunces'] text-3xl md:text-5xl font-medium tracking-tight text-[#1F2937] mb-4">
              How FluentAI Works
            </h2>
            <p className="text-lg text-[#4B5563] max-w-2xl mx-auto">
              Our platform combines AI technology with proven speech therapy techniques 
              to provide effective, personalized care
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card-base card-hover animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`feature-card-${index}`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#2D4A3E]/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#2D4A3E]" />
                </div>
                <h3 className="font-['Fraunces'] text-lg font-medium text-[#1F2937] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#4B5563] text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Therapy Image Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="tetris-grid items-center">
            <div className="col-span-1 md:col-span-5 order-2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1772419130717-e0630e3e4f28?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxzcGVlY2glMjB0aGVyYXBpc3QlMjBoZWxwaW5nJTIwY2hpbGR8ZW58MHx8fHwxNzczMTUwNDIzfDA&ixlib=rb-4.1.0&q=85"
                alt="Therapy session"
                className="rounded-3xl shadow-xl w-full object-cover aspect-[4/3]"
              />
            </div>
            <div className="col-span-1 md:col-span-7 order-1 md:order-2 md:pl-12">
              <h2 className="font-['Fraunces'] text-3xl md:text-5xl font-medium tracking-tight text-[#1F2937] mb-6">
                Comprehensive Exercise Library
              </h2>
              <p className="text-lg text-[#4B5563] mb-6">
                Access a wide range of speech therapy exercises covering all major categories:
              </p>
              <ul className="space-y-3">
                {[
                  "Oro-motor exercises for mouth strength",
                  "Articulation therapy for clear speech",
                  "Fluency training for smooth communication",
                  "Voice therapy for vocal control",
                  "Cognitive-linguistic tasks for brain-speech connection",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-[#4B5563]">
                    <div className="w-6 h-6 rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-[#10B981]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#2D4A3E]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-['Fraunces'] text-3xl md:text-5xl font-medium text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Join thousands of users who are improving their speech every day with FluentAI
          </p>
          <Link to="/register">
            <Button 
              className="bg-white text-[#2D4A3E] hover:bg-gray-100 rounded-full px-10 py-6 text-lg font-medium shadow-lg"
              data-testid="cta-get-started-btn"
            >
              Get Started for Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#2D4A3E] flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-['Fraunces'] text-lg font-semibold text-[#1F2937]">FluentAI</span>
            </div>
            <p className="text-xs text-[#9CA3AF] text-center max-w-2xl" data-testid="medical-disclaimer">
              This platform provides guided speech exercises and does not replace professional speech therapy or medical diagnosis.
              Always consult with a qualified healthcare professional for medical advice.
            </p>
            <p className="text-sm text-[#9CA3AF]">© 2024 FluentAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
