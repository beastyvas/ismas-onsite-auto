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
  
  const [settings, setSettings] = useState({
    businessName: "Isma's OnSite Auto Repair",
    phone: "(702) 801-7210",
    hours: "Mon-Sat: 8AM - 6PM",
  });

  useEffect(() => {
    // First, make all sections visible by default
    const allSections = document.querySelectorAll('[data-animate]');
    const initialVisible = {};
    
    allSections.forEach((el) => {
      const rect = el.getBoundingClientRect();
      // If section is in viewport on load, make it visible immediately
      if (rect.top < window.innerHeight) {
        initialVisible[el.id] = true;
      }
    });
    
    setIsVisible(initialVisible);

    // Then set up observer for sections below the fold
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { 
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    setTimeout(() => {
      allSections.forEach((el) => {
        observer.observe(el);
      });
    }, 100);

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

  // Floating CTA button scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setShowFloatingCTA(true);
      } else {
        setShowFloatingCTA(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
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
      if (!selectedDate || !duration) {
        setTimeOptions([]);
        return;
      }

      try {
        const { data: availabilityData, error: availErr } = await supabase
          .from("availability")
          .select("start_time, end_time")
          .eq("date", selectedDate)
          .single();

        if (availErr || !availabilityData) {
          setTimeOptions([]);
          return;
        }

        const startHour = parseInt(availabilityData.start_time.split(":")[0]);
        const endHour = parseInt(availabilityData.end_time.split(":")[0]);

        const { data: booked, error: bookedErr } = await supabase
          .rpc('get_booked_slots', { p_date: selectedDate });

        if (bookedErr) {
          console.error('Booking RPC error:', bookedErr);
          return;
        }

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

  const handleServiceToggle = useCallback((serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
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

    const payload = {
      id: uuidv4(),
      name: data.get("name"),
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
      paid: false,
    };

    try {
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
    <main className="min-h-screen bg-black text-gray-100">
      <Toaster position="bottom-center" />

      {/* Floating CTA Button */}
      {showFloatingCTA && (
        <div className="fixed bottom-8 right-8 z-50 animate-slideUp">
          <div className="flex flex-col gap-3">
            <a
              href="#booking"
              className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all flex items-center space-x-3 hover:scale-110 animate-pulse-slow"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-bold">{language === "es" ? "Reservar" : "Book Now"}</span>
            </a>
            <a
              href={`tel:${settings.phone}`}
              className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-red-500/50 transition-all flex items-center space-x-3 hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="font-bold">{language === "es" ? "Llamar" : "Call"}</span>
            </a>
          </div>
        </div>
      )}

      {/* Promo Banner */}
      {showPromo && promoText && (
        <div className="bg-red-600 text-white py-3 px-4 border-b border-red-700 shadow-lg sticky top-0 z-40 animate-slideDown">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-center flex-1">
              {promoText}
            </p>
            <button
              onClick={() => setShowPromo(false)}
              className="flex-shrink-0 text-red-200 hover:text-white transition-colors text-lg font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Language Toggle */}
      <div className={`${showPromo ? '' : 'sticky top-0'} bg-gray-900 border-b border-gray-800 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-end">
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium transition-colors ${language === "en" ? "text-white" : "text-gray-500"}`}>
              English
            </span>
            <button
              onClick={() => setLanguage(language === "en" ? "es" : "en")}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                language === "es" ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  language === "es" ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${language === "es" ? "text-white" : "text-gray-500"}`}>
              Español
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black border-b border-gray-800">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-red-900/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent animate-pulse-slow"></div>
        
        {/* Animated floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{top: '10%', left: '10%'}}></div>
          <div className="absolute w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-float-delayed" style={{bottom: '10%', right: '10%'}}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left animate-fadeInLeft">
              <div className="mb-8">
                <img
                  src={
                    settings.logoUrl
                      ? getStorageUrl('business-assets', settings.logoUrl)
                      : "/onsite-auto/images/logo.png"
                  }
                  alt="Logo"
                  className="w-64 mx-auto lg:mx-0 drop-shadow-2xl"
                />
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight text-white">
                {t.hero}
              </h1>
              
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                {t.subtitle}
              </p>

              <div className="inline-flex items-center bg-gray-800 border border-gray-700 px-6 py-3 rounded-full mb-8">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium text-gray-300">{t.since}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="#booking"
                  className="group inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-blue-600/50 hover:scale-105"
                >
                  {t.bookNow}
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <a
                  href={`tel:${settings.phone}`}
                  className="group inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-red-600/50 hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {t.emergency}
                </a>
              </div>
            </div>

            <div className="animate-fadeInRight">
              <div className="bg-gray-900 border border-gray-800 p-10 shadow-2xl rounded-2xl">
                <h3 className="text-2xl font-bold mb-6 text-white flex items-center">
                  <svg className="w-6 h-6 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t.contact}
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 group hover:transform hover:translate-x-2 transition-transform">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t.phone}</p>
                      <a href={`tel:${settings.phone}`} className="text-lg font-semibold text-white hover:text-blue-500 transition-colors">
                        {settings.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 group hover:transform hover:translate-x-2 transition-transform">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t.serviceArea}</p>
                      <p className="text-lg font-semibold text-white">Clark County, NV</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 group hover:transform hover:translate-x-2 transition-transform">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t.hours}</p>
                      <p className="text-lg font-semibold text-white">{settings.hours}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section 
        id="why-choose" 
        data-animate
        className={`py-16 bg-gray-900 border-b border-gray-800 transition-all duration-1000 ${
          isVisible['why-choose'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-white mb-4">
              {t.whyChooseUs}
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-red-500 mx-auto"></div>
          </div>

          {/* Animated Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 p-6 rounded-2xl text-center transform hover:scale-105 transition-all">
              <div className="text-5xl font-extrabold text-blue-400 mb-2">8+</div>
              <div className="text-gray-300 font-medium">{language === "es" ? "Años de Experiencia" : "Years Experience"}</div>
            </div>
            <div className="bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-500/30 p-6 rounded-2xl text-center transform hover:scale-105 transition-all">
              <div className="text-5xl font-extrabold text-red-400 mb-2">2000+</div>
              <div className="text-gray-300 font-medium">{language === "es" ? "Carros Reparados" : "Cars Fixed"}</div>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 p-6 rounded-2xl text-center transform hover:scale-105 transition-all">
              <div className="text-5xl font-extrabold text-green-400 mb-2">100%</div>
              <div className="text-gray-300 font-medium">{language === "es" ? "Satisfacción" : "Satisfaction"}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-gray-800 border border-gray-700 p-8 rounded-2xl hover:border-blue-500 transition-all hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-600/20">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t.mobileConvenience}</h3>
              <p className="text-gray-400 leading-relaxed">{t.mobileDesc}</p>
            </div>

            <div className="group bg-gray-800 border border-gray-700 p-8 rounded-2xl hover:border-blue-500 transition-all hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-600/20">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t.honestPricing}</h3>
              <p className="text-gray-400 leading-relaxed">{t.honestDesc}</p>
            </div>

            <div className="group bg-gray-800 border border-gray-700 p-8 rounded-2xl hover:border-blue-500 transition-all hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-600/20">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t.expertService}</h3>
              <p className="text-gray-400 leading-relaxed">{t.expertDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Your Mechanic */}
      {mechanics.length > 0 && (
        <section 
          id="mechanic" 
          className="py-16 bg-black border-b border-gray-800"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-4xl font-bold mb-4 text-white">
                  {t.meetMechanic}
                </h2>
                <p className="text-lg text-blue-500 font-semibold mb-6">
                  {mechanics[0]?.name}
                </p>
                
                <div className="space-y-4 text-gray-400 leading-relaxed">
                  <p className="text-lg">
                    {mechanics[0]?.bio_short}
                  </p>
                  <p>
                    {mechanics[0]?.bio_long}
                  </p>
                </div>

                <div className="mt-8">
                  <a
                    href="#booking"
                    className="inline-flex items-center px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition-all hover:shadow-blue-600/50 hover:scale-105"
                  >
                    {t.bookAppointment}
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="order-1 md:order-2 flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-red-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
                  <div className="relative w-80 h-80 rounded-3xl overflow-hidden border-2 border-gray-700 shadow-2xl">
                    <img
                      src={
                        mechanics[0]?.photo_url
                          ? getStorageUrl('mechanics', mechanics[0].photo_url)
                          : "/images/placeholder-mechanic.jpg"
                      }
                      alt={mechanics[0]?.name || "Mechanic"}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
        className={`py-16 bg-gray-900 border-b border-gray-800 transition-all duration-1000 ${
          isVisible['booking'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-white mb-4">
              {t.schedule}
            </h2>
            <p className="text-lg text-gray-400">{t.scheduleSubtitle}</p>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-red-500 mx-auto mt-6"></div>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-10 space-y-8 shadow-2xl"
          >
            {/* Contact Info */}
            <div className="space-y-5">
              <h3 className="text-xl font-bold text-white pb-3 border-b border-gray-700">
                {t.contactInfo}
              </h3>
              
              <input
                type="text"
                name="name"
                placeholder={t.fullName}
                required
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-gray-500"
              />
              
              <input
                type="tel"
                name="phone"
                placeholder={t.phoneNumber}
                required
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-gray-500"
                pattern="\d{10}"
                inputMode="numeric"
              />

              <div>
                <input
                  type="text"
                  name="address"
                  placeholder={t.serviceAddress}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 mt-2 ml-1">
                  {t.addressNote}
                </p>
              </div>

              <input
                type="text"
                name="vehicleInfo"
                placeholder={t.vehicle}
                required
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white placeholder-gray-500"
              />
            </div>

            {/* Services */}
            <div className="space-y-5">
              <h3 className="text-xl font-bold text-white pb-3 border-b border-gray-700">
                {t.selectServices}
              </h3>
              
              <div className="space-y-3">
                {categories.map((category) => {
                  const categoryServices = serviceOptions.filter(s => s.categoryId === category.id);
                  if (categoryServices.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-2">{category.icon}</span>
                        <span className="text-sm font-semibold text-white">
                          {language === "es" ? category.name_es : category.name}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {categoryServices.map((service) => (
                          <label
                            key={service.id}
                            className={`relative cursor-pointer p-3 rounded-lg border transition-all duration-300 group ${
                              selectedServices.includes(service.id)
                                ? "bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 shadow-lg shadow-blue-600/50 scale-105 ring-2 ring-blue-400/50"
                                : "bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750 hover:scale-105"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedServices.includes(service.id)}
                              onChange={() => handleServiceToggle(service.id)}
                              className="hidden"
                            />
                            {/* Checkmark indicator */}
                            {selectedServices.includes(service.id) && (
                              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-slideDown">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            <div className="text-center">
                              <div className={`text-2xl mb-1 transition-transform ${selectedServices.includes(service.id) ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {service.icon}
                              </div>
                              <div className="text-[10px] font-medium text-white leading-tight">
                                {language === "es" ? service.nameEs : service.name}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {selectedServices.length > 0 && (
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center animate-fadeIn">
                  <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-400">
                    {t.estimatedTime}: <span className="font-semibold text-white">{duration} {t.hoursText}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="space-y-5">
              <h3 className="text-xl font-bold text-white pb-3 border-b border-gray-700">
                {t.scheduleTitle}
              </h3>

              <div className="calendar-wrapper bg-gray-900 p-4 border border-gray-700 rounded-xl">
                <Calendar
                  value={selectedDate ? new Date(selectedDate + "T00:00:00") : null}
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

                    return isSelected
                      ? "selected-date-auto"
                      : isAvailable
                      ? "available-date-auto"
                      : null;
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
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-white"
              >
                <option value="">{t.selectTime}</option>
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {formatTo12Hour(t)}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Info */}
            <div className="space-y-5">
              <h3 className="text-xl font-bold text-white pb-3 border-b border-gray-700">
                {t.additionalInfo}
              </h3>

              <textarea
                name="notes"
                placeholder={t.describeIssue}
                rows="4"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all resize-none text-white placeholder-gray-500"
              />

              <div className="space-y-3">
                {/* Emergency Toggle */}
                <div className="bg-red-900/20 border border-red-500/40 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-red-400 mb-1">{t.emergencyRepair}</p>
                      <p className="text-xs text-red-400/70">{t.emergencySubtext}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEmergency(!isEmergency)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        isEmergency ? 'bg-red-600' : 'bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          isEmergency ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* First Responder Toggle */}
                <div className="bg-blue-900/20 border border-blue-500/40 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-200 mb-1">{t.firstResponder}</p>
                      <p className="text-xs text-gray-400">{t.firstResponderSubtext}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVeteran(!isVeteran)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        isVeteran ? 'bg-blue-600' : 'bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          isVeteran ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || selectedServices.length === 0}
              className={`w-full py-4 px-6 rounded-xl font-bold transition-all text-base shadow-lg ${
                isSubmitting || selectedServices.length === 0
                  ? "bg-gray-700 cursor-not-allowed text-gray-500"
                  : "bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white hover:shadow-2xl hover:scale-105"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span>{t.submitting}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span>{t.requestAppointment}</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>

            {selectedServices.length === 0 && (
              <p className="text-center text-sm text-red-400 flex items-center justify-center animate-pulse">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <section 
          id="testimonials" 
          className="py-16 bg-black border-b border-gray-800"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-white mb-4">
                {t.testimonials}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-red-500 mx-auto"></div>
            </div>

            <div className="relative">
              <div
                className={`bg-gray-900 border border-gray-800 rounded-2xl p-12 min-h-[400px] flex flex-col justify-between shadow-2xl transition-all duration-500 ${
                  fade ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
              >
                <div>
                  <div className="flex justify-center mb-6">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <svg key={i} className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  
                  {testimonials[currentTestimonial].image_url ? (
                    <div className="mb-6">
                      <img
                        src={getStorageUrl('testimonials', testimonials[currentTestimonial].image_url)}
                        alt="Review screenshot"
                        className="max-w-full max-h-[350px] mx-auto border border-gray-700 shadow-xl object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <blockquote className="text-gray-300 text-xl mb-6 text-center italic leading-relaxed">
                      "{testimonials[currentTestimonial].text}"
                    </blockquote>
                  )}
                </div>
                
                <div className="border-t border-gray-800 pt-6 text-center">
                  <p className="font-bold text-xl text-white">
                    {testimonials[currentTestimonial].name}
                  </p>
                  {testimonials[currentTestimonial].service && (
                    <p className="text-sm text-gray-500 mt-2 uppercase tracking-wider">
                      {testimonials[currentTestimonial].service}
                    </p>
                  )}
                </div>
              </div>

              {testimonials.length > 1 && (
                <div className="flex justify-center mt-8 space-x-3">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentTestimonial(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentTestimonial
                          ? "bg-blue-500 w-8"
                          : "bg-gray-700 hover:bg-gray-600 w-2"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Service Area - Las Vegas Map */}
      <section 
        id="service-area" 
        data-animate
        className={`py-16 bg-gray-900 border-b border-gray-800 transition-all duration-1000 ${
          isVisible['service-area'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-white mb-4">
              {t.serviceAreaPayment}
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-red-500 mx-auto"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Map */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {t.serviceArea}
              </h3>
              
              <div className="relative h-96 bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d103400.55678140822!2d-115.2!3d36.17!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80beb782a4f57dd1%3A0x3accd5e6d5b379a3!2sLas%20Vegas%2C%20NV!5e0!3m2!1sen!2sus!4v1234567890123"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-500"
                ></iframe>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start space-x-3 bg-green-900/20 border border-green-500/40 p-4 rounded-xl">
                  <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-bold text-white mb-1">{t.clarkCounty}</p>
                    <p className="text-sm text-gray-400">{t.clarkCountyDesc}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-yellow-900/20 border border-yellow-500/40 p-4 rounded-xl">
                  <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-bold text-white mb-1">{t.outsideClark}</p>
                    <p className="text-sm text-gray-400">
                      {t.outsideClarkDesc} <a href={`tel:${settings.phone}`} className="text-blue-400 hover:text-blue-300 font-semibold">{settings.phone}</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t.payment}
              </h3>

              <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl mb-6">
                <p className="text-lg text-white font-semibold mb-2">{t.paymentTerms}</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {t.paymentTermsDesc}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl text-center hover:border-blue-500 hover:scale-105 transition-all">
                  <div className="text-4xl mb-3">💵</div>
                  <p className="font-semibold text-white">Cash</p>
                </div>
                <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl text-center hover:border-blue-500 hover:scale-105 transition-all">
                  <div className="text-4xl mb-3">📱</div>
                  <p className="font-semibold text-white">Venmo</p>
                </div>
                <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl text-center hover:border-blue-500 hover:scale-105 transition-all">
                  <div className="text-4xl mb-3">💳</div>
                  <p className="font-semibold text-white">Zelle</p>
                </div>
                <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl text-center hover:border-blue-500 hover:scale-105 transition-all">
                  <div className="text-4xl mb-3">💸</div>
                  <p className="font-semibold text-white">Cash App</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center py-8 bg-black border-t border-gray-800">
        <Link
          href="/login"
          className="inline-flex items-center text-gray-500 hover:text-blue-500 font-medium transition-colors duration-200 text-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Team Login
        </Link>
      </div>

      {/* Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-fadeInLeft {
          animation: fadeInLeft 0.8s ease-out;
        }
        
        .animate-fadeInRight {
          animation: fadeInRight 0.8s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .calendar-wrapper .react-calendar {
          border: none !important;
          background: transparent !important;
          font-family: inherit;
          width: 100%;
          color: white;
        }
        
        .calendar-wrapper .react-calendar__tile {
          border: 1px solid #374151 !important;
          background: #111827 !important;
          padding: 10px !important;
          transition: all 0.2s !important;
          color: #9ca3af;
          border-radius: 0.75rem !important;
        }
        
        .calendar-wrapper .react-calendar__tile:hover:enabled {
          background: #1f2937 !important;
          border-color: #3b82f6 !important;
          color: white;
          transform: scale(1.05);
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
          transform: scale(1.1);
        }
        
        .calendar-wrapper .react-calendar__tile:disabled {
          background: #111827 !important;
          color: #4b5563 !important;
          border-color: #374151 !important;
        }
        
        .calendar-wrapper .react-calendar__navigation {
          background: #1f2937 !important;
          margin-bottom: 12px !important;
          border: 1px solid #374151 !important;
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

        /* Custom Animations */
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 30px) scale(1.1); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 25s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}