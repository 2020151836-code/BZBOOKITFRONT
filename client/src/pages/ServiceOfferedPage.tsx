import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import "./ServiceOfferedPage.css";
import { api } from "@/lib/api";

// Fetch services from Supabase
async function fetchServices() {
  const { data, error } = await supabase.from("service").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default function ServiceOfferedPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const {
    data: services,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  // Handle booking button clicks
  const handleBookNow = () => {
    if (user) {
      setLocation("/booking");
    } else {
      setLocation("/login");
    }
  };

  // Scroll animation effect
  useEffect(() => {
    if (isLoading) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const card = entry.target as HTMLElement;
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    const cards = document.querySelectorAll(".service-card");
    cards.forEach((card) => {
      const htmlCard = card as HTMLElement;
      htmlCard.style.opacity = "0";
      htmlCard.style.transform = "translateY(20px)";
      htmlCard.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [isLoading, services]);

  if (isLoading) {
    return (
      <div className="service-offered-page min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="service-offered-page min-h-screen flex items-center justify-center text-center p-4">
        <div className="text-red-700">
          <h2 className="text-2xl font-bold">Error Loading Services</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="service-offered-page">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <header>
        <div className="container">
          <div className="header-content">
            <nav className="nav-links">
              <a onClick={() => setLocation("/")}>Home</a>
              <a onClick={() => setLocation("/services")} className="active">Services</a>
            </nav>
            <div className="header-actions">
              <button className="btn btn-secondary" onClick={() => setLocation(user ? "/dashboard" : "/login")}>
                <i className="fas fa-user"></i> {user ? "Dashboard" : "Sign In"}
              </button>
              <button className="btn btn-primary" onClick={handleBookNow}>
                <i className="fas fa-calendar-plus"></i> Book Now
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Video Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center text-center text-white overflow-hidden bg-[#f5f1e8]">
        <iframe
          className="absolute top-1/2 left-1/2 w-full h-[200%] -translate-x-1/2 -translate-y-1/2 z-0"
          src="https://www.youtube.com/embed/DBSql_J7D94?autoplay=1&mute=1&loop=1&playlist=DBSql_J7D94&controls=0&showinfo=0&modestbranding=1&iv_load_policy=3"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ minWidth: '100%', minHeight: '100%', width: 'auto', height: 'auto' }}
        ></iframe>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute z-0 w-auto min-w-full min-h-full max-w-none"
        >
          <source src="/eyelashes.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
        <div className="relative z-20 p-4">
          <h2 className="text-5xl md:text-6xl font-bold mb-4">Our Services</h2>
          <p className="text-xl md:text-2xl opacity-90">Specialized treatments to enhance your natural beauty</p>
        </div>
      </section>

      <section className="services-section">
        <div className="container">
          <div className="services-grid">
            {services?.map((service, index) => (
              <div className="service-card" key={`${service.id}-${index}`}>
                <div className="service-image">
                  <i className="fas fa-eye"></i>
                </div>
                <div className="service-content">
                  <h3 className="service-title">{service.name}</h3>
                  <p className="service-description">{service.description || "A high-quality professional service."}</p>
                  <div className="service-footer">
                    <div className="service-price">BZ${service.price}</div>
                    <div className="service-duration">{service.duration_minutes || 60} min</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Ready to Enhance Your Natural Beauty?</h2>
          <p className="cta-text">Book your appointment today and experience the difference of our professional lash and brow services</p>
          <button className="btn btn-primary" style={{ background: "white", color: "var(--primary-orange)" }} onClick={handleBookNow}>
            <i className="fas fa-calendar-plus"></i> Book Now
          </button>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="copyright">© 2025 BZ Book It. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
