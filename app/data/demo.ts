import type { Lead, SourcingRule, Vehicle, Wanted } from "../types";

const images = [
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=82",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=82",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=82",
  "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1400&q=82",
];
const baseTimeline = (stockNo: string) => [
  { id: `${stockNo}-1`, time: "22 Aug 2026 · 10:40", label: "Vehicle imported", detail: "Manual source added to NK Cars." },
  { id: `${stockNo}-2`, time: "22 Aug 2026 · 10:42", label: "AI parsed", detail: "Vehicle fields extracted; uncertain values flagged." },
];
const source = (id: string, name: string, seller: string, price: number, status: "Verified" | "Needs verification" = "Verified") => ({
  id, name, seller, price, url: "https://example.com/demo-source", lastVerified: status === "Verified" ? "22 Aug 2026 · 10:45" : "21 Aug 2026 · 17:10", status,
});

export const demoVehicles: Vehicle[] = [
  { id:"v1",stockNo:"NK-26081",brand:"Toyota",model:"Hilux Revo",year:"2020",grade:"Prerunner E",engine:"2.4 GD",transmission:"AT",drive:"2WD",body:"Double Cab",mileage:"78,400 km",color:"White",sourcePrice:625000,sellingPrice:735000,state:"Waiting Review",availabilityVerified:true,image:images[0],plateMasked:"8กษ ••••",vinMasked:"MR0•••••••7812",sources:[source("s1","Bangkok Dealer A","Demo Seller A",625000),source("s2","Marketplace B","Demo Seller B",638000)],confidence:{brand:98,model:97,year:94,grade:71,engine:88,mileage:91},possibleDuplicate:"NK-26077",timeline:baseTimeline("NK-26081")},
  { id:"v2",stockNo:"NK-26082",brand:"Ford",model:"Ranger",year:"2021",grade:"Wildtrak",engine:"2.0 Bi-Turbo",transmission:"AT",drive:"4WD",body:"Double Cab",mileage:"64,200 km",color:"Black",sourcePrice:890000,sellingPrice:1045000,state:"Waiting Review",availabilityVerified:false,image:images[1],plateMasked:"3ขก ••••",vinMasked:"MNA•••••••4036",sources:[source("s3","Chiang Mai Partner","Demo Seller C",890000,"Needs verification")],confidence:{brand:99,model:98,year:96,grade:93,engine:91,mileage:82},timeline:baseTimeline("NK-26082")},
  { id:"v3",stockNo:"NK-26083",brand:"Isuzu",model:"D-Max",year:"2019",grade:"V-Cross",engine:"3.0",transmission:"AT",drive:"4WD",body:"Double Cab",mileage:"Need Review",color:"Grey",sourcePrice:715000,sellingPrice:845000,state:"Waiting Review",availabilityVerified:true,image:images[2],plateMasked:"7กอ ••••",vinMasked:"MPA•••••••9901",sources:[source("s4","Khon Kaen Source","Demo Seller D",715000)],confidence:{brand:98,model:95,year:90,grade:88,engine:86,mileage:0},timeline:baseTimeline("NK-26083")},
  { id:"v4",stockNo:"NK-26071",brand:"Toyota",model:"Hilux Revo",year:"2022",grade:"Rocco",engine:"2.8 GD",transmission:"AT",drive:"4WD",body:"Double Cab",mileage:"41,800 km",color:"Black",sourcePrice:1080000,sellingPrice:1250000,state:"Published",availabilityVerified:true,image:images[3],plateMasked:"4ขค ••••",vinMasked:"MR0•••••••1159",sources:[source("s5","VIGO4U Demo Stock","Internal Demo",1080000)],confidence:{brand:100,model:100,year:100,grade:100,engine:100,mileage:100},timeline:[...baseTimeline("NK-26071"),{id:"v4-3",time:"21 Aug 2026 · 14:30",label:"Owner approved",detail:"Approved and published to Marketplace."}]},
  { id:"v5",stockNo:"NK-26072",brand:"Toyota",model:"Hilux Vigo",year:"2014",grade:"Champ G",engine:"3.0 D-4D",transmission:"AT",drive:"4WD",body:"Double Cab",mileage:"139,000 km",color:"Silver",sourcePrice:465000,sellingPrice:575000,state:"Published",availabilityVerified:true,image:images[0],plateMasked:"2กย ••••",vinMasked:"MR0•••••••5477",sources:[source("s6","Ayutthaya Dealer","Demo Seller E",465000)],confidence:{brand:100,model:100,year:100,grade:96,engine:100,mileage:95},timeline:baseTimeline("NK-26072")},
  { id:"v6",stockNo:"NK-26073",brand:"Ford",model:"Ranger",year:"2020",grade:"XLT",engine:"2.2",transmission:"MT",drive:"2WD",body:"Double Cab",mileage:"92,300 km",color:"Blue",sourcePrice:530000,sellingPrice:655000,state:"Published",availabilityVerified:true,image:images[1],plateMasked:"9กท ••••",vinMasked:"MNA•••••••6630",sources:[source("s7","Pattaya Source","Demo Seller F",530000)],confidence:{brand:100,model:100,year:100,grade:94,engine:98,mileage:96},timeline:baseTimeline("NK-26073")},
  { id:"v7",stockNo:"NK-26074",brand:"Isuzu",model:"D-Max",year:"2021",grade:"Hi-Lander L",engine:"1.9",transmission:"AT",drive:"2WD",body:"Double Cab",mileage:"58,900 km",color:"White",sourcePrice:695000,sellingPrice:815000,state:"Published",availabilityVerified:true,image:images[2],plateMasked:"1ขส ••••",vinMasked:"MPA•••••••3312",sources:[source("s8","Bangkok Partner","Demo Seller G",695000)],confidence:{brand:100,model:100,year:100,grade:96,engine:100,mileage:99},timeline:baseTimeline("NK-26074")},
  { id:"v8",stockNo:"NK-26075",brand:"Toyota",model:"Hilux Revo",year:"2020",grade:"E Plus",engine:"2.4 GD",transmission:"AT",drive:"2WD",body:"Smart Cab",mileage:"72,100 km",color:"White",sourcePrice:595000,sellingPrice:720000,state:"Reserved",availabilityVerified:true,image:images[3],plateMasked:"6กว ••••",vinMasked:"MR0•••••••8204",sources:[source("s9","Nakhon Pathom Source","Demo Seller H",595000)],confidence:{brand:100,model:100,year:100,grade:98,engine:100,mileage:97},timeline:baseTimeline("NK-26075")},
  { id:"v9",stockNo:"NK-26061",brand:"Toyota",model:"Hilux Revo",year:"2019",grade:"Rocco",engine:"2.8 GD",transmission:"AT",drive:"4WD",body:"Double Cab",mileage:"88,700 km",color:"Grey",sourcePrice:850000,sellingPrice:995000,state:"Sold",availabilityVerified:false,image:images[0],plateMasked:"8กง ••••",vinMasked:"MR0•••••••2078",sources:[source("s10","Demo Archive","Demo Seller I",850000)],confidence:{brand:100,model:100,year:100,grade:100,engine:100,mileage:100},lastSoldPrice:995000,soldMonth:"July 2026",destination:"Kenya",timeline:[...baseTimeline("NK-26061"),{id:"v9-3",time:"14 Jul 2026 · 16:20",label:"Vehicle sold",detail:"Export destination: Kenya."}]},
];

export const demoLeads: Lead[] = [
  {id:"l1",customer:"James Mwangi",country:"Kenya",vehicleId:"v4",requirement:"Hilux Revo 4WD AT",stage:"Availability Check",lastActivity:"8 min ago",assigned:"Nune",port:"Mombasa",quantity:1,budget:"USD 36,000"},
  {id:"l2",customer:"Moses Phiri",country:"Zambia",vehicleId:"v5",requirement:"Vigo 2013–2015 AT",stage:"Vehicle Selected",lastActivity:"42 min ago",assigned:"Whawa",port:"Dar es Salaam",quantity:2,budget:"USD 18,000 / unit"},
  {id:"l3",customer:"Amina Yusuf",country:"Tanzania",requirement:"5 × Revo 2020 4WD AT",stage:"Qualified",lastActivity:"2 hr ago",assigned:"Nune",port:"Dar es Salaam",quantity:5,budget:"Need Review"},
  {id:"l4",customer:"Peter Banda",country:"Malawi",vehicleId:"v6",requirement:"Ford Ranger 2020",stage:"New",lastActivity:"Yesterday",assigned:"Unassigned",port:"Beira",quantity:1,budget:"USD 21,000"},
  {id:"l5",customer:"Chipo Ndlovu",country:"Zimbabwe",requirement:"D-Max 4WD 2019–2021",stage:"Closed",lastActivity:"3 days ago",assigned:"Whawa",port:"Maputo",quantity:1,budget:"USD 27,000"},
];

export const demoWanted: Wanted[] = [
  {id:"w1",customer:"Amina Yusuf",model:"Hilux Revo",yearRange:"2020–2022",transmission:"AT",drive:"4WD",body:"Double Cab",mileage:"< 100,000 km",color:"Any",quantity:5,budget:"USD 28,000 / unit",country:"Tanzania",port:"Dar es Salaam",status:"Matched"},
  {id:"w2",customer:"Daniel Tembo",model:"Ford Ranger",yearRange:"2019–2021",transmission:"AT",drive:"4WD",body:"Double Cab",mileage:"< 120,000 km",color:"Black / Grey",quantity:2,budget:"USD 25,000 / unit",country:"Zambia",port:"Dar es Salaam",status:"Searching"},
  {id:"w3",customer:"Grace Nyarko",model:"Hilux Vigo",yearRange:"2012–2015",transmission:"AT",drive:"2WD",body:"Double Cab",mileage:"Any",color:"White",quantity:1,budget:"USD 17,000",country:"Ghana",port:"Tema",status:"Customer Reviewing"},
];

export const demoRules: SourcingRule[] = [
  {id:"r1",brand:"Toyota",model:"Hilux Revo",years:"2020–2022",maxPrice:950000,transmission:"AT",drive:"4WD",body:"Double Cab",maxMileage:"100,000 km",color:"Any",area:"Thailand",required:"original, book",excluded:"flood, finance",priority:"Urgent",active:true},
  {id:"r2",brand:"Ford",model:"Ranger",years:"2019–2021",maxPrice:800000,transmission:"AT",drive:"4WD",body:"Double Cab",maxMileage:"120,000 km",color:"Black / Grey",area:"Central",required:"service history",excluded:"heavy accident",priority:"High",active:true},
  {id:"r3",brand:"Toyota",model:"Hilux Vigo",years:"2012–2015",maxPrice:500000,transmission:"AT",drive:"Any",body:"Double Cab",maxMileage:"Any",color:"White",area:"Thailand",required:"ready transfer",excluded:"cut chassis",priority:"Normal",active:false},
];
