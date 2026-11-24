// ─────────────────────────────────────────────────────────────
//  EDIT ME. Everything personal on the site comes from this file.
//  Change a value, save, push. No other file needs touching.
// ─────────────────────────────────────────────────────────────
window.SITE = {
  // Shown in the header, page title and profile card.
  name: "Q",

  // The site's look: one of the ids in themes.js (night, negroni, absinthe, midnight,
  // bourbon, champagne, tikinight, velvet, mezcal, rose).
  style: "night",
  // While choosing, a "Style" button lets visitors flip through every look.
  // Set to false once the style is picked.
  showStylePicker: true,

  rate: 50,   // dollars per hour
  years: 12,  // years of experience

  // Booking requests get emailed here (sent through formsubmit.co, free, no account).
  // The very first request sends a one-time "activate" email to this address: click it once.
  email: "marquise22.mt@gmail.com",

  // Optional: a Calendly / Cal.com / Google booking link. Adds a "pick a time" button.
  calendarLink: "",

  // Put your photo in this folder with this file name (portrait shots look best).
  photo: "photo.jpg",

  // Your ABC licence / RBS certification details.
  abc: {
    number: "RBS-0000000",
    issuer: "California ABC (RBS certified)",
    expires: "MM/YYYY",
    // Optional: a picture or PDF of the certificate in this folder, e.g. "abc-certificate.pdf"
    proof: "",
  },

  // Travel: priced by how far the event is from home, worked out as the client types their city.
  travel: {
    // Where trips start. lat/lon: right-click the spot in Google Maps and copy the two numbers.
    home: { name: "Cleveland, TN", lat: 35.1595, lon: -84.8766 },
    freeMiles: 25,        // no travel charge this close to home
    driveUpTo: 300,       // up to here it's a drive; further, it's a flight
    perMile: 0.70,        // driving, charged on the road miles there and back past freeMiles
    roadFactor: 1.25,     // road miles are about this much longer than a straight line
    overnightOver: 150,   // a drive further than this adds a hotel night
    hotelNight: 150,      // per night
    flightBase: 150,      // flight estimate: this plus flightPerMile × miles (round trip)
    flightPerMile: 0.15,
    longHaulOver: 2500,   // flights further than this take a travel day each way instead of one
    travelDayFee: 0,      // per day spent travelling (0 = not charged)
    perDiem: 0,           // meals, per day away (0 = not charged)
  },

  // Optional: shown in the footer if filled in.
  instagram: "",  // e.g. "https://instagram.com/yourhandle"
};
