import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Event code is required' },
        { status: 400 }
      );
    }

    // Query Firestore to find event with this code
    const adminApp = initAdmin();
    const db = getFirestore(adminApp);

    const querySnapshot = await db
      .collection('events')
      .where('code', '==', code.toUpperCase())
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventDoc = querySnapshot.docs[0];
    const eventData = eventDoc.data();

    // Check if event is active
    if (eventData.status === 'ended') {
      return NextResponse.json(
        { error: 'This event has ended' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      eventId: eventDoc.id,
      title: eventData.title,
      status: eventData.status
    });
  } catch (error) {
    console.error('Error validating event code:', error);
    return NextResponse.json(
      { error: 'Failed to validate event code' },
      { status: 500 }
    );
  }
}
