"use client";

import toast, { Toaster } from "react-hot-toast";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/utils/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import "react-calendar/dist/Calendar.css";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Figtree, Zilla_Slab } from "next/font/google";
import s from "@/styles/Home.module.css";

const figtree = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-figtree" });
const zilla = Zilla_Slab({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-zilla" });

const Calendar = dynamic(() => import("react-calendar"), {
  ssr: false,
  loading: () => <div style={{ height: 320 }} />,
});

// "YYYY-MM-DD" in the visitor's local time zone
const toLocalISO = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const fromISO = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Open start times on a date for a job of `duration` hours
async function fetchOpenTimes(date, duration) {
  const { data: availability, error: availErr } = await supabase
    .from("availability").select("start_time, end_time").eq("date", date).single();
  if (availErr || !availability) return [];

  const startHour = parseInt(availability.start_time.split(":")[0], 10);
  const endHour = parseInt(availability.end_time.split(":")[0], 10);

  const { data: booked, error: bookedErr } = await supabase.rpc("get_booked_slots", { p_date: date });
  if (bookedErr) {
    console.error("Booking RPC error:", bookedErr);
    return [];
  }

  const bookedRanges = (booked || []).map(({ start_time, end_time }) => ({
    start: parseInt(String(start_time).split(":")[0], 10),
    end: parseInt(String(end_time).split(":")[0], 10),
  }));

  const now = new Date();
  const isToday = date === toLocalISO(now);
  const open = [];
  for (let hour = startHour; hour <= endHour - duration; hour++) {
    if (isToday && hour <= now.getHours()) continue;
    const overlaps = bookedRanges.some((r) => hour < r.end && hour + duration > r.start);
    if (!overlaps) open.push(`${String(hour).padStart(2, "0")}:00`);
  }
  return open;
}

// Copied word for word from Isma's Google reviews. "…" marks where Google cut the text off.
const googleReviews = [
  { name: "Anthony Wilson", text: "Honest and dependable!!! Great customer service and always gets the job done right! I highly recommend him!!!" },
  { name: "anielca mattos", text: "Ismael is very knowledgeable, great, and sufficient. I was extremely pleased with the service done on my car! Will highly recommend!" },
  { name: "Vanessa Zepeta", text: "Explains the whole process very well just to inform and keep the customer at ease about what he will be doing to fix the car. He is a very efficient mechanic with affordable prices! He also does free quotes so I was able to know what my car needed and how much it would come out to get it fixed! …" },
  { name: "Sebastian Ornelas", text: "Solid 10/10, cheap prices, very communicative, and job was done perfectly. This won’t be the last time i’ll be looking towards onsite repairs …" },
  { name: "Trillyyy 03", text: "Sometimes you need more than just a mechanic sometimes you need a friend🤝. Outstanding service, will definitely be coming back. …" },
  { name: "Reteco 13", text: "Great service. Very RELIABLE. ALWAYS ON TIME and very nice definitely recommend 👍 …" },
  { name: "Luis Detrinidad", text: "Very reliable, cheap, super friendly …" },
];

const copy = {
  en: {
    book: "Book a time",
    call: "Call",
    realJob: "Real job · Las Vegas",
    heroTitle: "Auto repair wherever you're parked.",
    heroText: "Isma comes to your home or work in Las Vegas, Henderson and North Las Vegas. No tow, no waiting room.",
    seeTimes: "See open times",
    since: "Since 2021",
    spanish: "Se habla español",
    nextTimes: "Next open times",
    nextTimesSub: "Pick one, then tell us about your car.",
    today: "Today",
    tomorrow: "Tomorrow",
    pickTime: "Pick a time",
    bookAt: (day, time) => `Book ${day}, ${time}`,
    noTimes: "No open times are posted right now. Call or text",
    loadingTimes: "Checking open times…",
    fixesTitle: "What Isma fixes",
    fixesLead: "Prices are where the job starts. You'll know the total before any work begins.",
    from: "from",
    callForPrice: "Call for price",
    hr: "hr",
    hrs: "hrs",
    add: "Add",
    added: "Added",
    showAll: (n) => `Show all ${n} services`,
    showLess: "Show fewer services",
    howTitle: "How it works",
    steps: [
      ["Book a time", "Tell us the car, the problem and where it'll be parked."],
      ["Isma shows up", "With the tools and parts. You get a text when he's on the way."],
      ["Pay in two halves", "Half before he starts, half when it's done. Cash, Venmo, Zelle or Cash App."],
    ],
    meet: (name) => `Meet ${name}`,
    reviewsTitle: "What customers say",
    reviewsLead: "Straight from his Google page, word for word.",
    googleReview: "Google review",
    moreReviews: "Show more reviews",
    fiveStars: "5-star Google reviews",
    bookTitle: "Book your repair",
    bookLead: "Takes about two minutes. Isma confirms by text.",
    deposit: "A $50 deposit holds your time.",
    depositText: "It's charged today and comes off your final bill.",
    you: "About you",
    name: "Full name",
    phone: "Phone number",
    phoneHint: "10 digits, like 7021234567",
    address: "Where's the car?",
    addressHint: "Street, city and zip",
    vehicle: "Year, make and model",
    whatNeeds: "What does it need?",
    pickServices: "Pick at least one service.",
    estTime: "Estimated time",
    when: "Pick a day and time",
    pickDayFirst: "Pick a highlighted day to see open times.",
    noTimesDay: "No open times that day for this job. Try another day or call",
    anythingElse: "Anything else?",
    notesPlaceholder: "What's going on with the car? Noises, warning lights, anything Isma should know.",
    urgent: "It's urgent",
    urgentSub: "Isma will try to fit you in sooner.",
    responder: "I'm a first responder or veteran",
    responderSub: "Ask Isma about special pricing.",
    submit: "Request this time",
    submitPay: "Pay $50 deposit and book",
    submitting: "Sending…",
    paying: "Opening payment…",
    needTime: "Pick a day and time first.",
    timeDropped: (x) => `${x} doesn't fit this job anymore. Pick another time.`,
    success: "Request sent. Isma will text you to confirm.",
    failure: "That didn't go through. Try again, or call",
    faqTitle: "Questions people ask",
    faqLead: "Anything else? Call or text",
    faq: [
      ["Do you really come to my house?", "Yes. Isma works in your driveway, parking lot or at your job, wherever the car is."],
      ["Is there a travel fee?", "Not in Las Vegas, Henderson or North Las Vegas. Outside Clark County, call for a travel quote."],
      ["How do I pay?", "Half before the job starts and half when it's done. Cash, Venmo, Zelle or Cash App."],
      ["Do you speak Spanish?", "Yes. Isma works with customers in English and Spanish."],
    ],
    noFee: "No travel fee",
    outside: "Outside Clark County? Call for a travel quote:",
    pay: "Ways to pay",
    payTerms: "Half before the job, half when it's done.",
    cash: "Cash",
    teamLogin: "Team login",
  },
  es: {
    book: "Agendar",
    call: "Llamar",
    realJob: "Trabajo real · Las Vegas",
    heroTitle: "Reparación de autos donde estés estacionado.",
    heroText: "Isma va a tu casa o trabajo en Las Vegas, Henderson y North Las Vegas. Sin grúa, sin sala de espera.",
    seeTimes: "Ver horarios disponibles",
    since: "Desde 2021",
    spanish: "Se habla español",
    nextTimes: "Próximos horarios",
    nextTimesSub: "Elige uno y luego cuéntanos de tu carro.",
    today: "Hoy",
    tomorrow: "Mañana",
    pickTime: "Elige un horario",
    bookAt: (day, time) => `Reservar ${day}, ${time}`,
    noTimes: "No hay horarios publicados ahora. Llama o manda texto al",
    loadingTimes: "Buscando horarios…",
    fixesTitle: "Lo que Isma arregla",
    fixesLead: "Los precios son desde. Sabrás el total antes de empezar el trabajo.",
    from: "desde",
    callForPrice: "Llama para precio",
    hr: "h",
    hrs: "h",
    add: "Agregar",
    added: "Agregado",
    showAll: (n) => `Ver los ${n} servicios`,
    showLess: "Ver menos servicios",
    howTitle: "Cómo funciona",
    steps: [
      ["Reserva un horario", "Dinos el carro, el problema y dónde estará."],
      ["Isma llega a ti", "Con herramientas y piezas. Recibes un texto cuando va en camino."],
      ["Paga en dos partes", "Mitad antes de empezar, mitad al terminar. Efectivo, Venmo, Zelle o Cash App."],
    ],
    meet: (name) => `Conoce a ${name}`,
    reviewsTitle: "Lo que dicen los clientes",
    reviewsLead: "Directo de su página de Google, tal cual.",
    googleReview: "Reseña de Google",
    moreReviews: "Ver más reseñas",
    fiveStars: "Reseñas de 5 estrellas en Google",
    bookTitle: "Reserva tu reparación",
    bookLead: "Toma unos dos minutos. Isma confirma por texto.",
    deposit: "Un depósito de $50 aparta tu horario.",
    depositText: "Se cobra hoy y se descuenta de tu cuenta final.",
    you: "Tus datos",
    name: "Nombre completo",
    phone: "Teléfono",
    phoneHint: "10 dígitos, como 7021234567",
    address: "¿Dónde está el carro?",
    addressHint: "Calle, ciudad y código postal",
    vehicle: "Año, marca y modelo",
    whatNeeds: "¿Qué necesita?",
    pickServices: "Elige al menos un servicio.",
    estTime: "Tiempo estimado",
    when: "Elige día y hora",
    pickDayFirst: "Elige un día marcado para ver horarios.",
    noTimesDay: "No hay horarios ese día para este trabajo. Prueba otro día o llama al",
    anythingElse: "¿Algo más?",
    notesPlaceholder: "¿Qué le pasa al carro? Ruidos, luces de alerta, lo que Isma deba saber.",
    urgent: "Es urgente",
    urgentSub: "Isma intentará atenderte antes.",
    responder: "Soy primer respondiente o veterano",
    responderSub: "Pregúntale a Isma por precio especial.",
    submit: "Solicitar este horario",
    submitPay: "Pagar depósito de $50 y reservar",
    submitting: "Enviando…",
    paying: "Abriendo pago…",
    needTime: "Primero elige día y hora.",
    timeDropped: (x) => `${x} ya no alcanza para este trabajo. Elige otro horario.`,
    success: "Solicitud enviada. Isma te mandará un texto para confirmar.",
    failure: "No se pudo enviar. Intenta de nuevo o llama al",
    faqTitle: "Preguntas frecuentes",
    faqLead: "¿Algo más? Llama o manda texto al",
    faq: [
      ["¿De verdad vienes a mi casa?", "Sí. Isma trabaja en tu entrada, estacionamiento o trabajo, donde esté el carro."],
      ["¿Cobran por el traslado?", "No en Las Vegas, Henderson ni North Las Vegas. Fuera del condado de Clark, llama para una cotización."],
      ["¿Cómo pago?", "Mitad antes de empezar y mitad al terminar. Efectivo, Venmo, Zelle o Cash App."],
      ["¿Hablan español?", "Sí. Isma atiende en inglés y en español."],
    ],
    noFee: "Sin cargo de traslado",
    outside: "¿Fuera del condado de Clark? Llama para una cotización:",
    pay: "Formas de pago",
    payTerms: "Mitad antes del trabajo, mitad al terminar.",
    cash: "Efectivo",
    teamLogin: "Acceso del equipo",
  },
};

export default function Home() {
  const formRef = useRef();
  const [language, setLanguage] = useState("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [duration, setDuration] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [time, setTime] = useState("");
  const timeRef = useRef("");
  const [droppedTime, setDroppedTime] = useState("");
  const [timeOptions, setTimeOptions] = useState([]);
  const [timesLoading, setTimesLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [nextOpenings, setNextOpenings] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isVeteran, setIsVeteran] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [promoText, setPromoText] = useState("");
  const [openCategories, setOpenCategories] = useState(new Set());
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const squareEnabled = process.env.NEXT_PUBLIC_SQUARE_ENABLED === "true";

  const [settings, setSettings] = useState({
    businessName: "Isma's OnSite Auto Repair",
    phone: "(702) 801-7210",
    hours: "Mon-Sat: 8AM - 6PM",
  });

  const t = copy[language];
  const telHref = `tel:+1${settings.phone.replace(/\D/g, "").slice(-10)}`;

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
          { data: categoriesData },
        ] = await Promise.all([
          supabase.from("services").select("*").order("created_at", { ascending: true }),
          supabase.from("settings").select("*").maybeSingle(),
          supabase.from("testimonials").select("*").order("created_at", { ascending: false }),
          supabase.from("mechanics").select("*").order("created_at", { ascending: true }),
          supabase.from("availability").select("date"),
          supabase.from("service_categories").select("*").order("display_order", { ascending: true }),
        ]);

        if (categoriesData) setCategories(categoriesData);

        if (servicesData?.length > 0) {
          setServiceOptions(servicesData.map((service) => ({
            id: service.id,
            name: service.title,
            nameEs: service.title_es || service.title,
            duration: service.duration || 1,
            price: service.price,
            categoryId: service.category_id,
          })));
        }

        if (settingsData) {
          setSettings({
            businessName: settingsData.business_name || "Isma's OnSite Auto Repair",
            phone: settingsData.phone || "(702) 801-7210",
            hours: settingsData.hours || "Mon-Sat: 8AM - 6PM",
          });
          if (settingsData.promo_enabled && settingsData.promo_text) {
            setPromoText(settingsData.promo_text);
            setShowPromo(true);
          }
        }

        if (testimonialsData) setTestimonials(testimonialsData);

        setMechanics(mechanicsData?.length > 0 ? mechanicsData : [{
          name: "Isma",
          bio_short: "Isma has been fixing cars across the Las Vegas valley since 2021.",
          bio_long: "He brings the tools and parts to you, and he'll tell you what's wrong before he touches anything.",
          photo_url: null,
        }]);

        if (availabilityData) {
          const normalized = [...new Set(
            availabilityData.map((d) => new Date(d.date).toISOString().split("T")[0])
          )].sort();
          setAvailableDates(normalized);
        } else {
          setNextOpenings([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setNextOpenings([]);
      }
    };
    fetchAllData();
  }, []);

  // The next three days that still have a one-hour opening
  useEffect(() => {
    if (availableDates.length === 0) return;
    let cancelled = false;
    const today = toLocalISO(new Date());
    const upcoming = availableDates.filter((d) => d >= today).slice(0, 10);
    (async () => {
      const found = [];
      for (const date of upcoming) {
        const times = await fetchOpenTimes(date, 1);
        if (times.length > 0) found.push({ date, times: times.slice(0, 4) });
        if (found.length === 3) break;
      }
      if (!cancelled) setNextOpenings(found);
    })();
    return () => { cancelled = true; };
  }, [availableDates]);

  useEffect(() => {
    const total = selectedServices.reduce((sum, serviceId) => {
      const service = serviceOptions.find((x) => x.id === serviceId);
      return sum + (service?.duration || 1);
    }, 0);
    setDuration(total || 1);
  }, [selectedServices, serviceOptions]);

  useEffect(() => {
    if (!selectedDate) { setTimeOptions([]); return; }
    let cancelled = false;
    setTimesLoading(true);
    fetchOpenTimes(selectedDate, duration)
      .catch((error) => { console.error("Error loading times:", error); return []; })
      .then((open) => {
        if (cancelled) return;
        setTimeOptions(open);
        const current = timeRef.current;
        if (current && !open.includes(current)) {
          setTime("");
          setDroppedTime(current);
        }
        setTimesLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedDate, duration]);

  useEffect(() => {
    timeRef.current = time;
    if (time) setDroppedTime("");
  }, [time]);

  useEffect(() => {
    if (categories.length > 0 && openCategories.size === 0) {
      setOpenCategories(new Set([categories[0].id]));
    }
  }, [categories]);

  const formatTime = useCallback((timeStr) => {
    const hour = parseInt(timeStr.split(":")[0], 10);
    const suffix = hour >= 12 ? "pm" : "am";
    return `${hour % 12 === 0 ? 12 : hour % 12}:00 ${suffix}`;
  }, []);

  const dayLabel = useCallback((iso) => {
    const date = fromISO(iso);
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const locale = language === "es" ? "es-US" : "en-US";
    const weekday = date.toLocaleDateString(locale, { weekday: "short" });
    const monthDay = date.toLocaleDateString(locale, { month: "short", day: "numeric" });
    if (iso === toLocalISO(today)) return { main: t.today, sub: `${weekday} ${date.getDate()}` };
    if (iso === toLocalISO(tomorrow)) return { main: t.tomorrow, sub: `${weekday} ${date.getDate()}` };
    return { main: weekday.charAt(0).toUpperCase() + weekday.slice(1), sub: monthDay };
  }, [language, t]);

  const extractPrice = useCallback((priceStr) => {
    if (!priceStr && priceStr !== 0) return null;
    const str = String(priceStr);
    const match = str.match(/\$(\d+(?:\.\d+)?)/);
    if (match) return `$${match[1]}`;
    if (/^\d+(\.\d+)?$/.test(str)) return `$${str}`;
    return null;
  }, []);

  const hoursText = (n) => `${n} ${n === 1 ? t.hr : t.hrs}`;
  const serviceName = (service) => (language === "es" ? service.nameEs : service.name);

  const toggleCategory = useCallback((id) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleServiceToggle = useCallback((serviceId) => {
    setFormError("");
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  }, []);

  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({ block: "start" });
  };

  // Picking a chip in "Next open times" pre-fills the form's day and time
  const pickOpening = (date, slot) => {
    setFormError("");
    setSelectedDate(date);
    setTime(slot);
  };

  // Services with no category still show up in the form
  const categoryGroups = useMemo(() => {
    const known = new Set(categories.map((c) => c.id));
    const groups = categories
      .map((c) => ({ id: c.id, name: language === "es" ? c.name_es || c.name : c.name, items: serviceOptions.filter((x) => x.categoryId === c.id) }))
      .filter((g) => g.items.length > 0);
    const loose = serviceOptions.filter((x) => !known.has(x.categoryId));
    if (loose.length > 0) groups.push({ id: "other", name: language === "es" ? "Otros servicios" : "Other services", items: loose });
    return groups;
  }, [categories, serviceOptions, language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (selectedServices.length === 0) { setFormError(t.pickServices); return; }
    if (!selectedDate || !time) { setFormError(t.needTime); return; }
    setFormError("");
    setIsSubmitting(true);

    const form = formRef.current;
    const data = new FormData(form);
    const services = selectedServices.map((id) => {
      const service = serviceOptions.find((x) => x.id === id);
      return service?.name || id;
    }).join(", ");

    const payload = {
      id: uuidv4(),
      name: data.get("name"),
      phone: data.get("phone"),
      address: data.get("address"),
      vehicle_info: data.get("vehicleInfo"),
      services,
      date: selectedDate,
      start_time: time,
      notes: data.get("notes"),
      duration,
      is_emergency: isEmergency,
      veteran_discount: isVeteran,
    };

    try {
      if (squareEnabled) {
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

      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Booking failed");

      toast.success(t.success, { duration: 4000, position: "bottom-center" });
      formRef.current.reset();
      setSelectedServices([]);
      setSelectedDate(null);
      setTime("");
      setIsVeteran(false);
      setIsEmergency(false);
      setNextOpenings(null);
      setAvailableDates((d) => [...d]);
    } catch (err) {
      console.error("Error during booking:", err.message);
      toast.error(`${t.failure} ${settings.phone}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickedOpening = nextOpenings?.find((o) => o.date === selectedDate && o.times.includes(time));
  const visibleServices = showAllServices ? serviceOptions : serviceOptions.slice(0, 6);
  const mechanic = mechanics[0];
  const mechanicPhoto = mechanic?.photo_url ? getStorageUrl("mechanics", mechanic.photo_url) : null;
  // Google reviews first, then any saved in the dashboard that aren't already shown
  const allReviews = [
    ...googleReviews.map((r) => ({ key: `g-${r.name}`, name: r.name, text: r.text, rating: 5 })),
    ...testimonials
      .filter((r) => !googleReviews.some((g) => g.name.toLowerCase() === String(r.name || "").toLowerCase()))
      .map((r) => ({
        key: r.id || r.name,
        name: r.name,
        text: r.text,
        rating: Math.min(5, Math.max(1, r.rating || 5)),
        service: r.service,
        image: r.image_url ? getStorageUrl("testimonials", r.image_url) : null,
      })),
  ];
  const selectedList = selectedServices.map((id) => serviceOptions.find((x) => x.id === id)).filter(Boolean);

  return (
    <main className={`${s.page} ${figtree.variable} ${zilla.variable}`} lang={language}>
      <Toaster position="bottom-center" />

      {showPromo && promoText && (
        <div className={s.promo}>
          <div className={s.wrap}>
            <p>{promoText}</p>
            <button type="button" onClick={() => setShowPromo(false)} aria-label="Dismiss">×</button>
          </div>
        </div>
      )}

      <header className={s.top}>
        <div className={s.wrap}>
          <a href="#" className={s.brand}>{settings.businessName}</a>
          <div className={s.topRight}>
            <a href={telHref} className={s.topPhone}>{settings.phone}</a>
            <div className={s.lang} role="group" aria-label="Language">
              <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
              <button type="button" aria-pressed={language === "es"} onClick={() => setLanguage("es")}>ES</button>
            </div>
            <a href="#booking" className={s.topBook}>{t.book}</a>
          </div>
        </div>
      </header>

      <section className={s.hero}>
        <div className={s.heroGrid}>
          <div className={s.heroPhoto}>
            <img src="/images/hero-carport.jpg" alt="Isma replacing brakes on a car in an apartment carport" fetchPriority="high" />
            <span className={s.photoTag}>{t.realJob}</span>
          </div>
          <div className={`${s.heroCopy} ${s.wrap}`}>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroText}</p>
            <div className={s.ctas}>
              <a href="#times" className={`${s.btn} ${s.btnBook}`}>{t.seeTimes}</a>
              <a href={telHref} className={`${s.btn} ${s.btnCall}`}>{settings.phone}</a>
            </div>
            <div className={s.trust}>
              <a href="#reviews"><span className={s.stars}>★★★★★</span> {t.fiveStars}</a>
              <span>{t.since}</span>
              <span>{t.spanish}</span>
              <span>{settings.hours}</span>
            </div>
          </div>
        </div>
      </section>

      <div className={s.slotsBand}>
        <div className={s.wrap}>
          <div className={s.slots} id="times">
            <header>
              <h2 className={s.serif}>{t.nextTimes}</h2>
              <p className={s.sub}>{t.nextTimesSub}</p>
            </header>
            {nextOpenings === null && <p className={s.slotsEmpty}>{t.loadingTimes}</p>}
            {nextOpenings?.length === 0 && (
              <p className={s.slotsEmpty}>{t.noTimes} <a href={telHref}>{settings.phone}</a>.</p>
            )}
            {nextOpenings?.map(({ date, times }) => {
              const label = dayLabel(date);
              return (
                <div className={s.day} key={date}>
                  <div className={s.dayLabel}>{label.main}<span>{label.sub}</span></div>
                  <div className={s.chips}>
                    {times.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        className={s.chip}
                        aria-pressed={selectedDate === date && time === slot}
                        onClick={() => pickOpening(date, slot)}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {nextOpenings?.length > 0 && (
              <button type="button" className={`${s.btn} ${s.btnBook}`} onClick={scrollToBooking}>
                {pickedOpening ? t.bookAt(dayLabel(selectedDate).main, formatTime(time)) : t.pickTime}
              </button>
            )}
          </div>
        </div>
      </div>

      {serviceOptions.length > 0 && (
        <section className={s.sec} id="services">
          <div className={`${s.wrap} ${s.two}`}>
            <div>
              <h2>{t.fixesTitle}</h2>
              <p className={s.lead}>{t.fixesLead}</p>
            </div>
            <div>
              <ul className={s.svc}>
                {visibleServices.map((service) => {
                  const price = extractPrice(service.price);
                  const selected = selectedServices.includes(service.id);
                  return (
                    <li key={service.id}>
                      <button type="button" className={s.svcRow} aria-pressed={selected} onClick={() => handleServiceToggle(service.id)}>
                        <span className={s.svcName}>{serviceName(service)}</span>
                        <span className={s.svcPrice}>{price ? `${t.from} ${price}` : t.callForPrice}</span>
                        <span className={s.svcMeta}>~{hoursText(service.duration)}</span>
                        <span className={s.svcAdd}>{selected ? `✓ ${t.added}` : `+ ${t.add}`}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {serviceOptions.length > 6 && (
                <button type="button" className={s.more} onClick={() => setShowAllServices((v) => !v)}>
                  {showAllServices ? t.showLess : t.showAll(serviceOptions.length)}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <section className={`${s.sec} ${s.alt}`}>
        <div className={`${s.wrap} ${s.two}`}>
          <h2>{t.howTitle}</h2>
          <ol className={s.steps}>
            {t.steps.map(([title, text]) => (
              <li key={title}><div><b>{title}</b><span>{text}</span></div></li>
            ))}
          </ol>
        </div>
      </section>

      {mechanic && (
        <section className={s.sec} id="mechanic">
          <div className={`${s.wrap} ${mechanicPhoto ? s.isma : ""}`}>
            {mechanicPhoto && (
              <div className={s.ismaPhoto}><img src={mechanicPhoto} alt={mechanic.name} loading="lazy" /></div>
            )}
            <div>
              <h2>{t.meet(mechanic.name)}</h2>
              {mechanic.bio_short && <p>{mechanic.bio_short}</p>}
              {mechanic.bio_long && <p>{mechanic.bio_long}</p>}
            </div>
          </div>
        </section>
      )}

      <section className={`${s.sec} ${s.alt}`} id="reviews">
        <div className={s.wrap}>
          <h2>{t.reviewsTitle}</h2>
          <p className={s.lead}>{t.reviewsLead}</p>
          <div className={s.reviews}>
            {(showAllReviews ? allReviews : allReviews.slice(0, 4)).map((review) => (
              <figure className={s.review} key={review.key}>
                <span className={s.stars} aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}</span>
                {review.image ? (
                  <img src={review.image} alt={`Review from ${review.name}`} loading="lazy" />
                ) : (
                  <blockquote>“{review.text}”</blockquote>
                )}
                <figcaption>
                  {review.name}
                  <span>{review.service || t.googleReview}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          {!showAllReviews && allReviews.length > 4 && (
            <button type="button" className={s.more} onClick={() => setShowAllReviews(true)}>{t.moreReviews}</button>
          )}
        </div>
      </section>

      <section className={s.sec} id="booking">
        <div className={`${s.wrap} ${s.bookGrid}`}>
          <div>
            <h2>{t.bookTitle}</h2>
            <p className={s.lead}>{t.bookLead}</p>
            {squareEnabled && <p className={s.notice}><b>{t.deposit}</b> {t.depositText}</p>}
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className={s.form}>
            <fieldset className={s.fieldset}>
              <legend className={s.legend}>{t.you}</legend>
              <div className={s.row2}>
                <label className={s.label}>{t.name}
                  <input className={s.input} type="text" name="name" autoComplete="name" required />
                </label>
                <label className={s.label}>{t.phone}
                  <input className={s.input} type="tel" name="phone" autoComplete="tel-national" inputMode="numeric" pattern="\d{10}" title={t.phoneHint} required />
                  <span className={s.hint}>{t.phoneHint}</span>
                </label>
              </div>
              <label className={s.label}>{t.address}
                <input className={s.input} type="text" name="address" autoComplete="street-address" required />
                <span className={s.hint}>{t.addressHint}</span>
              </label>
              <label className={s.label}>{t.vehicle}
                <input className={s.input} type="text" name="vehicleInfo" placeholder="2014 Honda Civic" required />
              </label>
            </fieldset>

            <fieldset className={s.fieldset}>
              <legend className={s.legend}>{t.whatNeeds}</legend>
              <div>
                {categoryGroups.map((group) => {
                  const isOpen = openCategories.has(group.id);
                  const count = group.items.filter((x) => selectedServices.includes(x.id)).length;
                  return (
                    <div className={s.cat} key={group.id}>
                      <button type="button" className={s.catHead} aria-expanded={isOpen} onClick={() => toggleCategory(group.id)}>
                        <span>{group.name}{count > 0 && <span className={s.count}>{count}</span>}</span>
                      </button>
                      {isOpen && (
                        <div className={s.picks}>
                          {group.items.map((service) => {
                            const price = extractPrice(service.price);
                            return (
                              <button type="button" key={service.id} className={s.pick} aria-pressed={selectedServices.includes(service.id)} onClick={() => handleServiceToggle(service.id)}>
                                <span>{serviceName(service)}</span>
                                <span className={s.pickPrice}>{price || ""}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedList.length > 0 && (
                <div className={s.summary}>
                  {selectedList.map((service) => (
                    <div key={service.id}>
                      <span>{serviceName(service)}</span>
                      <span>{extractPrice(service.price) || `~${hoursText(service.duration)}`}</span>
                    </div>
                  ))}
                  <div className={s.total}><span>{t.estTime}</span><span>{hoursText(duration)}</span></div>
                </div>
              )}
            </fieldset>

            <fieldset className={s.fieldset}>
              <legend className={s.legend}>{t.when}</legend>
              <div className={s.calendar}>
                <Calendar
                  value={selectedDate ? fromISO(selectedDate) : null}
                  minDate={new Date()}
                  locale={language === "es" ? "es-US" : "en-US"}
                  calendarType="US"
                  onChange={(date) => { setFormError(""); setDroppedTime(""); setSelectedDate(toLocalISO(date)); }}
                  tileDisabled={({ date, view }) => view === "month" && !availableDates.includes(toLocalISO(date))}
                  tileClassName={({ date, view }) => {
                    if (view !== "month") return null;
                    const iso = toLocalISO(date);
                    if (iso === selectedDate) return "picked-day";
                    return availableDates.includes(iso) ? "open-day" : null;
                  }}
                />
              </div>
              {!selectedDate && <p className={s.hint}>{t.pickDayFirst}</p>}
              {droppedTime && !time && <p className={s.formError} role="status">{t.timeDropped(formatTime(droppedTime))}</p>}
              {selectedDate && !timesLoading && timeOptions.length === 0 && (
                <p className={s.hint}>{t.noTimesDay} <a href={telHref}>{settings.phone}</a>.</p>
              )}
              {selectedDate && timeOptions.length > 0 && (
                <div className={s.chips} role="group" aria-label={t.when}>
                  {timeOptions.map((slot) => (
                    <button type="button" key={slot} className={s.chip} aria-pressed={time === slot} onClick={() => { setFormError(""); setTime(slot); }}>
                      {formatTime(slot)}
                    </button>
                  ))}
                </div>
              )}
            </fieldset>

            <fieldset className={s.fieldset}>
              <legend className={s.legend}>{t.anythingElse}</legend>
              <textarea className={s.input} name="notes" rows={4} placeholder={t.notesPlaceholder} />
              <div className={s.toggles}>
                <button type="button" className={s.toggle} aria-pressed={isEmergency} onClick={() => setIsEmergency((v) => !v)}>
                  <span><b>{t.urgent}</b><span>{t.urgentSub}</span></span>
                </button>
                <button type="button" className={s.toggle} aria-pressed={isVeteran} onClick={() => setIsVeteran((v) => !v)}>
                  <span><b>{t.responder}</b><span>{t.responderSub}</span></span>
                </button>
              </div>
            </fieldset>

            {formError && <p className={s.formError} role="alert">{formError}</p>}
            <button type="submit" className={`${s.btn} ${s.btnBook}`} disabled={isSubmitting}>
              {isSubmitting
                ? (squareEnabled ? t.paying : t.submitting)
                : (squareEnabled ? t.submitPay : t.submit)}
            </button>
          </form>
        </div>
      </section>

      <section className={`${s.sec} ${s.alt}`}>
        <div className={`${s.wrap} ${s.two}`}>
          <div>
            <h2>{t.faqTitle}</h2>
            <p className={s.lead}>{t.faqLead} <a href={telHref}>{settings.phone}</a>.</p>
          </div>
          <div className={s.faq}>
            {t.faq.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className={s.sec}>
        <div className={`${s.wrap} ${s.area}`}>
          <div>
            <h3>{t.noFee}</h3>
            <ul className={s.pills}><li>Las Vegas</li><li>Henderson</li><li>North Las Vegas</li></ul>
            <p>{t.outside} <a href={telHref}>{settings.phone}</a></p>
          </div>
          <div>
            <h3>{t.pay}</h3>
            <ul className={s.pills}><li>{t.cash}</li><li>Venmo</li><li>Zelle</li><li>Cash App</li></ul>
            <p>{t.payTerms}</p>
          </div>
        </div>
      </section>

      <footer className={s.foot}>
        <div className={s.wrap}>
          <span className={s.brand}>{settings.businessName}</span>
          <p><a href={telHref}>{settings.phone}</a></p>
          <p>{settings.hours}</p>
          <p>Las Vegas, NV</p>
          <div className={s.footBottom}>
            <span>© {new Date().getFullYear()} {settings.businessName}</span>
            <Link href="/login">{t.teamLogin}</Link>
          </div>
        </div>
      </footer>

      <div className={s.dock}>
        <a href={telHref} className={`${s.btn} ${s.btnCall}`}>{t.call}</a>
        <a href="#booking" className={`${s.btn} ${s.btnBook}`}>{t.book}</a>
      </div>
    </main>
  );
}
