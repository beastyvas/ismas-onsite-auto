"use client";

import toast, { Toaster } from "react-hot-toast";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/utils/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import "react-calendar/dist/Calendar.css";
import Link from "next/link";
import dynamic from "next/dynamic";

const Calendar = dynamic(() => import("react-calendar"), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-gray-900 rounded-lg flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>
  )
});

export default function Home() {
  const formRef = useRef();
  const [selectedDate, setSelectedDate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [duration, setDuration] = useState(1);
  const [timeOptions, setTimeOptions] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [time, setTime] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [isVeteran, setIsVeteran] = useState(false);
  const [language, setLanguage] = useState("en");
  const [showPromo, setShowPromo] = useState(false);
  const [promoText, setPromoText] = useState("");
  const [isVisible, setIsVisible] = useState({});
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState(new Set());
  const [showAllServices, setShowAllServices] = useState(false);
  const squareEnabled = process.env.NEXT_PUBLIC_SQUARE_ENABLED === 'true';

  const [settings, setSettings] = useState({
    businessName: "Isma's OnSite Auto Repair",
    phone: "(702) 801-7210",
    hours: "Mon-Sat: 8AM - 6PM",
  });

  useEffect(() => {
    const allSections = document.querySelectorAll('[data-animate]');
    const initialVisible = {};
    allSections.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) initialVisible[el.id] = true;
    });
    setIsVisible(initialVisible);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -100px 0px' }
    );
    allSections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [fade, setFade] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [categories, setCategories] = useState([]);

  const getStorageUrl = useCallback((bucket, path) => {
    if (!path) return null;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [
          { data: servicesData },
          { data: settingsData },
          { data: testimonialsData },
          { data: mechanicsData },
          { data: availabilityData },
          { data: categoriesData }
        ] = await Promise.all([
          supabase.from("services").select("*").order("created_at", { ascending: true }),
          supabase.from("settings").select("*").maybeSingle(),
          supabase.from("testimonials").select("*").order("created_at", { ascending: false }),
          supabase.from("mechanics").select("*").order("created_at", { ascending: true }),
          supabase.from("availability").select("date"),
          supabase.from("service_categories").select("*").order("display_order", { ascending: true })
        ]);

        if (categoriesData) setCategories(categoriesData);

        if (servicesData?.length > 0) {
          const formattedOptions = servicesData.map((service) => ({
            id: service.id,
            name: service.title,
            nameEs: service.title_es || service.title,
            duration: service.duration || 1,
            icon: service.icon || "🔧",
            price: service.price,
            categoryId: service.category_id,
          }));
          setServiceOptions(formattedOptions);
        }

        if (settingsData) {
          setSettings({
            businessName: settingsData.business_name || "Isma's OnSite Auto Repair",
            phone: settingsData.phone || "(702) 801-7210",
            hours: settingsData.hours || "Mon-Sat: 8AM - 6PM",
            logoUrl: settingsData.logo_url || null,
          });
          if (settingsData.promo_enabled && settingsData.promo_text) {
            setPromoText(settingsData.promo_text);
            setShowPromo(true);
          }
        }

        if (testimonialsData) setTestimonials(testimonialsData);

        if (mechanicsData?.length > 0) {
          setMechanics(mechanicsData);
        } else {
          setMechanics([{
            name: "Isma",
            bio_short: "Certified mobile mechanic with years of experience.",
            bio_long: "I bring the tools and expertise right to your driveway.",
            photo_url: null,
          }]);
        }

        if (availabilityData) {
          const normalized = [...new Set(
            availabilityData.map((d) => new Date(d.date).toISOString().split("T")[0])
          )];
          setAvailableDates(normalized);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowFloatingCTA(window.scrollY > 600);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        setFade(true);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  useEffect(() => {
    const total = selectedServices.reduce((sum, serviceId) => {
      const service = serviceOptions.find(s => s.id === serviceId);
      return sum + (service?.duration || 1);
    }, 0);
    setDuration(total || 1);
  }, [selectedServices, serviceOptions]);

  useEffect(() => {
    const loadAvailableTimes = async () => {
      if (!selectedDate || !duration) { setTimeOptions([]); return; }
      try {
        const { data: availabilityData, error: availErr } = await supabase
          .from("availability").select("start_time, end_time").eq("date", selectedDate).single();
        if (availErr || !availabilityData) { setTimeOptions([]); return; }

        const startHour = parseInt(availabilityData.start_time.split(":")[0]);
        const endHour = parseInt(availabilityData.end_time.split(":")[0]);

        const { data: booked, error: bookedErr } = await supabase
          .rpc('get_booked_slots', { p_date: selectedDate });
        if (bookedErr) { console.error('Booking RPC error:', bookedErr); return; }

        const bookedRanges = booked.map(({ start_time, end_time }) => {
          const [sh] = String(start_time).split(':');
          const [eh] = String(end_time).split(':');
          return { start: parseInt(sh, 10), end: parseInt(eh, 10) };
        });

        const available = [];
        for (let hour = startHour; hour <= endHour - duration; hour++) {
          const overlaps = bookedRanges.some(r => hour < r.end && (hour + duration) > r.start);
          if (!overlaps) available.push(`${String(hour).padStart(2,'0')}:00`);
        }
        setTimeOptions(available);
      } catch (error) {
        console.error("Error loading times:", error);
        setTimeOptions([]);
      }
    };
    loadAvailableTimes();
  }, [selectedDate, duration]);

  const formatTo12Hour = useCallback((timeStr) => {
    const [hourStr] = timeStr.split(":");
    const hour = parseInt(hourStr);
    const suffix = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 === 0 ? 12 : hour % 12;
    return `${h}:00 ${suffix}`;
  }, []);

  // Open first category when categories load
  useEffect(() => {
    if (categories.length > 0 && openCategories.size === 0) {
      setOpenCategories(new Set([categories[0].id]));
    }
  }, [categories]);

  const toggleCategory = useCallback((id) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const extractPrice = useCallback((priceStr) => {
    if (!priceStr && priceStr !== 0) return null;
    const str = String(priceStr);
    const match = str.match(/\$(\d+(?:\.\d+)?)/);
    if (match) return `$${match[1]}`;
    if (/^\d+(\.\d+)?$/.test(str)) return `$${str}`;
    return null;
  }, []);

  const handleServiceToggle = useCallback((serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  }, []);

const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const form = formRef.current;
    const data = new FormData(form);
    const services = selectedServices.map(id => {
      const service = serviceOptions.find(s => s.id === id);
      return service?.name || id;
    }).join(", ");

    const bookingId = uuidv4();
    const customerName = data.get("name");

    const payload = {
      id: bookingId,
      name: customerName,
      phone: data.get("phone"),
      address: data.get("address"),
      vehicle_info: data.get("vehicleInfo"),
      services,
      date: data.get("date"),
      start_time: data.get("start_time"),
      notes: data.get("notes"),
      duration,
      is_emergency: isEmergency,
      veteran_discount: isVeteran,
    };

    try {
      if (squareEnabled) {
        // Redirect to Square hosted checkout
        const res = await fetch("/api/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to start checkout");
        window.location.href = json.checkoutUrl;
        return;
      }

      // Square disabled — book directly
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Booking failed");

      toast.success(
        language === "en"
          ? "Booking request submitted! We'll contact you shortly."
          : "¡Solicitud de reserva enviada! Nos pondremos en contacto pronto.",
        { duration: 3000, position: "bottom-center" }
      );

      formRef.current.reset();
      setSelectedServices([]);
      setSelectedDate(null);
      setTime("");
      setIsVeteran(false);
      setIsEmergency(false);
    } catch (err) {
      console.error("Error during booking:", err.message);
      toast.error(
        language === "en"
          ? "Something went wrong. Please try again."
          : "Algo salió mal. Por favor, inténtelo de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const translations = {
    en: {
      hero: "Professional Mobile Auto Repair",
      subtitle: "We Come To You - Expert Service, Right at Your Driveway",
      bookNow: "Book Service",
      emergency: "Emergency Call",
      since: "Trusted Since 2021",
      contact: "Get In Touch",
      phone: "Phone",
      serviceArea: "Service Area",
      hours: "Hours",
      whyChooseUs: "Why People Trust Us",
      mobileConvenience: "We Come To You",
      mobileDesc: "No towing, no waiting rooms. We bring the shop to your driveway.",
      honestPricing: "Honest, Fair Pricing",
      honestDesc: "No surprise fees. You'll know the cost before we start.",
      expertService: "Expert Craftsmanship",
      expertDesc: "Years of experience, genuine care for every vehicle.",
      meetMechanic: "Meet the Guy Behind the Wrench",
      bookAppointment: "Book an Appointment",
      schedule: "Let's Get Your Car Fixed",
      scheduleSubtitle: "Tell us what you need, and we'll take care of the rest",
      contactInfo: "Your Information",
      fullName: "Full Name",
      phoneNumber: "Phone Number (e.g. 7021234567)",
      serviceAddress: "Where Should We Meet You?",
      vehicle: "Vehicle (Year, Make, Model)",
      selectServices: "What Does Your Car Need?",
      estimatedTime: "Estimated time",
      hoursText: "hour(s)",
      scheduleTitle: "Pick Your Day & Time",
      selectTime: "Select Time",
      additionalInfo: "Anything Else We Should Know?",
      describeIssue: "Tell us about the problem or what you need...",
      emergencyRepair: "This is urgent - I need help ASAP",
      emergencySubtext: "We'll prioritize your request",
      firstResponder: "I'm a first responder",
      firstResponderSubtext: "Special pricing available",
      requestAppointment: "Book My Appointment",
      submitting: "Sending Your Request...",
      selectOneService: "Please select at least one service",
      testimonials: "Stories From Our Customers",
      serviceAreaPayment: "Where We Work & How You Pay",
      clarkCounty: "Clark County",
      clarkCountyDesc: "Free service to Las Vegas, Henderson & North Las Vegas",
      outsideClark: "Outside Clark County",
      outsideClarkDesc: "We can come to you! Call for a travel quote:",
      payment: "Payment Options",
      paymentTerms: "Payment Terms",
      paymentTermsDesc: "1/2 due before service begins, 1/2 due after completion",
      addressNote: "Include full address with city, state, and zip",
      needSpanish: "¿Necesitas Español?",
    },
    es: {
      hero: "Reparación Móvil Profesional",
      subtitle: "Vamos A Ti - Servicio Experto, En Tu Entrada",
      bookNow: "Reservar Servicio",
      emergency: "Llamada de Emergencia",
      since: "Confiable Desde 2021",
      contact: "Contacto",
      phone: "Teléfono",
      serviceArea: "Área de Servicio",
      hours: "Horario",
      whyChooseUs: "Por Qué La Gente Confía En Nosotros",
      mobileConvenience: "Vamos A Ti",
      mobileDesc: "Sin remolque, sin salas de espera. Llevamos el taller a tu entrada.",
      honestPricing: "Precios Honestos y Justos",
      honestDesc: "Sin cargos sorpresa. Sabrás el costo antes de comenzar.",
      expertService: "Artesanía Experta",
      expertDesc: "Años de experiencia, cuidado genuino por cada vehículo.",
      meetMechanic: "Conoce al Hombre Detrás de la Llave",
      bookAppointment: "Reservar una Cita",
      schedule: "Arreglemos Tu Carro",
      scheduleSubtitle: "Dinos qué necesitas y nosotros nos encargamos del resto",
      contactInfo: "Tu Información",
      fullName: "Nombre Completo",
      phoneNumber: "Número de Teléfono (ej. 7021234567)",
      serviceAddress: "¿Dónde Debemos Encontrarte?",
      vehicle: "Vehículo (Año, Marca, Modelo)",
      selectServices: "¿Qué Necesita Tu Carro?",
      estimatedTime: "Tiempo estimado",
      hoursText: "hora(s)",
      scheduleTitle: "Elige Tu Día y Hora",
      selectTime: "Seleccionar Hora",
      additionalInfo: "¿Algo Más Que Debamos Saber?",
      describeIssue: "Cuéntanos sobre el problema o lo que necesitas...",
      emergencyRepair: "Esto es urgente - Necesito ayuda ya",
      emergencySubtext: "Priorizaremos tu solicitud",
      firstResponder: "Soy un primer respondedor",
      firstResponderSubtext: "Precios especiales disponibles",
      requestAppointment: "Reservar Mi Cita",
      submitting: "Enviando Tu Solicitud...",
      selectOneService: "Por favor selecciona al menos un servicio",
      testimonials: "Historias de Nuestros Clientes",
      serviceAreaPayment: "Dónde Trabajamos y Cómo Pagas",
      clarkCounty: "Condado de Clark",
      clarkCountyDesc: "Servicio gratuito a Las Vegas, Henderson y North Las Vegas",
      outsideClark: "Fuera del Condado de Clark",
      outsideClarkDesc: "¡Podemos ir a ti! Llama para una cotización:",
      payment: "Opciones de Pago",
      paymentTerms: "Términos de Pago",
      paymentTermsDesc: "1/2 se debe antes del servicio, 1/2 se debe después de completar",
      addressNote: "Incluye dirección completa con ciudad, estado y código postal",
      needSpanish: "Need English?",
    }
  };

  const t = translations[language];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Toaster position="bottom-center" />

      {/* Promo Banner */}
      {showPromo && promoText && (
        <div className="bg-red-600 text-white py-3 px-4 border-b border-red-700 shadow-lg sticky top-0 z-[60] animate-slideDown">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-center flex-1">{promoText}</p>
            <button
              onClick={() => setShowPromo(false)}
              className="flex-shrink-0 text-red-200 hover:text-white transition-colors text-lg font-bold"
            >✕</button>
          </div>
        </div>
      )}

      {/* Floating CTA */}
      {showFloatingCTA && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideUp flex flex-col gap-3">
          <a
            href="#booking"
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {language === "es" ? "Reservar" : "Book Now"}
          </a>
          <a
            href={`tel:${settings.phone}`}
            className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {language === "es" ? "Llamar" : "Call"}
          </a>
        </div>
      )}

      {/* Navbar */}
      <nav className={`fixed left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06] transition-all ${showPromo ? 'top-[48px]' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex-shrink-0">
            <img
              src={settings.logoUrl ? getStorageUrl('business-assets', settings.logoUrl) : "/onsite-auto/images/logo.png"}
              alt="Logo"
              loading="eager"
              fetchPriority="high"
              className="h-11 w-auto"
            />
          </a>

          <div className="hidden sm:flex items-center gap-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLanguage("en")}
                className={`text-sm font-semibold transition-colors ${language === "en" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
              >EN</button>
              <span className="text-gray-700 text-xs">|</span>
              <button
                onClick={() => setLanguage("es")}
                className={`text-sm font-semibold transition-colors ${language === "es" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
              >ES</button>
            </div>
            <a href={`tel:${settings.phone}`} className="text-sm text-gray-400 hover:text-white transition-colors font-medium">
              {settings.phone}
            </a>
            <a href="#booking" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">
              {t.bookNow}
            </a>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden flex flex-col gap-[5px] p-2"
            aria-label="Menu"
          >
            <span className={`block w-6 h-0.5 bg-white transition-all duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all duration-200 ${mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-5 space-y-3">
            <a
              href="#booking"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >{t.bookNow}</a>
            <a
              href={`tel:${settings.phone}`}
              className="block w-full text-center border border-white/20 hover:border-white/40 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >{settings.phone}</a>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button onClick={() => { setLanguage("en"); setMobileMenuOpen(false); }}
                className={`text-sm font-semibold ${language === "en" ? "text-white" : "text-gray-500"}`}>
                English
              </button>
              <span className="text-gray-700 text-xs">|</span>
              <button onClick={() => { setLanguage("es"); setMobileMenuOpen(false); }}
                className={`text-sm font-semibold ${language === "es" ? "text-white" : "text-gray-500"}`}>
                Español
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-end pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-[#0a0a0a]/80 to-red-950/30" />
          <div className="absolute inset-0 hero-grid-pattern opacity-50 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/60" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/[0.07] rounded-full blur-[120px] pointer-events-none orb-float" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full pt-28">
          <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/[0.08] rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-400">
              {language === "es" ? "ABIERTO · SERVICIO EL MISMO DÍA" : "OPEN · SAME DAY SERVICE"}
            </span>
          </div>

          {language === "es" ? (
            <h1 className="text-[12vw] sm:text-7xl lg:text-8xl xl:text-9xl font-black uppercase leading-[0.88] tracking-tight mb-6">
              <span className="block text-gray-200">REPARACIÓN</span>
              <span className="block text-glow-blue">MÓVIL</span>
              <span className="block text-glow-red">DE AUTOS</span>
              <span className="block text-gray-300">HECHA BIEN.</span>
            </h1>
          ) : (
            <h1 className="text-[14vw] sm:text-7xl lg:text-8xl xl:text-9xl font-black uppercase leading-[0.88] tracking-tight mb-6">
              <span className="block text-gray-200">MOBILE</span>
              <span className="block">
                <span className="text-glow-blue">AUTO </span>
                <span className="text-glow-red">REPAIR</span>
              </span>
              <span className="block text-gray-300">DONE RIGHT.</span>
            </h1>
          )}

          <p className="text-gray-400 text-base sm:text-lg mb-10 max-w-lg leading-relaxed">
            {t.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-14">
            <a
              href="#booking"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-colors text-base"
            >
              {t.bookNow}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="#services"
              className="flex items-center justify-center border border-white/20 hover:border-white/40 hover:bg-white/[0.03] text-white font-semibold py-4 px-8 rounded-xl transition-colors text-base"
            >
              {language === "es" ? "Ver Servicios" : "View Services"}
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-bold text-white text-sm">4.9</span>
              <span className="text-gray-500 text-sm">· 2,400+ {language === "es" ? "reseñas" : "reviews"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>{language === "es" ? "Certificado ASE" : "ASE Certified"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section
        id="services"
        data-animate
        className={`bg-[#0a0a0a] transition-opacity transition-transform duration-700 ${
          isVisible['services'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="mb-12">
            <h2 className="text-4xl sm:text-5xl font-black uppercase leading-none text-gray-200">
              {language === "es" ? "HECHO PARA EL " : "BUILT FOR "}
              <span className="text-glow-blue">{language === "es" ? "RENDIMIENTO." : "PERFORMANCE."}</span>
            </h2>
            <h2 className="text-4xl sm:text-5xl font-black uppercase leading-none text-gray-200 mt-1">
              {language === "es" ? "DISEÑADO PARA LA " : "ENGINEERED FOR "}
              <span className="text-glow-red">{language === "es" ? "CONFIANZA." : "TRUST."}</span>
            </h2>
            <p className="text-gray-500 mt-5 max-w-lg text-sm leading-relaxed">
              {language === "es"
                ? "De reparaciones rápidas a complejas, cada trabajo recibe atención de calidad de concesionario."
                : "From quick fixes to complex repairs, every job gets dealer-quality care."}
            </p>
          </div>

          {serviceOptions.length > 0 && (() => {
            const visible = showAllServices ? serviceOptions : serviceOptions.slice(0, 6);
            return (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {visible.map((service) => (
                    <a
                      key={service.id}
                      href="#booking"
                      className="group flex flex-col bg-[#111] border border-white/[0.08] hover:border-white/[0.18] rounded-2xl p-4 gap-3 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-black rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          {service.icon}
                        </div>
                        <div className="w-7 h-7 rounded-full border border-white/[0.1] group-hover:border-white/25 flex items-center justify-center flex-shrink-0 transition-colors">
                          <svg className="w-3 h-3 text-gray-500 group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-black uppercase text-gray-100 text-sm leading-tight">
                          {language === "es" ? service.nameEs : service.name}
                        </h3>
                        <p className="text-gray-600 text-xs mt-1">
                          ~{service.duration} {service.duration === 1 ? (language === "es" ? "hr" : "hr") : (language === "es" ? "hrs" : "hrs")}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>

                {serviceOptions.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAllServices(v => !v)}
                    className="mt-4 w-full py-3 rounded-xl border border-white/[0.08] hover:border-white/[0.18] text-gray-400 hover:text-gray-200 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {showAllServices
                      ? (language === "es" ? "Ver menos" : "Show less")
                      : (language === "es" ? `Ver los ${serviceOptions.length - 6} servicios restantes` : `Show ${serviceOptions.length - 6} more services`)}
                    <svg
                      className={`w-4 h-4 transition-transform ${showAllServices ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </section>

      {/* Why Us */}
      <section
        id="why-choose"
        data-animate
        className={`bg-[#0d0d0d] border-y border-white/[0.06] transition-opacity transition-transform duration-700 ${
          isVisible['why-choose'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-glow-red-sm">
            {language === "es" ? "POR QUÉ ELEGIRNOS" : "WHY CHOOSE US"}
          </p>
          <h2 className="text-4xl sm:text-5xl font-black uppercase text-gray-200 leading-none mb-1">
            {language === "es" ? "SIN ATAJOS." : "NO SHORTCUTS."}
          </h2>
          <h2 className="text-4xl sm:text-5xl font-black uppercase text-glow-blue leading-none mb-12">
            {language === "es" ? "SIN SORPRESAS." : "NO SURPRISES."}
          </h2>

          <div className="space-y-3">
            {[
              {
                icon: (
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                bg: "bg-blue-600/20",
                title: t.mobileConvenience,
                desc: t.mobileDesc,
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                bg: "bg-red-600/20",
                title: t.honestPricing,
                desc: t.honestDesc,
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
                bg: "bg-blue-600/20",
                title: t.expertService,
                desc: t.expertDesc,
              },
            ].map((item, i) => (
              <div key={i} className="bg-[#111]/80 border border-white/[0.08] rounded-2xl p-6 flex items-start gap-5">
                <div className={`${item.bg} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-black uppercase text-white text-sm sm:text-base mb-1 tracking-wide">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#0a0a0a] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
            {[
              { value: "8+", label: language === "es" ? "AÑOS DE EXPERIENCIA" : "YEARS EXPERIENCE" },
              { value: "2K+", label: language === "es" ? "VEHÍCULOS ATENDIDOS" : "VEHICLES SERVICED" },
              { value: "4.9★", label: language === "es" ? "CALIFICACIÓN" : "CUSTOMER RATING" },
            ].map((stat, i) => (
              <div key={i} className="py-12 text-center">
                <div className="text-3xl sm:text-5xl font-black text-gradient-purple mb-2">{stat.value}</div>
                <div className="text-gray-500 text-[10px] sm:text-xs uppercase tracking-widest leading-tight px-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Your Mechanic */}
      {mechanics.length > 0 && (
        <section id="mechanic" className="bg-[#0d0d0d] border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-glow-red-sm">
                  {language === "es" ? "TU MECÁNICO" : "YOUR MECHANIC"}
                </p>
                <h2 className="text-4xl sm:text-5xl font-black uppercase text-gray-100 leading-none mb-6">
                  {t.meetMechanic}
                </h2>
                <p className="text-xs font-bold tracking-widest uppercase text-blue-400 mb-4">
                  {mechanics[0]?.name}
                </p>
                <div className="space-y-3 text-gray-400 text-sm leading-relaxed mb-8">
                  <p>{mechanics[0]?.bio_short}</p>
                  <p>{mechanics[0]?.bio_long}</p>
                </div>
                <a
                  href="#booking"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-colors"
                >
                  {t.bookAppointment}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>

              <div className="order-1 md:order-2 flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-red-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-700" />
                  <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl">
                    <img
                      src={
                        mechanics[0]?.photo_url
                          ? getStorageUrl('mechanics', mechanics[0].photo_url)
                          : "/images/placeholder-mechanic.jpg"
                      }
                      alt={mechanics[0]?.name || "Mechanic"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Booking Form */}
      <section
        id="booking"
        data-animate
        className={`bg-[#090909] border-b border-white/[0.06] transition-opacity transition-transform duration-700 ${
          isVisible['booking'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-glow-blue-sm">
              {language === "es" ? "RESERVAR CITA" : "BOOK APPOINTMENT"}
            </p>
            <h2 className="text-4xl sm:text-5xl font-black uppercase text-gray-100 leading-none mb-3">
              {t.schedule}
            </h2>
            <p className="text-gray-500 text-sm">{t.scheduleSubtitle}</p>
          </div>

          {/* Deposit notice — only shown when Square is active */}
          {squareEnabled && (
            <div className="flex items-start gap-3 bg-blue-950/20 border border-blue-500/20 rounded-xl px-4 py-3 mb-6">
              <span className="text-blue-400 text-base mt-0.5">🔒</span>
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="text-blue-400 font-semibold">
                  {language === "es" ? "Depósito de $50 requerido" : "$50 deposit required"}
                </span>{" "}
                {language === "es"
                  ? "para asegurar tu cita. Se cobra hoy y se aplica directamente a tu factura final."
                  : "to secure your booking — charged today, applied to your final bill when the job is done."}
              </p>
            </div>
          )}

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6"
          >
            {/* Contact Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 pb-3 border-b border-white/[0.08]">
                {t.contactInfo}
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  name="name"
                  placeholder={t.fullName}
                  required
                  className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 rounded-xl transition-colors text-white placeholder-gray-600 text-sm"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder={t.phoneNumber}
                  required
                  className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 rounded-xl transition-colors text-white placeholder-gray-600 text-sm"
                  pattern="\d{10}"
                  inputMode="numeric"
                />
              </div>
              <input
                type="text"
                name="address"
                placeholder={t.serviceAddress}
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 rounded-xl transition-colors text-white placeholder-gray-600 text-sm"
              />
              <p className="text-xs text-gray-600 ml-1">{t.addressNote}</p>
              <input
                type="text"
                name="vehicleInfo"
                placeholder={t.vehicle}
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 rounded-xl transition-colors text-white placeholder-gray-600 text-sm"
              />
            </div>

            {/* Services */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 pb-3 border-b border-white/[0.08]">
                {t.selectServices}
              </h3>
              <div className="space-y-1">
                {categories.map((category) => {
                  const categoryServices = serviceOptions.filter(s => s.categoryId === category.id);
                  if (categoryServices.length === 0) return null;
                  const isOpen = openCategories.has(category.id);
                  const selectedCount = categoryServices.filter(s => selectedServices.includes(s.id)).length;
                  return (
                    <div key={category.id} className="border border-white/[0.07] rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{category.icon}</span>
                          <span className="text-xs font-bold tracking-widest uppercase text-gray-400">
                            {language === "es" ? category.name_es : category.name}
                          </span>
                          {selectedCount > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                              {selectedCount}
                            </span>
                          )}
                        </div>
                        <svg
                          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isOpen && (
                        <div className="px-3 pb-3 grid grid-cols-2 gap-1.5 border-t border-white/[0.06]">
                          {categoryServices.map((service) => {
                            const selected = selectedServices.includes(service.id);
                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => handleServiceToggle(service.id)}
                                className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-left transition-colors mt-1.5 ${
                                  selected
                                    ? "bg-blue-600/15 border-blue-500/40"
                                    : "border-white/[0.06] hover:border-white/[0.18] hover:bg-white/[0.03]"
                                }`}
                              >
                                <span className="text-base flex-shrink-0 mt-px">{service.icon}</span>
                                <span className={`text-xs font-semibold leading-tight ${selected ? 'text-blue-400' : 'text-gray-300'}`}>
                                  {language === "es" ? service.nameEs : service.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedServices.length > 0 && (
                <div className="rounded-xl border border-white/[0.08] overflow-hidden animate-fadeIn">
                  <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                      {language === "es" ? "RESUMEN ESTIMADO" : "ESTIMATED ORDER"}
                    </p>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {selectedServices.map(serviceId => {
                      const service = serviceOptions.find(s => s.id === serviceId);
                      if (!service) return null;
                      return (
                        <div key={serviceId} className="flex items-center justify-between px-4 py-3 gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base flex-shrink-0">{service.icon}</span>
                            <span className="text-sm text-gray-200 font-medium truncate">
                              {language === "es" ? service.nameEs : service.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs text-gray-600">~{service.duration}hr</span>
                            {extractPrice(service.price) && (
                              <span className="text-sm font-bold text-blue-400">{extractPrice(service.price)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-4 py-3 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-gray-500">{t.estimatedTime}</span>
                    <span className="text-sm font-black text-gray-200">{duration} {t.hoursText}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 pb-3 border-b border-white/[0.08]">
                {t.scheduleTitle}
              </h3>
              <div className="calendar-wrapper bg-black/40 p-4 border border-white/[0.08] rounded-xl">
                <Calendar
                  value={selectedDate ? new Date(selectedDate + "T00:00:00") : null}
                  minDate={new Date()}
                  onChange={(date) => {
                    const isoDate = date.toISOString().split("T")[0];
                    setSelectedDate(isoDate);
                  }}
                  tileDisabled={({ date }) => {
                    const iso = date.toISOString().split("T")[0];
                    return !availableDates.includes(iso);
                  }}
                  tileClassName={({ date }) => {
                    const iso = date.toISOString().split("T")[0];
                    const isSelected = selectedDate === iso;
                    const isAvailable = availableDates.includes(iso);
                    return isSelected ? "selected-date-auto" : isAvailable ? "available-date-auto" : null;
                  }}
                  calendarType="US"
                />
              </div>
              <input type="hidden" name="date" value={selectedDate || ""} />
              <select
                name="start_time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 rounded-xl transition-colors text-white text-sm"
              >
                <option value="">{t.selectTime}</option>
                {timeOptions.map((t) => (
                  <option key={t} value={t}>{formatTo12Hour(t)}</option>
                ))}
              </select>
            </div>

            {/* Additional Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 pb-3 border-b border-white/[0.08]">
                {t.additionalInfo}
              </h3>
              <textarea
                name="notes"
                placeholder={t.describeIssue}
                rows="4"
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 rounded-xl transition-colors resize-none text-white placeholder-gray-600 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsEmergency(!isEmergency)}
                  className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border transition-colors text-left ${
                    isEmergency
                      ? 'bg-red-600/15 border-red-500/50'
                      : 'border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-base">🚨</span>
                    <span className={`text-xs font-bold uppercase tracking-wide leading-tight ${isEmergency ? 'text-red-400' : 'text-white'}`}>
                      {t.emergencyRepair}
                    </span>
                    <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                      isEmergency ? 'bg-red-500 border-red-500' : 'border-white/20'
                    }`} />
                  </div>
                  <p className={`text-xs ${isEmergency ? 'text-red-400/70' : 'text-gray-500'}`}>
                    {t.emergencySubtext}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVeteran(!isVeteran)}
                  className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border transition-colors text-left ${
                    isVeteran
                      ? 'bg-blue-600/15 border-blue-500/50'
                      : 'border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-base">🎖️</span>
                    <span className={`text-xs font-bold uppercase tracking-wide leading-tight ${isVeteran ? 'text-blue-400' : 'text-white'}`}>
                      {t.firstResponder}
                    </span>
                    <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                      isVeteran ? 'bg-blue-500 border-blue-500' : 'border-white/20'
                    }`} />
                  </div>
                  <p className={`text-xs ${isVeteran ? 'text-blue-400/70' : 'text-gray-500'}`}>
                    {t.firstResponderSubtext}
                  </p>
                </button>
              </div>
            </div>


            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || selectedServices.length === 0}
              className={`w-full py-4 px-6 rounded-xl font-black tracking-widest uppercase transition-colors text-sm ${
                isSubmitting || selectedServices.length === 0
                  ? "bg-white/[0.04] cursor-not-allowed text-gray-600 border border-white/[0.06]"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {squareEnabled
                    ? (language === "es" ? "Procesando pago…" : "Processing payment…")
                    : (language === "es" ? "Enviando…" : "Submitting…")}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {squareEnabled
                    ? (language === "es" ? "Pagar $50 y Reservar" : "Pay $50 Deposit & Book")
                    : (language === "es" ? "Solicitar Cita" : "Request Appointment")}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>

            {selectedServices.length === 0 && (
              <p className="text-center text-xs text-red-400 flex items-center justify-center gap-2 animate-pulse">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {t.selectOneService}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section id="testimonials" className="bg-[#0a0a0a] border-b border-white/[0.06]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-glow-blue-sm">
              {language === "es" ? "TESTIMONIOS" : "TESTIMONIALS"}
            </p>
            <h2 className="text-4xl sm:text-5xl font-black uppercase text-gray-100 leading-none mb-12">
              {t.testimonials}
            </h2>

            <div
              className={`bg-[#111] border border-white/[0.08] rounded-2xl p-8 sm:p-12 min-h-[280px] flex flex-col justify-between transition-opacity duration-500 ${
                fade ? "opacity-100" : "opacity-0"
              }`}
            >
              <div>
                <div className="flex mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {testimonials[currentTestimonial].image_url ? (
                  <div className="mb-6">
                    <img
                      src={getStorageUrl('testimonials', testimonials[currentTestimonial].image_url)}
                      alt="Review screenshot"
                      className="max-w-full max-h-[300px] mx-auto border border-white/[0.08] shadow-xl object-contain rounded-xl"
                    />
                  </div>
                ) : (
                  <blockquote className="text-gray-300 text-xl mb-6 italic leading-relaxed">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>
                )}
              </div>
              <div className="border-t border-white/[0.08] pt-5">
                <p className="font-black uppercase text-white">{testimonials[currentTestimonial].name}</p>
                {testimonials[currentTestimonial].service && (
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
                    {testimonials[currentTestimonial].service}
                  </p>
                )}
              </div>
            </div>

            {testimonials.length > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTestimonial(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentTestimonial ? "bg-blue-500 w-8" : "bg-gray-700 hover:bg-gray-600 w-1.5"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Service Area & Payment */}
      <section
        id="service-area"
        data-animate
        className={`bg-[#0d0d0d] border-b border-white/[0.06] transition-opacity transition-transform duration-700 ${
          isVisible['service-area'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-glow-blue-sm">
              {language === "es" ? "COBERTURA Y PAGO" : "COVERAGE & PAYMENT"}
            </p>
            <h2 className="text-4xl sm:text-5xl font-black uppercase text-gray-100 leading-none">
              {t.serviceAreaPayment}
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t.serviceArea}
              </h3>
              <div className="relative h-72 bg-black rounded-xl overflow-hidden border border-white/[0.08] mb-6">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d103400.55678140822!2d-115.2!3d36.17!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80beb782a4f57dd1%3A0x3accd5e6d5b379a3!2sLas%20Vegas%2C%20NV!5e0!3m2!1sen!2sus!4v1234567890123"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-green-900/20 border border-green-500/30 p-4 rounded-xl">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-bold text-white text-sm mb-0.5">{t.clarkCounty}</p>
                    <p className="text-xs text-gray-400">{t.clarkCountyDesc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-xl">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-bold text-white text-sm mb-0.5">{t.outsideClark}</p>
                    <p className="text-xs text-gray-400">
                      {t.outsideClarkDesc}{" "}
                      <a href={`tel:${settings.phone}`} className="text-blue-400 hover:text-blue-400 font-semibold">{settings.phone}</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t.payment}
              </h3>
              <div className="bg-black/50 border border-white/[0.06] p-5 rounded-xl mb-6">
                <p className="font-bold text-white text-sm mb-1">{t.paymentTerms}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{t.paymentTermsDesc}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 flex-1">
                {[
                  { icon: "💵", label: "Cash" },
                  { icon: "📱", label: "Venmo" },
                  { icon: "💳", label: "Zelle" },
                  { icon: "💸", label: "Cash App" },
                ].map(({ icon, label }) => (
                  <div key={label} className="bg-black/40 border border-white/[0.08] hover:border-white/[0.15] p-5 rounded-xl text-center transition-colors">
                    <div className="text-3xl mb-2">{icon}</div>
                    <p className="font-bold text-white text-sm">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">
          <div className="mb-10">
            <img
              src={settings.logoUrl ? getStorageUrl('business-assets', settings.logoUrl) : "/onsite-auto/images/logo.png"}
              alt="Logo"
              className="h-12 w-auto mb-5"
            />
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              {language === "es"
                ? "Reparación móvil de autos de calidad. Confiable desde 2021."
                : "Professional mobile auto repair, done right. Trusted since 2021."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-5">
                {language === "es" ? "CONTACTO" : "VISIT"}
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-400 text-sm">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Clark County, NV
                </li>
                <li className="flex items-center gap-3 text-gray-400 text-sm">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${settings.phone}`} className="hover:text-white transition-colors">{settings.phone}</a>
                </li>
                <li className="flex items-center gap-3 text-gray-400 text-sm">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {settings.hours}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-5">
                {language === "es" ? "SERVICIOS" : "SERVICES"}
              </h4>
              <ul className="space-y-2">
                {serviceOptions.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <a href="#booking" className="text-gray-400 hover:text-white text-sm transition-colors">
                      {language === "es" ? s.nameEs : s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-xs">
              © 2026 {settings.businessName}. All rights reserved.
            </p>
            <Link href="/login" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
              Team Login
            </Link>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }

        .calendar-wrapper .react-calendar {
          border: none !important;
          background: transparent !important;
          font-family: inherit;
          width: 100%;
          color: white;
        }
        .calendar-wrapper .react-calendar__tile {
          border: 1px solid rgba(255,255,255,0.06) !important;
          background: rgba(0,0,0,0.3) !important;
          padding: 10px !important;
          transition: background-color 0.15s, border-color 0.15s, color 0.15s !important;
          color: #9ca3af;
          border-radius: 0.75rem !important;
        }
        .calendar-wrapper .react-calendar__tile:hover:enabled {
          background: rgba(59,130,246,0.1) !important;
          border-color: rgba(59,130,246,0.4) !important;
          color: white;
        }
        .calendar-wrapper .react-calendar__tile--now {
          background: #1f2937 !important;
          font-weight: 600 !important;
          color: white;
          border-color: #4b5563 !important;
        }
        .calendar-wrapper .available-date-auto {
          background: #1e3a8a !important;
          color: white !important;
          font-weight: 500 !important;
          border: 1px solid #3b82f6 !important;
        }
        .calendar-wrapper .selected-date-auto {
          background: linear-gradient(135deg, #3b82f6, #ef4444) !important;
          color: white !important;
          font-weight: 700 !important;
          border: 1px solid #3b82f6 !important;
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.5) !important;
        }
        .calendar-wrapper .react-calendar__tile:disabled {
          background: rgba(0,0,0,0.2) !important;
          color: #374151 !important;
          border-color: rgba(255,255,255,0.04) !important;
        }
        .calendar-wrapper .react-calendar__navigation {
          background: rgba(255,255,255,0.03) !important;
          margin-bottom: 12px !important;
          border: 1px solid rgba(255,255,255,0.07) !important;
          border-radius: 0.75rem !important;
        }
        .calendar-wrapper .react-calendar__navigation button {
          color: white !important;
          font-weight: 600 !important;
          font-size: 16px;
        }
        .calendar-wrapper .react-calendar__navigation button:hover {
          background: #374151 !important;
          border-radius: 0.5rem;
        }
        .calendar-wrapper .react-calendar__month-view__weekdays {
          font-weight: 700 !important;
          color: #9ca3af !important;
          font-size: 13px;
        }
        .calendar-wrapper .react-calendar__month-view__weekdays__weekday {
          color: white !important;
          border-bottom: 1px solid #374151 !important;
          padding-bottom: 8px !important;
        }

        .hero-grid-pattern {
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .text-gradient-fire {
          background: linear-gradient(135deg, #3b82f6 0%, #ef4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .text-gradient-purple {
          background: linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .text-glow-blue {
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 20px rgba(96, 165, 250, 0.45));
        }

        .text-glow-red {
          background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.4));
        }

        .text-glow-red-sm {
          color: #f87171;
          text-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
        }

        .text-glow-blue-sm {
          color: #60a5fa;
          text-shadow: 0 0 12px rgba(96, 165, 250, 0.4);
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.05); }
        }
        .orb-float {
          animation: float 20s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>
    </main>
  );
}
