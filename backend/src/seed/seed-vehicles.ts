import type { NewVehicle } from '../modules/vehicles/vehicle.types.js';

/** Attribution for a freely licensed photo (also listed in docs/IMAGE_CREDITS.md). */
export interface ImageCredit {
  author: string;
  license: string;
  /** The photo's page on Wikimedia Commons. */
  sourceUrl: string;
}

export type SeedVehicle = NewVehicle & { imageCredit: ImageCredit };

const COMMONS_THUMB = 'https://thumb.wikimedia.org/wikipedia/commons/thumb';
const COMMONS_FILE = 'https://commons.wikimedia.org/wiki/File:';

/**
 * Demo catalogue: two vehicles per category. Every photo is a Wikimedia Commons
 * image whose title/description names this make, model and year, checked by
 * eye before use. Colours come from the photo description or the photo itself.
 * Prices are illustrative, in integer cents.
 */
export const SEED_VEHICLES: SeedVehicle[] = [
  {
    make: 'Toyota',
    model: 'Camry XSE',
    category: 'SEDAN',
    year: 2023,
    color: 'Celestial Silver',
    priceCents: 3_099_500,
    quantity: 4,
    imageUrl: `${COMMONS_THUMB}/c/ca/2023_Toyota_Camry_XSE%2C_front_right%2C_08-30-2026.jpg/1280px-2023_Toyota_Camry_XSE%2C_front_right%2C_08-30-2026.jpg`,
    imageCredit: {
      author: 'MercurySable99',
      license: 'CC BY-SA 4.0',
      sourceUrl: `${COMMONS_FILE}2023_Toyota_Camry_XSE,_front_right,_08-30-2026.jpg`,
    },
  },
  {
    make: 'Honda',
    model: 'Accord EX',
    category: 'SEDAN',
    year: 2023,
    color: 'Silver',
    priceCents: 2_961_000,
    quantity: 5,
    imageUrl: `${COMMONS_THUMB}/1/1d/2023_Honda_Accord_EX%2C_front_2.12.23.jpg/1280px-2023_Honda_Accord_EX%2C_front_2.12.23.jpg`,
    imageCredit: {
      author: 'Kevauto',
      license: 'CC BY-SA 4.0',
      sourceUrl: `${COMMONS_FILE}2023_Honda_Accord_EX,_front_2.12.23.jpg`,
    },
  },
  {
    make: 'Toyota',
    model: 'RAV4 Prime XSE',
    category: 'SUV',
    year: 2023,
    color: 'White',
    priceCents: 4_369_000,
    quantity: 2,
    imageUrl: `${COMMONS_THUMB}/5/58/23_Toyota_RAV4_Prime_XSE.jpg/1280px-23_Toyota_RAV4_Prime_XSE.jpg`,
    imageCredit: {
      author: 'HJUdall',
      license: 'CC0',
      sourceUrl: `${COMMONS_FILE}23_Toyota_RAV4_Prime_XSE.jpg`,
    },
  },
  {
    make: 'Hyundai',
    model: 'Tucson SEL',
    category: 'SUV',
    year: 2022,
    color: 'Calypso Red',
    priceCents: 2_750_000,
    quantity: 6,
    imageUrl: `${COMMONS_THUMB}/0/00/2022_Hyundai_Tucson_SEL_with_HTRAC_All_Wheel_Drive.jpg/1280px-2022_Hyundai_Tucson_SEL_with_HTRAC_All_Wheel_Drive.jpg`,
    imageCredit: {
      author: 'MercurySable99',
      license: 'CC BY-SA 4.0',
      sourceUrl: `${COMMONS_FILE}2022_Hyundai_Tucson_SEL_with_HTRAC_All_Wheel_Drive.jpg`,
    },
  },
  {
    make: 'Volkswagen',
    model: 'Golf R-Line',
    category: 'HATCHBACK',
    year: 2021,
    color: 'Moonstone Grey',
    priceCents: 2_490_000,
    quantity: 3,
    imageUrl: `${COMMONS_THUMB}/7/72/2021_Volkswagen_Golf_R-Line_TDi_S-A_2.0.jpg/1280px-2021_Volkswagen_Golf_R-Line_TDi_S-A_2.0.jpg`,
    imageCredit: {
      author: 'Vauxford',
      license: 'CC BY-SA 4.0',
      sourceUrl: `${COMMONS_FILE}2021_Volkswagen_Golf_R-Line_TDi_S-A_2.0.jpg`,
    },
  },
  {
    make: 'Honda',
    model: 'Civic Sport Touring',
    category: 'HATCHBACK',
    year: 2022,
    color: 'White',
    priceCents: 2_990_000,
    quantity: 4,
    imageUrl: `${COMMONS_THUMB}/3/3e/2022_Honda_Civic_Sport_Touring%2C_Front_Right%2C_11-07-2021.jpg/1280px-2022_Honda_Civic_Sport_Touring%2C_Front_Right%2C_11-07-2021.jpg`,
    imageCredit: {
      author: 'Elise240SX',
      license: 'CC BY-SA 4.0',
      sourceUrl: `${COMMONS_FILE}2022_Honda_Civic_Sport_Touring,_Front_Right,_11-07-2021.jpg`,
    },
  },
  {
    make: 'Ford',
    model: 'F-150 SuperCrew',
    category: 'TRUCK',
    year: 2021,
    color: 'Stone Gray',
    priceCents: 3_850_000,
    quantity: 3,
    imageUrl: `${COMMONS_THUMB}/c/c3/2021_Ford_F-150_SuperCrew%2C_front_4.28.21.jpg/1280px-2021_Ford_F-150_SuperCrew%2C_front_4.28.21.jpg`,
    imageCredit: {
      author: 'Kevauto',
      license: 'CC BY-SA 4.0',
      sourceUrl: `${COMMONS_FILE}2021_Ford_F-150_SuperCrew,_front_4.28.21.jpg`,
    },
  },
  {
    make: 'Toyota',
    model: 'Tacoma SR5 Access Cab',
    category: 'TRUCK',
    year: 2019,
    color: 'Silver Sky',
    priceCents: 2_799_500,
    quantity: 0,
    imageUrl: `${COMMONS_THUMB}/a/a1/2019_Toyota_Tacoma_SR5_4WD_Access_Cab%2C_front_right%2C_09-03-2022.jpg/1280px-2019_Toyota_Tacoma_SR5_4WD_Access_Cab%2C_front_right%2C_09-03-2022.jpg`,
    imageCredit: {
      author: 'MercurySable99',
      license: 'CC BY-SA 4.0',
      sourceUrl: `${COMMONS_FILE}2019_Toyota_Tacoma_SR5_4WD_Access_Cab,_front_right,_09-03-2022.jpg`,
    },
  },
  {
    make: 'Mazda',
    model: 'MX-5 Miata RF Grand Touring',
    category: 'CONVERTIBLE',
    year: 2021,
    color: 'Deep Crystal Blue',
    priceCents: 3_350_000,
    quantity: 2,
    imageUrl: `${COMMONS_THUMB}/c/c7/2021_Mazda_MX-5_Miata_RF_Grand_Touring%2C_front_right%2C_06-15-2024.jpg/1280px-2021_Mazda_MX-5_Miata_RF_Grand_Touring%2C_front_right%2C_06-15-2024.jpg`,
    imageCredit: {
      author: 'MercurySable99',
      license: 'CC BY-SA 4.0',
      sourceUrl: `${COMMONS_FILE}2021_Mazda_MX-5_Miata_RF_Grand_Touring,_front_right,_06-15-2024.jpg`,
    },
  },
  {
    make: 'Ford',
    model: 'Mustang Convertible',
    category: 'CONVERTIBLE',
    year: 2018,
    color: 'Yellow',
    priceCents: 3_290_000,
    quantity: 0,
    imageUrl: `${COMMONS_THUMB}/0/0a/2018_Ford_Mustang_Convertible_%28SIAM_2018%29.jpg/1280px-2018_Ford_Mustang_Convertible_%28SIAM_2018%29.jpg`,
    imageCredit: {
      author: 'Bull-Doser',
      license: 'Public domain',
      sourceUrl: `${COMMONS_FILE}2018_Ford_Mustang_Convertible_(SIAM_2018).jpg`,
    },
  },
  {
    make: 'Honda',
    model: 'Odyssey EX-L',
    category: 'VAN',
    year: 2021,
    color: 'Silver',
    priceCents: 3_650_000,
    quantity: 3,
    imageUrl: `${COMMONS_THUMB}/a/a3/2021_Honda_Odyssey_EX-L_%28facelift%29%2C_front_1.1.21.jpg/1280px-2021_Honda_Odyssey_EX-L_%28facelift%29%2C_front_1.1.21.jpg`,
    imageCredit: {
      author: 'Kevauto',
      license: 'CC BY-SA 4.0',
      sourceUrl: `${COMMONS_FILE}2021_Honda_Odyssey_EX-L_(facelift),_front_1.1.21.jpg`,
    },
  },
  {
    make: 'Chrysler',
    model: 'Pacifica Touring L',
    category: 'VAN',
    year: 2022,
    color: 'Gray',
    priceCents: 3_990_000,
    quantity: 1,
    imageUrl: `${COMMONS_THUMB}/9/9e/2022_Chrysler_Pacifica_Touring_L_%28facelift%29%2C_front_6.17.23.jpg/1280px-2022_Chrysler_Pacifica_Touring_L_%28facelift%29%2C_front_6.17.23.jpg`,
    imageCredit: {
      author: 'Kevauto',
      license: 'CC BY-SA 4.0',
      sourceUrl: `${COMMONS_FILE}2022_Chrysler_Pacifica_Touring_L_(facelift),_front_6.17.23.jpg`,
    },
  },
  {
    make: 'Tesla',
    model: 'Model 3',
    category: 'EV',
    year: 2023,
    color: 'Pearl White',
    priceCents: 4_024_000,
    quantity: 5,
    imageUrl: `${COMMONS_THUMB}/8/86/Tesla_Model_3_%282023%29_IMG_9488_%28cropped%29.jpg/1280px-Tesla_Model_3_%282023%29_IMG_9488_%28cropped%29.jpg`,
    imageCredit: {
      author: 'Alexander-93',
      license: 'CC BY-SA 4.0',
      sourceUrl: `${COMMONS_FILE}Tesla_Model_3_(2023)_IMG_9488_(cropped).jpg`,
    },
  },
  {
    make: 'Hyundai',
    model: 'Ioniq 5 Ultimate',
    category: 'EV',
    year: 2022,
    color: 'Gray',
    priceCents: 4_290_000,
    quantity: 2,
    imageUrl: `${COMMONS_THUMB}/6/6a/2022_Hyundai_ioniq_5_Ultimate.jpg/1280px-2022_Hyundai_ioniq_5_Ultimate.jpg`,
    imageCredit: {
      author: 'Calreyn88',
      license: 'CC BY-SA 4.0',
      sourceUrl: `${COMMONS_FILE}2022_Hyundai_ioniq_5_Ultimate.jpg`,
    },
  },
];
