import { z } from "zod";

export const InquiryKindSchema = z.enum(["단체복", "커스텀 소량 굿즈"]);
export const DesignStageSchema = z.enum(["complete", "assets_only", "need_help"]);

export const Step1Schema = z.object({ inquiry_kind: InquiryKindSchema });
export const Step2Schema = z.object({
  priorities: z
    .array(z.object({ key: z.string(), rank: z.number().int().min(1).max(3) }))
    .max(5),
});
export const Step3Schema = z.object({
  items: z.array(z.string()).min(1),
  item_custom: z.string().optional(),
});
export const Step4Schema = z.object({ quantity: z.number().int().min(1) });
export const Step5Schema = z.object({ design: DesignStageSchema });
export const Step6Schema = z.object({ needed_date: z.string() });
export const Step7Schema = z.object({ heard_about: z.string() });
export const Step8Schema = z.object({ name: z.string().min(1), contact: z.string().min(3), privacy_consent: z.literal(true) });
export const Step9Schema = z.object({ preferred_time_start: z.string(), preferred_time_end: z.string() });

export type Step1 = z.infer<typeof Step1Schema>;
export type Step2 = z.infer<typeof Step2Schema>;
export type Step3 = z.infer<typeof Step3Schema>;
export type Step4 = z.infer<typeof Step4Schema>;
export type Step5 = z.infer<typeof Step5Schema>;
export type Step6 = z.infer<typeof Step6Schema>;
export type Step7 = z.infer<typeof Step7Schema>;
export type Step8 = z.infer<typeof Step8Schema>;
export type Step9 = z.infer<typeof Step9Schema>;

