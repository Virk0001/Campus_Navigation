import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });
const LOCATIONS_COLLECTION = 'locations';

const locations = [
  {
    name: 'COS - Computer Science & Engineering Department',
    description: 'Computer Science department with labs, lecture halls, and faculty offices.',
    type: 'class',
    coordinates: { lat: 30.3555, lng: 76.364 },
    tags: ['academic', 'computer-science', 'csed', 'labs', 'department']
  },
  {
    name: 'E-Block (Main Academic Block)',
    description: 'Primary academic block with classrooms, laboratories, and engineering departments.',
    type: 'class',
    coordinates: { lat: 30.3548, lng: 76.3635 },
    tags: ['academic', 'engineering', 'classrooms', 'labs']
  },
  {
    name: 'J-Block (Academic Block)',
    description: 'Academic building with classrooms and department offices.',
    type: 'class',
    coordinates: { lat: 30.3542, lng: 76.3632 },
    tags: ['academic', 'classrooms', 'lectures']
  },
  {
    name: 'Library Block (Central Library)',
    description: 'Central library with books, digital resources, and study spaces.',
    type: 'class',
    coordinates: { lat: 30.3545, lng: 76.3628 },
    tags: ['library', 'books', 'study', 'academic']
  },
  {
    name: 'Administrative Block (A-Block)',
    description: 'Main administrative building with registrar and dean offices.',
    type: 'faculty',
    coordinates: { lat: 30.3552, lng: 76.3632 },
    tags: ['administration', 'office', 'registrar', 'dean']
  },
  {
    name: 'Hostel A (Boys)',
    description: 'Boys hostel accommodation with mess facilities and common rooms.',
    type: 'hostel',
    coordinates: { lat: 30.3538, lng: 76.365 },
    tags: ['hostel', 'boys', 'residence', 'mess']
  },
  {
    name: 'Hostel B (Boys)',
    description: 'Boys hostel with student accommodation and recreational spaces.',
    type: 'hostel',
    coordinates: { lat: 30.354, lng: 76.3655 },
    tags: ['hostel', 'boys', 'residence']
  },
  {
    name: 'Jaggi Hostel (Boys)',
    description: 'Popular boys hostel with modern facilities, mess, and common areas.',
    type: 'hostel',
    coordinates: { lat: 30.3543, lng: 76.3648 },
    tags: ['hostel', 'boys', 'jaggi', 'residence', 'mess']
  },
  {
    name: 'Girls Hostel A',
    description: 'Girls hostel with secure accommodation and residential facilities.',
    type: 'hostel',
    coordinates: { lat: 30.3558, lng: 76.365 },
    tags: ['hostel', 'girls', 'residence', 'secure']
  },
  {
    name: 'Girls Hostel B',
    description: 'Girls hostel accommodation with mess and recreational facilities.',
    type: 'hostel',
    coordinates: { lat: 30.356, lng: 76.3655 },
    tags: ['hostel', 'girls', 'residence', 'mess']
  },
  {
    name: 'Old Mess (Central Dining)',
    description: 'Primary mess and dining facility serving hostel residents.',
    type: 'eatables',
    coordinates: { lat: 30.3541, lng: 76.3646 },
    tags: ['food', 'mess', 'dining', 'meals']
  },
  {
    name: 'New Mess',
    description: 'Modern dining facility with multiple food options.',
    type: 'eatables',
    coordinates: { lat: 30.3544, lng: 76.3651 },
    tags: ['food', 'mess', 'dining']
  },
  {
    name: 'Nescafe (Coffee Shop)',
    description: 'Coffee shop and casual dining spot for students and visitors.',
    type: 'eatables',
    coordinates: { lat: 30.355, lng: 76.3638 },
    tags: ['food', 'coffee', 'cafe', 'snacks']
  },
  {
    name: "Domino's Pizza Outlet",
    description: "On-campus Domino's outlet for quick meals and gatherings.",
    type: 'eatables',
    coordinates: { lat: 30.3547, lng: 76.3641 },
    tags: ['food', 'pizza', 'fast-food']
  },
  {
    name: 'Sports Complex & Gymnasium',
    description: 'Sports complex with gymnasium, indoor courts, and fitness facilities.',
    type: 'sports',
    coordinates: { lat: 30.3535, lng: 76.3625 },
    tags: ['sports', 'gym', 'fitness', 'recreation']
  },
  {
    name: 'Outdoor Stadium',
    description: 'Outdoor stadium for cricket, football, athletics, and sports events.',
    type: 'sports',
    coordinates: { lat: 30.353, lng: 76.363 },
    tags: ['sports', 'stadium', 'cricket', 'football']
  },
  {
    name: 'Basketball Courts',
    description: 'Outdoor basketball courts for practice and tournaments.',
    type: 'sports',
    coordinates: { lat: 30.3537, lng: 76.3622 },
    tags: ['sports', 'basketball', 'courts']
  },
  {
    name: 'Auditorium (Main Hall)',
    description: 'Auditorium for cultural events, seminars, convocations, and guest lectures.',
    type: 'entertainment',
    coordinates: { lat: 30.355, lng: 76.3633 },
    tags: ['auditorium', 'events', 'cultural', 'seminars']
  },
  {
    name: 'Amphitheatre (Open Air Theatre)',
    description: 'Outdoor amphitheatre for performances, cultural nights, and gatherings.',
    type: 'entertainment',
    coordinates: { lat: 30.3546, lng: 76.3635 },
    tags: ['amphitheatre', 'theatre', 'outdoor', 'events']
  },
  {
    name: 'Health Center (Medical)',
    description: 'Campus health center for first aid and basic healthcare.',
    type: 'medical',
    coordinates: { lat: 30.3548, lng: 76.3643 },
    tags: ['medical', 'health', 'emergency', 'clinic']
  },
  {
    name: 'ATM - SBI',
    description: 'State Bank of India ATM for cash withdrawal and banking services.',
    type: 'bank',
    coordinates: { lat: 30.3549, lng: 76.3636 },
    tags: ['atm', 'bank', 'sbi', 'cash']
  },
  {
    name: 'Stationery Shop',
    description: 'Campus stationery store for supplies, books, and printing services.',
    type: 'shop',
    coordinates: { lat: 30.3547, lng: 76.3637 },
    tags: ['stationery', 'shop', 'books', 'printing']
  },
  {
    name: 'Main Gate (Primary Entrance)',
    description: 'Primary campus entrance with security check and visitor registration.',
    type: 'faculty',
    coordinates: { lat: 30.3563, lng: 76.3625 },
    tags: ['gate', 'entrance', 'security', 'entry']
  },
  {
    name: 'Parking Area (Main)',
    description: 'Primary parking facility for students, staff, and visitors.',
    type: 'parking',
    coordinates: { lat: 30.356, lng: 76.363 },
    tags: ['parking', 'vehicles', 'cars', 'bikes']
  }
];

const locationExists = async (db, name) => {
  const snapshot = await db
    .collection(LOCATIONS_COLLECTION)
    .where('name', '==', name)
    .limit(1)
    .get();

  return !snapshot.empty;
};

const seedLocations = async () => {
  const [{ getFirebaseFirestore }, { createLocation }] = await Promise.all([
    import('../src/utils/firebaseAdmin.js'),
    import('../src/repositories/locationRepository.js')
  ]);

  const db = getFirebaseFirestore();
  let added = 0;
  let skipped = 0;

  console.log('Seeding Firestore locations...\n');

  for (const location of locations) {
    if (await locationExists(db, location.name)) {
      skipped += 1;
      console.log(`Skipped: ${location.name}`);
      continue;
    }

    await createLocation({
      ...location,
      meta: {
        seededBy: 'seedFirebaseLocations'
      }
    });

    added += 1;
    console.log(`Added: ${location.name}`);
  }

  const totalCount = (await db.collection(LOCATIONS_COLLECTION).get()).size;

  console.log('\nSeed completed.');
  console.log(`Added: ${added}`);
  console.log(`Skipped existing: ${skipped}`);
  console.log(`Total locations: ${totalCount}`);
};

seedLocations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed locations:', error);
    process.exit(1);
  });
