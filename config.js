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

  // Optional: shown in the footer if filled in.
  instagram: "",  // e.g. "https://instagram.com/yourhandle"
};
