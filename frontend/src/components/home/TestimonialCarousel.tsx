import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface TestimonialProps {
  autoScrollInterval?: number;
}

const testimonials = [
  {
    title: "RAPID RESOLUTION BRINGS CUSTOMER SATISFACTION.",
    person: "Michael Rodriguez",
    role: "Customer Service Director",
    description: "Learn More About Our Approach",
    linkTo: "/approach",
    linkColor: "text-green-600 hover:text-green-800",
    image: "/Slider.png",
    imageAlt: "Customer service representative",
  },
  {
    title: "TEAMWORK MAKES THE DREAM WORK.",
    person: "Sarah Chen",
    role: "Project Lead",
    description: "Learn About Collaboration",
    linkTo: "/collaboration",
    linkColor: "text-blue-600 hover:text-blue-800",
    image: "/sliderimage2.png",
    imageAlt: "Team meeting with analytics",
  },
  {
    title: "IDEAS ARE THE BEGINNINGS OF ALL ENTERPRISES.",
    person: "Lakasmi Gupta",
    role: "Innovation Lead",
    description: "Spark Innovation",
    linkTo: "/innovation",
    linkColor: "text-purple-600 hover:text-purple-800",
    image: "/sliderimage3.png",
    imageAlt: "Innovation team collaborating",
  }
];

const TestimonialCarousel: React.FC<TestimonialProps> = ({ autoScrollInterval = 5000 }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = testimonials.length;

  const goToSlide = useCallback((index: number) => {
    // Handle wrap-around
    const slideIndex = (index + totalSlides) % totalSlides;
    setCurrentSlide(slideIndex);
    
    // Scroll the carousel to the selected slide
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.clientWidth;
      carouselRef.current.scrollLeft = slideIndex * slideWidth;
    }
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // Reset the autoscroll timer when user interaction occurs
  const resetAutoScroll = useCallback(() => {
    // Clear existing timer
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
    }

    // Only restart if auto-scrolling is enabled
    if (isAutoScrolling) {
      autoScrollTimerRef.current = setInterval(() => {
        nextSlide();
      }, autoScrollInterval);
    }
  }, [autoScrollInterval, isAutoScrolling, nextSlide]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
        setIsAutoScrolling(false);
      } else if (e.key === 'ArrowRight') {
        nextSlide();
        setIsAutoScrolling(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextSlide, prevSlide]);

  // Initialize auto-scroll
  useEffect(() => {
    resetAutoScroll();
    
    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [resetAutoScroll, currentSlide]);

  // Handle manual interaction
  const handleManualNavigation = (index: number) => {
    goToSlide(index);
    setIsAutoScrolling(false);
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {testimonials.map((testimonial, index) => (
          <div key={index} className="carousel-slide min-w-full flex-shrink-0">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="flex flex-col md:flex-row">
                {/* Left Content Panel */}
                <div className="md:w-1/2 bg-gray-100 p-12 md:p-16 flex flex-col justify-center">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    {testimonial.title}
                  </h3>
                  <p className="text-gray-700 text-lg mb-2 font-medium">{testimonial.person}</p>
                  <p className="text-gray-600 mb-8">{testimonial.role}</p>
                  
                  <Link
                    to={testimonial.linkTo}
                    className={`inline-flex items-center font-semibold group ${testimonial.linkColor}`}
                  >
                    {testimonial.description} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                
                {/* Right Image Panel */}
                <div className="md:w-1/2">
                  <div className="h-full relative">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.imageAlt} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute right-4 bottom-4 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-70">
                      <div className="w-4 h-4 bg-gray-100 rotate-45"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow-md hover:bg-opacity-100 transition-all z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-gray-800" />
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow-md hover:bg-opacity-100 transition-all z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-gray-800" />
      </button>
      
      {/* Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => handleManualNavigation(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? 'bg-blue-600 w-6' : 'bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default TestimonialCarousel;