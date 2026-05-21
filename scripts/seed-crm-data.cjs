/**
 * Seed CRM demo data para client_barber_01.
 * Crea appointments y customers realistas para video demo.
 *
 * Uso: node scripts/seed-crm-data.cjs
 */
const fs = require("fs");
const path = require("path");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

// --- Cargar .env.local ---
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
}

const pk = (env.FIREBASE_PRIVATE_KEY || "").split("\\n").join("\n");

const app = initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: pk,
  }),
});

const dbId = env.FIREBASE_DATABASE_ID;
const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

const CLIENT_ID = "client_barber_01";

// --- Helpers ---
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(d) {
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

// --- Demo Customers ---
const customers = [
  {
    email: "david.cohen@gmail.com",
    fullName: "David Cohen",
    phone: "+972-50-123-4567",
    source: "booking",
    visitCount: 5,
    tags: ["VIP", "regular"],
    preferences: ["Fade bajo", "Sin producto"],
    notes: "Prefiere a Alex. Siempre pide cafe.",
  },
  {
    email: "yossi.levi@gmail.com",
    fullName: "Yossi Levi",
    phone: "+972-52-987-6543",
    source: "booking",
    visitCount: 3,
    tags: ["regular"],
    preferences: ["Barba completa"],
    notes: "",
  },
  {
    email: "mike.ross@outlook.com",
    fullName: "Michael Ross",
    phone: "+972-54-555-1234",
    source: "walk-in",
    visitCount: 1,
    tags: ["nuevo"],
    preferences: [],
    notes: "Primera visita. Turista de NYC.",
  },
  {
    email: "avi.mizrahi@walla.co.il",
    fullName: "Avi Mizrahi",
    phone: "+972-50-777-8899",
    source: "booking",
    visitCount: 8,
    tags: ["VIP", "regular", "referral"],
    preferences: ["Corte clasico", "Shave con toalla caliente"],
    notes: "Cliente desde el dia 1. Trajo 3 referidos.",
  },
  {
    email: "tom.b@gmail.com",
    fullName: "Tom Ben-David",
    phone: "+972-53-222-3344",
    source: "instagram",
    visitCount: 2,
    tags: [],
    preferences: ["Color treatment"],
    notes: "Vino por Instagram. Interesado en color.",
  },
  {
    email: "noam.shapira@gmail.com",
    fullName: "Noam Shapira",
    phone: "+972-58-111-9988",
    source: "booking",
    visitCount: 4,
    tags: ["regular"],
    preferences: ["Full ritual"],
    notes: "Siempre reserva el ritual completo los viernes.",
  },
];

// --- Demo Appointments ---
const today = new Date();
const todayStr = formatDate(today);
const tomorrowStr = formatDate(daysFromNow(1));
const day3Str = formatDate(daysFromNow(2));
const yesterdayStr = formatDate(daysFromNow(-1));
const twoDaysAgoStr = formatDate(daysFromNow(-2));
const threeDaysAgoStr = formatDate(daysFromNow(-3));
const lastWeekStr = formatDate(daysFromNow(-7));

const appointments = [
  // --- Pasados (completed) ---
  {
    customerName: "David Cohen",
    customerEmail: "david.cohen@gmail.com",
    customerPhone: "+972-50-123-4567",
    serviceId: "haircut",
    staffId: "alex",
    date: lastWeekStr,
    time: "10:00",
    duration: 30,
    status: "completed",
    createdAt: daysFromNow(-8),
  },
  {
    customerName: "Avi Mizrahi",
    customerEmail: "avi.mizrahi@walla.co.il",
    customerPhone: "+972-50-777-8899",
    serviceId: "full-ritual",
    staffId: "alex",
    date: lastWeekStr,
    time: "14:00",
    duration: 75,
    status: "completed",
    createdAt: daysFromNow(-8),
  },
  {
    customerName: "Yossi Levi",
    customerEmail: "yossi.levi@gmail.com",
    customerPhone: "+972-52-987-6543",
    serviceId: "beard-sculpt",
    staffId: "daniel",
    date: threeDaysAgoStr,
    time: "11:00",
    duration: 25,
    status: "completed",
    createdAt: daysFromNow(-4),
  },
  {
    customerName: "Tom Ben-David",
    customerEmail: "tom.b@gmail.com",
    customerPhone: "+972-53-222-3344",
    serviceId: "color-treatment",
    staffId: "daniel",
    date: twoDaysAgoStr,
    time: "15:00",
    duration: 50,
    status: "completed",
    createdAt: daysFromNow(-3),
  },
  {
    customerName: "David Cohen",
    customerEmail: "david.cohen@gmail.com",
    customerPhone: "+972-50-123-4567",
    serviceId: "straight-shave",
    staffId: "alex",
    date: yesterdayStr,
    time: "09:30",
    duration: 35,
    status: "completed",
    createdAt: daysFromNow(-2),
  },

  // --- Hoy ---
  {
    customerName: "Noam Shapira",
    customerEmail: "noam.shapira@gmail.com",
    customerPhone: "+972-58-111-9988",
    serviceId: "full-ritual",
    staffId: "alex",
    date: todayStr,
    time: "10:00",
    duration: 75,
    status: "confirmed",
    createdAt: daysFromNow(-1),
  },
  {
    customerName: "Michael Ross",
    customerEmail: "mike.ross@outlook.com",
    customerPhone: "+972-54-555-1234",
    serviceId: "haircut",
    staffId: "daniel",
    date: todayStr,
    time: "11:30",
    duration: 30,
    status: "confirmed",
    createdAt: daysFromNow(-1),
  },
  {
    customerName: "Avi Mizrahi",
    customerEmail: "avi.mizrahi@walla.co.il",
    customerPhone: "+972-50-777-8899",
    serviceId: "beard-sculpt",
    staffId: "alex",
    date: todayStr,
    time: "14:00",
    duration: 25,
    status: "pending",
    createdAt: new Date(),
  },

  // --- Futuros ---
  {
    customerName: "Yossi Levi",
    customerEmail: "yossi.levi@gmail.com",
    customerPhone: "+972-52-987-6543",
    serviceId: "haircut",
    staffId: "alex",
    date: tomorrowStr,
    time: "10:00",
    duration: 30,
    status: "confirmed",
    createdAt: new Date(),
  },
  {
    customerName: "David Cohen",
    customerEmail: "david.cohen@gmail.com",
    customerPhone: "+972-50-123-4567",
    serviceId: "full-ritual",
    staffId: "alex",
    date: tomorrowStr,
    time: "16:00",
    duration: 75,
    status: "confirmed",
    createdAt: new Date(),
  },
  {
    customerName: "Tom Ben-David",
    customerEmail: "tom.b@gmail.com",
    customerPhone: "+972-53-222-3344",
    serviceId: "color-treatment",
    staffId: "daniel",
    date: day3Str,
    time: "12:00",
    duration: 50,
    status: "pending",
    createdAt: new Date(),
  },
  {
    customerName: "Noam Shapira",
    customerEmail: "noam.shapira@gmail.com",
    customerPhone: "+972-58-111-9988",
    serviceId: "straight-shave",
    staffId: "daniel",
    date: day3Str,
    time: "15:00",
    duration: 35,
    status: "confirmed",
    createdAt: new Date(),
  },

  // --- Uno cancelado para variedad ---
  {
    customerName: "Michael Ross",
    customerEmail: "mike.ross@outlook.com",
    customerPhone: "+972-54-555-1234",
    serviceId: "beard-sculpt",
    staffId: "alex",
    date: yesterdayStr,
    time: "16:00",
    duration: 25,
    status: "cancelled",
    createdAt: daysFromNow(-3),
  },
];

// --- Seed ---
async function seed() {
  console.log(`Seeding CRM data para ${CLIENT_ID}...\n`);

  // 1. Customers
  console.log("--- Customers ---");
  for (const c of customers) {
    const docId = `${CLIENT_ID}_${simpleHash(c.email.toLowerCase())}`;
    const now = Timestamp.now();
    const lastVisit = Timestamp.fromDate(daysFromNow(-Math.floor(Math.random() * 7)));

    await db.collection("customers").doc(docId).set({
      clientId: CLIENT_ID,
      email: c.email.toLowerCase(),
      fullName: c.fullName,
      phone: c.phone,
      source: c.source,
      visitCount: c.visitCount,
      tags: c.tags,
      preferences: c.preferences,
      notes: c.notes,
      lastVisitAt: lastVisit,
      createdAt: Timestamp.fromDate(daysFromNow(-30)),
      updatedAt: now,
    }, { merge: true });

    console.log(`  ✓ ${c.fullName} (${docId})`);
  }

  // 2. Appointments
  console.log("\n--- Appointments ---");
  for (const a of appointments) {
    const docRef = db.collection("appointments").doc();
    await docRef.set({
      clientId: CLIENT_ID,
      customerName: a.customerName,
      customerEmail: a.customerEmail,
      customerPhone: a.customerPhone,
      serviceId: a.serviceId,
      staffId: a.staffId,
      date: a.date,
      time: a.time,
      duration: a.duration,
      status: a.status,
      createdAt: Timestamp.fromDate(a.createdAt),
    });

    const emoji = a.status === "completed" ? "✅" :
                  a.status === "confirmed" ? "📅" :
                  a.status === "pending" ? "⏳" : "❌";
    console.log(`  ${emoji} ${a.date} ${a.time} — ${a.customerName} (${a.serviceId}) [${a.status}]`);
  }

  console.log(`\n🎉 Seed completo: ${customers.length} customers, ${appointments.length} appointments`);
  console.log("Refresh el CRM del template para ver los datos.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
