// pages/dashboard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";

function InputField({ label, sublabel, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-[11px] text-zinc-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
      />
      {sublabel && <p className="text-[11px] text-zinc-500 mt-1">{sublabel}</p>}
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 3 }) {
  return (
    <div>
      <label className="block text-[11px] text-zinc-400 mb-1">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-100 resize-none focus:outline-none focus:ring-1 focus:ring-red-500"
      />
    </div>
  );
}

function EditAppointmentForm({ appointment, services, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: appointment.customerName || "",
    phone: appointment.phone || "",
    address: appointment.address || "",
    vehicle: appointment.vehicle || "",
    services: appointment.services || [],
    date: appointment.date || "",
    start_time: appointment.time || "",
    duration: appointment.duration || 2,
    notes: appointment.notes || "",
    is_emergency: appointment.emergency || false,
    veteran_discount: appointment.veteranDiscount || false,
    paid: appointment.paid || false,
    status: appointment.status || "confirmed",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const [hour, minute] = formData.start_time.split(":");
    const endHour = parseInt(hour) + (parseInt(formData.duration) || 1);
    const end_time = `${String(endHour).padStart(2, "0")}:${minute || "00"}`;

    const { error } = await supabase
      .from("bookings")
      .update({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        vehicle: formData.vehicle,
        services: formData.services,
        date: formData.date,
        start_time: formData.start_time,
        end_time,
        duration: parseInt(formData.duration) || 1,
        notes: formData.notes,
        is_emergency: formData.is_emergency,
        veteran_discount: formData.veteran_discount,
        paid: formData.paid,
        status: formData.status,
      })
      .eq("id", appointment.id);

    setSaving(false);
    if (error) {
      alert("Failed to save: " + error.message);
    } else {
      onSave({ ...formData, end_time });
    }
  };

  const toggleService = (title) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(title)
        ? prev.services.filter((s) => s !== title)
        : [...prev.services, title],
    }));
  };

  const inputCls =
    "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500";
  const labelCls = "block text-[11px] text-zinc-400 mb-1";
  const selectCls =
    "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-4 bg-zinc-900/80 border border-zinc-700 rounded-xl p-4"
    >
      <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
        Edit Appointment
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Name *</label>
          <input type="text" required value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Phone</label>
          <input type="tel" value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={inputCls} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>Service Address</label>
          <input type="text" value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className={inputCls} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>Vehicle</label>
          <input type="text" value={formData.vehicle}
            onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
            placeholder="e.g. 2018 Honda Civic"
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Date</label>
          <input type="date" value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Start Time</label>
          <input type="time" value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Duration (hours)</label>
          <input type="number" min="1" max="12" value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Status</label>
          <select value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className={selectCls}>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="on_way">On The Way</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Payment</label>
          <select value={formData.paid ? "true" : "false"}
            onChange={(e) => setFormData({ ...formData, paid: e.target.value === "true" })}
            className={selectCls}>
            <option value="false">Deposit Pending</option>
            <option value="true">Deposit Paid</option>
          </select>
        </div>
      </div>

      {services.length > 0 && (
        <div>
          <label className={labelCls}>Services</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {services.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => toggleService(svc.title)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                  formData.services.includes(svc.title)
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {svc.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {services.length === 0 && (
        <div>
          <label className={labelCls}>Services (comma-separated)</label>
          <input type="text"
            value={formData.services.join(", ")}
            onChange={(e) =>
              setFormData({
                ...formData,
                services: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
            className={inputCls} />
        </div>
      )}

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={formData.is_emergency}
            onChange={(e) => setFormData({ ...formData, is_emergency: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-zinc-600 text-red-500" />
          Emergency
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={formData.veteran_discount}
            onChange={(e) => setFormData({ ...formData, veteran_discount: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-zinc-600 text-green-500" />
          Veteran Discount
        </label>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea rows="2" value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-100 resize-none focus:outline-none focus:ring-1 focus:ring-red-500" />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex-1 px-4 py-2 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-200 transition disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 bg-zinc-800 text-zinc-200 text-xs rounded-lg hover:bg-zinc-700 transition border border-zinc-700">
          Cancel
        </button>
      </div>
    </form>
  );
}

function NewAppointmentForm({ services, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    vehicle: "",
    services: [],
    date: "",
    start_time: "",
    duration: 2,
    notes: "",
    is_emergency: false,
    veteran_discount: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/add-client-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!json.success) {
      alert("Failed to add appointment: " + json.error);
    } else {
      onSuccess();
    }
  };

  const toggleService = (title) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(title)
        ? prev.services.filter((s) => s !== title)
        : [...prev.services, title],
    }));
  };

  const inputCls =
    "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500";
  const labelCls = "block text-[11px] text-zinc-400 mb-1";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 space-y-4 bg-zinc-950/70 border border-zinc-700 rounded-xl p-5"
    >
      <h3 className="text-sm font-semibold text-zinc-100">Add Client Appointment</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Name *</label>
          <input type="text" required value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Phone *</label>
          <input type="tel" required value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={inputCls} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>Service Address *</label>
          <input type="text" required value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Full address where service will be performed"
            className={inputCls} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>Vehicle *</label>
          <input type="text" required value={formData.vehicle}
            onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
            placeholder="e.g. 2018 Honda Civic"
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Date *</label>
          <input type="date" required value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Start Time *</label>
          <input type="time" required value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Duration (hours)</label>
          <input type="number" min="1" max="12" required value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
            className={inputCls} />
        </div>
      </div>

      {services.length > 0 && (
        <div>
          <label className={labelCls}>Services</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {services.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => toggleService(svc.title)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                  formData.services.includes(svc.title)
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {svc.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {services.length === 0 && (
        <div>
          <label className={labelCls}>Services (comma-separated)</label>
          <input type="text"
            value={formData.services.join(", ")}
            onChange={(e) =>
              setFormData({
                ...formData,
                services: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder="Oil Change, Brake Inspection"
            className={inputCls} />
        </div>
      )}

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={formData.is_emergency}
            onChange={(e) => setFormData({ ...formData, is_emergency: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-zinc-600 text-red-500" />
          Emergency
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={formData.veteran_discount}
            onChange={(e) => setFormData({ ...formData, veteran_discount: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-zinc-600 text-green-500" />
          Veteran Discount
        </label>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea rows="3" value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="What does the client need? Any special details..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-100 resize-none focus:outline-none focus:ring-1 focus:ring-red-500" />
      </div>

      <div className="bg-zinc-900/60 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-400">
        Manually added appointments are set to{" "}
        <strong className="text-zinc-200">Confirmed</strong> and{" "}
        <strong className="text-zinc-200">Not Paid</strong> by default. The time slot will be
        blocked on the booking calendar immediately.
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 transition disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Appointment"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-zinc-800 text-zinc-200 text-sm rounded-lg hover:bg-zinc-700 transition border border-zinc-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Dashboard() {
  const router = useRouter();

  // ---------- STATE ----------
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [appointments, setAppointments] = useState([]);
  const [apptTab, setApptTab] = useState("upcoming");

  // Schedule (per-day hours)
  const [schedule, setSchedule] = useState({
    monday: { enabled: false, start: "", end: "" },
    tuesday: { enabled: false, start: "", end: "" },
    wednesday: { enabled: false, start: "", end: "" },
    thursday: { enabled: false, start: "", end: "" },
    friday: { enabled: false, start: "", end: "" },
    saturday: { enabled: false, start: "", end: "" },
    sunday: { enabled: false, start: "", end: "" },
  });

  const [mechanics, setMechanics] = useState([]);
  const [newMechanic, setNewMechanic] = useState({
    name: "",
    bioShort: "",
    bioLong: "",
    photoFile: null,
    photoPreview: null,
  });

  // Services
const [services, setServices] = useState([]);
const [categories, setCategories] = useState([]);
const [servicesByCategory, setServicesByCategory] = useState({});
const [newCategory, setNewCategory] = useState({
  name: "",
  nameEs: "",
  icon: "",
});
const [newService, setNewService] = useState({
  name: "",
  nameEs: "",
  description: "",
  price: "",
  icon: "",
  duration: 1,
  categoryId: "",
  imageFile: null,
  imagePreview: null,
});

  // Testimonials / Reviews
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    name: "",
    service: "",
    rating: 5,
    text: "",
    photoFile: null,
    photoPreview: null,
  });

  // Settings (business info)
 const [settings, setSettings] = useState({
  id: null,
  businessName: "Isma's OnSite Auto Repair",
  tagline: "Honest mobile mechanic serving Las Vegas.",
  baseAddress: "Ash Dr, Las Vegas, NV 89121",
  phone: "(702) 801-7210",
  smsNumber: "(702) 801-7210",
  email: "contact@ismaauto.com",
  hours: "",
  logoUrl: null, // in settings state
});

const [expandedPhoto, setExpandedPhoto] = useState(null);

const [logoFile, setLogoFile] = useState(null); // ← ADD THIS
const [logoPreview, setLogoPreview] = useState(null); // ← ADD THIS

  const [promo, setPromo] = useState({
    enabled: false,
    text: "",
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [showOnlyEmergency, setShowOnlyEmergency] = useState(false);
  const [showOnlyPaid, setShowOnlyPaid] = useState(false);
  const [showNewApptForm, setShowNewApptForm] = useState(false);
  const [editingApptId, setEditingApptId] = useState(null);

  const getStorageUrl = (bucket, path) => {
  if (!path) return null;
  return `https://saphvmlpnbtzyhsqpalw.supabase.co/storage/v1/object/public/${bucket}/${path}`;
};
  // ---------- FETCH DATA ON LOAD ----------
 useEffect(() => {
  const fetchAllData = async () => {
    // ---------- 1) FETCH BOOKINGS + JOB NOTES/PHOTOS ----------
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (bookingsError) {
      console.error("Bookings fetch error:", bookingsError);
      return;
    }
    let notesByAppt = {};
    let photosByAppt = {};

    if (bookingsData && bookingsData.length > 0) {
      const bookingIds = bookingsData.map((b) => b.id);

      const [
        { data: notesData, error: notesError },
        { data: photosData, error: photosError },
      ] = await Promise.all([
        supabase
          .from("job_notes")
          .select("id, booking_id, notes, created_at")
          .in("booking_id", bookingIds)
          .order("created_at", { ascending: true }),
        supabase
          .from("job_photos")
          .select("id, booking_id, photo_url, created_at")
          .in("booking_id", bookingIds)
          .order("created_at", { ascending: true }),
      ]);

      if (notesError) {
        console.error("Job notes fetch error:", notesError);
      }
      if (photosError) {
        console.error("Job photos fetch error:", photosError);
      }

      notesByAppt = {};
      (notesData || []).forEach((n) => {
        if (!notesByAppt[n.booking_id]) notesByAppt[n.booking_id] = [];
        notesByAppt[n.booking_id].push(n);
      });

      photosByAppt = {};
      (photosData || []).forEach((p) => {
        if (!photosByAppt[p.booking_id])
          photosByAppt[p.booking_id] = [];
        photosByAppt[p.booking_id].push(p);
      });
    }

    const formattedAppointments =
      bookingsData?.map((booking) => ({
        id: booking.id,
        customerName: booking.name,
        phone: booking.phone,
        address: booking.address,
        vehicle: booking.vehicle, // <- column is "vehicle" now
        services: Array.isArray(booking.services)
          ? booking.services
          : booking.services
          ? booking.services.split(",")
          : [],
        date: booking.date,
        time: booking.start_time,
        notes: booking.notes,
        status: booking.status || "pending",
        emergency: booking.is_emergency,
        veteranDiscount: booking.veteran_discount,
        duration: booking.duration,
        paid: booking.paid,
        squarePaymentId: booking.square_payment_id,
        distanceMiles: booking.distance_miles,

        // Persisted history
        savedNotes: notesByAppt[booking.id] || [],
        savedPhotos: photosByAppt[booking.id] || [],

        // Local drafts for current session
        _localNotes: "",
        _localPhotos: [],
      })) || [];

    setAppointments(formattedAppointments);

    // ---------- 2) AUTH USER ----------
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Auth getUser error:", userError);
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }

    // ---------- 3) SETTINGS ----------
    const { data: settingsData, error: settingsError } = await supabase
      .from("settings")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!settingsError && settingsData) {
      setSettings({
        id: settingsData.id,
        businessName:
          settingsData.business_name || "Isma's OnSite Auto Repair",
        tagline:
          settingsData.tagline || "Honest mobile mechanic serving Las Vegas.",
        baseAddress:
          settingsData.base_address || "Ash Dr, Las Vegas, NV 89121",
        phone: settingsData.phone || "(702) 801-7210",
        smsNumber: settingsData.sms_number || "(702) 801-7210",
        email: settingsData.email || "contact@ismaauto.com",
        hours: settingsData.hours || "",
          logoUrl: settingsData.logo_url || null,
      });

      setPromo({
        enabled: settingsData.promo_enabled ?? false,
        text: settingsData.promo_text ?? "",
      });
    }

    // ---------- 4) SERVICES & CATEGORIES ----------
const [
  { data: servicesData, error: servicesError },
  { data: categoriesData, error: categoriesError }
] = await Promise.all([
  supabase.from("services").select("*").order("created_at", { ascending: false }),
  supabase.from("service_categories").select("*").order("display_order", { ascending: true })
]);

if (!servicesError && servicesData) {
  const formattedServices = servicesData.map((s) => ({
    id: s.id,
    title: s.title,
    title_es: s.title_es,
    description: s.description,
    price: s.price,
    icon: s.icon,
    duration: s.duration,
    image_url: s.image_url,
    category_id: s.category_id, // ← ADD THIS
  }));
  setServices(formattedServices);
}

if (!categoriesError && categoriesData) {
  setCategories(categoriesData);
}

    // ---------- 5) TESTIMONIALS ----------
    const { data: testimonialsData, error: testimonialsError } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (!testimonialsError && testimonialsData) {
      setReviews(testimonialsData);
    }

    // ---------- 6) MECHANICS ----------
    const { data: mechanicsData, error: mechanicsError } = await supabase
      .from("mechanics")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    if (!mechanicsError && mechanicsData) {
      setMechanics(mechanicsData);
    }

    // ---------- 7) SCHEDULE SETTINGS ----------
    const { data: scheduleData, error: scheduleError } = await supabase
      .from("schedule_settings")
      .select("*")
      .eq("owner_id", user.id)
      .order("day_of_week");

    if (!scheduleError && scheduleData) {
      const scheduleMap = {
        monday: { enabled: false, start: "09:00", end: "17:00" },
        tuesday: { enabled: false, start: "09:00", end: "17:00" },
        wednesday: { enabled: false, start: "09:00", end: "17:00" },
        thursday: { enabled: false, start: "09:00", end: "17:00" },
        friday: { enabled: false, start: "09:00", end: "17:00" },
        saturday: { enabled: false, start: "09:00", end: "17:00" },
        sunday: { enabled: false, start: "09:00", end: "17:00" },
      };

      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];

      scheduleData.forEach((day) => {
        const dayName = dayNames[day.day_of_week];
        if (dayName) {
          scheduleMap[dayName] = {
            enabled: day.is_open,
            start: day.start_time || "09:00",
            end: day.end_time || "17:00",
          };
        }
      });

      setSchedule(scheduleMap);
    }

    setReady(true);
  };

  fetchAllData();

  // ---------- REALTIME SUBSCRIPTION FOR BOOKINGS ----------
  const subscription = supabase
    .channel("bookings-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookings" },
      () => {
        fetchAllData();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [router]);

function getTodayLocal() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

  // ---------- HELPER FUNCTIONS ----------
async function autoCalculateMileage(appointment) {
  try {
    const res = await fetch("/api/calc-mileage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAddress: settings.baseAddress,
        toAddress: appointment.address,
      }),
    });

    const data = await res.json();

    if (data.success) {
      // Save to database
      await supabase
        .from("bookings")
        .update({ distance_miles: data.miles })
        .eq("id", appointment.id);

      // Update locally
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointment.id ? { ...a, distanceMiles: data.miles } : a
        )
      );
    }
  } catch (err) {
    console.error("Mileage autocalc error:", err);
  }
}

  const handleOnTheWay = async (appt) => {
  try {
    // Update status in database FIRST
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "on_way" })
      .eq("id", appt.id);

    if (updateError) {
      console.error("Update error:", updateError);
      alert("❌ Failed to update status");
      return;
    }

    // Update local state
    updateAppointmentStatus(appt.id, "on_way");

    // Send SMS
    const res = await fetch("/api/on-the-way", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerPhone: appt.phone,
        name: appt.customerName,
        date: appt.date,
        start_time: appt.time,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert("❌ Failed to send On The Way text.");
      return;
    }

    alert("🚗 Customer notified you're on the way!");

  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
};

  function formatTime(time24) {
    if (!time24) return "";
    const [hourStr, minuteStr = "00"] = time24.split(":");
    const hour = parseInt(hourStr, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minuteStr}${suffix}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

 function updateLocalNotes(id, text) {
  setAppointments((prev) =>
    prev.map((a) =>
      a.id === id ? { ...a, _localNotes: text } : a
    )
  );
}

function handleLocalPhotos(id, files) {
  const readers = Array.from(files).map((file) => {
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });
  });

  Promise.all(readers).then((images) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, _localPhotos: [...(a._localPhotos || []), ...images] }
          : a
      )
    );
  });
}

async function saveLocalJobNotes(id) {
  const appointment = appointments.find((a) => a.id === id);
  if (!appointment) return;

  try {
    const newSavedNotes = [];
    const newSavedPhotos = [];

    // Upload photos if any
    const photoFileNames = [];
    if (appointment._localPhotos && appointment._localPhotos.length > 0) {
      for (const photo of appointment._localPhotos) {
        const response = await fetch(photo);
        const blob = await response.blob();
        const fileName = `${Date.now()}-${Math.random()}.jpg`;

       const { error: uploadError } = await supabase.storage
  .from("job-photos")
  .upload(fileName, blob);


        if (!uploadError) {
          photoFileNames.push(fileName);
        } else {
          console.error("Photo upload error:", uploadError);
        }
      }
    }

    // Save notes to job_notes table (optional)
    if (appointment._localNotes && appointment._localNotes.trim() !== "") {
      const { data: noteRows, error: noteError } = await supabase
        .from("job_notes")
        .insert({
          booking_id: id,
          notes: appointment._localNotes.trim(),
        })
        .select("*");

      if (noteError) throw noteError;
      if (noteRows && noteRows.length > 0) {
        newSavedNotes.push(noteRows[0]);
      }
    }

    // Save photos to job_photos table
    if (photoFileNames.length > 0) {
      const { data: photoRows, error: photoError } = await supabase
        .from("job_photos")
        .insert(
          photoFileNames.map((fileName) => ({
            booking_id: id,
            photo_url: fileName,
          }))
        )
        .select("*");

      if (photoError) throw photoError;
      if (photoRows) newSavedPhotos.push(...photoRows);
    }

    // Move drafts into saved arrays and clear drafts
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              savedNotes: [...(a.savedNotes || []), ...newSavedNotes],
              savedPhotos: [...(a.savedPhotos || []), ...newSavedPhotos],
              _localNotes: "",
              _localPhotos: [],
            }
          : a
      )
    );

    alert("✅ Notes and photos saved!");
  } catch (err) {
    console.error(err);
    alert("Failed to save notes");
  }
}


  function getStatusBadgeClasses(status) {
    switch (status) {
      case "pending":
        return "bg-amber-500/20 text-amber-300 border border-amber-500/40";
      case "confirmed":
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
      case "completed":
        return "bg-sky-500/20 text-sky-300 border border-sky-500/40";
      case "cancelled":
        return "bg-red-500/20 text-red-300 border border-red-500/40";
      default:
        return "bg-zinc-700/40 text-zinc-200 border border-zinc-600";
    }
  }

  function getEmergencyBadgeClasses(emergency) {
    if (!emergency) return "";
    return "bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-full uppercase tracking-wide";
  }

  function averageRating() {
    if (!reviews.length) return null;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }

  function appointmentsThisWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return appointments.filter((a) => {
      const d = new Date(a.date + "T00:00:00");
      return d >= weekStart && d <= weekEnd;
    }).length;
  }

  function todaysAppointments() {
    const isoToday = getTodayLocal();
    return appointments.filter((a) => a.date === isoToday).length;
  }

  function emergenciesToday() {
    const isoToday = getTodayLocal();
    return appointments.filter((a) => a.date === isoToday && a.emergency)
      .length;
  }

  // Filter appointments
  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (showOnlyEmergency && !a.emergency) return false;
    if (showOnlyPaid && !a.paid) return false;
    return true;
  });

 const today = getTodayLocal(); // Use the helper function we created
const upcoming = filteredAppointments.filter((a) => a.date >= today);
const past = filteredAppointments.filter(
  (a) => a.date < today || a.status === "completed"
);
  const listToRender = apptTab === "upcoming" ? upcoming : past;

  // ---------- ACTION HANDLERS ----------
  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      router.push("/login");
    }
  }

  async function updateAppointmentStatus(id, status) {
    // Update locally since status isn't in DB yet
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  }

  async function updatePaidStatus(id, paid) {
    const { error } = await supabase
      .from("bookings")
      .update({ paid })
      .eq("id", id);

    if (error) {
      console.error("Failed to update paid status:", error);
      alert("Failed to update payment status");
      return;
    }

    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, paid } : a))
    );
  }

  async function confirmAndNotify(id) {
  const appointment = appointments.find((a) => a.id === id);
  if (!appointment) {
    return alert("Appointment not found.");
  }

  try {
    // 🚀 AUTO-CALCULATE MILEAGE FIRST
    if (!appointment.distanceMiles && appointment.address) {
      await autoCalculateMileage(appointment);
    }

    // Send SMS - NOW WITH bookingId!
    const res = await fetch("/api/confirm-appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: appointment.customerName,
        phone: appointment.phone,
        date: appointment.date,
        time: appointment.time,
        address: appointment.address,
        emergency: appointment.emergency,
        bookingId: id,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert("SMS failed: " + data.error);
      return;
    }

    alert("✅ Customer notified via SMS!");

  } catch (err) {
    console.error(err);
    alert("Failed to confirm appointment");
  }
}

 async function completeAppointment(id) {
  // Update in database first
  const { error } = await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", id);

  if (error) {
    console.error("Failed to complete:", error);
    alert("Failed to complete appointment");
    return;
  }

  // Then update local state
  updateAppointmentStatus(id, "completed");
}

 async function cancelAppointment(id) {
  const ok = window.confirm("Cancel this appointment?");
  if (!ok) return;
  
  // Update in database first
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) {
    console.error("Failed to cancel:", error);
    alert("Failed to cancel appointment");
    return;
  }

  // Then update local state
  updateAppointmentStatus(id, "cancelled");
}

  async function deleteAppointment(id) {
    const ok = window.confirm("Delete this appointment?");
    if (!ok) return;
    
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete appointment");
      return;
    }

    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  function handleEditSave(apptId, updated) {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === apptId
          ? {
              ...apt,
              customerName: updated.name,
              phone: updated.phone,
              address: updated.address,
              vehicle: updated.vehicle,
              services: updated.services,
              date: updated.date,
              time: updated.start_time,
              duration: updated.duration,
              notes: updated.notes,
              emergency: updated.is_emergency,
              veteranDiscount: updated.veteran_discount,
              paid: updated.paid,
              status: updated.status,
            }
          : apt
      )
    );
    setEditingApptId(null);
  }

  function handleScheduleChange(dayKey, field, value) {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  }

  async function handleSaveSchedule() {
    try {
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const updates = [];

      // Convert UI format to database format
      Object.entries(schedule).forEach(([dayKey, dayData]) => {
        const dayOfWeek = dayNames.indexOf(dayKey);
        if (dayOfWeek !== -1) {
          updates.push({
            day_of_week: dayOfWeek,
            is_open: dayData.enabled,
            start_time: dayData.start,
            end_time: dayData.end,
          });
        }
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be logged in to save schedule");
        return;
      }

      // Upsert each day's schedule
      for (const update of updates) {
        const { error } = await supabase
          .from("schedule_settings")
          .upsert({
            owner_id: user.id,
            ...update,
          }, {
            onConflict: "owner_id,day_of_week"
          });

        if (error) throw error;
      }

      alert("✅ Schedule saved successfully!");
    } catch (err) {
      console.error("Error saving schedule:", err);
      alert("❌ Failed to save schedule: " + err.message);
    }
  }

  async function handleGenerateAvailability() {
    try {
      const confirmed = window.confirm(
        "This will generate availability slots for the next 30 days based on your weekly schedule. Continue?"
      );
      
      if (!confirmed) return;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be logged in");
        return;
      }

      // Fetch schedule settings
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("schedule_settings")
        .select("*")
        .eq("owner_id", user.id);

      if (scheduleError) throw scheduleError;

      if (!scheduleData || scheduleData.length === 0) {
        alert("⚠️ Please save your schedule first before generating availability!");
        return;
      }

      // Create a map of day_of_week -> schedule
      const scheduleMap = {};
      scheduleData.forEach((day) => {
        scheduleMap[day.day_of_week] = day;
      });

      // Generate slots for next 30 days
      const slots = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daySchedule = scheduleMap[dayOfWeek];
        
        // Skip if day is not open
        if (!daySchedule || !daySchedule.is_open) continue;
        
        const dateStr = date.toISOString().split('T')[0];
        
        // Check if this date already has availability
        const { data: existing } = await supabase
          .from("availability")
          .select("id")
          .eq("owner_id", user.id)
          .eq("date", dateStr);
        
        // Skip if already has slots for this date
        if (existing && existing.length > 0) continue;
        
        // Add the full day slot (you can customize this to create multiple slots per day)
        slots.push({
          owner_id: user.id,
          date: dateStr,
          start_time: daySchedule.start_time,
          end_time: daySchedule.end_time,
        });
      }

      if (slots.length === 0) {
        alert("ℹ️ No new availability slots to generate. All dates already have slots!");
        return;
      }

      // Insert all slots
      const { error: insertError } = await supabase
        .from("availability")
        .insert(slots);

      if (insertError) throw insertError;

      alert(`✅ Generated ${slots.length} availability slots for the next 30 days!`);
    } catch (err) {
      console.error("Error generating availability:", err);
      alert("❌ Failed to generate availability: " + err.message);
    }
  }

  // ========== SERVICES ==========
  async function handleAddService(e) {
    e.preventDefault();
    if (!newService.name.trim()) {
      alert("Please enter a service name.");
      return;
    }

    let imagePath = null;

    // Upload image if provided
    if (newService.imageFile) {
      const fileExt = newService.imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("services")
        .upload(fileName, newService.imageFile);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("Failed to upload image");
        return;
      } else {
        imagePath = fileName;
      }
    }

  const { data, error } = await supabase
  .from("services")
  .insert({
    name: newService.name,
    title: newService.name,
    title_es: newService.nameEs,
    description: newService.description,
    price: newService.price,
    icon: newService.icon || "🔧",
    duration: newService.duration || 1,
    category_id: newService.categoryId, // ← ADD THIS LINE
    image_url: imagePath,
  })
  .select();

    if (error) {
      console.error(error);
      alert("Failed to add service");
      return;
    }
const formattedService = {
  id: data[0].id,
  name: data[0].title,
  nameEs: data[0].title_es,
  description: data[0].description,
  price: data[0].price,
  icon: data[0].icon,
  duration: data[0].duration,  // ← ADD THIS
  imageUrl: data[0].image_url,
};

    setServices((prev) => [formattedService, ...prev]);
   setNewService({ 
  name: "", 
  nameEs: "", 
  description: "", 
  price: "",
  icon: "",
  duration: 1,
  categoryId: "", // ← ADD THIS LINE
  imageFile: null,
  imagePreview: null,
});
  }

  async function handleDeleteService(id) {
    const ok = window.confirm("Remove this service?");
    if (!ok) return;

    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to delete service");
      return;
    }

    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  // ========== TESTIMONIALS ==========
  async function handleAddReview(e) {
    e.preventDefault();

    let photoPath = null;

    if (newReview.photoFile) {
      const file = newReview.photoFile;
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("testimonials")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
      } else {
        photoPath = fileName;
      }
    }

    const { data, error } = await supabase
      .from("testimonials")
      .insert({
        name: newReview.name,
        service: newReview.service || null,
        rating: newReview.rating,
        text: newReview.text,
        image_url: photoPath,
      })
      .select();

    if (error) {
      console.error(error);
      alert("Failed to add testimonial");
      return;
    }

    setReviews((prev) => [data[0], ...prev]);

    setNewReview({
      name: "",
      service: "",
      rating: 5,
      text: "",
      photoFile: null,
      photoPreview: null,
    });
  }

  async function handleDeleteReview(id) {
    const ok = window.confirm("Delete this testimonial?");
    if (!ok) return;

    const { error } = await supabase.from("testimonials").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to delete testimonial");
      return;
    }

    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  // ========== MECHANICS ==========
 async function handleAddMechanic(e) {
  e.preventDefault();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      alert("You must be logged in");
      return;
    }

    let photoPath = null;

    if (newMechanic.photoFile) {
      const ext = newMechanic.photoFile.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("mechanics")
        .upload(fileName, newMechanic.photoFile);

      if (uploadError) {
        console.error(uploadError);
        alert("Failed to upload photo");
        return;
      }

      photoPath = fileName;
    }

    const { data, error } = await supabase
      .from("mechanics")
      .insert({
        owner_id: user.id,
        name: newMechanic.name,
        bio_short: newMechanic.bioShort,
        bio_long: newMechanic.bioLong,
        photo_url: photoPath,
      })
      .select("*");

    if (error) throw error;

    setMechanics((prev) => [...prev, data[0]]);

    setNewMechanic({
      name: "",
      bioShort: "",
      bioLong: "",
      photoFile: null,
      photoPreview: null,
    });
  } catch (err) {
    console.error("Add mechanic error:", err);
    alert("Failed to add mechanic: " + err.message);
  }
}


  async function handleDeleteMechanic(id) {
    const ok = window.confirm("Delete this mechanic?");
    if (!ok) return;

    await supabase.from("mechanics").delete().eq("id", id);

    setMechanics((prev) => prev.filter((m) => m.id !== id));
  }

async function handleSaveSettings(e) {
  e.preventDefault();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      alert("You must be logged in to save settings");
      return;
    }

    let logoPath = settings.logoUrl; // Keep existing logo by default

    // Upload new logo if provided
    if (logoFile) {
      const fileExt = logoFile.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("business-assets")
        .upload(fileName, logoFile);

      if (uploadError) {
        console.error("Logo upload error:", uploadError);
        alert("Failed to upload logo");
        return;
      }

      logoPath = fileName;
    }

    const payload = {
      owner_id: user.id,
      business_name: settings.businessName,
      phone: settings.phone,
      email: settings.email,
      hours: settings.hours,
      base_address: settings.baseAddress,
      sms_number: settings.smsNumber,
      tagline: settings.tagline,
      promo_text: promo.text,
      promo_enabled: promo.enabled,
      logo_url: logoPath, // ← ADD THIS LINE
    };

    const { data, error } = await supabase
      .from("settings")
      .upsert(payload, { onConflict: "owner_id" })
      .select("*")
      .single();

    if (error) throw error;

    setSettings((prev) => ({
      ...prev,
      id: data.id,
      logoUrl: data.logo_url, // ← ADD THIS LINE
    }));

    // Clear logo file state after successful save
    setLogoFile(null); // ← ADD THIS LINE
    setLogoPreview(null); // ← ADD THIS LINE

    alert("✅ Settings saved successfully!");
  } catch (err) {
    console.error(err);
    alert("Failed to save settings: " + err.message);
  }
}


  // ---------- RENDER GUARD ----------
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ---------- UI CONFIG ----------
  const tabs = [
    { id: "overview", label: "Dashboard", icon: "🏠" },
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "schedule", label: "Schedule", icon: "⏰" },
    { id: "services", label: "Services", icon: "🔧" },
    { id: "reviews", label: "Reviews", icon: "⭐" },
    { id: "settings", label: "Settings", icon: "⚙️" },
    { id: "mechanics", label: "Mechanics", icon: "🧰" },
    { id: "promos", label: "Promotions", icon: "🏷️" },
  ];

  const dayLabels = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  // ---------- RENDER ----------
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-600/40">
              <span className="text-2xl">🔧</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-zinc-50">
                Isma&apos;s Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                OnSite Auto Repair
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition"
          >
            Sign Out
          </button>
        </div>

        {/* Top nav tabs */}
        <div className="border-t border-zinc-800 bg-black/80">
          <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 overflow-x-auto scrollbar-none">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center flex-shrink-0 space-x-2 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all ${
                    activeTab === tab.id
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/40"
                      : "bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <section className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg shadow-black/40">
                <p className="text-xs text-zinc-400 mb-1">Today&apos;s Jobs</p>
                <p className="text-3xl font-semibold text-zinc-50">
                  {todaysAppointments()}
                </p>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Jobs scheduled for today.
                </p>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg shadow-black/40">
                <p className="text-xs text-zinc-400 mb-1">This Week</p>
                <p className="text-3xl font-semibold text-zinc-50">
                  {appointmentsThisWeek()}
                </p>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Total appointments this week.
                </p>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg shadow-black/40">
                <p className="text-xs text-zinc-400 mb-1">Emergency Calls</p>
                <p className="text-3xl font-semibold text-red-400">
                  {emergenciesToday()}
                </p>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Emergency jobs scheduled for today.
                </p>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg shadow-black/40">
                <p className="text-xs text-zinc-400 mb-1">Rating</p>
                <p className="text-3xl font-semibold text-amber-300">
                  {averageRating() || "-"}
                </p>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Average from {reviews.length || 0} reviews.
                </p>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-700/40 rounded-2xl p-4 shadow-lg shadow-black/40">
                <p className="text-xs text-emerald-400 mb-1">Deposits</p>
                <p className="text-3xl font-semibold text-emerald-300">
                  ${appointments.filter(a => a.paid).length * 50}
                </p>
                <p className="text-[11px] text-emerald-700 mt-2">
                  {appointments.filter(a => a.paid).length} booking{appointments.filter(a => a.paid).length !== 1 ? 's' : ''} collected
                </p>
              </div>
            </div>

            {/* Today schedule + quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Today's schedule */}
              <div className="md:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/40">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-zinc-50">
                    Today&apos;s Schedule
                  </h2>
                  <span className="text-xs text-zinc-500">
                    {formatDate(getTodayLocal())}
                  </span>
                </div>

                <div className="space-y-3">
                  {appointments
                    .filter(
                      (a) => a.date === getTodayLocal()
                    )
                    .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
                    .map((a) => (
                      <div
                        key={a.id}
                        className="flex items-start justify-between bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3"
                      >
                        <div className="flex-1 mr-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium text-sm text-zinc-50">
                              {a.customerName}
                            </p>
                            {a.emergency && (
                              <span className={getEmergencyBadgeClasses(true)}>
                                EMERGENCY
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mb-1">
                            {a.vehicle}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {a.services.join(" • ")}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-semibold text-zinc-50">
                            {formatTime(a.time || "09:00")}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {a.distanceMiles
                              ? `${a.distanceMiles.toFixed(1)} mi`
                              : ""}
                          </p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${getStatusBadgeClasses(
                              a.status
                            )}`}
                          >
                            {a.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}

                 {appointments.filter((a) => a.date === getTodayLocal()).length === 0 && (
  <div className="text-center py-6 text-sm text-zinc-500">
    No jobs scheduled for today.
  </div>
)}
</div>
</div>
              {/* Quick actions */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/40 space-y-4">
                <h2 className="text-lg font-semibold text-zinc-50 mb-2">
                  Quick Actions
                </h2>
                <button
                  onClick={() => setActiveTab("appointments")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-600 text-sm font-medium text-white hover:bg-red-500 transition shadow-lg shadow-red-600/40"
                >
                  <span>View All Appointments</span>
                  <span className="text-xl">📅</span>
                </button>
                <button
                  onClick={() => setActiveTab("schedule")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-800 text-sm font-medium text-zinc-100 hover:bg-zinc-700 transition border border-zinc-700"
                >
                  <span>Edit Work Hours</span>
                  <span className="text-xl">⏰</span>
                </button>
                <button
                  onClick={() => setActiveTab("services")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-800 text-sm font-medium text-zinc-100 hover:bg-zinc-700 transition border border-zinc-700"
                >
                  <span>Update Services</span>
                  <span className="text-xl">🔧</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === "appointments" && (
          <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/40 space-y-4">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start justify-between w-full sm:w-auto gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-50">
                    Appointments
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Manage upcoming jobs, confirmations and emergencies.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewApptForm((v) => !v)}
                  className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    showNewApptForm
                      ? "bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      : "bg-white text-black border-transparent hover:bg-zinc-200"
                  }`}
                >
                  {showNewApptForm ? "Cancel" : "+ Add Client"}
                </button>
              </div>

{/* UPCOMING / PAST TOGGLE */}
<div className="flex gap-2 mb-4 bg-zinc-950/40 border border-zinc-800 rounded-xl p-1">
  <button
    onClick={() => setApptTab("upcoming")}
    className={`
      flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
      ${
        apptTab === "upcoming"
          ? "bg-white text-black shadow-md"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      }
    `}
  >
    Upcoming
  </button>

  <button
    onClick={() => setApptTab("past")}
    className={`
      flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
      ${
        apptTab === "past"
          ? "bg-white text-black shadow-md"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      }
    `}
  >
    Past
  </button>
</div>
              {/* FILTER TOOLS */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-200"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <label className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyEmergency}
                    onChange={(e) => setShowOnlyEmergency(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-zinc-600 text-red-500"
                  />
                  <span className="text-zinc-300">Emergency only</span>
                </label>

                <label className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyPaid}
                    onChange={(e) => setShowOnlyPaid(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-zinc-600 text-green-500"
                  />
                  <span className="text-zinc-300">Paid only</span>
                </label>
              </div>
            </div>

            {showNewApptForm && (
              <NewAppointmentForm
                services={services}
                onSuccess={() => setShowNewApptForm(false)}
                onCancel={() => setShowNewApptForm(false)}
              />
            )}

            <div className="space-y-4">
              {/* NO APPOINTMENTS */}
              {listToRender.length === 0 && (
                <div className="text-center py-8 text-sm text-zinc-500">
                  {apptTab === "upcoming"
                    ? "No upcoming appointments."
                    : "No past appointments yet."}
                </div>
              )}

              {/* APPOINTMENT CARDS */}
              {listToRender.map((a) => (
                <div
                  key={a.id}
                  className="bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 sm:px-5 sm:py-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    {/* LEFT SIDE */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-zinc-50">
                          {a.customerName}
                        </p>

                        {a.emergency && (
                          <span className={getEmergencyBadgeClasses(true)}>
                            EMERGENCY
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400">{a.vehicle}</p>

                      <p className="text-[11px] text-zinc-500 mt-1">
                        {a.services.join(" • ")}
                      </p>

                      <p className="text-[11px] text-zinc-500 mt-1">
                        📍 {a.address}
                      </p>

                      <p className="text-[11px] text-zinc-500 mt-1">
                        📞 {a.phone}
                      </p>

                      {a.notes && (
                        <p className="text-[11px] text-zinc-500 mt-1 italic">
                          Note: {a.notes}
                        </p>
                      )}

                      {a.veteranDiscount && (
                        <p className="text-[11px] text-blue-400 mt-1 font-medium">
                          🎖️ Veteran Discount Applied
                        </p>
                      )}
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="flex flex-col items-end gap-1 min-w-[120px]">
                      <p className="text-xs text-zinc-400">
                        {formatDate(a.date)} • {formatTime(a.time || "09:00")}
                      </p>

                      {a.distanceMiles && (
                        <p className="text-[11px] text-zinc-500">
                          ~{a.distanceMiles.toFixed(1)} mi from home base
                        </p>
                      )}

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${getStatusBadgeClasses(
                          a.status
                        )}`}
                      >
                        {a.status.toUpperCase()}
                      </span>

                      {/* Deposit badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        a.paid
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {a.paid ? '✓ $50 Deposit Paid' : '⏳ Deposit Pending'}
                      </span>

                      {a.squarePaymentId && (
                        <p className="text-[10px] text-zinc-600 font-mono">
                          #{a.squarePaymentId.slice(-8)}
                        </p>
                      )}

{/* UPCOMING BUTTONS ONLY */}
{apptTab === "upcoming" && (
  <div className="flex flex-wrap gap-1 mt-2 justify-end">
    {/* Confirm & Notify - Only show if pending */}
    {a.status === "pending" && (
      <button
        onClick={() => confirmAndNotify(a.id)}
        className="px-2.5 py-1 text-[11px] rounded-lg bg-red-600 text-white hover:bg-red-500"
      >
        Confirm & Notify
      </button>
    )}

    {/* On The Way - Only show if confirmed (not pending, not on_way) */}
    {a.status === "confirmed" && (
      <button
        onClick={() => handleOnTheWay(a)}
        className="px-2.5 py-1 text-[11px] rounded-lg bg-blue-600 text-white hover:bg-blue-500"
      >
        On The Way
      </button>
    )}

    {/* Mark Completed - Show if confirmed or on_way */}
    {(a.status === "confirmed" || a.status === "on_way") && 
     a.status !== "completed" && 
     a.status !== "cancelled" && (
      <button
        onClick={() => completeAppointment(a.id)}
        className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
      >
        Mark Completed
      </button>
    )}

    {/* Mark Deposit Paid - manual override for cash/phone payments */}
    {!a.paid && (
      <button
        onClick={() => updatePaidStatus(a.id, true)}
        className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/60"
      >
        Mark Deposit Paid
      </button>
    )}

    {/* Cancel - Show unless cancelled or completed */}
    {a.status !== "cancelled" && a.status !== "completed" && (
      <button
        onClick={() => cancelAppointment(a.id)}
        className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
      >
        Cancel
      </button>
    )}

    {/* EDIT BUTTON */}
    <button
      onClick={() => setEditingApptId(editingApptId === a.id ? null : a.id)}
      className={`px-2.5 py-1 text-[11px] rounded-lg border transition ${
        editingApptId === a.id
          ? "bg-zinc-700 border-zinc-600 text-zinc-200"
          : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
      }`}
    >
      {editingApptId === a.id ? "Close" : "✏️ Edit"}
    </button>

    {/* DELETE BUTTON - Always show in upcoming */}
    <button
      onClick={() => deleteAppointment(a.id)}
      className="px-2.5 py-1 text-[11px] rounded-lg bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40"
    >
      🗑️ Delete
    </button>
  </div>
)}

                     {/* PAST APPOINTMENTS JOB NOTES */}
{apptTab === "past" && (
  <div className="mt-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">

    
    {/* EXISTING NOTES / PHOTOS */}
    {(a.savedNotes?.length > 0 || a.savedPhotos?.length > 0) && (
      <div className="space-y-3">
        {a.savedNotes?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-200 mb-1">
              Saved Notes
            </p>
            <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {a.savedNotes.map((n) => (
                <li
                  key={n.id}
                  className="text-[11px] text-zinc-300 bg-zinc-950/70 border border-zinc-800 rounded-lg px-2 py-1.5"
                >
                  <span className="block text-[10px] text-zinc-500 mb-0.5">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                  {n.notes}
                </li>
              ))}
            </ul>
          </div>
        )}

        {a.savedPhotos?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-200 mb-1">
              Saved Photos
            </p>
            <div className="grid grid-cols-3 gap-2">
              {a.savedPhotos.map((p) => {
  const photoSrc = `https://saphvmlpnbtzyhsqpalw.supabase.co/storage/v1/object/public/job-photos/${p.photo_url}`;
  return (
    <img
      key={p.id}
      src={photoSrc}
      alt="Job photo"
      onClick={() => setExpandedPhoto(photoSrc)}
      className="w-full h-24 object-cover rounded-lg border border-zinc-800 cursor-zoom-in hover:opacity-90 transition"
    />
  );
})}

            </div>
          </div>
        )}
      </div>
    )}

    {/* NEW NOTES INPUT */}
    <div>
      <label className="text-xs text-zinc-400 uppercase tracking-wider">
        Job Notes
      </label>
      <textarea
        value={a._localNotes || ""}
        onChange={(e) => updateLocalNotes(a.id, e.target.value)}
        rows={3}
        placeholder="Add details about this job (what was wrong, what you fixed, parts used, etc.)..."
        className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-red-500"
      />
    </div>

    {/* PHOTO UPLOAD */}
    <div>
      <label className="text-xs text-zinc-400 uppercase tracking-wider">
        Upload Photos
      </label>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleLocalPhotos(a.id, e.target.files)}
        className="mt-1 text-sm text-zinc-300"
      />

      {/* PHOTO PREVIEW GRID */}
      {a._localPhotos && a._localPhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {a._localPhotos.map((src, i) => (
            <img
  key={i}
  src={src}
  alt="upload preview"
  onClick={() => setExpandedPhoto(src)}
  className="w-full h-24 object-cover rounded-lg border border-zinc-800 cursor-zoom-in hover:opacity-90 transition"
/>

          ))}
        </div>
      )}
    </div>

    {/* SAVE BUTTON */}
    <div className="flex justify-between items-center">
      <button
        onClick={() => setEditingApptId(editingApptId === a.id ? null : a.id)}
        className={`px-3 py-1.5 text-xs rounded-lg border transition ${
          editingApptId === a.id
            ? "bg-zinc-700 border-zinc-600 text-zinc-200"
            : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
        }`}
      >
        {editingApptId === a.id ? "Close Edit" : "✏️ Edit"}
      </button>
      <button
        onClick={() => saveLocalJobNotes(a.id)}
        className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 transition"
      >
        Save Notes
      </button>
    </div>
   </div>
)}
                    </div>
                  </div>
                  {editingApptId === a.id && (
                    <EditAppointmentForm
                      appointment={a}
                      services={services}
                      onSave={(updated) => handleEditSave(a.id, updated)}
                      onCancel={() => setEditingApptId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
        {/* SCHEDULE TAB */}
        {activeTab === "schedule" && (
          <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/40 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-50">
                  Work Schedule
                </h2>
                <p className="text-xs text-zinc-500">
                  Control the days and hours you appear available on the booking
                  form.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dayLabels.map(({ key, label }) => {
                const day = schedule[key];
                return (
                  <div
                    key={key}
                    className="bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-50">
                          {label}
                        </span>
                        {!day.enabled && (
                          <span className="text-[11px] text-zinc-500">
                            (Off)
                          </span>
                        )}
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={day.enabled}
                          onChange={(e) =>
                            handleScheduleChange(
                              key,
                              "enabled",
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 rounded border-zinc-600 text-red-500 focus:ring-red-500"
                        />
                        <span className="ml-1.5 text-[11px] text-zinc-400">
                          Active
                        </span>
                      </label>
                    </div>

                    {day.enabled && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex-1">
                          <label className="block text-[11px] text-zinc-500 mb-1">
                            Start
                          </label>
                          <input
                            type="time"
                            value={day.start}
                            onChange={(e) =>
                              handleScheduleChange(key, "start", e.target.value)
                            }
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[11px] text-zinc-500 mb-1">
                            End
                          </label>
                          <input
                            type="time"
                            value={day.end}
                            onChange={(e) =>
                              handleScheduleChange(key, "end", e.target.value)
                            }
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-zinc-500">
              Later, this schedule will directly control which times clients can
              pick on the booking page.
            </p>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-zinc-800">
              <div className="text-xs text-zinc-400">
                <p className="font-medium text-zinc-300 mb-1">💡 Quick Tip:</p>
                <p>After saving your schedule, click "Generate Availability" to automatically create bookable time slots for the next 30 days.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateAvailability}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-500 transition whitespace-nowrap"
                >
                  🗓️ Generate Availability
                </button>
                <button
                  onClick={handleSaveSchedule}
                  className="px-4 py-2 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-500 transition whitespace-nowrap"
                >
                  Save Schedule
                </button>
              </div>
            </div>
          </section>
        )}

        {/* SERVICES TAB */}
        {activeTab === "services" && (
          <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/40 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-50">Services</h2>
                <p className="text-xs text-zinc-500">
                  These will appear on the website under &quot;Services&quot;.
                </p>
              </div>
            </div>
{/* CATEGORY MANAGEMENT */}
<div className="bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-4 space-y-4">
  <h3 className="text-sm font-semibold text-zinc-50">Service Categories</h3>
  
  {/* Add Category Form */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
    <div>
      <label className="block text-[11px] text-zinc-400 mb-1">Category Name</label>
      <input
        type="text"
        value={newCategory.name}
        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
        placeholder="e.g. Engine"
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
      />
    </div>
    <div>
      <label className="block text-[11px] text-zinc-400 mb-1">Spanish Name</label>
      <input
        type="text"
        value={newCategory.nameEs}
        onChange={(e) => setNewCategory(prev => ({ ...prev, nameEs: e.target.value }))}
        placeholder="e.g. Motor"
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
      />
    </div>
    <div>
      <label className="block text-[11px] text-zinc-400 mb-1">Icon</label>
      <input
        type="text"
        value={newCategory.icon}
        onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
        placeholder="🔧"
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
      />
    </div>
    <button
      type="button"
      onClick={async () => {
        if (!newCategory.name.trim()) return;
        
        const { data, error } = await supabase
          .from("service_categories")
          .insert({
            name: newCategory.name,
            name_es: newCategory.nameEs,
            icon: newCategory.icon || "🔧",
          })
          .select();
        
        if (!error && data) {
          setCategories(prev => [...prev, data[0]]);
          setNewCategory({ name: "", nameEs: "", icon: "" });
        }
      }}
      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-500"
    >
      Add Category
    </button>
  </div>



  {/* List Categories */}
  <div className="flex flex-wrap gap-2">
    {categories.map(cat => (
      <div key={cat.id} className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5">
        <span className="text-base">{cat.icon}</span>
        <span className="text-xs text-zinc-200">{cat.name}</span>
        <button
          type="button"
          onClick={async () => {
            await supabase.from("service_categories").delete().eq("id", cat.id);
            setCategories(prev => prev.filter(c => c.id !== cat.id));
          }}
          className="text-[10px] text-red-400 hover:text-red-300 ml-1"
        >
          ✕
        </button>
      </div>
    ))}
  </div>
</div>
{/* ← INSERT THE BULK ASSIGNMENT TOOL RIGHT HERE ↓ */}

{/* BULK ASSIGN CATEGORIES */}
<div className="bg-amber-950/20 border border-amber-700/40 rounded-xl px-4 py-4 space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="text-sm font-semibold text-amber-200">
      ⚡ Quick Assignment Tool
    </h3>
    <p className="text-xs text-amber-400">
      Assign categories to existing services
    </p>
  </div>

  <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
    {services.filter(s => !s.category_id).map(service => (
      <div key={service.id} className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-700 rounded-lg p-3">
        <span className="text-xl">{service.icon}</span>
        <span className="text-xs text-zinc-200 flex-1">{service.title}</span>
        <select
          onChange={async (e) => {
            const categoryId = e.target.value;
            if (!categoryId) return;
            
            const { error } = await supabase
              .from("services")
              .update({ category_id: categoryId })
              .eq("id", service.id);
            
            if (!error) {
              setServices(prev => prev.map(s => 
                s.id === service.id ? { ...s, category_id: categoryId } : s
              ));
            }
          }}
          className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-200"
        >
          <option value="">Assign to...</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>
    ))}
    
    {services.filter(s => !s.category_id).length === 0 && (
      <p className="text-center text-xs text-zinc-500 py-4">
        ✅ All services have been assigned to categories!
      </p>
    )}
  </div>
</div>

{/* ← BULK ASSIGNMENT TOOL ENDS HERE */}

            {/* Add service form */}
            <form
              onSubmit={handleAddService}
              className="bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-4 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Service Name (English)
                  </label>
                  <input
                    type="text"
                    value={newService.name}
                    onChange={(e) =>
                      setNewService((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g. Brake Inspection"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
  <label className="block text-[11px] text-zinc-400 mb-1">
    Category
  </label>
  <select
    value={newService.categoryId}
    onChange={(e) =>
      setNewService((prev) => ({
        ...prev,
        categoryId: e.target.value,
      }))
    }
    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
    required
  >
    <option value="">Select a category...</option>
    {categories.map(cat => (
      <option key={cat.id} value={cat.id}>
        {cat.icon} {cat.name}
      </option>
    ))}
  </select>
</div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Service Name (Spanish)
                  </label>
                  <input
                    type="text"
                    value={newService.nameEs}
                    onChange={(e) =>
                      setNewService((prev) => ({
                        ...prev,
                        nameEs: e.target.value,
                      }))
                    }
                    placeholder="e.g. Inspección de frenos"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Icon (emoji)
                  </label>
                  <input
                    type="text"
                    value={newService.icon}
                    onChange={(e) =>
                      setNewService((prev) => ({
                        ...prev,
                        icon: e.target.value,
                      }))
                    }
                    placeholder="e.g. 🔧 or 🛑"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

<div>
  <label className="block text-[11px] text-zinc-400 mb-1">
    Duration (hours)
  </label>
  <input
    type="number"
    min="1"
    max="8"
    value={newService.duration || 1}
    onChange={(e) =>
      setNewService((prev) => ({
        ...prev,
        duration: parseInt(e.target.value) || 1,
      }))
    }
    placeholder="e.g. 1 or 2"
    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
  />
  <p className="text-[10px] text-zinc-500 mt-1">
    How many hours this service typically takes
  </p>
</div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newService.description}
                  onChange={(e) =>
                    setNewService((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="What do you do for this service?"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Price (optional)
                  </label>
                  <input
                    type="text"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    placeholder='e.g. "From $79" or "Parts + labor"'
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Service Image (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setNewService((prev) => ({
                        ...prev,
                        imageFile: file,
                        imagePreview: URL.createObjectURL(file),
                      }));
                    }}
                    className="text-xs text-zinc-300"
                  />
                </div>
              </div>

              {newService.imagePreview && (
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Image Preview
                  </label>
                  <img
                    src={newService.imagePreview}
                    alt="Service preview"
                    className="w-32 h-32 rounded-lg object-cover border border-zinc-700"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-500 self-end"
                >
                  Add Service
                </button>
              </div>
            </form>

            {/* Services list */}
            <div className="space-y-3">
              {services.length === 0 && (
                <div className="text-center py-6 text-sm text-zinc-500">
                  No services added yet.
                </div>
              )}
              {services.map((s) => (
                <div
                  key={s.id}
                  className="bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    {s.image_url ? (
                      <img
                        src={`https://saphvmlpnbtzyhsqpalw.supabase.co/storage/v1/object/public/services/${s.image_url}`}
                        alt={s.title}
                        className="w-16 h-16 rounded-lg object-cover border border-zinc-700"
                      />
                    ) : s.icon && (
                      <div className="w-16 h-16 bg-zinc-900 rounded-lg border border-zinc-700 flex items-center justify-center text-2xl">
                        {s.icon}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-zinc-50">{s.title}</p>
                      {s.title_es && (
                        <p className="text-xs text-zinc-400 mt-1">
                          ES: {s.title_es}
                        </p>
                      )}
                      {s.description && (
                        <p className="text-xs text-zinc-400 mt-1">
                          {s.description}
                        </p>
                      )}
                      {s.price && (
                        <p className="text-[11px] text-zinc-500 mt-1">
                          {s.price}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteService(s.id)}
                    className="text-[11px] text-zinc-400 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* REVIEWS TAB */}
        {activeTab === "reviews" && (
          <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/40 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-50">
                  Testimonials
                </h2>
                <p className="text-xs text-zinc-500">
                  Add or edit reviews that will show on the homepage.
                </p>
              </div>
            </div>

            {/* Add review form */}
            <form
              onSubmit={handleAddReview}
              className="bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-4 space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={newReview.name}
                    onChange={(e) =>
                      setNewReview((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g. Luis R."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Service (optional)
                  </label>
                  <input
                    type="text"
                    value={newReview.service}
                    onChange={(e) =>
                      setNewReview((prev) => ({
                        ...prev,
                        service: e.target.value,
                      }))
                    }
                    placeholder="e.g. Brake job"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Rating
                  </label>
                  <select
                    value={newReview.rating}
                    onChange={(e) =>
                      setNewReview((prev) => ({
                        ...prev,
                        rating: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} stars
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Review Text
                </label>
                <textarea
                  value={newReview.text}
                  onChange={(e) =>
                    setNewReview((prev) => ({
                      ...prev,
                      text: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="What did they say about your work?"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Photo (optional)
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    setNewReview((prev) => ({
                      ...prev,
                      photoFile: file,
                      photoPreview: URL.createObjectURL(file),
                    }));
                  }}
                  className="text-xs text-zinc-300"
                />

                {newReview.photoPreview && (
                  <img
                    src={newReview.photoPreview}
                    alt="Preview"
                    className="w-20 h-20 mt-2 rounded-lg object-cover border border-zinc-700"
                  />
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-500"
                >
                  Add Testimonial
                </button>
              </div>
            </form>

            {/* Reviews list */}
            <div className="space-y-3">
              {reviews.length === 0 && (
                <div className="text-center py-6 text-sm text-zinc-500">
                  No testimonials added yet.
                </div>
              )}
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-zinc-50">
                        {r.name}
                      </p>
                      <p className="text-[11px] text-amber-300">
                        {"★".repeat(r.rating)}
                      </p>
                    </div>
                    {r.service && (
                      <p className="text-[11px] text-zinc-400 mb-1">
                        {r.service}
                      </p>
                    )}
                    <p className="text-xs text-zinc-300">{r.text}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    className="text-[11px] text-zinc-400 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MECHANICS TAB */}
        {activeTab === "mechanics" && (
          <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-5">
            <h2 className="text-lg font-semibold text-zinc-50">
              Mechanics Team
            </h2>
            <p className="text-xs text-zinc-500">
              Add additional mechanics for rotation.
            </p>

            {/* Add Mechanic Form */}
            <form
              onSubmit={handleAddMechanic}
              className="space-y-4 bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 text-xs"
            >
              <InputField
                label="Name"
                value={newMechanic.name}
                onChange={(e) =>
                  setNewMechanic((p) => ({ ...p, name: e.target.value }))
                }
              />

              <TextareaField
                label="Short Intro"
                rows={2}
                value={newMechanic.bioShort}
                onChange={(e) =>
                  setNewMechanic((p) => ({ ...p, bioShort: e.target.value }))
                }
              />

              <TextareaField
                label="Long Bio"
                rows={4}
                value={newMechanic.bioLong}
                onChange={(e) =>
                  setNewMechanic((p) => ({ ...p, bioLong: e.target.value }))
                }
              />

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    setNewMechanic((p) => ({
                      ...p,
                      photoFile: file,
                      photoPreview: URL.createObjectURL(file),
                    }));
                  }}
                />

                {newMechanic.photoPreview && (
                  <img
                    src={newMechanic.photoPreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-lg mt-2 object-cover border border-zinc-700"
                  />
                )}
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-500"
              >
                Add Mechanic
              </button>
            </form>

            {/* List Mechanics */}
            <div className="space-y-3">
              {mechanics.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-4">
                  No mechanics added yet.
                </p>
              )}

              {mechanics.map((m) => (
                <div
                  key={m.id}
                  className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{m.name}</p>
                    <p className="text-xs text-zinc-400 mt-1">{m.bio_short}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteMechanic(m.id)}
                    className="text-[11px] text-zinc-400 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SETTINGS TAB */}
{activeTab === "settings" && (
  <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-lg shadow-black/40 space-y-8">
    {/* Header */}
    <div>
      <h2 className="text-lg font-semibold text-zinc-50">Settings</h2>
      <p className="text-xs text-zinc-500">
        Business information used around the site.
      </p>
    </div>

    {/* SETTINGS FORM */}
    <form onSubmit={handleSaveSettings} className="space-y-8 text-xs">
      
      {/* ========== ADD THIS ENTIRE LOGO SECTION HERE ========== */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-50 pb-2 border-b border-zinc-700">
          Business Logo
        </h3>

        <div className="flex items-start gap-4">
          {/* Current Logo Preview */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-zinc-950 border border-zinc-700 rounded-lg overflow-hidden flex items-center justify-center">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-full object-contain p-2"
                />
              ) : settings.logoUrl ? (
                <img
                  src={getStorageUrl("business-assets", settings.logoUrl)}
                  alt="Current logo"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center p-4">
                  <div className="text-3xl mb-2">🔧</div>
                  <p className="text-[10px] text-zinc-500">
                    No logo uploaded
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Controls */}
          <div className="flex-1">
            <label className="block text-[11px] text-zinc-400 mb-1">
              Upload New Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;

                setLogoFile(file);
                setLogoPreview(URL.createObjectURL(file));
              }}
              className="text-xs text-zinc-300"
            />
            <p className="text-[10px] text-zinc-500 mt-2">
              Recommended: PNG or SVG with transparent background
              <br />
              Max size: 2MB
            </p>

            {(logoPreview || settings.logoUrl) && (
              <button
                type="button"
                onClick={() => {
                  setLogoFile(null);
                  setLogoPreview(null);
                  setSettings((prev) => ({ ...prev, logoUrl: null }));
                }}
                className="mt-3 text-[11px] text-red-400 hover:text-red-300 transition"
              >
                Remove Logo
              </button>
            )}
          </div>
        </div>
      </div>
      {/* ========== END LOGO SECTION ========== */}
              {/* BUSINESS INFO */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Business Name"
                    value={settings.businessName}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        businessName: e.target.value,
                      }))
                    }
                  />
                  <InputField
                    label="Tagline"
                    value={settings.tagline}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        tagline: e.target.value,
                      }))
                    }
                  />
                </div>

                <InputField
                  label="Home Base Address"
                  value={settings.baseAddress}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      baseAddress: e.target.value,
                    }))
                  }
                  sublabel="Used for calculating travel distance."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="Main Phone"
                    value={settings.phone}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                  <InputField
                    label="SMS Number"
                    value={settings.smsNumber}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        smsNumber: e.target.value,
                      }))
                    }
                    sublabel="Where booking and confirmation texts will be sent."
                  />
                  <InputField
                    label="Contact Email"
                    type="email"
                    value={settings.email}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                <TextareaField
                  label="Business Hours"
                  rows={3}
                  value={settings.hours}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, hours: e.target.value }))
                  }
                />

              
              </div>
              {/* SAVE GLOBAL SETTINGS */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-500"
                >
                  Save All Settings
                </button>
              </div>
            </form>
          </section>
        )}

        {/* PROMOTIONS TAB */}
        {activeTab === "promos" && (
          <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/40 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-50">
                  Promotions
                </h2>
                <p className="text-xs text-zinc-500">
                  Control promo banners shown on your website.
                </p>
              </div>
            </div>

            {/* Enable/Disable */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={promo.enabled}
                onChange={(e) =>
                  setPromo((prev) => ({ ...prev, enabled: e.target.checked }))
                }
                className="w-4 h-4 rounded border-zinc-600 text-red-500"
              />
              <span className="text-sm text-zinc-300">
                Show Promo Banner on Website
              </span>
            </label>

            {/* Promo Text */}
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">
                Promo Text
              </label>
              <input
                type="text"
                value={promo.text}
                onChange={(e) =>
                  setPromo((prev) => ({ ...prev, text: e.target.value }))
                }
                placeholder="e.g. 10% Off for Veterans & First Responders!"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-500"
              >
                Save Promo Settings
              </button>
            </div>
          </section>
        )}
      </div>

      {expandedPhoto && (
  <div
    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
    onClick={() => setExpandedPhoto(null)}
  >
    <div
      className="relative max-w-3xl w-full px-4"
      onClick={(e) => e.stopPropagation()} // prevent closing when clicking image
    >
      <button
        onClick={() => setExpandedPhoto(null)}
        className="absolute -top-8 right-2 text-zinc-300 hover:text-white text-sm"
      >
        ✕ Close
      </button>

      <img
        src={expandedPhoto}
        alt="Expanded job photo"
        className="w-full max-h-[80vh] object-contain rounded-xl border border-zinc-700 shadow-xl"
      />
    </div>
  </div>
)}

    </main>
  );
}