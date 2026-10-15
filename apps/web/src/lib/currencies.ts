/**
 * Centralized ISO 4217 Currency Registry for ValGrow Business OS
 *
 * Supports all international currencies with their ISO 4217 code,
 * official display name, localized symbol, and standardized option label.
 *
 * Format: Currency Code — Currency Name (Symbol), e.g. "LKR — Sri Lankan Rupee (Rs)"
 */

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  label: string;
}

export const DEFAULT_CURRENCY = "INR";

export const CURRENCIES: Currency[] = [
  {
    "code": "INR",
    "name": "Indian Rupee",
    "symbol": "₹",
    "label": "INR — Indian Rupee (₹)"
  },
  {
    "code": "USD",
    "name": "US Dollar",
    "symbol": "$",
    "label": "USD — US Dollar ($)"
  },
  {
    "code": "EUR",
    "name": "Euro",
    "symbol": "€",
    "label": "EUR — Euro (€)"
  },
  {
    "code": "GBP",
    "name": "British Pound",
    "symbol": "£",
    "label": "GBP — British Pound (£)"
  },
  {
    "code": "AED",
    "name": "UAE Dirham",
    "symbol": "د.إ",
    "label": "AED — UAE Dirham (د.إ)"
  },
  {
    "code": "SGD",
    "name": "Singapore Dollar",
    "symbol": "S$",
    "label": "SGD — Singapore Dollar (S$)"
  },
  {
    "code": "LKR",
    "name": "Sri Lankan Rupee",
    "symbol": "Rs",
    "label": "LKR — Sri Lankan Rupee (Rs)"
  },
  {
    "code": "AUD",
    "name": "Australian Dollar",
    "symbol": "A$",
    "label": "AUD — Australian Dollar (A$)"
  },
  {
    "code": "CAD",
    "name": "Canadian Dollar",
    "symbol": "CA$",
    "label": "CAD — Canadian Dollar (CA$)"
  },
  {
    "code": "JPY",
    "name": "Japanese Yen",
    "symbol": "¥",
    "label": "JPY — Japanese Yen (¥)"
  },
  {
    "code": "CNY",
    "name": "Chinese Yuan",
    "symbol": "¥",
    "label": "CNY — Chinese Yuan (¥)"
  },
  {
    "code": "NPR",
    "name": "Nepalese Rupee",
    "symbol": "Rs",
    "label": "NPR — Nepalese Rupee (Rs)"
  },
  {
    "code": "BDT",
    "name": "Bangladeshi Taka",
    "symbol": "৳",
    "label": "BDT — Bangladeshi Taka (৳)"
  },
  {
    "code": "PKR",
    "name": "Pakistani Rupee",
    "symbol": "Rs",
    "label": "PKR — Pakistani Rupee (Rs)"
  },
  {
    "code": "AFN",
    "name": "Afghan Afghani",
    "symbol": "؋",
    "label": "AFN — Afghan Afghani (؋)"
  },
  {
    "code": "ALL",
    "name": "Albanian Lek",
    "symbol": "L",
    "label": "ALL — Albanian Lek (L)"
  },
  {
    "code": "AMD",
    "name": "Armenian Dram",
    "symbol": "֏",
    "label": "AMD — Armenian Dram (֏)"
  },
  {
    "code": "ANG",
    "name": "Netherlands Antillean Guilder",
    "symbol": "ƒ",
    "label": "ANG — Netherlands Antillean Guilder (ƒ)"
  },
  {
    "code": "AOA",
    "name": "Angolan Kwanza",
    "symbol": "Kz",
    "label": "AOA — Angolan Kwanza (Kz)"
  },
  {
    "code": "ARS",
    "name": "Argentine Peso",
    "symbol": "$",
    "label": "ARS — Argentine Peso ($)"
  },
  {
    "code": "AWG",
    "name": "Aruban Florin",
    "symbol": "ƒ",
    "label": "AWG — Aruban Florin (ƒ)"
  },
  {
    "code": "AZN",
    "name": "Azerbaijani Manat",
    "symbol": "₼",
    "label": "AZN — Azerbaijani Manat (₼)"
  },
  {
    "code": "BAM",
    "name": "Bosnia-Herzegovina Convertible Mark",
    "symbol": "KM",
    "label": "BAM — Bosnia-Herzegovina Convertible Mark (KM)"
  },
  {
    "code": "BBD",
    "name": "Barbadian Dollar",
    "symbol": "$",
    "label": "BBD — Barbadian Dollar ($)"
  },
  {
    "code": "BGN",
    "name": "Bulgarian Lev",
    "symbol": "лв",
    "label": "BGN — Bulgarian Lev (лв)"
  },
  {
    "code": "BHD",
    "name": "Bahraini Dinar",
    "symbol": ".د.ب",
    "label": "BHD — Bahraini Dinar (.د.ب)"
  },
  {
    "code": "BIF",
    "name": "Burundian Franc",
    "symbol": "FBu",
    "label": "BIF — Burundian Franc (FBu)"
  },
  {
    "code": "BMD",
    "name": "Bermudan Dollar",
    "symbol": "$",
    "label": "BMD — Bermudan Dollar ($)"
  },
  {
    "code": "BND",
    "name": "Brunei Dollar",
    "symbol": "$",
    "label": "BND — Brunei Dollar ($)"
  },
  {
    "code": "BOB",
    "name": "Bolivian Boliviano",
    "symbol": "Bs.",
    "label": "BOB — Bolivian Boliviano (Bs.)"
  },
  {
    "code": "BRL",
    "name": "Brazilian Real",
    "symbol": "R$",
    "label": "BRL — Brazilian Real (R$)"
  },
  {
    "code": "BSD",
    "name": "Bahamian Dollar",
    "symbol": "$",
    "label": "BSD — Bahamian Dollar ($)"
  },
  {
    "code": "BTN",
    "name": "Bhutanese Ngultrum",
    "symbol": "Nu.",
    "label": "BTN — Bhutanese Ngultrum (Nu.)"
  },
  {
    "code": "BWP",
    "name": "Botswanan Pula",
    "symbol": "P",
    "label": "BWP — Botswanan Pula (P)"
  },
  {
    "code": "BYN",
    "name": "Belarusian Ruble",
    "symbol": "Br",
    "label": "BYN — Belarusian Ruble (Br)"
  },
  {
    "code": "BZD",
    "name": "Belize Dollar",
    "symbol": "BZ$",
    "label": "BZD — Belize Dollar (BZ$)"
  },
  {
    "code": "CDF",
    "name": "Congolese Franc",
    "symbol": "FC",
    "label": "CDF — Congolese Franc (FC)"
  },
  {
    "code": "CHF",
    "name": "Swiss Franc",
    "symbol": "CHF",
    "label": "CHF — Swiss Franc (CHF)"
  },
  {
    "code": "CLP",
    "name": "Chilean Peso",
    "symbol": "$",
    "label": "CLP — Chilean Peso ($)"
  },
  {
    "code": "COP",
    "name": "Colombian Peso",
    "symbol": "$",
    "label": "COP — Colombian Peso ($)"
  },
  {
    "code": "CRC",
    "name": "Costa Rican Colón",
    "symbol": "₡",
    "label": "CRC — Costa Rican Colón (₡)"
  },
  {
    "code": "CUC",
    "name": "Cuban Convertible Peso",
    "symbol": "CUC$",
    "label": "CUC — Cuban Convertible Peso (CUC$)"
  },
  {
    "code": "CUP",
    "name": "Cuban Peso",
    "symbol": "₱",
    "label": "CUP — Cuban Peso (₱)"
  },
  {
    "code": "CVE",
    "name": "Cape Verdean Escudo",
    "symbol": "$",
    "label": "CVE — Cape Verdean Escudo ($)"
  },
  {
    "code": "CZK",
    "name": "Czech Koruna",
    "symbol": "Kč",
    "label": "CZK — Czech Koruna (Kč)"
  },
  {
    "code": "DJF",
    "name": "Djiboutian Franc",
    "symbol": "Fdj",
    "label": "DJF — Djiboutian Franc (Fdj)"
  },
  {
    "code": "DKK",
    "name": "Danish Krone",
    "symbol": "kr",
    "label": "DKK — Danish Krone (kr)"
  },
  {
    "code": "DOP",
    "name": "Dominican Peso",
    "symbol": "RD$",
    "label": "DOP — Dominican Peso (RD$)"
  },
  {
    "code": "DZD",
    "name": "Algerian Dinar",
    "symbol": "دج",
    "label": "DZD — Algerian Dinar (دج)"
  },
  {
    "code": "EGP",
    "name": "Egyptian Pound",
    "symbol": "E£",
    "label": "EGP — Egyptian Pound (E£)"
  },
  {
    "code": "ERN",
    "name": "Eritrean Nakfa",
    "symbol": "Nfk",
    "label": "ERN — Eritrean Nakfa (Nfk)"
  },
  {
    "code": "ETB",
    "name": "Ethiopian Birr",
    "symbol": "Br",
    "label": "ETB — Ethiopian Birr (Br)"
  },
  {
    "code": "FJD",
    "name": "Fijian Dollar",
    "symbol": "$",
    "label": "FJD — Fijian Dollar ($)"
  },
  {
    "code": "FKP",
    "name": "Falkland Islands Pound",
    "symbol": "£",
    "label": "FKP — Falkland Islands Pound (£)"
  },
  {
    "code": "GEL",
    "name": "Georgian Lari",
    "symbol": "₾",
    "label": "GEL — Georgian Lari (₾)"
  },
  {
    "code": "GHS",
    "name": "Ghanaian Cedi",
    "symbol": "GH₵",
    "label": "GHS — Ghanaian Cedi (GH₵)"
  },
  {
    "code": "GIP",
    "name": "Gibraltar Pound",
    "symbol": "£",
    "label": "GIP — Gibraltar Pound (£)"
  },
  {
    "code": "GMD",
    "name": "Gambian Dalasi",
    "symbol": "D",
    "label": "GMD — Gambian Dalasi (D)"
  },
  {
    "code": "GNF",
    "name": "Guinean Franc",
    "symbol": "FG",
    "label": "GNF — Guinean Franc (FG)"
  },
  {
    "code": "GTQ",
    "name": "Guatemalan Quetzal",
    "symbol": "Q",
    "label": "GTQ — Guatemalan Quetzal (Q)"
  },
  {
    "code": "GYD",
    "name": "Guyanaese Dollar",
    "symbol": "$",
    "label": "GYD — Guyanaese Dollar ($)"
  },
  {
    "code": "HKD",
    "name": "Hong Kong Dollar",
    "symbol": "HK$",
    "label": "HKD — Hong Kong Dollar (HK$)"
  },
  {
    "code": "HNL",
    "name": "Honduran Lempira",
    "symbol": "L",
    "label": "HNL — Honduran Lempira (L)"
  },
  {
    "code": "HRK",
    "name": "Croatian Kuna",
    "symbol": "kn",
    "label": "HRK — Croatian Kuna (kn)"
  },
  {
    "code": "HTG",
    "name": "Haitian Gourde",
    "symbol": "G",
    "label": "HTG — Haitian Gourde (G)"
  },
  {
    "code": "HUF",
    "name": "Hungarian Forint",
    "symbol": "Ft",
    "label": "HUF — Hungarian Forint (Ft)"
  },
  {
    "code": "IDR",
    "name": "Indonesian Rupiah",
    "symbol": "Rp",
    "label": "IDR — Indonesian Rupiah (Rp)"
  },
  {
    "code": "ILS",
    "name": "Israeli New Shekel",
    "symbol": "₪",
    "label": "ILS — Israeli New Shekel (₪)"
  },
  {
    "code": "IQD",
    "name": "Iraqi Dinar",
    "symbol": "ع.د",
    "label": "IQD — Iraqi Dinar (ع.د)"
  },
  {
    "code": "IRR",
    "name": "Iranian Rial",
    "symbol": "﷼",
    "label": "IRR — Iranian Rial (﷼)"
  },
  {
    "code": "ISK",
    "name": "Icelandic Króna",
    "symbol": "kr",
    "label": "ISK — Icelandic Króna (kr)"
  },
  {
    "code": "JMD",
    "name": "Jamaican Dollar",
    "symbol": "J$",
    "label": "JMD — Jamaican Dollar (J$)"
  },
  {
    "code": "JOD",
    "name": "Jordanian Dinar",
    "symbol": "JD",
    "label": "JOD — Jordanian Dinar (JD)"
  },
  {
    "code": "KES",
    "name": "Kenyan Shilling",
    "symbol": "KSh",
    "label": "KES — Kenyan Shilling (KSh)"
  },
  {
    "code": "KGS",
    "name": "Kyrgyz Som",
    "symbol": "с",
    "label": "KGS — Kyrgyz Som (с)"
  },
  {
    "code": "KHR",
    "name": "Cambodian Riel",
    "symbol": "៛",
    "label": "KHR — Cambodian Riel (៛)"
  },
  {
    "code": "KMF",
    "name": "Comorian Franc",
    "symbol": "CF",
    "label": "KMF — Comorian Franc (CF)"
  },
  {
    "code": "KPW",
    "name": "North Korean Won",
    "symbol": "₩",
    "label": "KPW — North Korean Won (₩)"
  },
  {
    "code": "KRW",
    "name": "South Korean Won",
    "symbol": "₩",
    "label": "KRW — South Korean Won (₩)"
  },
  {
    "code": "KWD",
    "name": "Kuwaiti Dinar",
    "symbol": "KD",
    "label": "KWD — Kuwaiti Dinar (KD)"
  },
  {
    "code": "KYD",
    "name": "Cayman Islands Dollar",
    "symbol": "$",
    "label": "KYD — Cayman Islands Dollar ($)"
  },
  {
    "code": "KZT",
    "name": "Kazakhstani Tenge",
    "symbol": "₸",
    "label": "KZT — Kazakhstani Tenge (₸)"
  },
  {
    "code": "LAK",
    "name": "Laotian Kip",
    "symbol": "₭",
    "label": "LAK — Laotian Kip (₭)"
  },
  {
    "code": "LBP",
    "name": "Lebanese Pound",
    "symbol": "L£",
    "label": "LBP — Lebanese Pound (L£)"
  },
  {
    "code": "LRD",
    "name": "Liberian Dollar",
    "symbol": "$",
    "label": "LRD — Liberian Dollar ($)"
  },
  {
    "code": "LSL",
    "name": "Lesotho Loti",
    "symbol": "L",
    "label": "LSL — Lesotho Loti (L)"
  },
  {
    "code": "LYD",
    "name": "Libyan Dinar",
    "symbol": "LD",
    "label": "LYD — Libyan Dinar (LD)"
  },
  {
    "code": "MAD",
    "name": "Moroccan Dirham",
    "symbol": "MAD",
    "label": "MAD — Moroccan Dirham (MAD)"
  },
  {
    "code": "MDL",
    "name": "Moldovan Leu",
    "symbol": "L",
    "label": "MDL — Moldovan Leu (L)"
  },
  {
    "code": "MGA",
    "name": "Malagasy Ariary",
    "symbol": "Ar",
    "label": "MGA — Malagasy Ariary (Ar)"
  },
  {
    "code": "MKD",
    "name": "Macedonian Denar",
    "symbol": "ден",
    "label": "MKD — Macedonian Denar (ден)"
  },
  {
    "code": "MMK",
    "name": "Myanmar Kyat",
    "symbol": "K",
    "label": "MMK — Myanmar Kyat (K)"
  },
  {
    "code": "MNT",
    "name": "Mongolian Tugrik",
    "symbol": "₮",
    "label": "MNT — Mongolian Tugrik (₮)"
  },
  {
    "code": "MOP",
    "name": "Macanese Pataca",
    "symbol": "MOP$",
    "label": "MOP — Macanese Pataca (MOP$)"
  },
  {
    "code": "MRU",
    "name": "Mauritanian Ouguiya",
    "symbol": "UM",
    "label": "MRU — Mauritanian Ouguiya (UM)"
  },
  {
    "code": "MUR",
    "name": "Mauritian Rupee",
    "symbol": "₨",
    "label": "MUR — Mauritian Rupee (₨)"
  },
  {
    "code": "MVR",
    "name": "Maldivian Rufiyaa",
    "symbol": "Rf",
    "label": "MVR — Maldivian Rufiyaa (Rf)"
  },
  {
    "code": "MWK",
    "name": "Malawian Kwacha",
    "symbol": "MK",
    "label": "MWK — Malawian Kwacha (MK)"
  },
  {
    "code": "MXN",
    "name": "Mexican Peso",
    "symbol": "$",
    "label": "MXN — Mexican Peso ($)"
  },
  {
    "code": "MYR",
    "name": "Malaysian Ringgit",
    "symbol": "RM",
    "label": "MYR — Malaysian Ringgit (RM)"
  },
  {
    "code": "MZN",
    "name": "Mozambican Metical",
    "symbol": "MT",
    "label": "MZN — Mozambican Metical (MT)"
  },
  {
    "code": "NAD",
    "name": "Namibian Dollar",
    "symbol": "N$",
    "label": "NAD — Namibian Dollar (N$)"
  },
  {
    "code": "NGN",
    "name": "Nigerian Naira",
    "symbol": "₦",
    "label": "NGN — Nigerian Naira (₦)"
  },
  {
    "code": "NIO",
    "name": "Nicaraguan Córdoba",
    "symbol": "C$",
    "label": "NIO — Nicaraguan Córdoba (C$)"
  },
  {
    "code": "NOK",
    "name": "Norwegian Krone",
    "symbol": "kr",
    "label": "NOK — Norwegian Krone (kr)"
  },
  {
    "code": "NZD",
    "name": "New Zealand Dollar",
    "symbol": "NZ$",
    "label": "NZD — New Zealand Dollar (NZ$)"
  },
  {
    "code": "OMR",
    "name": "Omani Rial",
    "symbol": "RO",
    "label": "OMR — Omani Rial (RO)"
  },
  {
    "code": "PAB",
    "name": "Panamanian Balboa",
    "symbol": "B/.",
    "label": "PAB — Panamanian Balboa (B/.)"
  },
  {
    "code": "PEN",
    "name": "Peruvian Sol",
    "symbol": "S/.",
    "label": "PEN — Peruvian Sol (S/.)"
  },
  {
    "code": "PGK",
    "name": "Papua New Guinean Kina",
    "symbol": "K",
    "label": "PGK — Papua New Guinean Kina (K)"
  },
  {
    "code": "PHP",
    "name": "Philippine Peso",
    "symbol": "₱",
    "label": "PHP — Philippine Peso (₱)"
  },
  {
    "code": "PLN",
    "name": "Polish Zloty",
    "symbol": "zł",
    "label": "PLN — Polish Zloty (zł)"
  },
  {
    "code": "PYG",
    "name": "Paraguayan Guarani",
    "symbol": "₲",
    "label": "PYG — Paraguayan Guarani (₲)"
  },
  {
    "code": "QAR",
    "name": "Qatari Riyal",
    "symbol": "QR",
    "label": "QAR — Qatari Riyal (QR)"
  },
  {
    "code": "RON",
    "name": "Romanian Leu",
    "symbol": "lei",
    "label": "RON — Romanian Leu (lei)"
  },
  {
    "code": "RSD",
    "name": "Serbian Dinar",
    "symbol": "дин.",
    "label": "RSD — Serbian Dinar (дин.)"
  },
  {
    "code": "RUB",
    "name": "Russian Ruble",
    "symbol": "₽",
    "label": "RUB — Russian Ruble (₽)"
  },
  {
    "code": "RWF",
    "name": "Rwandan Franc",
    "symbol": "RF",
    "label": "RWF — Rwandan Franc (RF)"
  },
  {
    "code": "SAR",
    "name": "Saudi Riyal",
    "symbol": "SR",
    "label": "SAR — Saudi Riyal (SR)"
  },
  {
    "code": "SBD",
    "name": "Solomon Islands Dollar",
    "symbol": "$",
    "label": "SBD — Solomon Islands Dollar ($)"
  },
  {
    "code": "SCR",
    "name": "Seychellois Rupee",
    "symbol": "SR",
    "label": "SCR — Seychellois Rupee (SR)"
  },
  {
    "code": "SDG",
    "name": "Sudanese Pound",
    "symbol": "SDG",
    "label": "SDG — Sudanese Pound (SDG)"
  },
  {
    "code": "SEK",
    "name": "Swedish Krona",
    "symbol": "kr",
    "label": "SEK — Swedish Krona (kr)"
  },
  {
    "code": "SHP",
    "name": "St. Helena Pound",
    "symbol": "£",
    "label": "SHP — St. Helena Pound (£)"
  },
  {
    "code": "SLE",
    "name": "Sierra Leonean Leone",
    "symbol": "Le",
    "label": "SLE — Sierra Leonean Leone (Le)"
  },
  {
    "code": "SLL",
    "name": "Sierra Leonean Leone (1964—2022)",
    "symbol": "Le",
    "label": "SLL — Sierra Leonean Leone (1964—2022) (Le)"
  },
  {
    "code": "SOS",
    "name": "Somali Shilling",
    "symbol": "S",
    "label": "SOS — Somali Shilling (S)"
  },
  {
    "code": "SRD",
    "name": "Surinamese Dollar",
    "symbol": "$",
    "label": "SRD — Surinamese Dollar ($)"
  },
  {
    "code": "SSP",
    "name": "South Sudanese Pound",
    "symbol": "£",
    "label": "SSP — South Sudanese Pound (£)"
  },
  {
    "code": "STN",
    "name": "São Tomé & Príncipe Dobra",
    "symbol": "Db",
    "label": "STN — São Tomé & Príncipe Dobra (Db)"
  },
  {
    "code": "SVC",
    "name": "Salvadoran Colón",
    "symbol": "₡",
    "label": "SVC — Salvadoran Colón (₡)"
  },
  {
    "code": "SYP",
    "name": "Syrian Pound",
    "symbol": "£",
    "label": "SYP — Syrian Pound (£)"
  },
  {
    "code": "SZL",
    "name": "Swazi Lilangeni",
    "symbol": "E",
    "label": "SZL — Swazi Lilangeni (E)"
  },
  {
    "code": "THB",
    "name": "Thai Baht",
    "symbol": "฿",
    "label": "THB — Thai Baht (฿)"
  },
  {
    "code": "TJS",
    "name": "Tajikistani Somoni",
    "symbol": "SM",
    "label": "TJS — Tajikistani Somoni (SM)"
  },
  {
    "code": "TMT",
    "name": "Turkmenistani Manat",
    "symbol": "T",
    "label": "TMT — Turkmenistani Manat (T)"
  },
  {
    "code": "TND",
    "name": "Tunisian Dinar",
    "symbol": "DT",
    "label": "TND — Tunisian Dinar (DT)"
  },
  {
    "code": "TOP",
    "name": "Tongan Paʻanga",
    "symbol": "T$",
    "label": "TOP — Tongan Paʻanga (T$)"
  },
  {
    "code": "TRY",
    "name": "Turkish Lira",
    "symbol": "₺",
    "label": "TRY — Turkish Lira (₺)"
  },
  {
    "code": "TTD",
    "name": "Trinidad & Tobago Dollar",
    "symbol": "TT$",
    "label": "TTD — Trinidad & Tobago Dollar (TT$)"
  },
  {
    "code": "TWD",
    "name": "New Taiwan Dollar",
    "symbol": "NT$",
    "label": "TWD — New Taiwan Dollar (NT$)"
  },
  {
    "code": "TZS",
    "name": "Tanzanian Shilling",
    "symbol": "TSh",
    "label": "TZS — Tanzanian Shilling (TSh)"
  },
  {
    "code": "UAH",
    "name": "Ukrainian Hryvnia",
    "symbol": "₴",
    "label": "UAH — Ukrainian Hryvnia (₴)"
  },
  {
    "code": "UGX",
    "name": "Ugandan Shilling",
    "symbol": "USh",
    "label": "UGX — Ugandan Shilling (USh)"
  },
  {
    "code": "UYU",
    "name": "Uruguayan Peso",
    "symbol": "$U",
    "label": "UYU — Uruguayan Peso ($U)"
  },
  {
    "code": "UZS",
    "name": "Uzbekistani Som",
    "symbol": "soʻm",
    "label": "UZS — Uzbekistani Som (soʻm)"
  },
  {
    "code": "VES",
    "name": "Venezuelan Bolívar",
    "symbol": "Bs.S",
    "label": "VES — Venezuelan Bolívar (Bs.S)"
  },
  {
    "code": "VND",
    "name": "Vietnamese Dong",
    "symbol": "₫",
    "label": "VND — Vietnamese Dong (₫)"
  },
  {
    "code": "VUV",
    "name": "Vanuatu Vatu",
    "symbol": "VT",
    "label": "VUV — Vanuatu Vatu (VT)"
  },
  {
    "code": "WST",
    "name": "Samoan Tala",
    "symbol": "WS$",
    "label": "WST — Samoan Tala (WS$)"
  },
  {
    "code": "XAF",
    "name": "Central African CFA Franc",
    "symbol": "FCFA",
    "label": "XAF — Central African CFA Franc (FCFA)"
  },
  {
    "code": "XCD",
    "name": "East Caribbean Dollar",
    "symbol": "EC$",
    "label": "XCD — East Caribbean Dollar (EC$)"
  },
  {
    "code": "XCG",
    "name": "Caribbean guilder",
    "symbol": "Cg.",
    "label": "XCG — Caribbean guilder (Cg.)"
  },
  {
    "code": "XDR",
    "name": "Special Drawing Rights",
    "symbol": "SDR",
    "label": "XDR — Special Drawing Rights (SDR)"
  },
  {
    "code": "XOF",
    "name": "West African CFA Franc",
    "symbol": "CFA",
    "label": "XOF — West African CFA Franc (CFA)"
  },
  {
    "code": "XPF",
    "name": "CFP Franc",
    "symbol": "₣",
    "label": "XPF — CFP Franc (₣)"
  },
  {
    "code": "XSU",
    "name": "Sucre",
    "symbol": "Sucre",
    "label": "XSU — Sucre (Sucre)"
  },
  {
    "code": "YER",
    "name": "Yemeni Rial",
    "symbol": "﷼",
    "label": "YER — Yemeni Rial (﷼)"
  },
  {
    "code": "ZAR",
    "name": "South African Rand",
    "symbol": "R",
    "label": "ZAR — South African Rand (R)"
  },
  {
    "code": "ZMW",
    "name": "Zambian Kwacha",
    "symbol": "ZK",
    "label": "ZMW — Zambian Kwacha (ZK)"
  },
  {
    "code": "ZWG",
    "name": "Zimbabwean Gold",
    "symbol": "ZiG",
    "label": "ZWG — Zimbabwean Gold (ZiG)"
  },
  {
    "code": "ZWL",
    "name": "Zimbabwean Dollar (2009–2024)",
    "symbol": "Z$",
    "label": "ZWL — Zimbabwean Dollar (2009–2024) (Z$)"
  }
];

export const CURRENCY_MAP: Record<string, Currency> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c])
);

/**
 * Find currency by ISO 4217 code (case-insensitive)
 */
export function getCurrency(code?: string | null): Currency | undefined {
  if (!code) return undefined;
  return CURRENCY_MAP[code.toUpperCase()];
}

/**
 * Format currency as standard display string: "CODE — Name (Symbol)"
 * Falls back to the raw code if not found in registry.
 */
export function formatCurrencyLabel(codeOrCurrency?: string | Currency | null): string {
  if (!codeOrCurrency) return "";
  if (typeof codeOrCurrency === "object") {
    return codeOrCurrency.label || (codeOrCurrency.code + " — " + codeOrCurrency.name + " (" + codeOrCurrency.symbol + ")");
  }
  const curr = getCurrency(codeOrCurrency);
  return curr ? curr.label : codeOrCurrency;
}

/**
 * Search currencies by code, name, or symbol (case-insensitive)
 */
export function searchCurrencies(query: string): Currency[] {
  const q = query.trim().toLowerCase();
  if (!q) return CURRENCIES;
  return CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
  );
}
