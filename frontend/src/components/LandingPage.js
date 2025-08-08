import React, { useEffect, useRef, useState } from 'react';

// It's recommended to include the AOS library's CSS in your main project file (e.g., index.css or App.css)
// For this self-contained component, we'll assume it's loaded globally.
// You can add this to your public/index.html: <link rel="stylesheet" href="https://unpkg.com/aos@next/dist/aos.css" />
// And this before your closing </body> tag: <script src="https://unpkg.com/aos@next/dist/aos.js"></script>

// Helper component for SVG Icons
const Icon = ({ path, className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

// The main Landing Page Component, redesigned for a cinematic feel.
export const LandingPage = ({ onLoginClick, onSignUpClick }) => {
  const canvasRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for the new mobile-first menu
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  // Effect for AOS and Canvas Neural Network Animation
  useEffect(() => {
    // 1. Initialize Animate on Scroll (AOS)
    if (window.AOS) {
      window.AOS.init({
        duration: 1000,
        once: true,
        offset: 100,
      });
    }

    // 2. Initialize Canvas Neural Network Animation
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let nodes = [];
    let mouse = { x: null, y: null, radius: 150 };

    const handleMouseMove = (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initNodes();
    };
    window.addEventListener('resize', resizeCanvas);
    
    class Node {
      constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
      update() {
        if (this.x > canvas.width || this.x < 0) { this.directionX = -this.directionX; }
        if (this.y > canvas.height || this.y < 0) { this.directionY = -this.directionY; }
        
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius) {
            this.x -= this.directionX * 2;
            this.y -= this.directionY * 2;
        } else {
            this.x += this.directionX;
            this.y += this.directionY;
        }
        this.draw();
      }
    }

    function initNodes() {
      nodes = [];
      let numberOfNodes = (canvas.width * canvas.height) / 20000;
      for (let i = 0; i < numberOfNodes; i++) {
        let size = (Math.random() * 2) + 1;
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let directionX = (Math.random() * 0.4) - 0.2;
        let directionY = (Math.random() * 0.4) - 0.2;
        // MODIFICATION: Reduced opacity for a darker, subtler node color
        let color = `rgba(59, 130, 246, ${Math.random() * 0.2 + 0.05})`;
        nodes.push(new Node(x, y, directionX, directionY, size, color));
      }
    }

    function connect() {
        let opacityValue = 1;
        for (let a = 0; a < nodes.length; a++) {
            for (let b = a; b < nodes.length; b++) {
                let distance = ((nodes[a].x - nodes[b].x) * (nodes[a].x - nodes[b].x))
                             + ((nodes[a].y - nodes[b].y) * (nodes[a].y - nodes[b].y));
                if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                    opacityValue = 1 - (distance / 20000);
                    // MODIFICATION: Reduced opacity for darker, subtler connection lines
                    ctx.strokeStyle = `rgba(96, 165, 250, ${opacityValue * 0.1})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(nodes[a].x, nodes[a].y);
                    ctx.lineTo(nodes[b].x, nodes[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    let animationFrameId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].update();
      }
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setFormSubmitted(true);
    }
  };
  
  // NEW: Function to handle menu link clicks and close the menu
  const handleMenuClick = (e, targetId) => {
    e.preventDefault();
    setIsMenuOpen(false);
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const features = [
    {
      title: 'AI Buddy',
      description: "Your personal AI tutor, available 24/7. Ask complex questions, get step-by-step explanations, and receive instant feedback to master any subject. AI Buddy adapts to your learning style, offering customized examples and practice problems to ensure you truly understand the material, not just memorize it.",
      image: 'https://static.liveperson.com/static-assets/2023/08/31151914/Blog_Conversational-AI_BotHoldingWorld.jpg',
      iconPath: 'M9.813 15.904L9 15l.813-.904L9.937 15l-.124.904zM12 21a9 9 0 100-18 9 9 0 000 18z',
    },
    {
      title: 'Aura PDF Reader',
      description: 'Go beyond static text. Our intelligent reader analyzes your documents, automatically generating summaries, key-term flashcards, and interactive Q&As. Highlight a section to get instant multi-language translations or simplify complex jargon into easy-to-understand language.',
      image: 'https://www.sparity.com/wp-content/uploads/2024/01/Benefits-of-AI-for-Businesses-in-Driving-Digital-Transformation-3.webp',
      iconPath: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    },
    {
      title: 'Collaborative Study Rooms',
      description: 'Create or join virtual study rooms. Work with peers on a shared digital whiteboard, co-edit notes in real-time, and host video sessions with integrated AI-powered transcription and summarization, so you never miss a key point.',
      image: 'https://aimarketingengineers.com/wp-content/uploads/2024/04/Human-AI-Collaboration-Enhancing-Productivity-and-Creativity-in-the-Workplace7-1024x439.png',
      iconPath: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.04-2.72a3 3 0 00-4.682 2.72 9.094 9.094 0 003.741.479m7.04-2.72a3 3 0 01-2.247 2.247m1.334 0a3 3 0 01-2.247-2.247M3 18.72v-3.528c0-.995.606-1.911 1.558-2.328a.75.75 0 11.812 1.348a1.5 1.5 0 00-.93 1.157v2.353a9.094 9.094 0 003.741.479M21 18.72v-3.528c0-.995-.606-1.911-1.558-2.328a.75.75 0 10-.812 1.348a1.5 1.5 0 01.93 1.157v2.353a9.094 9.094 0 01-3.741.479M12 15a3 3 0 110-6 3 3 0 010 6z',
    },
  ];

  const styles = `
    body {
      background-color: #000000;
      color: #e5e7eb;
      overflow-x: hidden;
    }
    .main-container {
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-color: #000000;
    }
    #particle-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    .content-wrapper {
        position: relative;
        z-index: 2;
        background: radial-gradient(ellipse at 50% -20%, rgba(10, 5, 40, 0.3) 0%, rgba(0,0,0,0.9) 70%, #000 100%);
    }
    .cinematic-title {
      font-family: 'Rajdhani', sans-serif;
      font-weight: 700;
      color: #f9fafb;
      text-shadow: 0 0 15px rgba(100, 180, 255, 0.3), 1px 1px 2px rgba(0,0,0,0.9);
      transition: text-shadow 0.3s ease;
    }
    .cinematic-title:hover {
        text-shadow: 0 0 20px rgba(150, 200, 255, 0.5), 1px 1px 2px rgba(0,0,0,0.9);
    }
    .tech-glow-border {
      border: 1px solid rgba(59, 130, 246, 0.2);
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.1), inset 0 0 10px rgba(59, 130, 246, 0.1);
      transition: all 0.3s ease-in-out;
    }
    .tech-glow-border:hover {
      border-color: rgba(96, 165, 250, 0.6);
      box-shadow: 0 0 25px rgba(96, 165, 250, 0.3), inset 0 0 15px rgba(96, 165, 250, 0.2);
    }
    .section-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent);
        /* MODIFICATION: Reduced vertical margin */
        margin: 5rem auto;
        width: 50%;
    }
    .image-container {
        position: relative;
        perspective: 1000px;
    }
    .image-container img {
        transition: transform 0.3s ease-in-out;
    }
    .image-container:hover img {
        transform: translateZ(20px);
    }
    .feature-card {
        transition: transform 0.3s ease-in-out;
        transform-style: preserve-3d;
    }
    .feature-card:hover {
        transform: rotateY(5deg) scale(1.02);
    }
  `;

  return (
    <div className="main-container">
      <canvas id="particle-canvas" ref={canvasRef}></canvas>
      <div className="content-wrapper font-sans antialiased">
        <style>{styles}</style>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&family=Inter:wght@400;700&display=swap" rel="stylesheet" />

        {/* NEW: Modern Floating Menu Navigation */}
        <div className="fixed top-4 right-4 z-50">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="p-3 bg-black/60 backdrop-blur-md tech-glow-border rounded-full text-white hover:text-blue-300 transition-all duration-300"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <Icon path="M6 18L18 6M6 6l12 12" className="w-7 h-7" /> : <Icon path="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" className="w-7 h-7" />}
          </button>
        </div>

        {/* NEW: Full-screen Menu Overlay */}
        <div className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center transition-opacity duration-500 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <nav className="flex flex-col items-center justify-center text-center space-y-8">
                <a href="#ai-planner" onClick={(e) => handleMenuClick(e, 'ai-planner')} className="text-gray-300 hover:text-blue-300 transition-colors duration-300 text-3xl font-bold cinematic-title">AI Planner</a>
                <a href="#features" onClick={(e) => handleMenuClick(e, 'features')} className="text-gray-300 hover:text-blue-300 transition-colors duration-300 text-3xl font-bold cinematic-title">Features</a>
                <a href="#contact" onClick={(e) => handleMenuClick(e, 'contact')} className="text-gray-300 hover:text-blue-300 transition-colors duration-300 text-3xl font-bold cinematic-title">Contact</a>
            </nav>
            <div className="mt-16 flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-6">
                <button onClick={onLoginClick} className="text-white font-semibold py-3 px-8 rounded-lg transition-all text-xl hover:bg-white/10 duration-300">Login</button>
                <button onClick={onSignUpClick} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-all text-xl transform hover:scale-105 duration-300 shadow-lg shadow-blue-500/30">Sign Up</button>
            </div>
        </div>

        <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden px-4">
            <div className="absolute inset-0 z-10" style={{ backgroundImage: `url('https://assets.techcircle.in/uploads/article-image/2024/05/images/34736-ai-projects.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center', opacity:0.1 }}></div>
            <div className="relative z-20 p-6">
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase cinematic-title mb-6" data-aos="fade-down">
                Study Sync
                </h1>
                <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-400 font-sans" data-aos="fade-up" data-aos-delay="200">
                AI-Powered Learning. Cinematic Results. Your academic evolution starts now.
                </p>
                <button onClick={onSignUpClick} className="mt-12 bg-blue-600 text-white font-bold py-4 px-10 rounded-lg text-lg transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-blue-500/50 border border-blue-400 hover:bg-blue-500" data-aos="fade-up" data-aos-delay="400">
                Begin Your Ascent
                </button>
            </div>
        </section>
        
        {/* MODIFICATION: Reduced vertical padding */}
        <section id="ai-planner" className="py-16 sm:py-24 relative z-10 px-6">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-x-20 gap-y-12 items-center">
              <div data-aos="fade-right">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">The AI Study Planner</h2>
                <p className="text-lg leading-relaxed text-gray-400 font-sans mb-4">The core of Study Sync. Upload your entire syllabus, textbook, or research papers, and our advanced AI engine constructs a dynamic, day-by-day study plan tailored to your deadlines and learning pace. It deconstructs complex topics into manageable sessions, identifies key concepts, and schedules review periods to maximize retention.</p>
                <p className="text-lg leading-relaxed text-gray-400 font-sans">Stop guessing what to study next. Let our AI build the most efficient path to mastery for you.</p>
              </div>
              <div className="image-container relative" data-aos="zoom-in-left">
                <div className="tech-glow-border rounded-2xl p-1.5 transition-all duration-300 hover:p-2 hover:border-blue-400">
                  <img src="https://files.mymap.ai/public/aigc/ffjsklmsmtgnqmr.png" alt="AI Study Planner" className="rounded-xl object-cover w-full h-auto aspect-video" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/000000/3b82f6?text=Connection+Lost'; }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>
        
        {/* MODIFICATION: Reduced vertical padding */}
        <section id="features" className="py-16 sm:py-24 relative z-10 overflow-hidden px-6">
          <div className="container mx-auto">
            {/* MODIFICATION: Reduced margin-bottom */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" data-aos="zoom-in">
                The Arsenal
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto font-sans" data-aos="fade-up" data-aos-delay="200">
                A suite of intelligent tools forged in the future of learning.
              </p>
            </div>
            {/* MODIFICATION: Reduced space between feature cards */}
            <div className="space-y-20">
              {features.map((feature, index) => (
                <div key={index} className="grid md:grid-cols-2 gap-x-20 gap-y-12 items-center feature-card">
                  <div className={`order-2 ${index % 2 === 0 ? 'md:order-1' : 'md:order-2'}`} data-aos={index % 2 === 0 ? 'fade-right' : 'fade-left'}>
                    <div className="inline-flex items-center space-x-4 mb-5">
                      <div className="p-3 bg-gray-900 tech-glow-border rounded-lg"><Icon path={feature.iconPath} className="w-8 h-8 text-blue-400" /></div>
                      <h3 className="text-3xl font-bold text-white">{feature.title}</h3>
                    </div>
                    <p className="text-lg leading-relaxed text-gray-400 font-sans">{feature.description}</p>
                  </div>
                  <div className={`order-1 ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'}`} data-aos="zoom-in-up">
                    <div className="image-container relative tech-glow-border rounded-2xl p-1.5 transition-all duration-300 hover:p-2 hover:border-blue-400">
                      <img src={feature.image} alt={feature.title} className="rounded-xl object-cover w-full h-auto aspect-video" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/000000/3b82f6?text=Connection+Lost'; }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider"></div>
        
        {/* MODIFICATION: Reduced vertical padding */}
        <section id="contact" className="py-16 sm:py-24 relative z-10 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-black/40 tech-glow-border rounded-2xl p-8 md:p-12 grid md:grid-cols-2 gap-12 items-center" data-aos="fade-up">
                <div className="text-center md:text-left">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Get In Touch</h2>
                    <p className="text-lg text-gray-400 mb-8 font-sans">Connect with Study Sync. Shape the future of learning. Direct channel open for inquiries and collaborations.</p>
                    <div className="space-y-4 text-left">
                        <p className="flex items-center"><Icon path="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" className="w-6 h-6 mr-3 text-blue-400"/> contact@studysync.ai</p>
                        <p className="flex items-center"><Icon path="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" className="w-6 h-6 mr-3 text-blue-400"/><Icon path="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" className="w-6 h-6 mr-3 text-blue-400" style={{marginLeft: '-1.5rem'}}/> Sector 5, Cybernetic Hub, Neo-Genesis</p>
                    </div>
                </div>
                <form className="space-y-6" onSubmit={handleFormSubmit}>
                    <input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleFormChange} className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans" />
                    <input type="email" name="email" placeholder="Your Email" value={formData.email} onChange={handleFormChange} className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans" />
                    <textarea placeholder="Your Message..." name="message" value={formData.message} onChange={handleFormChange} rows="5" className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"></textarea>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-10 rounded-lg text-lg transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-blue-500/50 border border-blue-400 hover:bg-blue-500 disabled:opacity-50 disabled:scale-100" disabled={formSubmitted}>
                      {formSubmitted ? 'Details Received' : 'Send'}
                    </button>
                </form>
            </div>
          </div>
        </section>

        <footer className="border-t border-blue-800/20 text-center py-8 relative z-10 mt-16">
          <div className="container mx-auto px-6">
            <p className="text-gray-400 font-sans">&copy; 2025 Study Sync. All Rights Reserved.</p>
            <p className="text-sm text-gray-600 mt-2 font-sans">Forged in the Future.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};