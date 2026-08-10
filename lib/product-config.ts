// ============================================================
// كتالوج منتجات App Studio (SDKLite)
// ------------------------------------------------------------
// يجب إضافة كل منتج في لوحة App Studio → المنتجات (Products)
// بنفس الـ slug المذكور أدناه، والسعر بييجي من السيرفر مش من
// الكود. لو المنتج مش مضاف، payWithPi بترجع product_not_found.
// ============================================================
export const PRODUCT_CONFIG = {
  // منتجات القالب الأولية (تم إنشاؤها في App Studio سابقاً)
  PRODUCT_6a2532aa26d7f34ec446f379: "6a2532aa26d7f34ec446f379",
  PRODUCT_6a2532b7325f2077f088f4d7: "6a2532b7325f2077f088f4d7",

  // منتج إحياء الأصول النافقة (0.5 Pi)
  LIFELINE_REVIVE: "lifeline_revive",

  // منتجات تأجير الأراضي — أضفها بنفس الـ slugs:
  //   land_tier_farmer (2 Pi) | land_tier_pasha (7 Pi)
  //   land_tier_royal (15 Pi) | land_tier_golden_pyramid (30 Pi)
  //   land_tier_solar_temple (50 Pi)
  LAND_TIER: (tierId: string) => `land_tier_${tierId}`,

  // منتجات الإيجار من شاشة ديوان الأراضي القديمة
  LAND_RENT: (landId: string) => `land_rent_${landId}`,

  // منتجات خدمات السوق المتقدم:
  //   service_market_p2p (2.5) | service_royal_exchange (4.5)
  //   service_factory_hub (6.5) | service_crown_ledger (8.5)
  SERVICE: (serviceId: string) => `service_${serviceId}`,

  // منتجات الشراء الآمن (P2P escrow)
  P2P: (listingId: string) => `p2p_${listingId}`,
} as const;
