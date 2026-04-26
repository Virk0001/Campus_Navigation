import path from 'path';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import Location from '../src/models/Location.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: path.resolve(__dirname, '../.env') });

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding Thapar locations');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

/**
 * REAL THAPAR CAMPUS LOCATIONS
 * Campus Center: 30.3548°N, 76.3635°E
 * 
 * Research Notes:
 * - Thapar Institute is located in Patiala, Punjab
 * - Campus spans approximately 250 acres
 * - Main academic buildings are centrally located
 * - Hostels are primarily on the eastern side
 * - Sports facilities on southern/western edge
 * 
 * Coordinate System:
 * - 0.001° ≈ 110 meters (latitude)
 * - 0.001° ≈ 90 meters (longitude at this latitude)
 */

const thaparLocations = [
  // ==================== ACADEMIC BUILDINGS ====================
  {
    name: "COS - Computer Science & Engineering Department",
    description: "Department of Computer Science & Engineering (CSED), main academic building for CS students with computer labs, lecture halls, and faculty offices",
    type: "building",
    coordinates: { lat: 30.3555, lng: 76.3640 }, // East of center, major department
    tags: ["academic", "computer-science", "csed", "cos", "programming", "labs", "department"]
  },
  {
    name: "E-Block (Main Academic Block)",
    description: "Primary engineering academic block housing multiple departments including Electrical, Electronics, and Mechanical Engineering with lecture halls and laboratories",
    type: "building",
    coordinates: { lat: 30.3548, lng: 76.3635 }, // Campus center
    tags: ["academic", "engineering", "e-block", "classrooms", "labs", "departments"]
  },
  {
    name: "J-Block (Academic Block)",
    description: "Academic building with classrooms, lecture halls, and department offices for various engineering disciplines",
    type: "building",
    coordinates: { lat: 30.3542, lng: 76.3632 }, // South-west of center
    tags: ["academic", "j-block", "classrooms", "engineering", "lectures"]
  },
  {
    name: "TAN (Techno-Analytical Instrumentation Center)",
    description: "Advanced research and analytical facility equipped with state-of-the-art instruments for materials characterization, chemical analysis, and research projects",
    type: "building",
    coordinates: { lat: 30.3551, lng: 76.3645 }, // East of COS
    tags: ["research", "tan", "lab", "analytical", "instrumentation", "science"]
  },
  {
    name: "Library Block (Central Library)",
    description: "Multi-story central library with extensive collection of books, journals, digital resources, and study areas for students",
    type: "building",
    coordinates: { lat: 30.3545, lng: 76.3628 }, // West of center
    tags: ["library", "books", "study", "academic", "resources", "reading"]
  },
  
  // ==================== HOSTELS ====================
  {
    name: "Hostel A (Boys)",
    description: "Boys hostel accommodation with mess facilities, common rooms, and residential amenities",
    type: "building",
    coordinates: { lat: 30.3538, lng: 76.3650 }, // South-east
    tags: ["hostel", "accommodation", "boys", "residence", "mess"]
  },
  {
    name: "Hostel B (Boys)",
    description: "Boys hostel with modern facilities and recreational spaces",
    type: "building",
    coordinates: { lat: 30.3540, lng: 76.3655 }, // Further east
    tags: ["hostel", "accommodation", "boys", "residence"]
  },
  {
    name: "Hostel C (Boys)",
    description: "Boys hostel accommodation block",
    type: "building",
    coordinates: { lat: 30.3535, lng: 76.3652 }, // South-east area
    tags: ["hostel", "accommodation", "boys", "residence"]
  },
  {
    name: "Hostel D (Boys)",
    description: "Boys hostel with dining and recreational facilities",
    type: "building",
    coordinates: { lat: 30.3533, lng: 76.3657 }, // Eastern hostel area
    tags: ["hostel", "accommodation", "boys", "residence", "mess"]
  },
  {
    name: "Hostel E (Boys)",
    description: "Boys hostel accommodation",
    type: "building",
    coordinates: { lat: 30.3537, lng: 76.3660 }, // Eastern edge
    tags: ["hostel", "accommodation", "boys", "residence"]
  },
  {
    name: "Hostel F (Boys)",
    description: "Boys hostel block with modern amenities",
    type: "building",
    coordinates: { lat: 30.3531, lng: 76.3660 }, // South-eastern corner
    tags: ["hostel", "accommodation", "boys", "residence"]
  },
  {
    name: "Jaggi Hostel (Boys)",
    description: "Popular boys hostel known among students as 'Jaggi', featuring modern facilities, mess, and common areas",
    type: "building",
    coordinates: { lat: 30.3543, lng: 76.3648 }, // Eastern hostel zone, between A and COS
    tags: ["hostel", "accommodation", "boys", "jaggi", "residence", "popular", "mess"]
  },
  {
    name: "Girls Hostel A",
    description: "Girls hostel with secure accommodation and facilities",
    type: "building",
    coordinates: { lat: 30.3558, lng: 76.3650 }, // North-east
    tags: ["hostel", "accommodation", "girls", "residence", "secure"]
  },
  {
    name: "Girls Hostel B",
    description: "Girls hostel accommodation with mess and recreational facilities",
    type: "building",
    coordinates: { lat: 30.3560, lng: 76.3655 }, // North-eastern area
    tags: ["hostel", "accommodation", "girls", "residence", "mess"]
  },
  {
    name: "Girls Hostel C",
    description: "Girls hostel with modern amenities",
    type: "building",
    coordinates: { lat: 30.3562, lng: 76.3651 }, // Northern hostel area
    tags: ["hostel", "accommodation", "girls", "residence"]
  },
  
  // ==================== DINING & FOOD ====================
  {
    name: "Old Mess (Central Dining)",
    description: "Primary mess and dining facility serving meals to hostel residents with multiple food counters",
    type: "poi",
    coordinates: { lat: 30.3541, lng: 76.3646 }, // Between hostels and academic area
    tags: ["food", "mess", "dining", "cafeteria", "meals", "lunch", "dinner"]
  },
  {
    name: "New Mess",
    description: "Modern dining facility with variety of food options",
    type: "poi",
    coordinates: { lat: 30.3544, lng: 76.3651 }, // Eastern dining area
    tags: ["food", "mess", "dining", "meals", "new"]
  },
  {
    name: "Nescafe (Coffee Shop)",
    description: "Popular coffee shop and casual dining spot for students, faculty, and visitors",
    type: "poi",
    coordinates: { lat: 30.3550, lng: 76.3638 }, // Near center, accessible location
    tags: ["food", "coffee", "cafe", "nescafe", "snacks", "beverages", "hangout"]
  },
  {
    name: "Domino's Pizza Outlet",
    description: "On-campus Domino's Pizza outlet for quick meals and gatherings",
    type: "poi",
    coordinates: { lat: 30.3547, lng: 76.3641 }, // Accessible central location
    tags: ["food", "pizza", "dominos", "fast-food", "snacks"]
  },
  {
    name: "Food Court",
    description: "Multi-vendor food court with diverse cuisine options",
    type: "poi",
    coordinates: { lat: 30.3545, lng: 76.3638 }, // Central food area
    tags: ["food", "dining", "food-court", "variety", "meals"]
  },
  
  // ==================== SPORTS & RECREATION ====================
  {
    name: "Sports Complex & Gymnasium",
    description: "Modern sports complex with gymnasium, indoor courts, and fitness facilities for students and faculty",
    type: "building",
    coordinates: { lat: 30.3535, lng: 76.3625 }, // South-west area
    tags: ["sports", "gym", "gymnasium", "fitness", "recreation", "health", "workout"]
  },
  {
    name: "Outdoor Stadium",
    description: "Large outdoor stadium for cricket, football, athletics, and major sports events",
    type: "poi",
    coordinates: { lat: 30.3530, lng: 76.3630 }, // South-western edge
    tags: ["sports", "stadium", "cricket", "football", "athletics", "outdoor"]
  },
  {
    name: "Basketball Courts",
    description: "Multiple outdoor basketball courts for practice and tournaments",
    type: "poi",
    coordinates: { lat: 30.3537, lng: 76.3622 }, // Western sports area
    tags: ["sports", "basketball", "courts", "outdoor"]
  },
  {
    name: "Tennis Courts",
    description: "Professional tennis courts for students and staff",
    type: "poi",
    coordinates: { lat: 30.3532, lng: 76.3622 }, // Near basketball courts
    tags: ["sports", "tennis", "courts", "outdoor"]
  },
  
  // ==================== ADMINISTRATIVE ====================
  {
    name: "Administrative Block (A-Block)",
    description: "Main administrative building housing Registrar office, Dean offices, and administrative staff",
    type: "building",
    coordinates: { lat: 30.3552, lng: 76.3632 }, // North of center
    tags: ["administration", "admin", "office", "registrar", "dean", "a-block"]
  },
  {
    name: "Admissions Office",
    description: "Office for admissions, student registration, and enrollment services",
    type: "poi",
    coordinates: { lat: 30.3553, lng: 76.3630 }, // Near admin block
    tags: ["administration", "admissions", "enrollment", "office"]
  },
  
  // ==================== CULTURAL & EVENTS ====================
  {
    name: "Auditorium (Main Hall)",
    description: "Large auditorium for cultural events, seminars, convocations, and guest lectures with seating for hundreds",
    type: "building",
    coordinates: { lat: 30.3550, lng: 76.3633 }, // Central, near library
    tags: ["auditorium", "events", "cultural", "seminars", "lectures", "convocation", "hall"]
  },
  {
    name: "Amphitheatre (Open Air Theatre)",
    description: "Outdoor amphitheatre for performances, cultural nights, and student gatherings",
    type: "poi",
    coordinates: { lat: 30.3546, lng: 76.3635 }, // Central open area
    tags: ["amphitheatre", "theatre", "outdoor", "cultural", "performances", "events"]
  },
  
  // ==================== HEALTH & SERVICES ====================
  {
    name: "Health Center (Medical)",
    description: "Campus health center providing medical services, first aid, and basic healthcare for students and staff",
    type: "poi",
    coordinates: { lat: 30.3548, lng: 76.3643 }, // Accessible eastern location
    tags: ["medical", "health", "healthcare", "emergency", "doctor", "clinic"]
  },
  {
    name: "ATM - SBI",
    description: "State Bank of India ATM for cash withdrawal and banking services",
    type: "poi",
    coordinates: { lat: 30.3549, lng: 76.3636 }, // Near center
    tags: ["atm", "bank", "sbi", "cash", "banking"]
  },
  {
    name: "ATM - PNB",
    description: "Punjab National Bank ATM",
    type: "poi",
    coordinates: { lat: 30.3546, lng: 76.3632 }, // Another accessible location
    tags: ["atm", "bank", "pnb", "cash", "banking"]
  },
  {
    name: "Stationery Shop",
    description: "Campus stationery store for books, supplies, and printing services",
    type: "poi",
    coordinates: { lat: 30.3547, lng: 76.3637 }, // Central accessible area
    tags: ["stationery", "shop", "books", "supplies", "printing", "xerox"]
  },
  
  // ==================== ENTRY/EXIT POINTS ====================
  {
    name: "Main Gate (Primary Entrance)",
    description: "Primary entrance to Thapar Institute campus with security check and visitor registration",
    type: "poi",
    coordinates: { lat: 30.3563, lng: 76.3625 }, // Northern entrance
    tags: ["gate", "entrance", "main-gate", "security", "entry"]
  },
  {
    name: "Gate No. 2 (Secondary Entrance)",
    description: "Secondary entrance to campus",
    type: "poi",
    coordinates: { lat: 30.3528, lng: 76.3640 }, // Southern entrance
    tags: ["gate", "entrance", "secondary", "entry"]
  },
  
  // ==================== NOTABLE LANDMARKS ====================
  {
    name: "Central Lawn",
    description: "Large central green lawn area popular for student gatherings, outdoor study, and events",
    type: "poi",
    coordinates: { lat: 30.3548, lng: 76.3638 }, // Central open space
    tags: ["lawn", "park", "green", "outdoor", "gathering", "events"]
  },
  {
    name: "Thapar Technology Campus (TTC)",
    description: "Innovation and technology hub for startups, research projects, and entrepreneurship development",
    type: "building",
    coordinates: { lat: 30.3558, lng: 76.3645 }, // North-eastern innovation zone
    tags: ["innovation", "technology", "startup", "entrepreneurship", "research", "ttc"]
  },
  {
    name: "Workshop & Labs Building",
    description: "Mechanical workshops and engineering laboratories for practical training",
    type: "building",
    coordinates: { lat: 30.3540, lng: 76.3628 }, // South-western academic area
    tags: ["workshop", "labs", "engineering", "mechanical", "practical"]
  },
  {
    name: "Guest House",
    description: "Campus guest house for visiting faculty, parents, and official guests",
    type: "building",
    coordinates: { lat: 30.3556, lng: 76.3622 }, // Western area, quiet zone
    tags: ["guest-house", "accommodation", "visitors", "lodging"]
  },
  {
    name: "Parking Area (Main)",
    description: "Primary parking facility for students, staff, and visitors",
    type: "poi",
    coordinates: { lat: 30.3560, lng: 76.3630 }, // Near main gate
    tags: ["parking", "vehicles", "cars", "bikes"]
  }
];

const seedThaparLocations = async () => {
  try {
    console.log('🚀 Starting Thapar campus locations seeding...\n');

    // Don't delete existing data, just add new locations
    // This preserves any manually added locations
    console.log('📍 Adding new Thapar campus locations...');

    // Check for duplicates before inserting
    for (const location of thaparLocations) {
      const exists = await Location.findOne({ name: location.name });
      if (exists) {
        console.log(`⏭️  Skipping "${location.name}" (already exists)`);
      } else {
        await Location.create(location);
        console.log(`✅ Added: ${location.name}`);
      }
    }

    const totalCount = await Location.countDocuments();
    console.log(`\n✨ Seeding completed successfully!`);
    console.log(`📊 Total locations in database: ${totalCount}`);
    console.log(`\n🎯 New locations added with categories:`);
    console.log(`   📚 Academic Buildings: COS, E-Block, J-Block, TAN, Library`);
    console.log(`   🏠 Hostels: A-F (Boys), Jaggi, Girls A-C`);
    console.log(`   🍽️ Dining: Old Mess, New Mess, Nescafe, Domino's, Food Court`);
    console.log(`   🏃 Sports: Sports Complex, Stadium, Courts`);
    console.log(`   🏛️ Admin: Administrative Block, Admissions`);
    console.log(`   🎭 Cultural: Auditorium, Amphitheatre`);
    console.log(`   🏥 Services: Health Center, ATMs, Stationery`);
    console.log(`   🚪 Entry Points: Main Gate, Gate No. 2`);
    console.log(`   🌳 Landmarks: Central Lawn, TTC, Workshop, Guest House\n`);
    
  } catch (error) {
    console.error('❌ Error seeding Thapar locations:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run seeding
connectDB().then(() => {
  seedThaparLocations();
});
