import { z } from 'zod';

export const ContentToDesignSchema = z.object({
  content_package: z.any(),
});

export const DesignToQualitySchema = z.object({
  email_package: z.any(),
});

export const QualityToDeliverySchema = z.object({
  quality_package: z.any(),
});

export type ContentToDesign = z.infer<typeof ContentToDesignSchema>;
export type DesignToQuality = z.infer<typeof DesignToQualitySchema>;
export type QualityToDelivery = z.infer<typeof QualityToDeliverySchema>; 