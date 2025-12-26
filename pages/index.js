"use client";

import toast, { Toaster } from "react-hot-toast";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import RepairGallery from "@/components/RepairGallery";
import { supabase } from "@/utils/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import "react-calendar/dist/Calendar.css";
import Link from "next/link";
import dynamic from "next/dynamic";

// Lazy load Calendar for better initial load
const Calendar = dynamic(() => import("react-calendar"), { 
  ssr: false,
  loading: () => (
    <div className="h-80 bg-slate-900/50 rounded-lg flex items-center justify-center">
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
  const [isVeteran, setIsVeteran] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(true);
  const [language, setLanguage] = useState("en");
  const [showPromo, setShowPromo] = useState(false);
  const [promoText, setPromoText] = useState("");
  
  // Data from database
  const [settings, setSettings] = useState({
    businessName: "Isma's OnSite Auto Repair",
    phone: "(702) 801-7210",
    hours: "Mon-Sat: 8AM - 6PM",
  });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [fade, setFade] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [currentService, setCurrentService] = useState(0);
  const [services, setServices] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [currentMechanic, setCurrentMechanic] = useState(0);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [categories, setCategories] = useState([]); // ← ADD THIS
const [openCategory, setOpenCategory] = useState(null); // ← ADD THIS

  // Memoized storage URL helper
  const getStorageUrl = useCallback((bucket, path) => {
    if (!path) return null;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }, []);


  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch in parallel for better performance
        const [
          { data: servicesData },
          { data: settingsData },
          { data: testimonialsData },
          { data: mechanicsData },
          { data: availabilityData }
        ] = await Promise.all([
          supabase.from("services").select("*").order("created_at", { ascending: true }),
          supabase.from("settings").select("*").maybeSingle(),
          supabase.from("testimonials").select("*").order("created_at", { ascending: false }),
          supabase.from("mechanics").select("*").order("created_at", { ascending: true }),
          supabase.from("availability").select("date")
        ]);

        // Process services
       // Process services & categories
if (servicesData?.length > 0) {
  // Fetch categories
  const { data: categoriesData } = await supabase
    .from("service_categories")
    .select("*")
    .order("display_order", { ascending: true });
  
  if (categoriesData) {
    setCategories(categoriesData);
  }

  const formattedOptions = servicesData.map((service) => ({
    id: service.id,
    name: service.title,
    nameEs: service.title_es || service.title,
    duration: service.duration || 1,
    icon: service.icon || "🔧",
    price: service.price,
    categoryId: service.category_id, // ← ADD THIS LINE
  }));
  setServiceOptions(formattedOptions);
  setServices(servicesData);
}
        // Process settings
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

        // Process testimonials
        if (testimonialsData) {
          setTestimonials(testimonialsData);
        }

        // Process mechanics with fallback
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

        // Process available dates
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

  // Auto-rotate testimonials
  useEffect(() => {
    if (testimonials.length <= 1) return;
    
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        setFade(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Auto-rotate mechanics
  useEffect(() => {
    if (mechanics.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentMechanic((prev) => (prev + 1) % mechanics.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [mechanics.length]);

  // Auto-rotate services
  useEffect(() => {
    if (services.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentService((prev) => (prev + 1) % services.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [services.length]);

  // Calculate total duration
  useEffect(() => {
    const total = selectedServices.reduce((sum, serviceId) => {
      const service = serviceOptions.find(s => s.id === serviceId);
      return sum + (service?.duration || 1);
    }, 0);
    setDuration(total || 1);
  }, [selectedServices, serviceOptions]);

  // Load available times for selected date
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
      is_emergency: data.get("isEmergency") === "on",
      veteran_discount: data.get("veteranDiscount") === "on",
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

  const translations = useMemo(() => ({
    en: {
      hero: "Professional Mobile Auto Repair",
      subtitle: "We Come To You - Clark County & Surrounding Areas",
      bookNow: "Book Service",
      emergency: "Emergency Repair",
      since: "Serving Las Vegas Since 2021",
      services: "Our Services",
      testimonials: "What Our Customers Say",
      schedule: "Schedule Your Service",
      contact: "Contact Information",
      phone: "Phone",
      serviceArea: "Service Area",
      hours: "Hours",
      scheduleSubtitle: "Fill out the form below and we'll get back to you shortly",
      contactInfo: "Contact Information",
      fullName: "Full Name",
      phoneNumber: "Phone Number (e.g. 7021234567)",
      serviceAddress: "Service Address",
      vehicle: "Vehicle (Year, Make, Model)",
      selectServices: "Select Services",
      estimatedTime: "Estimated time",
      hoursText: "hour(s)",
      scheduleTitle: "Schedule",
      selectTime: "Select Time",
      additionalInfo: "Additional Info",
      describeIssue: "Describe the issue or service needed...",
      emergencyRepair: "Emergency repair (priority)",
      emergencySubtext: "We'll prioritize your request",
      firstResponder: "First Responder discount",
      discountSubtext: "Special pricing available",
      requestAppointment: "Request Appointment",
      submitting: "Submitting Request...",
      selectOneService: "Please select at least one service",
      serviceAreaPayment: "Service Area & Payment",
      clarkCounty: "Clark County",
      clarkCountyDesc: "No travel fee for Las Vegas, North Las Vegas, Henderson, and Boulder City",
      outsideClark: "Outside Clark County",
      outsideClarkDesc: "Transportation fee may apply. Call for quote:",
      payment: "Payment:",
      paymentMethods: "Cash, Venmo, Zelle, Cash App",
      dashboardLogin: "Dashboard Login",
      selectLanguage: "Select Language",
      chooseLanguage: "Choose your preferred language",
      english: "English",
      spanish: "Español",
      mondaySaturday: "Mon-Sat: 8AM - 6PM",
      firstResponderDiscounts: "First Responder Discounts",
      available: "Available",
      meetMechanic: "Meet Your Mechanic",
      mechanicIntro1: "Hey, I'm",
      bookAppointment: "Book an Appointment",
      addressNote: "Please include full address with city, state, and zip code",
    },
    es: {
      hero: "Reparación Móvil Profesional de Autos",
      subtitle: "Vamos A Ti - Condado de Clark y Áreas Circundantes",
      bookNow: "Reservar Servicio",
      emergency: "Reparación de Emergencia",
      since: "Sirviendo a Las Vegas Desde 2021",
      services: "Nuestros Servicios",
      testimonials: "Lo Que Dicen Nuestros Clientes",
      schedule: "Programe Su Servicio",
      contact: "Información de Contacto",
      phone: "Teléfono",
      serviceArea: "Área de Servicio",
      hours: "Horario",
      scheduleSubtitle: "Complete el formulario y nos comunicaremos pronto",
      contactInfo: "Información de Contacto",
      fullName: "Nombre Completo",
      phoneNumber: "Número de Teléfono (ej. 7021234567)",
      serviceAddress: "Dirección del Servicio",
      vehicle: "Vehículo (Año, Marca, Modelo)",
      selectServices: "Seleccionar Servicios",
      estimatedTime: "Tiempo estimado",
      hoursText: "hora(s)",
      scheduleTitle: "Horario",
      selectTime: "Seleccionar Hora",
      additionalInfo: "Información Adicional",
      describeIssue: "Describa el problema o servicio necesario...",
      emergencyRepair: "Reparación de emergencia (prioridad)",
      emergencySubtext: "Priorizaremos su solicitud",
      firstResponder: "Descuento para primeros respondedores",
      discountSubtext: "Precios especiales disponibles",
      requestAppointment: "Solicitar Cita",
      submitting: "Enviando Solicitud...",
      selectOneService: "Por favor seleccione al menos un servicio",
      serviceAreaPayment: "Área de Servicio y Pago",
      clarkCounty: "Condado de Clark",
      clarkCountyDesc: "Sin tarifa de viaje para Las Vegas, North Las Vegas, Henderson y Boulder City",
      outsideClark: "Fuera del Condado de Clark",
      outsideClarkDesc: "Puede aplicar tarifa de transporte. Llame para cotización:",
      payment: "Pago:",
      paymentMethods: "Efectivo, Venmo, Zelle, Cash App",
      dashboardLogin: "Acceso al Panel",
      selectLanguage: "Seleccionar Idioma",
      chooseLanguage: "Elija su idioma preferido",
      english: "English",
      spanish: "Español",
      mondaySaturday: "Lun-Sáb: 8AM - 6PM",
      firstResponderDiscounts: "Descuentos para Primeros Respondedores",
      available: "Disponibles",
      meetMechanic: "Conoce a Tu Mecánico",
      mechanicIntro1: "Hola, soy",
      bookAppointment: "Reservar una Cita",
      addressNote: "Por favor incluya la dirección completa con ciudad, estado y código postal",
    }
  }), []);

  const t = translations[language];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100">
      <Toaster position="bottom-center" />

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500 max-w-md w-full p-6 sm:p-8 shadow-2xl rounded-lg">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-white">
              {t.selectLanguage}
            </h2>
            <p className="text-center text-gray-300 text-sm mb-6 sm:mb-8">{t.chooseLanguage}</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setLanguage("en");
                  setShowLanguageModal(false);
                }}
                className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl"
              >
                <div className="text-2xl mb-2">🇺🇸</div>
                <div className="text-sm">{t.english}</div>
              </button>
              <button
                onClick={() => {
                  setLanguage("es");
                  setShowLanguageModal(false);
                }}
                className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl"
              >
                <div className="text-2xl mb-2">🇲🇽</div>
                <div className="text-sm">{t.spanish}</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promo Banner - Mobile Optimized */}
      {showPromo && promoText && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 sm:py-3 px-3 sm:px-4 border-b border-blue-500 shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <p className="text-xs sm:text-sm font-semibold text-center flex-1 leading-tight">
              {promoText}
            </p>
            <button
              onClick={() => setShowPromo(false)}
              className="flex-shrink-0 text-blue-200 hover:text-white transition-colors text-lg font-bold"
              aria-label="Close promo"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hero Section - Mobile Optimized */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 border-b border-blue-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Logo & Text */}
            <div className="text-center lg:text-left">
              <div className="mb-6 sm:mb-8">
                <img
  src={
    settings.logoUrl
      ? getStorageUrl('business-assets', settings.logoUrl)
      : "onsite-auto/images/logo.png"
  }
  alt="Onsite Auto Repairs Logo"
  className="w-48 sm:w-56 md:w-64 mx-auto lg:mx-0 drop-shadow-2xl"
  loading="eager"
/>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-4 sm:mb-6 leading-tight text-white tracking-tight">
                {t.hero}
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {t.subtitle}
              </p>

              {/* Trust Badge */}
              <div className="mb-6 sm:mb-8">
                <div className="inline-flex items-center bg-slate-800/50 border border-blue-500/30 px-4 sm:px-5 py-2 sm:py-3 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-2 sm:mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs sm:text-sm font-medium text-gray-200">{t.since}</span>
                </div>
              </div>

              {/* CTA Buttons - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <a
                  href="#booking"
                  className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-500/50"
                >
                  {t.bookNow}
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <a
                  href={`tel:${settings.phone}`}
                  className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {t.emergency}
                </a>
              </div>
            </div>

            {/* Right: Contact & Hours - Mobile Optimized */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 p-6 sm:p-8 lg:p-10 shadow-2xl rounded-lg">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white flex items-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.contact}
              </h3>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Phone */}
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t.phone}</p>
                    <a href={`tel:${settings.phone}`} className="text-base sm:text-lg font-semibold text-white hover:text-blue-400 transition-colors">
                      {settings.phone}
                    </a>
                  </div>
                </div>

                {/* Service Area */}
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t.serviceArea}</p>
                    <p className="text-base sm:text-lg font-semibold text-white">Clark County, NV</p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t.hours}</p>
                    <p className="text-base sm:text-lg font-semibold text-white">{settings.hours}</p>
                  </div>
                </div>

                {/* Discount Badge */}
                <div className="pt-4 sm:pt-6 border-t border-blue-500/20">
                  <div className="flex items-center space-x-2 sm:space-x-3 bg-blue-600/10 border border-blue-500/30 p-3 sm:p-4 rounded-lg">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs sm:text-sm text-gray-200">
                      <span className="font-semibold text-white">{t.firstResponderDiscounts}</span> {t.available}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Your Mechanic - Mobile Optimized */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-800/30">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-center">
          {/* PHOTO */}
          <div className="flex justify-center order-1 md:order-none">
            <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20">
              <img
                src={
                  mechanics[currentMechanic]?.photo_url
                    ? getStorageUrl('mechanics', mechanics[currentMechanic].photo_url)
                    : "/images/placeholder-mechanic.jpg"
                }
                alt={mechanics[currentMechanic]?.name || "Mechanic"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* TEXT */}
          <div className="order-2 md:order-none">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-white">
              {t.meetMechanic}
            </h2>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-3 sm:mb-4">
              {t.mechanicIntro1}{" "}
              <span className="font-semibold text-blue-400">
                {mechanics[currentMechanic]?.name}
              </span>.{" "}
              {mechanics[currentMechanic]?.bio_short}
            </p>

            <p className="text-sm sm:text-base text-gray-400 leading-relaxed mb-4 sm:mb-6">
              {mechanics[currentMechanic]?.bio_long}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <a
                href="#booking"
                className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-600/40 transition-all text-sm sm:text-base"
              >
                {t.bookAppointment}
              </a>

              {/* Optional next/prev buttons */}
              {mechanics.length > 1 && (
                <div className="flex space-x-3 justify-center sm:justify-start">
                  <button
                    onClick={() =>
                      setCurrentMechanic(
                        (currentMechanic - 1 + mechanics.length) % mechanics.length
                      )
                    }
                    className="px-3 sm:px-4 py-2 bg-slate-700/50 text-white border border-blue-500/30 hover:bg-slate-600/50 rounded-lg transition-all text-sm"
                    aria-label="Previous mechanic"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() =>
                      setCurrentMechanic((currentMechanic + 1) % mechanics.length)
                    }
                    className="px-3 sm:px-4 py-2 bg-slate-700/50 text-white border border-blue-500/30 hover:bg-slate-600/50 rounded-lg transition-all text-sm"
                    aria-label="Next mechanic"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Mobile Optimized */}
      {testimonials.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20 bg-slate-800/30 border-y border-blue-900/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4">
                {t.testimonials}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto"></div>
            </div>

            <div className="relative">
              <div
                className={`bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 sm:p-8 lg:p-12 min-h-[320px] sm:min-h-[380px] flex flex-col justify-between shadow-2xl transition-all duration-500 ${
                  fade ? "opacity-100" : "opacity-0"
                }`}
              >
                <div>
                  <div className="flex justify-center mb-4 sm:mb-6">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  
                  {testimonials[currentTestimonial].image_url ? (
                    <div className="mb-4 sm:mb-6">
                      <img
                        src={getStorageUrl('testimonials', testimonials[currentTestimonial].image_url)}
                        alt="Review screenshot"
                        className="max-w-full max-h-[250px] sm:max-h-[350px] mx-auto border border-blue-500/30 shadow-xl object-contain rounded-lg"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <blockquote className="text-gray-300 text-base sm:text-lg lg:text-xl mb-4 sm:mb-6 text-center italic leading-relaxed">
                      "{testimonials[currentTestimonial].text}"
                    </blockquote>
                  )}
                </div>
                
                <div className="border-t border-blue-500/20 pt-4 sm:pt-6 text-center">
                  <p className="font-bold text-lg sm:text-xl text-white">
                    {testimonials[currentTestimonial].name}
                  </p>
                  {testimonials[currentTestimonial].service && (
                    <p className="text-xs sm:text-sm text-gray-400 mt-2 uppercase tracking-wider">
                      {testimonials[currentTestimonial].service}
                    </p>
                  )}
                </div>
              </div>

              {testimonials.length > 1 && (
                <>
                  {/* Dots */}
                  <div className="flex justify-center mt-6 sm:mt-8 space-x-2 sm:space-x-3">
                    {testimonials.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentTestimonial(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentTestimonial
                            ? "bg-blue-500 w-6 sm:w-8"
                            : "bg-slate-700 hover:bg-slate-600 w-2"
                        }`}
                        aria-label={`View testimonial ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Navigation Buttons - Hidden on mobile, visible on larger screens */}
                  <button
                    onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-16 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full items-center justify-center transition-all border border-blue-500/30 shadow-lg"
                    aria-label="Previous testimonial"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-16 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full items-center justify-center transition-all border border-blue-500/30 shadow-lg"
                    aria-label="Next testimonial"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Services Carousel - Mobile Optimized */}
      {services.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20 bg-slate-900/50 border-y border-blue-900/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4">
                {t.services}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto"></div>
            </div>

            <div className="relative">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 overflow-hidden shadow-2xl rounded-2xl">
                {services[currentService]?.image_url ? (
                  <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
                    <img
                      src={getStorageUrl('services', services[currentService].image_url)}
                      alt={services[currentService].title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                  </div>
                ) : (
                  <div className="h-64 sm:h-80 lg:h-96 bg-slate-700/50 flex items-center justify-center">
                    <span className="text-6xl sm:text-7xl lg:text-8xl">{services[currentService].icon || "🔧"}</span>
                  </div>
                )}
                
                <div className="p-6 sm:p-8 lg:p-12">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                    {services[currentService].title}
                  </h3>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed">
                    {services[currentService].description}
                  </p>
                </div>
              </div>

              {services.length > 1 && (
                <>
                  {/* Dots */}
                  <div className="flex justify-center mt-6 sm:mt-8 space-x-2 sm:space-x-3">
                    {services.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentService(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentService
                            ? "bg-blue-500 w-6 sm:w-8"
                            : "bg-slate-700 hover:bg-slate-600 w-2"
                        }`}
                        aria-label={`View service ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Navigation Buttons - Hidden on mobile */}
                  <button
                    onClick={() => setCurrentService((prev) => (prev - 1 + services.length) % services.length)}
                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-16 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full items-center justify-center transition-all border border-blue-500/30 shadow-lg"
                    aria-label="Previous service"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentService((prev) => (prev + 1) % services.length)}
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-16 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full items-center justify-center transition-all border border-blue-500/30 shadow-lg"
                    aria-label="Next service"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      

      {/* Booking Form - Mobile Optimized */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-800/30 border-y border-blue-900/30" id="booking">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 sm:mb-4">
              {t.schedule}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-300">{t.scheduleSubtitle}</p>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto mt-4 sm:mt-6"></div>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 shadow-2xl"
          >
            {/* Contact Information */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-lg sm:text-xl font-bold text-white pb-2 sm:pb-3 border-b border-blue-500/20 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t.contactInfo}
              </h3>
              
              <input
                type="text"
                name="name"
                placeholder={t.fullName}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/50 border border-blue-500/30 focus:border-blue-500 rounded-lg transition-colors text-white placeholder-gray-500 text-sm sm:text-base"
              />
              
              <input
                type="tel"
                name="phone"
                placeholder={t.phoneNumber}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/50 border border-blue-500/30 focus:border-blue-500 rounded-lg transition-colors text-white placeholder-gray-500 text-sm sm:text-base"
                pattern="\d{10}"
                inputMode="numeric"
              />

              
 <div>
  <input
    type="text"
    name="address"
    placeholder={t.serviceAddress}
    required
    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/50 border border-blue-500/30 focus:border-blue-500 rounded-lg transition-colors text-white placeholder-gray-500 text-sm sm:text-base"
  />
  <p className="text-xs text-gray-400 mt-1.5 ml-1">
    {t.addressNote}
  </p>
</div>

              <input
                type="text"
                name="vehicleInfo"
                placeholder={t.vehicle}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/50 border border-blue-500/30 focus:border-blue-500 rounded-lg transition-colors text-white placeholder-gray-500 text-sm sm:text-base"
              />
            </div>

            {/* Service Selection - Mobile Optimized */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-lg sm:text-xl font-bold text-white pb-2 sm:pb-3 border-b border-blue-500/20 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {t.selectServices}
              </h3>
              
              {/* Service Selection - Accordion Style */}
<div className="space-y-2">
  {categories.map((category) => {
    const categoryServices = serviceOptions.filter(s => s.categoryId === category.id);
    if (categoryServices.length === 0) return null;
    
    const isOpen = openCategory === category.id;
    
    return (
      <div key={category.id} className="bg-slate-900/30 border border-blue-500/20 rounded-lg overflow-hidden">
        {/* Category Header */}
        <button
          type="button"
          onClick={() => setOpenCategory(isOpen ? null : category.id)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-900/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{category.icon}</span>
            <span className="text-sm font-semibold text-white">
              {language === "es" ? category.name_es : category.name}
            </span>
            <span className="text-xs text-gray-400">
              ({categoryServices.length})
            </span>
          </div>
          <svg 
            className={`w-5 h-5 text-blue-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Category Services */}
        {isOpen && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border-t border-blue-500/20">
            {categoryServices.map((service) => (
              <label
                key={service.id}
                className={`cursor-pointer p-3 sm:p-4 rounded-lg border transition-all ${
                  selectedServices.includes(service.id)
                    ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20"
                    : "bg-slate-900/30 border-blue-500/20 hover:border-blue-500/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service.id)}
                  onChange={() => handleServiceToggle(service.id)}
                  className="hidden"
                />
                <div className="text-center">
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{service.icon}</div>
                  <div className="text-[10px] sm:text-xs font-medium text-white leading-tight">
                    {language === "es" ? service.nameEs : service.name}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  })}
  
  {/* Uncategorized services (if any) */}
  {serviceOptions.filter(s => !s.categoryId).length > 0 && (
    <div className="bg-slate-900/30 border border-blue-500/20 rounded-lg p-3">
      <p className="text-xs text-gray-400 mb-2">Other Services:</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {serviceOptions.filter(s => !s.categoryId).map((service) => (
          <label
            key={service.id}
            className={`cursor-pointer p-3 rounded-lg border transition-all ${
              selectedServices.includes(service.id)
                ? "bg-blue-600/20 border-blue-500"
                : "bg-slate-900/30 border-blue-500/20"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedServices.includes(service.id)}
              onChange={() => handleServiceToggle(service.id)}
              className="hidden"
            />
            <div className="text-center">
              <div className="text-xl mb-1">{service.icon}</div>
              <div className="text-[10px] font-medium text-white">
                {language === "es" ? service.nameEs : service.name}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )}
</div>
              
              {selectedServices.length > 0 && (
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3 sm:p-4 flex items-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs sm:text-sm text-gray-300">
                    {t.estimatedTime}: <span className="font-semibold text-white">{duration} {t.hoursText}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Date & Time - Mobile Optimized */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-lg sm:text-xl font-bold text-white pb-2 sm:pb-3 border-b border-blue-500/20 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t.scheduleTitle}
              </h3>

              <div className="calendar-wrapper bg-slate-900/50 p-3 sm:p-4 border border-blue-500/30 rounded-lg">
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
                  className="w-full"
                />
              </div>

              <input type="hidden" name="date" value={selectedDate || ""} />

              <select
                name="start_time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/50 border border-blue-500/30 focus:border-blue-500 rounded-lg transition-colors text-white text-sm sm:text-base"
              >
                <option value="">{t.selectTime}</option>
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {formatTo12Hour(t)}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Details - Mobile Optimized */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-lg sm:text-xl font-bold text-white pb-2 sm:pb-3 border-b border-blue-500/20 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.additionalInfo}
              </h3>

              <textarea
                name="notes"
                placeholder={t.describeIssue}
                rows="4"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/50 border border-blue-500/30 focus:border-blue-500 rounded-lg transition-colors resize-none text-white placeholder-gray-500 text-sm sm:text-base"
              />

              <div className="space-y-2 sm:space-y-3">
                <label className="flex items-start space-x-2 sm:space-x-3 cursor-pointer bg-red-900/10 border border-red-500/30 p-3 sm:p-4 rounded-lg hover:bg-red-900/20 transition-colors">
                  <input
                    type="checkbox"
                    name="isEmergency"
                    className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 accent-red-500 flex-shrink-0"
                  />
                  <div>
                    <span className="text-red-400 font-semibold text-xs sm:text-sm block">{t.emergencyRepair}</span>
                    <span className="text-red-400/70 text-[10px] sm:text-xs">{t.emergencySubtext}</span>
                  </div>
                </label>

                <label className="flex items-start space-x-2 sm:space-x-3 cursor-pointer bg-blue-900/10 border border-blue-500/30 p-3 sm:p-4 rounded-lg hover:bg-blue-900/20 transition-colors">
                  <input
                    type="checkbox"
                    name="veteranDiscount"
                    checked={isVeteran}
                    onChange={(e) => setIsVeteran(e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 accent-blue-500 flex-shrink-0"
                  />
                  <div>
                    <span className="text-gray-200 font-semibold text-xs sm:text-sm block">{t.firstResponder}</span>
                    <span className="text-gray-400 text-[10px] sm:text-xs">{t.discountSubtext}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || selectedServices.length === 0}
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-bold transition-all text-sm sm:text-base shadow-lg ${
                isSubmitting || selectedServices.length === 0
                  ? "bg-slate-700 cursor-not-allowed text-gray-500"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white hover:shadow-xl hover:shadow-blue-500/50"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 sm:mr-3"></div>
                  <span>{t.submitting}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span>{t.requestAppointment}</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>

            {selectedServices.length === 0 && (
              <p className="text-center text-xs sm:text-sm text-red-400 flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {t.selectOneService}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Service Area & Payment Info - Mobile Optimized */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-900/50 border-t border-blue-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 sm:p-8 lg:p-12 shadow-2xl">
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                {t.serviceAreaPayment}
              </h3>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-slate-900/50 border border-blue-500/20 rounded-xl p-4 sm:p-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-base sm:text-lg text-white mb-2">{t.clarkCounty}</p>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                      {t.clarkCountyDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-blue-500/20 rounded-xl p-4 sm:p-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-base sm:text-lg text-white mb-2">{t.outsideClark}</p>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                      {t.outsideClarkDesc} <a href={`tel:${settings.phone}`} className="text-blue-400 hover:text-blue-300 font-semibold">{settings.phone}</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 bg-slate-900/50 border border-blue-500/20 rounded-xl p-4 sm:p-6 text-center">
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm sm:text-base lg:text-lg">
                  <span className="font-bold text-white">{t.payment}</span> <span className="text-gray-300">{t.paymentMethods}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Link */}
      <div className="text-center py-6 sm:py-8 bg-slate-900/30">
        <Link
          href="/login"
          className="inline-flex items-center text-gray-400 hover:text-blue-400 font-medium transition-colors duration-200 text-xs sm:text-sm"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t.dashboardLogin}
        </Link>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .calendar-wrapper .react-calendar {
          border: none !important;
          background: transparent !important;
          font-family: inherit;
          width: 100%;
          color: white;
        }
        
        .calendar-wrapper .react-calendar__tile {
          border: 1px solid rgba(59, 130, 246, 0.2) !important;
          background: rgba(15, 23, 42, 0.5) !important;
          padding: 8px !important;
          transition: all 0.15s !important;
          color: #94a3b8;
          border-radius: 0.5rem !important;
          font-size: 13px;
        }
        
        @media (min-width: 640px) {
          .calendar-wrapper .react-calendar__tile {
            padding: 10px !important;
            font-size: 14px;
          }
        }
        
        .calendar-wrapper .react-calendar__tile:hover:enabled {
          background: rgba(59, 130, 246, 0.1) !important;
          border-color: rgba(59, 130, 246, 0.4) !important;
          color: white;
        }
        
        .calendar-wrapper .react-calendar__tile--now {
          background: rgba(59, 130, 246, 0.15) !important;
          font-weight: 600 !important;
          color: white;
          border-color: rgba(59, 130, 246, 0.3) !important;
        }
        
        .calendar-wrapper .available-date-auto {
          background: rgba(59, 130, 246, 0.2) !important;
          color: white !important;
          font-weight: 500 !important;
          border: 1px solid rgba(59, 130, 246, 0.4) !important;
        }
        
        .calendar-wrapper .selected-date-auto {
          background: linear-gradient(to bottom right, #3b82f6, #2563eb) !important;
          color: white !important;
          font-weight: 600 !important;
          border: 1px solid #3b82f6 !important;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
        }
        
        .calendar-wrapper .react-calendar__tile:disabled {
          background: rgba(15, 23, 42, 0.3) !important;
          color: #475569 !important;
          border-color: rgba(59, 130, 246, 0.1) !important;
        }
        
        .calendar-wrapper .react-calendar__navigation {
          background: rgba(30, 41, 59, 0.5) !important;
          margin-bottom: 10px !important;
          border: 1px solid rgba(59, 130, 246, 0.2) !important;
          border-radius: 0.5rem !important;
        }
        
        .calendar-wrapper .react-calendar__navigation button {
          color: white !important;
          font-weight: 500 !important;
          font-size: 14px;
        }
        
        @media (min-width: 640px) {
          .calendar-wrapper .react-calendar__navigation button {
            font-size: 16px;
          }
        }
        
        .calendar-wrapper .react-calendar__navigation button:hover {
          background: rgba(59, 130, 246, 0.2) !important;
        }
        
        .calendar-wrapper .react-calendar__month-view__weekdays {
          font-weight: 600 !important;
          color: #94a3b8 !important;
          font-size: 11px;
        }
        
        @media (min-width: 640px) {
          .calendar-wrapper .react-calendar__month-view__weekdays {
            font-size: 13px;
          }
        }

        .calendar-wrapper .react-calendar__month-view__weekdays__weekday {
          color: white !important;
          border-bottom: 1px solid rgba(59, 130, 246, 0.2) !important;
          padding-bottom: 4px !important;
        }
        
        @media (min-width: 640px) {
          .calendar-wrapper .react-calendar__month-view__weekdays__weekday {
            padding-bottom: 6px !important;
          }
        }
      `}</style>
    </main>
  );
}