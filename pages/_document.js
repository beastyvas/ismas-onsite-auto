import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "name": "Isma's OnSite Auto Repair",
    "alternateName": "OnSite Auto LV",
    "description": "Mobile mechanic serving Las Vegas, Henderson, North Las Vegas, and Clark County. We come to your home or office — no towing required. Same-day service available.",
    "url": "https://www.onsiteautolv.com",
    "telephone": "+17028017210",
    "priceRange": "$$",
    "image": "https://www.onsiteautolv.com/og-image.png",
    "logo": "https://www.onsiteautolv.com/logo.png",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Las Vegas",
      "addressRegion": "NV",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 36.1699,
      "longitude": -115.1398
    },
    "areaServed": [
      { "@type": "City", "name": "Las Vegas" },
      { "@type": "City", "name": "Henderson" },
      { "@type": "City", "name": "North Las Vegas" },
      { "@type": "City", "name": "Summerlin" },
      { "@type": "City", "name": "Spring Valley" },
      { "@type": "AdministrativeArea", "name": "Clark County" }
    ],
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
        "opens": "08:00",
        "closes": "18:00"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Mobile Auto Repair Services",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Oil Change" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Brake Repair" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Battery Replacement" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Engine Diagnostics" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Tire Services" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Emergency Roadside Assistance" } }
      ]
    },
    "sameAs": [],
    "foundingDate": "2021",
    "slogan": "We Come To You — Expert Service, Right at Your Driveway"
  };

  return (
    <Html lang="en">
      <Head>
        {/* Primary */}
        <title>Mobile Mechanic Las Vegas | Isma&apos;s OnSite Auto Repair</title>
        <meta name="description" content="Mobile mechanic in Las Vegas, NV. We come to your home or office — oil changes, brakes, diagnostics & more. Same-day service available. Call (702) 801-7210." />
        <meta name="keywords" content="mobile mechanic Las Vegas, mobile auto repair Las Vegas, mechanic near me Las Vegas, mobile mechanic Henderson NV, car repair at home Las Vegas, mobile oil change Las Vegas, brake repair Las Vegas, emergency mechanic Las Vegas, mobile mechanic Clark County" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Isma's OnSite Auto Repair" />
        <link rel="canonical" href="https://www.onsiteautolv.com" />

        {/* Geo — boosts local relevance */}
        <meta name="geo.region" content="US-NV" />
        <meta name="geo.placename" content="Las Vegas" />
        <meta name="geo.position" content="36.1699;-115.1398" />
        <meta name="ICBM" content="36.1699, -115.1398" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Isma's OnSite Auto Repair" />
        <meta property="og:title" content="Mobile Mechanic Las Vegas | Isma's OnSite Auto Repair" />
        <meta property="og:description" content="Mobile mechanic that comes to you anywhere in Las Vegas. Oil changes, brakes, diagnostics & more. Book online or call (702) 801-7210." />
        <meta property="og:url" content="https://www.onsiteautolv.com" />
        <meta property="og:image" content="https://www.onsiteautolv.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mobile Mechanic Las Vegas | Isma's OnSite Auto Repair" />
        <meta name="twitter:description" content="Mobile mechanic that comes to you anywhere in Las Vegas. Book online or call (702) 801-7210." />
        <meta name="twitter:image" content="https://www.onsiteautolv.com/og-image.png" />

        {/* Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Local Business JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
