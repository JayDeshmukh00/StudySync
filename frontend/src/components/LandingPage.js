import React, { useEffect } from 'react';
import { Icon } from './Icon'; // Assuming Icon.js is in the same directory

export const LandingPage = ({ onLoginClick, onSignUpClick }) => {
    
    // This effect initializes the Animate on Scroll (AOS) library.
    useEffect(() => {
        // A simple check to ensure the AOS library is available on the window object.
        if (window.AOS) {
          window.AOS.init({
            duration: 1000, // Animation duration in milliseconds
            once: true, // Whether animation should happen only once - while scrolling down
          });
        }
    }, []);

    const scrollToFeatures = () => {
        document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToContact = () => {
        document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="bg-black text-white font-sans">
            {/* Main Container with new Background Image */}
            <div className="relative min-h-screen w-full overflow-hidden">
                <div 
                    className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1590214196322-f886c57937f2?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')` }}
                >
                    <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"></div>
                </div>

                {/* Navbar */}
                <nav className="absolute top-0 left-0 right-0 z-30 p-4">
                    <div className="container mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Icon path="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" className="w-8 h-8 text-blue-400" />
                            <span className="text-2xl font-bold">StudySync</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-6">
                            <button onClick={scrollToFeatures} className="hover:text-blue-400 transition-colors">Features</button>
                            <button className="hover:text-blue-400 transition-colors">About</button>
                            <button onClick={scrollToContact} className="hover:text-blue-400 transition-colors">Contact</button>
                        </div>
                        <div className="space-x-4">
                            <button onClick={onLoginClick} className="font-semibold hover:text-blue-400 transition-colors">Login</button>
                            <button onClick={onSignUpClick} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Sign Up</button>
                        </div>
                    </div>
                </nav>

                {/* New background glow element */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div 
                        className="w-1/2 h-1/2 rounded-full blur-3xl animate-pulse"
                        style={{ backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(0, 0, 0, 0) 70%)' }}
                    ></div>
                </div>

                {/* Hero Section Content */}
                <div className="relative z-20 flex flex-col items-center justify-center h-screen text-center p-4">
                    <h1 className="text-6xl md:text-8xl font-bold mb-4 animate-fade-in-down text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 drop-shadow-lg">
                        StudySync
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 animate-fade-in-up max-w-3xl">
                        AI-Driven Planning, Real-Time Analytics, and Smart Learning—all in one place. Transform your study habits and achieve academic excellence effortlessly.
                    </p>
                    <div className="space-x-4 animate-fade-in-up animation-delay-500">
                        <button onClick={onSignUpClick} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition duration-300 text-lg shadow-lg shadow-blue-500/50">Get Started for Free</button>
                    </div>
                </div>
            </div>

            {/* How It Works Section */}
            <section className="bg-black py-20 px-4">
                <div className="container mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-12" data-aos="fade-up">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="text-center" data-aos="fade-up" data-aos-delay="100">
                            <div className="bg-blue-900/30 w-24 h-24 rounded-full mx-auto flex items-center justify-center border-2 border-blue-500 mb-4">
                                <span className="text-4xl font-bold">1</span>
                            </div>
                            <h3 className="text-2xl font-semibold mb-2">Upload Your Syllabus</h3>
                            <p className="text-gray-400">Provide your course material or textbook in PDF format.</p>
                        </div>
                        <div className="text-center" data-aos="fade-up" data-aos-delay="200">
                            <div className="bg-blue-900/30 w-24 h-24 rounded-full mx-auto flex items-center justify-center border-2 border-blue-500 mb-4">
                                <span className="text-4xl font-bold">2</span>
                            </div>
                            <h3 className="text-2xl font-semibold mb-2">Generate Your Plan</h3>
                            <p className="text-gray-400">Our AI analyzes your document and creates a personalized, day-by-day study schedule.</p>
                        </div>
                        <div className="text-center" data-aos="fade-up" data-aos-delay="300">
                            <div className="bg-blue-900/30 w-24 h-24 rounded-full mx-auto flex items-center justify-center border-2 border-blue-500 mb-4">
                                <span className="text-4xl font-bold">3</span>
                            </div>
                            <h3 className="text-2xl font-semibold mb-2">Achieve Your Goals</h3>
                            <p className="text-gray-400">Follow your custom plan, track your progress, and excel in your studies.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <div id="features-section" className="bg-gray-900/50 text-white py-20 px-4">
                <div className="container mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-2" data-aos="fade-up">Transform Your Learning</h2>
                    <p className="text-lg text-gray-400 mb-12" data-aos="fade-up">Leverage the power of AI to create a study plan that works for you.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-gray-900/50 p-8 rounded-xl border border-blue-800/50 shadow-lg shadow-blue-900/20 transition-transform hover:-translate-y-2" data-aos="zoom-in">
                            <Icon path="M3.375 5.25h17.25c.621 0 1.125.504 1.125 1.125v13.5c0 .621-.504 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125v-13.5c0-.621.504-1.125 1.125-1.125Z" className="w-12 h-12 mx-auto mb-4 text-blue-400"/>
                            <h3 className="text-2xl font-bold mb-2">AI-Powered Planning</h3>
                            <p className="text-gray-400">Upload your syllabus or textbook, and our AI will generate a detailed, day-by-day study plan tailored to your schedule.</p>
                        </div>
                        <div className="bg-gray-900/50 p-8 rounded-xl border border-blue-800/50 shadow-lg shadow-blue-900/20 transition-transform hover:-translate-y-2" data-aos="zoom-in" data-aos-delay="100">
                             <Icon path="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" className="w-12 h-12 mx-auto mb-4 text-blue-400"/>
                            <h3 className="text-2xl font-bold mb-2">Progress Analytics</h3>
                            <p className="text-gray-400">Take daily assessments and track your performance with our analytics dashboard to identify your strengths and weaknesses.</p>
                        </div>
                        <div className="bg-gray-900/50 p-8 rounded-xl border border-blue-800/50 shadow-lg shadow-blue-900/20 transition-transform hover:-translate-y-2" data-aos="zoom-in" data-aos-delay="200">
                            <Icon path="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" className="w-12 h-12 mx-auto mb-4 text-blue-400"/>
                            <h3 className="text-2xl font-bold mb-2">Interactive Learning</h3>
                            <p className="text-gray-400">Engage with AI-generated flashcards, mind maps, and a helpful chatbot to solidify your understanding of complex topics.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <section className="bg-black py-20 px-4">
                <div className="container mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-12" data-aos="fade-up">What Our Users Say</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-900/50 p-8 rounded-xl border border-blue-800/50" data-aos="fade-right">
                            <p className="text-gray-400 italic mb-4">"This app has been a game-changer for my studies. The AI-generated plans keep me on track, and the analytics help me focus on my weak spots."</p>
                            <div className="flex items-center justify-center">
                                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-12 h-12 rounded-full mr-4"/>
                                <div>
                                    <p className="font-bold">Sarah J.</p>
                                    <p className="text-sm text-gray-500">University Student</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-900/50 p-8 rounded-xl border border-blue-800/50" data-aos="fade-left">
                            <p className="text-gray-400 italic mb-4">"I love the interactive tools, especially the flashcards and mind maps. They make learning so much more engaging and effective."</p>
                            <div className="flex items-center justify-center">
                                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-12 h-12 rounded-full mr-4"/>
                                <div>
                                    <p className="font-bold">Michael B.</p>
                                    <p className="text-sm text-gray-500">High School Student</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Section */}
            <footer id="contact-section" className="bg-gray-900/50 text-white py-10 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center md:text-left">
                    <div>
                        <h4 className="text-xl font-bold mb-2">StudySync</h4>
                        <p className="text-gray-400">Your AI-powered academic companion. Plan smarter, learn faster.</p>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold mb-2">Contact Us</h4>
                        <p className="text-gray-400">Email: support@studysync.ai</p>
                        <p className="text-gray-400">Location: Innovation Hub, Tech Park</p>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold mb-2">Follow Us</h4>
                        <div className="flex space-x-4 justify-center md:justify-start">
                            <a href="#" className="text-gray-400 hover:text-blue-400">Twitter</a>
                            <a href="#" className="text-gray-400 hover:text-blue-400">Instagram</a>
                            <a href="#" className="text-gray-400 hover:text-blue-400">LinkedIn</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
