// Centralized EMI Data and Bank Tenures from official SSLCOMMERZ EMI chart
// Excluding City Bank and BRAC Bank as per instruction

export interface BankEmiConfig {
  id: string;
  name: string;
  shortName: string;
  tenures: number[];
}

export const EMI_MIN_AMOUNT = 5000;
export const SSL_OPERATION_HOTLINE = "09677725222";

// 30 Partner Commercial Banks (SL 1 to 30 from official chart, City Bank #31 and BRAC Bank excluded)
export const EMI_BANKS: BankEmiConfig[] = [
  { id: "one-bank", name: "One Bank LTD.", shortName: "One Bank", tenures: [3, 6, 9, 12] },
  { id: "exim-bank", name: "Exim Bank Limited", shortName: "Exim Bank", tenures: [3, 6, 9, 12] },
  { id: "sibl", name: "Shahjalal Islami Bank Limited (SIBL)", shortName: "SIBL", tenures: [3, 6, 9, 12] },
  { id: "dbl", name: "Dhaka Bank Limited (DBL)", shortName: "Dhaka Bank", tenures: [3, 6, 9, 12] },
  { id: "premier-bank", name: "Premier Bank Limited", shortName: "Premier Bank", tenures: [3, 6, 9, 12] },
  { id: "bal", name: "Bank Asia Limited (BAL)", shortName: "Bank Asia", tenures: [3, 6, 9, 12, 18, 24] },
  { id: "prime-bank", name: "Prime Bank Limited", shortName: "Prime Bank", tenures: [3, 6, 9, 12, 18, 24] },
  { id: "ucbl", name: "United Commercial Bank (UCBL)", shortName: "UCB", tenures: [3, 6, 9, 12, 24] },
  { id: "sbl", name: "Standard Bank Limited (SBL)", shortName: "Standard Bank", tenures: [3, 6, 9, 12, 18, 24] },
  { id: "lbf", name: "LankaBangla Finance (LBF)", shortName: "LankaBangla", tenures: [3, 6, 9, 12, 18, 24] },
  { id: "nrbc", name: "NRBC Bank Limited", shortName: "NRBC Bank", tenures: [3, 6, 9, 12, 18, 24] },
  { id: "sbac", name: "South Bangla Agriculture Bank (SBAC)", shortName: "SBAC Bank", tenures: [3, 6, 9, 12, 18, 24] },
  { id: "mdl", name: "Midland Bank Limited (MDL)", shortName: "Midland Bank", tenures: [3, 6, 9, 12, 18, 24] },
  { id: "pubali-bank", name: "Pubali Bank Limited", shortName: "Pubali Bank", tenures: [3, 6, 9, 12, 18, 24] },
  { id: "modhumoti", name: "Modhumoti Bank (PLC)", shortName: "Modhumoti Bank", tenures: [3, 6, 9, 12, 18, 24] },
  { id: "ab-bank", name: "AB Bank", shortName: "AB Bank", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "meghna-bank", name: "Meghna Bank Limited (MBL)", shortName: "Meghna Bank", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "al-arafah", name: "Al-Arafah Islami Bank Limited", shortName: "Al-Arafah", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "islami-bank", name: "Islami Bank Bangladesh (PLC)", shortName: "Islami Bank", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "nrb-bank", name: "NRB Bank Limited", shortName: "NRB Bank", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "mtb", name: "Mutual Trust Bank Limited (MTB)", shortName: "MTB", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "scb", name: "Standard Chartered Bank (SCB)", shortName: "Standard Chartered", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "ncc", name: "National Credit & Commerce Bank Limited (NCC)", shortName: "NCC Bank", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "dbbl", name: "Dutch Bangla Bank Limited (DBBL)", shortName: "DBBL", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "jamuna-bank", name: "Jamuna Bank Limited (JBL)", shortName: "Jamuna Bank", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "cbbl", name: "Community Bank Bangladesh Limited (CBBL)", shortName: "Community Bank", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "trust-bank", name: "Trust Bank Limited", shortName: "Trust Bank", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "ebl", name: "Eastern Bank Limited (EBL)", shortName: "Eastern Bank", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "mercantile-bank", name: "Mercantile Bank Limited (MBL)", shortName: "Mercantile Bank", tenures: [3, 6, 9, 12, 18, 24, 36] },
  { id: "southeast-bank", name: "Southeast Bank Limited (SEBL)", shortName: "Southeast Bank", tenures: [3, 6, 9, 12, 18, 24, 30, 36] }
];

// SSLCOMMERZ EMI Charge Rates Table from Image 2
export interface EmiRate {
  months: number;
  scbRate: number; // Standard Chartered Bank rate
  generalRate: number; // For All Other 29 Partner Banks
}

export const EMI_RATES: EmiRate[] = [
  { months: 3, scbRate: 5.67, generalRate: 5.13 },
  { months: 6, scbRate: 7.86, generalRate: 6.75 },
  { months: 9, scbRate: 10.74, generalRate: 8.99 },
  { months: 12, scbRate: 13.77, generalRate: 11.33 },
  { months: 18, scbRate: 17.65, generalRate: 15.03 },
  { months: 24, scbRate: 23.25, generalRate: 20.38 },
  { months: 30, scbRate: 0, generalRate: 21.80 }, // Only Southeast Bank supports 30M
  { months: 36, scbRate: 31.07, generalRate: 26.26 }
];
