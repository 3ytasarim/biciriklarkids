import { z } from "zod";
import { normalizeTrPhone, PROVINCES } from "./tr";

const name = (label: string) => z.string().trim().min(2, `${label} en az 2 karakter olmalı.`).max(80);

/** Ödeme formu şeması — istemcide (React Hook Form) ve sunucuda (server action) aynı kurallar. */
export const checkoutSchema = z
  .object({
    email: z.email("Geçerli bir e-posta adresi girin.").max(160),
    phone: z
      .string()
      .trim()
      .refine((v) => normalizeTrPhone(v) !== null, "Geçerli bir cep telefonu girin (05xx xxx xx xx)."),
    firstName: name("Ad"),
    lastName: name("Soyad"),
    city: z.enum(PROVINCES, { error: "İl seçin." }),
    district: z.string().trim().min(2, "İlçe girin.").max(80),
    postalCode: z
      .string()
      .trim()
      .regex(/^(\d{5})?$/, "Posta kodu 5 haneli olmalı.")
      .optional(),
    addressLine: z.string().trim().min(10, "Açık adresinizi (mahalle, sokak, no, daire) yazın.").max(400),
    billingSame: z.boolean(),
    invoiceType: z.enum(["individual", "corporate"]),
    billingFirstName: z.string().trim().max(80).optional(),
    billingLastName: z.string().trim().max(80).optional(),
    billingCity: z.string().trim().max(60).optional(),
    billingDistrict: z.string().trim().max(80).optional(),
    billingAddressLine: z.string().trim().max(400).optional(),
    companyName: z.string().trim().max(160).optional(),
    taxOffice: z.string().trim().max(80).optional(),
    taxNumber: z
      .string()
      .trim()
      .regex(/^(\d{10,11})?$/, "Vergi/T.C. kimlik no 10–11 haneli olmalı.")
      .optional(),
    note: z.string().trim().max(500).optional(),
    paymentMethod: z.string().min(1, "Ödeme yöntemi seçin.").max(40),
    /** Kargo firması kimliği (admin'de aktif firma tanımlıysa sunucu zorunlu tutar). */
    shippingCarrier: z.string().max(40).optional(),
    acceptTerms: z.literal(true, { error: "Devam etmek için sözleşmeleri onaylayın." }),
    marketingConsent: z.boolean().optional(),
    saveAddress: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.billingSame) {
      if (!v.billingFirstName || v.billingFirstName.length < 2) ctx.addIssue({ code: "custom", path: ["billingFirstName"], message: "Fatura adı girin." });
      if (!v.billingLastName || v.billingLastName.length < 2) ctx.addIssue({ code: "custom", path: ["billingLastName"], message: "Fatura soyadı girin." });
      if (!v.billingCity || !(PROVINCES as readonly string[]).includes(v.billingCity)) ctx.addIssue({ code: "custom", path: ["billingCity"], message: "Fatura ili seçin." });
      if (!v.billingDistrict || v.billingDistrict.length < 2) ctx.addIssue({ code: "custom", path: ["billingDistrict"], message: "Fatura ilçesi girin." });
      if (!v.billingAddressLine || v.billingAddressLine.length < 10) ctx.addIssue({ code: "custom", path: ["billingAddressLine"], message: "Fatura adresi girin." });
    }
    if (v.invoiceType === "corporate") {
      if (!v.companyName || v.companyName.length < 2) ctx.addIssue({ code: "custom", path: ["companyName"], message: "Firma ünvanı girin." });
      if (!v.taxOffice || v.taxOffice.length < 2) ctx.addIssue({ code: "custom", path: ["taxOffice"], message: "Vergi dairesi girin." });
      if (!v.taxNumber || v.taxNumber.length !== 10) ctx.addIssue({ code: "custom", path: ["taxNumber"], message: "10 haneli vergi numarası girin." });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
