import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TestimonialProps {
  autoScrollInterval?: number;
}

const testimonials = [
  {
    title: "", // Removed text content
    person: "",
    role: "",
    description: "",
    linkTo: "/approach",
    linkColor: "text-green-600 hover:text-green-800",
    image: "/Slider.png", // Updated path with leading slash for public directory
    imageAlt: "Customer service representative",
  },
  {
    title: "", // Removed text content
    person: "",
    role: "",
    description: "",
    linkTo: "/collaboration",
    linkColor: "text-blue-600 hover:text-blue-800",
    image: "/sliderimage2.png", // Updated path
    imageAlt: "Team meeting with analytics",
  },
  {
    title: "", // Removed text content
    person: "",
    role: "",
    description: "",
    linkTo: "/innovation",
    linkColor: "text-purple-600 hover:text-purple-800",
    image: "/sliderimage3.png", // Updated path
    imageAlt: "Innovation team collaborating",
  },
  {
    title: "", // Removed text content
    person: "",
    role: "",
    description: "",
    linkTo: "/solutions",
    linkColor: "text-blue-600 hover:text-blue-800",
    image: "/exploreinsight.png", // Using one of the provided images
    imageAlt: "Analytics dashboard meeting",
  },
  {
    title: "", // Removed text content
    person: "",
    role: "",
    description: "",
    linkTo: "/technology",
    linkColor: "text-purple-600 hover:text-purple-800",
    image: "/exploreinsight2.png", // Using one of the provided images
    imageAlt: "AI-powered data visualization",
  }
];

const TestimonialCarousel: React.FC<TestimonialProps> = ({ autoScrollInterval = 5000 }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSlides = testimonials.length;

  const goToSlide = useCallback((index: number) => {
    // Handle wrap-around
    const slideIndex = (index + totalSlides) % totalSlides;
    setCurrentSlide(slideIndex);
    
    // No need to manually scroll as we're using transform in the render
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
    if (isAutoScrolling) {
      resetAutoScroll();
    } else {
      // Clear any existing timer when auto-scrolling is turned off
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
    }
    
    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [resetAutoScroll, currentSlide, isAutoScrolling]);

  // Handle manual interaction
  const handleManualNavigation = (index: number) => {
    goToSlide(index);
    setIsAutoScrolling(false);
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '600px' }} role="region" aria-label="Image carousel">
      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        aria-live="polite"
      >
        {testimonials.map((testimonial, index) => (
          <div 
            key={index} 
            className="carousel-slide min-w-full flex-shrink-0 h-full"
            aria-hidden={currentSlide !== index ? "true" : "false"}
            role="tabpanel"
            id={`slide-${index}`}
          >
            <div className="bg-white rounded-xl overflow-hidden shadow-lg h-full">
              <div className="flex h-full">
                {/* Full-Width Image Panel (removed text content panel) */}
                <div className="w-full relative overflow-hidden">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.imageAlt} 
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation Arrows */}
      <button 
        onClick={() => {
          prevSlide();
          setIsAutoScrolling(false);
        }}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow-md hover:bg-opacity-100 transition-all z-10"
        aria-label="Previous slide"
        type="button"
      >
        <ChevronLeft className="w-6 h-6 text-gray-800" />
      </button>
      
      <button 
        onClick={() => {
          nextSlide();
          setIsAutoScrolling(false);
        }}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow-md hover:bg-opacity-100 transition-all z-10"
        aria-label="Next slide"
        type="button"
      >
        <ChevronRight className="w-6 h-6 text-gray-800" />
      </button>
      
      {/* Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2" role="tablist">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => handleManualNavigation(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? 'bg-blue-600 w-6' : 'bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-selected={index === currentSlide ? "true" : "false"}
            aria-controls={`slide-${index}`}
            role="tab"
            type="button"
          />
        ))}
      </div>
    </div>
  );
};

export default TestimonialCarousel;