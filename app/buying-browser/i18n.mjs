export const SUPPORTED_LANGUAGES = Object.freeze(["en", "zh-CN", "th"]);

const dictionaries = {
  en: {
    language: "Language", english: "English", chinese: "简体中文", thai: "ไทย",
    browse: "Browse", saved: "Saved", myCases: "My Cases", inspections: "Inspections", messages: "Messages",
    vehiclePrice: "Vehicle Price", platformTransactionFee: "NK Platform & Transaction Fee", buyingServiceFee: "NK Buying Service",
    inspectionTravel: "Inspection & Travel", domesticTransport: "Domestic Transport", repairModification: "Repair / Modification",
    exportShipping: "Export / Shipping", otherAgreedCharges: "Other Agreed Charges", total: "Total", knownSubtotal: "Current total / subtotal",
    transparentPricing: "Transparent pricing", workingPriceStructure: "Working price structure", whatsIncluded: "What's included?",
    platformIncluded: "NK platform access, Vehicle Case, transaction workflow, document and workflow administration, case tracking, and system coordination.",
    buyingIncluded: "Thai seller communication, availability confirmation, seller verification, negotiation coordination, purchase coordination, and vehicle acquisition support.",
    nkServiceDisclosure: "These are NK Cars service fees. They are not charged by Facebook, Marketplace, the Thai government, or another third party.",
    finalPurchasePriceNote: "NK service amounts use the current vehicle price until the actual purchase price is confirmed. They recalculate from the actual vehicle purchase price.",
    pending: "Pending", known: "Known", pendingCosts: "{count} pending cost lines are excluded. This is not a final quote.",
    allCostsIncluded: "All current cost lines are included. Final approval is still required.",
    checkAvailability: "Check Availability", requestInspection: "Request Inspection", askNkAi: "Ask NK AI", saveToNk: "Save to NK", buyThroughNk: "Buy Through NK",
    browseVehicles: "Browse Vehicles", savedVehicles: "Saved Vehicles", searchVehicles: "Search vehicles", filters: "Filters", sort: "Sort",
    vehicleCriteria: "Vehicle criteria", location: "Thai search location", yearFrom: "Year from", yearTo: "Year to", minPrice: "Minimum price (USD)", maxPrice: "Maximum price (USD)", maxMileage: "Maximum mileage (km)", any: "Any", recommended: "Recommended", priceLow: "Price: low first", priceHigh: "Price: high first", newestYear: "Newest year", lowestMileage: "Lowest mileage", showVehicles: "Show {count} vehicles",
    vehicles: "vehicles", results: "results", pasteLink: "Paste link", noSaved: "No saved vehicles yet", noMatches: "No vehicles match these filters",
    resetFilters: "Reset filters", year: "Year", engine: "Engine", transmission: "Transmission", drive: "Drive", bodyCab: "Body / Cab", mileage: "Mileage",
    vehicleOverview: "Vehicle overview", vehicleSpecifications: "Vehicle specifications", continueThroughNk: "Continue through NK", chooseNext: "What would you like to do?",
    saveVehicle: "Save Vehicle", savedAction: "Saved", caseSummary: "Case summary", caseTimeline: "Case timeline", nkAiAssistant: "NK AI Assistant",
    inspectionNetwork: "Inspection network", conversationHistory: "Conversation history", account: "Account", sendQuestion: "Send question",
    askPlaceholder: "Ask about this vehicle, price, or inspection", sourceVehicle: "Source Vehicle", availability: "Availability", translation: "Translation",
    messagesTitle: "Messages", inspectionTitle: "Inspections", buy: "Buy", thailand: "Thailand", searchArea: "Search area",
    bangkokMetro: "Bangkok Metro", nearbyProvinces: "Nearby provinces", allThailand: "All Thailand",
    translatedVehicleDetails: "Translated vehicle details", translatedFromThai: "Translated from Thai", needsReview: "Needs review",
    originalFactsPreserved: "Original listing facts are preserved separately. Unknown details still require NK verification.", listingFacts: "Listing facts", sourcePhotos: "{count} source photos",
    recommendedFirstStep: "Recommended first step", inspectionInsideCase: "Managed inside your Vehicle Case", continueExistingCase: "Continue in your existing Vehicle Case", createCaseNoCommitment: "Start a Vehicle Case with no purchase commitment",
    inventoryStorage: "NK inventory storage", synchronized: "Synchronized", fallbackActive: "Fallback active",
    inventoryGroundingLive: "Results use Owner-approved records and customer-safe media from NK's QNAP storage.",
    inventoryGroundingFallback: "QNAP synchronization is unavailable. Results use the last verified NK snapshot and never invent current availability.",
    inventoryPrivacy: "Only Owner-approved customer-safe records and media are shown here. Source URLs, seller details, and internal storage references stay private.",
  },
  "zh-CN": {
    language: "语言", english: "English", chinese: "简体中文", thai: "ไทย",
    browse: "浏览", saved: "已保存", myCases: "我的案件", inspections: "验车", messages: "消息",
    vehiclePrice: "车辆价格", platformTransactionFee: "NK 平台及交易服务费", buyingServiceFee: "NK 购车服务费",
    inspectionTravel: "验车及出行费用", domesticTransport: "泰国内陆运输", repairModification: "维修 / 改装",
    exportShipping: "出口 / 海运费用", otherAgreedCharges: "其他约定费用", total: "总计", knownSubtotal: "当前总计 / 小计",
    transparentPricing: "透明价格", workingPriceStructure: "当前价格明细", whatsIncluded: "包含哪些服务？",
    platformIncluded: "包括 NK 平台使用、车辆案件、交易流程、文件与流程管理、案件跟踪和系统协调。",
    buyingIncluded: "包括与泰国卖家沟通、确认可售状态、卖家核实、议价协调、购买协调和车辆采购支持。",
    nkServiceDisclosure: "这些是 NK Cars 的服务费用，并非 Facebook、Marketplace、泰国政府或其他第三方收取。",
    finalPurchasePriceNote: "在实际购买价格确认前，NK 服务金额按当前车辆价格计算；确认后将按实际购买价格重新计算。",
    pending: "待确认", known: "已确认", pendingCosts: "{count} 项待确认费用未计入。这不是最终报价。",
    allCostsIncluded: "当前费用均已计入，最终仍需批准。",
    checkAvailability: "确认车辆是否可售", requestInspection: "申请验车", askNkAi: "询问 NK AI", saveToNk: "保存到 NK", buyThroughNk: "通过 NK 购买",
    browseVehicles: "浏览车辆", savedVehicles: "已保存车辆", searchVehicles: "搜索车辆", filters: "筛选", sort: "排序",
    vehicleCriteria: "车辆条件", location: "泰国搜索地区", yearFrom: "起始年份", yearTo: "截止年份", minPrice: "最低价格（USD）", maxPrice: "最高价格（USD）", maxMileage: "最高里程（km）", any: "不限", recommended: "推荐", priceLow: "价格从低到高", priceHigh: "价格从高到低", newestYear: "年份最新", lowestMileage: "里程最低", showVehicles: "显示 {count} 辆车",
    vehicles: "辆车", results: "个结果", pasteLink: "粘贴链接", noSaved: "尚未保存车辆", noMatches: "没有符合筛选条件的车辆",
    resetFilters: "重置筛选", year: "年份", engine: "发动机", transmission: "变速箱", drive: "驱动", bodyCab: "车身 / 驾驶室", mileage: "里程",
    vehicleOverview: "车辆概览", vehicleSpecifications: "车辆规格", continueThroughNk: "继续通过 NK", chooseNext: "您下一步想做什么？",
    saveVehicle: "保存车辆", savedAction: "已保存", caseSummary: "案件摘要", caseTimeline: "案件时间线", nkAiAssistant: "NK AI 助手",
    inspectionNetwork: "验车服务", conversationHistory: "对话记录", account: "账户", sendQuestion: "发送问题",
    askPlaceholder: "询问车辆、价格或验车信息", sourceVehicle: "来源车辆", availability: "可售状态", translation: "翻译",
    messagesTitle: "消息", inspectionTitle: "验车", buy: "购买", thailand: "泰国", searchArea: "搜索区域",
    bangkokMetro: "曼谷及周边地区", nearbyProvinces: "邻近府", allThailand: "全泰国",
    translatedVehicleDetails: "已翻译的车辆信息", translatedFromThai: "从泰语翻译", needsReview: "需要审核",
    originalFactsPreserved: "原始车源信息会单独保留。未知信息仍需 NK 核实。", listingFacts: "车源信息", sourcePhotos: "{count} 张车源照片",
    recommendedFirstStep: "建议的第一步", inspectionInsideCase: "在车辆案件中管理", continueExistingCase: "继续现有车辆案件", createCaseNoCommitment: "创建车辆案件，无购买承诺",
    inventoryStorage: "NK 车辆数据存储", synchronized: "已同步", fallbackActive: "正在使用备用数据",
    inventoryGroundingLive: "结果来自 NK QNAP 存储中经车主批准的记录和客户可见媒体。",
    inventoryGroundingFallback: "QNAP 同步当前不可用。结果使用 NK 最近验证的快照，不会虚构当前可售状态。",
    inventoryPrivacy: "这里只显示经车主批准的客户可见记录和媒体。车源链接、卖家信息和内部存储引用保持私密。",
  },
  th: {
    language: "ภาษา", english: "English", chinese: "简体中文", thai: "ไทย",
    browse: "ค้นหารถ", saved: "บันทึกแล้ว", myCases: "เคสของฉัน", inspections: "ตรวจสภาพ", messages: "ข้อความ",
    vehiclePrice: "ราคารถ", platformTransactionFee: "ค่าบริการแพลตฟอร์มและธุรกรรม NK", buyingServiceFee: "ค่าบริการจัดซื้อรถ NK",
    inspectionTravel: "ค่าตรวจรถและเดินทาง", domesticTransport: "ค่าขนส่งภายในประเทศไทย", repairModification: "ค่าซ่อม / ดัดแปลง",
    exportShipping: "ค่าขนส่งออก / ค่าระวาง", otherAgreedCharges: "ค่าใช้จ่ายอื่นที่ตกลงกัน", total: "ยอดรวม", knownSubtotal: "ยอดรวม / ยอดย่อยปัจจุบัน",
    transparentPricing: "โครงสร้างราคาโปร่งใส", workingPriceStructure: "รายละเอียดราคาปัจจุบัน", whatsIncluded: "รวมบริการอะไรบ้าง?",
    platformIncluded: "การใช้แพลตฟอร์ม NK, Vehicle Case, ขั้นตอนธุรกรรม, การจัดการเอกสารและงาน, การติดตามเคส และการประสานงานระบบ",
    buyingIncluded: "การสื่อสารกับผู้ขายไทย, ยืนยันว่ารถยังอยู่, ตรวจสอบผู้ขาย, ประสานการต่อรอง, ประสานการซื้อ และช่วยดำเนินการจัดซื้อรถ",
    nkServiceDisclosure: "ค่าบริการเหล่านี้เป็นของ NK Cars ไม่ใช่ค่าธรรมเนียมจาก Facebook, Marketplace, รัฐบาลไทย หรือบุคคลภายนอก",
    finalPurchasePriceNote: "ก่อนยืนยันราคาซื้อจริง ระบบใช้ราคารถปัจจุบันคำนวณค่าบริการ และจะคำนวณใหม่จากราคาซื้อรถจริงเมื่อยืนยันแล้ว",
    pending: "รอยืนยัน", known: "ยืนยันแล้ว", pendingCosts: "ยังไม่รวมค่าใช้จ่ายที่รอยืนยัน {count} รายการ และยังไม่ใช่ใบเสนอราคาสุดท้าย",
    allCostsIncluded: "รวมค่าใช้จ่ายปัจจุบันครบแล้ว แต่ยังต้องได้รับการอนุมัติขั้นสุดท้าย",
    checkAvailability: "ตรวจสอบว่ารถยังอยู่หรือไม่", requestInspection: "ขอตรวจสภาพรถ", askNkAi: "ถาม NK AI", saveToNk: "บันทึกเข้า NK", buyThroughNk: "ซื้อผ่าน NK",
    browseVehicles: "ค้นหารถ", savedVehicles: "รถที่บันทึกไว้", searchVehicles: "ค้นหารถ", filters: "ตัวกรอง", sort: "เรียงลำดับ",
    vehicleCriteria: "เงื่อนไขรถ", location: "พื้นที่ค้นหาในประเทศไทย", yearFrom: "ปีเริ่มต้น", yearTo: "ปีสิ้นสุด", minPrice: "ราคาต่ำสุด (USD)", maxPrice: "ราคาสูงสุด (USD)", maxMileage: "เลขไมล์สูงสุด (km)", any: "ทั้งหมด", recommended: "แนะนำ", priceLow: "ราคาต่ำไปสูง", priceHigh: "ราคาสูงไปต่ำ", newestYear: "ปีใหม่ที่สุด", lowestMileage: "เลขไมล์ต่ำที่สุด", showVehicles: "แสดงรถ {count} คัน",
    vehicles: "คัน", results: "ผลลัพธ์", pasteLink: "วางลิงก์", noSaved: "ยังไม่มีรถที่บันทึก", noMatches: "ไม่พบรถตามตัวกรอง",
    resetFilters: "ล้างตัวกรอง", year: "ปี", engine: "เครื่องยนต์", transmission: "เกียร์", drive: "ระบบขับเคลื่อน", bodyCab: "ตัวถัง / ห้องโดยสาร", mileage: "เลขไมล์",
    vehicleOverview: "ภาพรวมรถ", vehicleSpecifications: "ข้อมูลรถ", continueThroughNk: "ดำเนินการผ่าน NK", chooseNext: "ต้องการทำอะไรต่อ?",
    saveVehicle: "บันทึกรถ", savedAction: "บันทึกแล้ว", caseSummary: "สรุปเคส", caseTimeline: "ลำดับเหตุการณ์", nkAiAssistant: "ผู้ช่วย NK AI",
    inspectionNetwork: "เครือข่ายตรวจสภาพ", conversationHistory: "ประวัติการสนทนา", account: "บัญชี", sendQuestion: "ส่งคำถาม",
    askPlaceholder: "ถามเกี่ยวกับรถ ราคา หรือการตรวจสภาพ", sourceVehicle: "รถจากแหล่งภายนอก", availability: "สถานะรถ", translation: "การแปล",
    messagesTitle: "ข้อความ", inspectionTitle: "ตรวจสภาพ", buy: "ซื้อ", thailand: "ประเทศไทย", searchArea: "พื้นที่ค้นหา",
    bangkokMetro: "กรุงเทพและปริมณฑล", nearbyProvinces: "จังหวัดใกล้เคียง", allThailand: "ทั่วประเทศไทย",
    translatedVehicleDetails: "ข้อมูลรถที่แปลแล้ว", translatedFromThai: "แปลจากภาษาไทย", needsReview: "ต้องตรวจสอบ",
    originalFactsPreserved: "ระบบเก็บข้อมูลต้นฉบับแยกไว้ รายละเอียดที่ยังไม่ทราบต้องให้ NK ตรวจสอบ", listingFacts: "ข้อมูลจากประกาศ", sourcePhotos: "รูปจากแหล่งข้อมูล {count} รูป",
    recommendedFirstStep: "ขั้นตอนแรกที่แนะนำ", inspectionInsideCase: "จัดการภายใน Vehicle Case", continueExistingCase: "ดำเนินการต่อใน Vehicle Case เดิม", createCaseNoCommitment: "เริ่ม Vehicle Case โดยยังไม่ผูกมัดการซื้อ",
    inventoryStorage: "พื้นที่เก็บข้อมูลรถ NK", synchronized: "ซิงก์แล้ว", fallbackActive: "กำลังใช้ข้อมูลสำรอง",
    inventoryGroundingLive: "ผลลัพธ์ใช้ข้อมูลที่ Owner อนุมัติและสื่อลูกค้าที่ปลอดภัยจากพื้นที่เก็บข้อมูล QNAP ของ NK",
    inventoryGroundingFallback: "ขณะนี้ซิงก์ QNAP ไม่ได้ ระบบใช้ snapshot ล่าสุดที่ NK ตรวจสอบแล้วและจะไม่แต่งสถานะรถขึ้นเอง",
    inventoryPrivacy: "หน้านี้แสดงเฉพาะข้อมูลและสื่อที่ Owner อนุมัติให้ลูกค้าเห็น ลิงก์ต้นทาง ข้อมูลผู้ขาย และตำแหน่งจัดเก็บภายในยังเป็นข้อมูลส่วนตัว",
  },
};

export function normalizeLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value) ? value : "en";
}

export function detectSourceLanguage(text) {
  const value = String(text || "");
  if (/[฀-๿]/u.test(value)) return "th";
  if (/[㐀-鿿]/u.test(value)) return "zh-CN";
  if (/[A-Za-z]/.test(value)) return "en";
  return "unknown";
}

export function translate(language, key, variables = {}) {
  const dictionary = dictionaries[normalizeLanguage(language)] || dictionaries.en;
  const template = dictionary[key] || dictionaries.en[key] || key;
  return Object.entries(variables).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), template);
}

export function localizeListingSummary(listing, language) {
  const selected = normalizeLanguage(language);
  if (selected === "en") return listing.summary;
  const year = listing.year ?? (selected === "th" ? "รอตรวจสอบปี" : "年份待确认");
  const mileage = listing.mileageKm === null ? (selected === "th" ? "เลขไมล์รอตรวจสอบ" : "里程待确认") : `${listing.mileageKm.toLocaleString("en-US")} km`;
  if (selected === "zh-CN") return `${year} ${listing.brand} ${listing.model}，${listing.grade}，${listing.engine}，${listing.transmission}，${listing.drive}，${listing.body}，${mileage}。可售状态、价格和车况仍需核实。`;
  return `${year} ${listing.brand} ${listing.model} รุ่น ${listing.grade}, ${listing.engine}, เกียร์ ${listing.transmission}, ${listing.drive}, ${listing.body}, ${mileage} สถานะรถ ราคา และสภาพจริงยังต้องตรวจสอบ`;
}

export function localizeAvailability(status, language) {
  const selected = normalizeLanguage(language);
  if (selected === "en") return status;
  const labels = selected === "zh-CN" ? {
    "Availability Not Yet Confirmed": "可售状态尚未确认",
    "Availability Check Requested": "已申请确认可售状态",
    "Verified Available": "已确认可售",
    "Price Changed": "价格已变更",
    "Possibly Unavailable": "可能已不可售",
  } : {
    "Availability Not Yet Confirmed": "ยังไม่ได้ยืนยันว่ารถยังอยู่",
    "Availability Check Requested": "ส่งคำขอตรวจสอบสถานะแล้ว",
    "Verified Available": "ยืนยันว่ารถยังอยู่",
    "Price Changed": "ราคาเปลี่ยนแปลง",
    "Possibly Unavailable": "รถอาจไม่อยู่แล้ว",
  };
  return labels[status] || status;
}
