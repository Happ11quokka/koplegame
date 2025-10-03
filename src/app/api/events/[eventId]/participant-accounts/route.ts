import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    await initAdmin();
    const db = getFirestore();

    // Get all participant accounts for this event
    const accountsSnapshot = await db
      .collection('events')
      .doc(params.eventId)
      .collection('participantAccounts')
      .orderBy('participantId', 'asc')
      .get();

    const accounts = accountsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching participant accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant accounts' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    await initAdmin();
    const db = getFirestore();
    const auth = getAuth();

    const body = await request.json();
    const { count } = body;

    if (!count || count < 1 || count > 50) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Get existing accounts to find the next participant ID
    const existingAccountsSnapshot = await db
      .collection('events')
      .doc(params.eventId)
      .collection('participantAccounts')
      .orderBy('participantId', 'desc')
      .limit(1)
      .get();

    let nextId = 1;
    if (!existingAccountsSnapshot.empty) {
      const lastAccount = existingAccountsSnapshot.docs[0].data();
      nextId = lastAccount.participantId + 1;
    }

    const createdAccounts = [];
    const errors = [];

    // Create accounts
    for (let i = 0; i < count; i++) {
      const participantId = nextId + i;
      const email = `kople${participantId}@kople.com`;
      const password = 'kolple';

      try {
        // Create Firebase Auth user
        const userRecord = await auth.createUser({
          email,
          password,
          emailVerified: true
        });

        // Store account info in Firestore
        await db
          .collection('events')
          .doc(params.eventId)
          .collection('participantAccounts')
          .add({
            participantId,
            email,
            uid: userRecord.uid,
            isUsed: false,
            createdAt: new Date()
          });

        createdAccounts.push({ participantId, email });
      } catch (error: any) {
        console.error(`Error creating account ${email}:`, error);
        errors.push(`Failed to create ${email}: ${error.message}`);
      }
    }

    return NextResponse.json({
      created: createdAccounts.length,
      accounts: createdAccounts,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error creating participant accounts:', error);
    return NextResponse.json(
      { error: 'Failed to create participant accounts' },
      { status: 500 }
    );
  }
}
