import type { InternalSourceRecord } from "./demo-internal-data";

type CaptureSeed = Omit<
  InternalSourceRecord,
  | "id"
  | "adapterId"
  | "sourceReference"
  | "sourcePlatform"
  | "sourceUrl"
  | "imageUrls"
  | "availability"
  | "demo"
  | "originalMediaCount"
> & {
  listingId: string;
  files: string;
};

const seeds: CaptureSeed[] = [
  {
    listingId: "4406225212934069",
    files: "f0bab1d1bd86f101.jpg 8697018227f36ef9.jpg 0ba855e8f75b4f06.jpg 51372ba48027443c.jpg 441fb27cb2804242.jpg 91f850c0a9e1b65c.jpg b49b4d028013226a.jpg fd2aade7890beda0.jpg e4d0761afd1e9d81.jpg a9a7b3f1f9fb4b72.jpg 8c0b4208452d2d18.jpg 545154a4971cb435.jpg c500ea62da4f8865.jpg 83380ad27171b350.jpg 560fd7863bb19120.jpg 6f2afd6c89637384.jpg 730b6970a6ef408a.jpg 84eccce4fb5679a0.jpg 20472c9db5c734f6.jpg",
    sellerName: "Pranee Pra Jaideaw",
    sellerPhone: "Not listed in captured evidence",
    exactLocation: "Bangkok, Thailand",
    internalNotes: "Seller states one owner, two keys, regular servicing, no heavy-load use, and recently changed Michelin tires. These claims are not independently verified. Raw media is Owner-only pending plate masking and media review.",
    title: "2020 Toyota Hilux Revo Rocco 2.4 AT",
    summary: "A 2020 Hilux Revo Rocco double cab. The listing states 2.4L, automatic transmission, 2WD, and 64,000 km. Availability, condition, ownership history, and current price still require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Rocco", engine: "2.4L diesel",
    transmission: "AT", drive: "2WD", body: "Double Cab", mileageKm: 64000, color: "White",
    observedPriceThb: 759000, observedAt: "2026-08-25T15:50:31.281Z", generalLocation: "Bangkok",
    translationState: "Normalized", evidenceLabels: ["Listing title", "Listing description", "Marketplace vehicle facts"],
  },
  {
    listingId: "1072449122204129",
    files: "317f53df576e1dff.png aafccfe047e22de8.jpg 17b583e728bfe998.jpg 653fd59f5cf0a078.jpg fc4a1d86f3cfcceb.jpg 48474efea42c4bff.jpg 5dd5a18dc02b2f68.jpg 030a7a2d086e22d0.jpg d5d8ce855a3a81d0.jpg 986d811cb4b303c8.jpg 846664b55a7cab48.jpg 1055437622571f8b.jpg da64d50a84f0c271.jpg",
    sellerName: "Apple Kanda",
    sellerPhone: "Not listed in captured evidence",
    exactLocation: "Bang Saen / Nong Mon, Chon Buri, Thailand",
    internalNotes: "Seller states one-owner history. The source claims and condition have not been independently verified. Raw media remains Owner-only.",
    title: "2020 Toyota Hilux Revo Rocco 2.4 AT",
    summary: "A white 2020 Hilux Revo Rocco double cab. The listing states a 2.4L diesel engine, automatic transmission, 2WD, and 168,000 km. Availability and condition remain unverified.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Rocco", engine: "2.4L diesel",
    transmission: "AT", drive: "2WD", body: "Double Cab", mileageKm: 168000, color: "White",
    observedPriceThb: 598000, observedAt: "2026-08-25T15:50:39.454Z", generalLocation: "Chon Buri",
    translationState: "Normalized", evidenceLabels: ["Listing title", "Listing description", "Marketplace vehicle facts"],
  },
  {
    listingId: "28269089766055915",
    files: "31ca245a0a689c58.jpg 9d4cea584664a12f.jpg 817aeaff8f915111.jpg b4644b95bd17b576.jpg 28e2e924c4317a01.jpg 905effe5ed4f1d7e.jpg cad6f45749395a65.jpg c12b07cba6f2c335.jpg a7ba5e1e2bdbd9cb.jpg eddd9efa1829617d.jpg 43312de35f4f78f5.jpg bfc46fa0bd2218d3.jpg 0e5bd6a5a4b677ac.jpg",
    sellerName: "Priyaporn",
    sellerPhone: "Not listed in captured evidence",
    exactLocation: "Phutthamonthon Sai 4 / Samut Sakhon area, Thailand",
    internalNotes: "Listing references Kusuma Auto and states 98,xxx km. Drive type and body configuration were not explicit enough to confirm. Raw media remains Owner-only.",
    title: "2020 Toyota Hilux Revo 2.4 AT",
    summary: "A grey 2020 Hilux Revo with a claimed 2.4L diesel engine, automatic transmission, and approximately 98,000 km. Body configuration, drive type, availability, and condition need review.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Unknown", engine: "2.4L diesel",
    transmission: "AT", drive: "Unknown", body: "Need Review", mileageKm: 98000, color: "Grey",
    observedPriceThb: 530000, observedAt: "2026-08-25T15:50:47.265Z", generalLocation: "Samut Sakhon",
    translationState: "Need Review", evidenceLabels: ["Listing title", "Listing description", "Drive and body need review"],
  },
  {
    listingId: "1612765793828637",
    files: "094069d1fae161a1.jpg 45faaa6145f8bdfb.jpg 4ce18b13b9c6bcc8.jpg 3f6c265d11151174.jpg e9b032a68b33a6f3.jpg ce440be07418bfea.jpg 7c8b40c991b9a2a6.jpg 210d46e03505c581.jpg 857bacec9999ab4b.jpg ae60c3e197250361.jpg aa912be2b1caabab.jpg 30baf21006297fb3.jpg ca40503001af853a.jpg 8ad5e8cb8c213290.jpg 109d715417c6da45.jpg 23227d1b20f03c50.jpg c412caf587bdc222.jpg 29317b744e3e74b7.jpg 123cfe144110c395.jpg",
    sellerName: "Tingly Pisitkul",
    sellerPhone: "Not listed in captured evidence",
    exactLocation: "Bang Lamung, Chon Buri, Thailand",
    internalNotes: "Seller claims one-owner history and Toyota Sure provenance. These claims and the current vehicle condition require verification. Raw media remains Owner-only.",
    title: "2020 Toyota Hilux Revo Prerunner Entry 2.4 AT",
    summary: "A grey 2020 Hilux Revo Double Cab Entry Prerunner with automatic transmission and a claimed 41,600 km. Availability, Toyota Sure history, and condition remain unverified.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Entry Prerunner", engine: "2.4L diesel",
    transmission: "AT", drive: "2WD", body: "Double Cab", mileageKm: 41600, color: "Grey",
    observedPriceThb: 558000, observedAt: "2026-08-25T15:50:55.501Z", generalLocation: "Chon Buri",
    translationState: "Normalized", evidenceLabels: ["Listing title", "Listing description", "Marketplace vehicle facts"],
  },
  {
    listingId: "959507670501941",
    files: "06ccac6d455e0cb2.jpg 2fbaa17af20eb729.jpg f607560e199297ea.jpg bf09ffdef23826de.jpg 8741f4ae35dbeec5.jpg 7b292e6db9d8f6a0.jpg 114560b00babead1.jpg c275bf9b32d2e9e2.jpg d8a473d44cfa333f.jpg 702ef80dfdbaf01c.jpg f154154e6102d3d0.jpg e793f2d0145b0eb1.jpg",
    sellerName: "Phanudet Wisutthong",
    sellerPhone: "Not listed in captured evidence",
    exactLocation: "Ban Na San / Surat Thani, Thailand",
    internalNotes: "Seller states one-owner history and Ironman suspension. A captured odometer image shows 247,356 km. Raw media remains Owner-only.",
    title: "2020 Toyota Hilux Revo 2.8 4WD MT Single Cab",
    summary: "A grey 2020 Hilux Revo single cab with a claimed 2.8L diesel engine, manual transmission, 4WD, and an odometer image showing 247,356 km. Availability, modifications, and condition require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Unknown", engine: "2.8L diesel",
    transmission: "MT", drive: "4WD", body: "Single Cab", mileageKm: 247356, color: "Grey",
    observedPriceThb: 599000, observedAt: "2026-08-25T15:51:03.222Z", generalLocation: "Surat Thani",
    translationState: "Need Review", evidenceLabels: ["Listing title", "Listing description", "Odometer photo: 247,356 km"],
  },
  {
    listingId: "4157304391235946",
    files: "015cbc075cbe166a.jpg 36dab0131a826a5e.jpg ce85152056d9b4dc.jpg 1d3a05ffb527235d.jpg e3fc43acaeff7bc6.jpg f0833ddb1c6b1c48.jpg 1ea3974296dba83c.jpg a57145a9ba858ebb.jpg 4629c8bafcb3db72.jpg f4c02d1fe6b61cfa.jpg 8f49080de4e8742d.jpg 849cadf726070f52.jpg 4f93b1fc24298d40.jpg",
    sellerName: "Wonder Car Kook",
    sellerPhone: "086 399 1067",
    exactLocation: "Surat Thani, Thailand",
    internalNotes: "Listing states model year 2020 and registration in 2021. This date distinction must be retained during review. Raw media and seller contact are Owner-only.",
    title: "2020 Toyota Hilux Revo Prerunner 2.4 Mid MT",
    summary: "A black Hilux Revo Prerunner 2.4 Mid with manual transmission and 90,955 km. The listing states model year 2020 and registration in 2021, so documents should confirm the customer-facing year.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Prerunner Mid", engine: "2.4L diesel",
    transmission: "MT", drive: "2WD", body: "Need Review", mileageKm: 90955, color: "Black",
    observedPriceThb: 599000, observedAt: "2026-08-25T15:51:11.349Z", generalLocation: "Surat Thani",
    translationState: "Need Review", evidenceLabels: ["Listing title", "Listing description", "Model year 2020 / registered 2021"],
  },
  {
    listingId: "28105500719058350",
    files: "caab8104dec4001d.jpg d19f42c1e753ec71.jpg 46f16062dec796a4.jpg d34882fdcb341b92.jpg a9903203eff89fb4.jpg 3e8c3953cbfbb5db.jpg 2ef7676655961173.jpg ded854998dc3f904.jpg 0becd94d54e90c55.jpg 987eb0ce58cfd8da.jpg 2ecd2350a2282956.jpg b91518b2e04a4c34.jpg 7ba01d4323298b26.jpg ee3f2a22ed905a3b.jpg 61038295d5919af2.jpg c05a15302521ee94.jpg 1e9c1862a1233443.jpg 8d2fdc6079370e0b.jpg e883cb8d9ca70c42.jpg d2146fc1bf351ffc.jpg",
    sellerName: "Facebook display name captured in Thai",
    sellerPhone: "094 372 4165",
    exactLocation: "Samut Prakan, Thailand",
    internalNotes: "Marketplace facts state 36,000 km while the seller description states 35,000 km. Mileage is a conflict and must remain Need Review. Raw media and seller details are Owner-only.",
    title: "2020 Toyota Hilux Revo Mid MT Double Cab",
    summary: "A black 2020 Hilux Revo Mid four-door pickup with manual transmission. The source contains conflicting mileage claims of 35,000 and 36,000 km, so mileage remains Need Review.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Mid", engine: "Unknown",
    transmission: "MT", drive: "Unknown", body: "Double Cab", mileageKm: 36000, color: "Black",
    observedPriceThb: 499000, observedAt: "2026-08-25T15:51:20.109Z", generalLocation: "Samut Prakan",
    translationState: "Need Review", evidenceLabels: ["Listing title", "Listing description", "Mileage conflict: 35,000 vs 36,000 km"],
  },
  {
    listingId: "1104577338649690",
    files: "3bda4bc9861ba953.jpg d242baf7e659395b.jpg 65f804e7de21b922.jpg 36322a45f1b73da4.jpg 092ada100d1444cc.jpg 8a486f20b9f13c82.jpg c5112b193fe4c6d5.jpg a0f7bd02b5846103.jpg c570acd459a4b7c1.jpg bc661c9f41d4f3ac.jpg 62a8e760da631a68.jpg 3d4070b7a9d52afe.jpg 1239b61f8f2e3a3c.jpg d7826d76433c15ae.jpg 85f4dd40e89446e3.jpg a964a1eaeb31b47a.jpg 0d2feb31c737bcfd.jpg 1e0e192cee7fa011.jpg 0568700d19e7a1de.jpg b61ab6189755019e.jpg",
    sellerName: "Nattaporn Chinrum",
    sellerPhone: "Not listed in captured evidence",
    exactLocation: "Bang Bua Thong, Nonthaburi, Thailand",
    internalNotes: "Seller description lists equipment and condition claims that remain unverified. Drive type was not explicit in the captured evidence. Raw media remains Owner-only.",
    title: "2020 Toyota Hilux Revo Smart Cab 2.4 Mid AT",
    summary: "A white 2020 Hilux Revo Smart Cab 2.4 Mid with automatic transmission and 97,225 km. Drive type, availability, equipment, and condition require verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Mid", engine: "2.4L diesel",
    transmission: "AT", drive: "Unknown", body: "Smart Cab", mileageKm: 97225, color: "White",
    observedPriceThb: 369000, observedAt: "2026-08-25T15:51:27.887Z", generalLocation: "Nonthaburi",
    translationState: "Need Review", evidenceLabels: ["Listing title", "Listing description", "Drive type needs review"],
  },
  {
    listingId: "1015890394739418",
    files: "15c95af7b8c4fb15.png a3d7fa27b1ed427e.jpg 1a651e022921679f.jpg 94780e35581975cd.jpg 32468067b2a8e24f.jpg a50034c5d3b65eba.jpg e492cc719d33950b.jpg 74faa72d747b7095.jpg 2a93374b55db5a90.jpg b5fe7cb6f4b56d9e.jpg 6e83f21bd2be9547.jpg 2e27a69ead912ccd.jpg 3d6725ffff6657bd.jpg acb906cef05f7a75.jpg dc25a71b5b3ba09c.jpg 0194e4283021a30e.jpg 87c37fd29626476c.jpg 9d0de7e59e2e37be.jpg",
    sellerName: "Benz Rattanachai",
    sellerPhone: "Not listed in captured evidence",
    exactLocation: "Bangkok, Thailand",
    internalNotes: "Seller claims one-owner history and Toyota Sure warranty. Drive type was not explicit enough to confirm. Raw media remains Owner-only.",
    title: "2020 Toyota Hilux Revo Rocco 2.4 AT Double Cab",
    summary: "A black 2020 Hilux Revo Rocco double cab with a claimed 2.4L diesel engine, automatic transmission, and 62,861 km. Availability, warranty, history, and condition remain unverified.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Rocco", engine: "2.4L diesel",
    transmission: "AT", drive: "Unknown", body: "Double Cab", mileageKm: 62861, color: "Black",
    observedPriceThb: 659000, observedAt: "2026-08-25T15:51:35.597Z", generalLocation: "Bangkok",
    translationState: "Normalized", evidenceLabels: ["Listing title", "Listing description", "Marketplace vehicle facts"],
  },
  {
    listingId: "1078557808193843",
    files: "1b5b80813c3fd30d.jpg f393703a985a0d4b.jpg 52b065880dab2d7b.jpg 821aecfebeb35192.jpg c00c77d19c7859ae.jpg dd33f9c07592e6c5.jpg 1f3519aef80e579e.jpg 7028696e309d78cc.jpg 00d2d31374a296ce.jpg 14e1df14d0e82daf.jpg a6918f9b7268c4a7.jpg 30fb0cf7d5af5704.jpg db4a2d45fa34180f.jpg f465e47211695bef.jpg 27d86299bd6d7aa4.jpg d7b59adee6c67bb8.jpg 808142a72f49e317.jpg c0b7b4082329dd06.jpg ae41f6a922b1fec3.jpg 09b066273571d031.jpg",
    sellerName: "Art Hinjaroen",
    sellerPhone: "080 632 3247",
    exactLocation: "Bang Yai / Bang Kruai, Nonthaburi, Thailand",
    internalNotes: "Seller claims one-owner history and no accident or flood damage. These claims are unverified. Raw media and seller contact are Owner-only.",
    title: "2020 Toyota Hilux Revo 2.8 4WD MT Single Cab",
    summary: "A black 2020 Hilux Revo single cab with a claimed 2.8L diesel engine, 4WD, manual transmission, and 98,000 km. Availability, history, and condition require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Unknown", engine: "2.8L diesel",
    transmission: "MT", drive: "4WD", body: "Single Cab", mileageKm: 98000, color: "Black",
    observedPriceThb: 589000, observedAt: "2026-08-25T15:51:43.342Z", generalLocation: "Nonthaburi",
    translationState: "Normalized", evidenceLabels: ["Listing title", "Listing description", "Marketplace vehicle facts"],
  },
];

// Raw browser evidence remains internal until plates and source clues are redacted.
export const capturedBatchInternalRecords: InternalSourceRecord[] = seeds.map((seed, index) => {
  const { listingId, files, evidenceLabels, ...record } = seed;
  const fileNames = files.split(" ");
  const sequence = String(index + 1).padStart(2, "0");
  return {
    ...record,
    id: `nk-fb-capture-2026-0825-${sequence}`,
    adapterId: "facebook-owner-browser-capture",
    sourceReference: `NK-FB-2026-0825-${sequence}`,
    sourcePlatform: "Facebook Marketplace",
    sourceUrl: `https://www.facebook.com/marketplace/item/${listingId}/`,
    imageUrls: [],
    availability: "Availability Not Yet Confirmed",
    demo: false,
    originalMediaCount: fileNames.length,
    evidenceLabels: [...evidenceLabels, `${fileNames.length} captured images`],
  };
});
