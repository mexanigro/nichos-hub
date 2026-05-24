import test from "node:test";
import assert from "node:assert/strict";
import {
  getNicheServices,
  normalizeBusinessNiche,
  resolveVisibleServiceIds,
  toggleVisibleService,
  type ServiceVisibilityConfig,
} from "./services.ts";

test("estetica service visibility can persist exactly two visible services", () => {
  const services = getNicheServices("estetica");
  let config: ServiceVisibilityConfig = { features: { showServices: true } };

  config = toggleVisibleService(config, services, "botox");
  config = toggleVisibleService(config, services, "facial");
  config = toggleVisibleService(config, services, "skin-booster");

  assert.deepEqual(config.visibleServices, ["lip-filler", "cheek-filler"]);
  assert.equal(config.features?.showServices, true);
  assert.deepEqual(resolveVisibleServiceIds(config, services), ["lip-filler", "cheek-filler"]);
});

test("hiding the last visible service disables the services section instead of saving an empty allow-list", () => {
  const services = getNicheServices("estetica");
  let config: ServiceVisibilityConfig = {
    features: { showServices: true },
    visibleServices: ["lip-filler"],
  };

  config = toggleVisibleService(config, services, "lip-filler");

  assert.equal(config.visibleServices, null);
  assert.equal(config.features?.showServices, false);
  assert.deepEqual(resolveVisibleServiceIds(config, services), []);
});

test("turning one service back on from hidden-all state saves a one-item allow-list", () => {
  const services = getNicheServices("estetica");
  const config = toggleVisibleService({ features: { showServices: false } }, services, "botox");

  assert.deepEqual(config.visibleServices, ["botox"]);
  assert.equal(config.features?.showServices, true);
  assert.deepEqual(resolveVisibleServiceIds(config, services), ["botox"]);
});

test("otro normalizes to estetica because deployments map custom niches to the estetica template", () => {
  assert.equal(normalizeBusinessNiche("otro"), "estetica");
  assert.deepEqual(
    getNicheServices("otro").map((service) => service.id),
    ["lip-filler", "cheek-filler", "botox", "facial", "skin-booster"],
  );
});

test("unknown visible service IDs are ignored before counting or saving", () => {
  const services = getNicheServices("estetica");

  assert.deepEqual(
    resolveVisibleServiceIds(
      { features: { showServices: true }, visibleServices: ["lip-filler", "unknown-service"] },
      services,
    ),
    ["lip-filler"],
  );
});
