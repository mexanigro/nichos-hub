# Wizard reference images

Mini-screenshots de cómo se ve cada sección del template en cada nicho.
Se muestran arriba del input correspondiente en `/onboarding/info` y `/onboarding/free`.

## Estructura esperada

```
public/wizard-refs/
  barberia/
    benefits.jpg
    testimonials.jpg
    faq.jpg
    hero.jpg
    services.jpg          (futuro)
    gallery.jpg           (futuro)
  estetica/
    ...
  tattoo/
    ...
  nails/
    ...
  cafeteria/
    ...
  remodelaciones/
    ...
```

## Spec de las imágenes

- **Aspecto**: 16:9 horizontal o 4:3.
- **Ancho**: 800-1200px (se renderiza max-height 220px con object-fit cover).
- **Peso**: < 150KB por imagen, JPG comprimido.
- **Contenido**: la sección del template renderizada con datos placeholder
  realistas del nicho (NO el sitio de un cliente real — datos de muestra).
- **Idioma**: puede ser cualquiera (se ve como referencia visual, el texto
  no importa tanto como el layout/style).

## Cómo se enchufan

El componente `WizardRefImage` (src/components/wizard/wizard-ref-image.tsx)
construye el path `/wizard-refs/{niche}/{stepKey}.jpg`. Si la imagen no
existe (404), no renderiza nada — fallback silencioso. Liam puede subir
imágenes una por una y van apareciendo.

## Cómo capturarlas

Una opción rápida (para una sesión futura):

1. Levantar cada template de nicho con datos placeholder.
2. Para cada step que tiene referencia (benefits, testimonials, faq, hero),
   tomar screenshot de la sección correspondiente.
3. Comprimir a JPG ~80% calidad, < 150KB.
4. Subir a `/public/wizard-refs/{niche}/{stepKey}.jpg`.

Un script Playwright que automatice esto requeriría:
- Acceso a los 5 repos de template (barber, estetica, tattoo, nails, cafe,
  remodelaciones).
- Datos placeholder por nicho.
- Selectores estables de cada sección.

Por ahora, captura manual es más rápida que automatizar — son ~24 imágenes
en total (6 nichos × 4 steps).

## Steps que aceptan referencia hoy

| stepKey       | renderizado en          | sección del template |
|---------------|-------------------------|----------------------|
| `benefits`    | step-benefits           | whyChooseUs          |
| `testimonials`| step-testimonials       | testimonials carousel|
| `faq`         | step-faq                | FAQ accordion        |
| `hero`        | step-gallery            | hero background      |

Agregar nuevos: importar `WizardRefImage` en el step y pasar `stepKey`.
