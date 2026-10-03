// CIERRE-TRAMO-01 · guard del alta (C3; Liam, 2026-10-03: «arreglá el alta para que escriba cityStateZip, con un guard en npm test que
// ejecute el alta y valide sin errores»). Desde C3, `validateConfig` da error por un campo de `contact.address` que no es calle, barrio
// ni ciudad (`street`, `district`, `cityStateZip`), y la pestaña Config manda el config entero: una ficha con el `city` que escribía el
// alta no se podía guardar. Esto EJECUTA lo que escribe el alta (`configDeAlta`, la función que llama `POST
// /api/onboarding/client-info`) con un cuerpo como el que manda el wizard pagado, y lo pasa por `validateConfig`; y la vuelta al wizard
// (`configToWizardData`) devuelve la ciudad. En las dos direcciones: el `city` de antes sí sería error.
import { test } from "node:test";
import assert from "node:assert/strict";
import { importarModulo } from "./orden/arreglos-03/_comun.ts";

type Issue = { path: string; message: string; severity: "error" | "warning" };

/** El cuerpo que arma `paid-wizard-client.tsx` (sin las urls de material, que el alta copia tal cual). */
const cuerpo = (niche: string) => ({
  clientId: "alta-prueba",
  niche,
  businessMode: "team",
  businessName: "Studio Prueba",
  tagline: "Una línea",
  description: "Una descripción del negocio.",
  contact: {
    phone: "+972 3-000-0000",
    email: "hello@example.com",
    address: { street: "Herzl 1", district: "Florentin", city: "Tel Aviv" },
    instagram: "",
    facebook: "",
    whatsapp: "+972 3-000-0000",
  },
  colors: "gold black",
  accentColor: "#c9a227",
  services: [{ id: "corte", label: "Corte", price: "120", duration: "45" }],
  hours: { sunday: { isOpen: true, open: "09:00", close: "18:00" } },
  ownerName: "Noa",
  ownerRole: "Dueña",
  ownerBio: "Bio.",
  benefits: [{ title: "Rápido", desc: "Sin espera", iconName: "Star" }],
  testimonials: [{ name: "Dana", title: "", text: "Excelente.", rating: 5 }],
  faqItems: [{ q: "¿Abren el sábado?", a: "No." }],
  faviconEmoji: "✂️",
  locale: "he",
});

test("el alta escribe la ciudad en contact.address.cityStateZip y su config pasa validateConfig sin errores (todos los nichos del wizard)", async () => {
  const { configDeAlta } = (await importarModulo("src/lib/onboarding-config.ts")) as { configDeAlta: (b: unknown, lang?: string) => Record<string, any> };
  const { validateConfig } = (await importarModulo("src/lib/config-validator.ts")) as { validateConfig: (c: unknown) => Issue[] };
  const { configToWizardData } = (await importarModulo("src/lib/wizard/config-to-wizard.ts")) as { configToWizardData: (c: unknown) => Record<string, any> };
  for (const niche of ["barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones", "peluqueria", "otro"]) {
    const config = configDeAlta(cuerpo(niche), "he");
    assert.deepEqual(config.contact.address, { street: "Herzl 1", district: "Florentin", cityStateZip: "Tel Aviv" }, `${niche}: la dirección del alta usa los campos que la página lee`);
    const errores = validateConfig(config).filter((i) => i.severity === "error");
    assert.deepEqual(errores, [], `${niche}: el config del alta pasa validateConfig sin errores`);
    assert.equal(configToWizardData(config).city, "Tel Aviv", `${niche}: la vuelta al wizard devuelve la ciudad`);
  }
  // La otra dirección: la dirección que escribía el alta antes (`city`) es error, y el wizard la sigue leyendo en una ficha vieja.
  const viejo = { contact: { address: { street: "Herzl 1", city: "Tel Aviv" } } };
  assert.deepEqual(validateConfig(viejo).filter((i) => i.severity === "error").map((i) => i.path), ["contact.address.city"], "el `city` de las altas viejas es error");
  assert.equal(configToWizardData(viejo).city, "Tel Aviv", "una ficha vieja con `city` sigue abriendo el wizard con su ciudad");
});
