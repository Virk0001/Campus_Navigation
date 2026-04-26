/**
 * Delete All Users Script
 * WARNING: This will permanently delete all users from Firebase Auth and Firestore
 * Use with caution - this action is irreversible
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const { getFirebaseAuth, getFirebaseFirestore } = await import('../src/utils/firebaseAdmin.js');

async function deleteAllUsers() {
  console.log('⚠️  WARNING: This will delete ALL users from the database!');
  console.log('⚠️  This action is IRREVERSIBLE!\n');

  const auth = getFirebaseAuth();
  const db = getFirebaseFirestore();

  try {
    // Step 1: Get all users from Firestore
    console.log('📋 Step 1: Fetching all users from Firestore...');
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('✅ No users found in Firestore. Database is already clean.\n');
      return;
    }

    const userCount = usersSnapshot.size;
    console.log(`📊 Found ${userCount} user(s) in Firestore\n`);

    // Step 2: Delete each user
    console.log('🗑️  Step 2: Deleting users...\n');
    
    let successCount = 0;
    let errorCount = 0;

    for (const doc of usersSnapshot.docs) {
      const uid = doc.id;
      const userData = doc.data();
      
      try {
        console.log(`  Deleting: ${userData.email} (${userData.role})`);
        
        // Delete from Firestore
        await db.collection('users').doc(uid).delete();
        console.log(`    ✅ Firestore document deleted`);
        
        // Delete from Firebase Auth
        try {
          await auth.deleteUser(uid);
          console.log(`    ✅ Firebase Auth user deleted`);
        } catch (authError) {
          if (authError.code === 'auth/user-not-found') {
            console.log(`    ⚠️  User not found in Firebase Auth (already deleted)`);
          } else {
            throw authError;
          }
        }
        
        successCount++;
        console.log(`    ✅ Complete\n`);
        
      } catch (error) {
        errorCount++;
        console.error(`    ❌ Error deleting ${userData.email}:`, error.message, '\n');
      }
    }

    // Step 3: Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 DELETION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total users found:     ${userCount}`);
    console.log(`Successfully deleted:  ${successCount}`);
    console.log(`Errors:                ${errorCount}`);
    console.log('='.repeat(50));

    if (successCount === userCount) {
      console.log('\n✨ All users deleted successfully!');
      console.log('🧹 Database is now clean.\n');
    } else {
      console.log('\n⚠️  Some users could not be deleted. Check errors above.\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal error during deletion:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🔥 Firebase User Deletion Script\n');
deleteAllUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
