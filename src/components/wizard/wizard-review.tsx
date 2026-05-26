"use client";

import { WizardStep } from "./wizard-step";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";

function ReviewSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="wiz-review-section">
      <div className="wiz-review-head">
        <span className="wiz-review-label">{label}</span>
      </div>
      <div className="wiz-review-body">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="wiz-review-item">
      <span className="wiz-review-k">{label}</span>
      <span className="wiz-review-v">{value}</span>
    </div>
  );
}

export function StepReview({
  data,
  variant,
  errors,
}: StepProps & { goTo?: (step: number) => void }) {
  const { t } = useT();
  const w = t.wizard;

  const nicheLabel = data.niche === "otro"
    ? data.customNiche || w.niches.otro
    : w.niches[data.niche] || data.niche;

  return (
    <WizardStep
      title={variant === "free" ? w.reviewTitle : w.reviewTitle}
      subtitle={variant === "free" ? w.reviewSub : w.reviewSubPaid}
      errors={errors}
    >
      <div className="wiz-review">
        <ReviewSection label={w.sectionBusiness}>
          <ReviewItem label={w.businessNameLabel} value={data.businessName} />
          <ReviewItem label={w.nicheTypeLabel} value={nicheLabel} />
          <ReviewItem label={w.modeLabel} value={data.businessMode === "solo" ? w.solo : w.team} />
          {data.tagline && <ReviewItem label={w.taglineLabel} value={data.tagline} />}
          {data.description && <ReviewItem label={w.descLabel} value={data.description} />}
        </ReviewSection>

        <ReviewSection label={w.sectionContact}>
          <ReviewItem label={w.whatsappLabel} value={data.whatsapp} />
          <ReviewItem label={w.emailLabel} value={data.email} />
          {data.phone && <ReviewItem label={w.phoneLabel} value={data.phone} />}
          <ReviewItem label={w.instagramLabel} value={data.instagram} />
          {data.facebook && <ReviewItem label={w.facebookLabel} value={data.facebook} />}
          {data.address && <ReviewItem label={w.addressLabel} value={[data.address, data.district, data.city].filter(Boolean).join(", ")} />}
        </ReviewSection>

        {(data.colors || data.accentColor || data.logoCreate || data.logo) && (
          <ReviewSection label={w.sectionStyle}>
            {data.colors && <ReviewItem label={w.colorsLabel} value={data.colors} />}
            {data.accentColor && (
              <div className="wiz-review-item">
                <span className="wiz-review-k">{w.accentLabel}</span>
                <span className="wiz-review-v" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    className="wiz-color-dot active"
                    style={{ background: data.accentColor, width: 14, height: 14 }}
                  />
                  {data.accentColor}
                </span>
              </div>
            )}
            {data.logoCreate && <ReviewItem label="Logo" value={w.logoCreateLabel} />}
            {data.logo && <ReviewItem label="Logo" value={data.logo.name} />}
          </ReviewSection>
        )}

        {variant === "paid" && data.services.filter((s) => s.visible).length > 0 && (
          <ReviewSection label={w.sectionServices}>
            {data.services
              .filter((s) => s.visible)
              .map((s) => (
                <ReviewItem
                  key={s.id}
                  label={s.label || s.id}
                  value={[s.price && `${s.price} NIS`, s.duration && `${s.duration} min`].filter(Boolean).join(" / ") || "—"}
                />
              ))}
          </ReviewSection>
        )}

        {variant === "paid" && (
          <ReviewSection label={w.sectionHours}>
            {Object.entries(data.hours).map(([day, h], i) => (
              <ReviewItem
                key={day}
                label={w.dayNames[i] || day}
                value={h.isOpen ? `${h.open} - ${h.close}` : w.closed}
              />
            ))}
          </ReviewSection>
        )}

        {data.ownerName && (
          <ReviewSection label={w.sectionOwner}>
            <ReviewItem label={w.ownerNameLabel} value={data.ownerName} />
            <ReviewItem label={w.ownerRoleLabel} value={data.ownerRole} />
          </ReviewSection>
        )}
      </div>
    </WizardStep>
  );
}
