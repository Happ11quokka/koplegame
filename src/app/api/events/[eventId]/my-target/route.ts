import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const url = new URL(request.url);
    const participantId = url.searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json(
        { error: 'participantId query param is required' },
        { status: 400 }
      );
    }

    const adminApp = initAdmin();
    const db = getFirestore(adminApp);
    const eventRef = db.collection('events').doc(params.eventId);

    const participantDoc = await eventRef.collection('participants').doc(participantId).get();
    if (!participantDoc.exists) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    const assignmentSnapshot = await eventRef
      .collection('assignments')
      .where('participantId', '==', participantId)
      .limit(1)
      .get();

    if (assignmentSnapshot.empty) {
      return NextResponse.json(
        { error: 'No assignment found for participant' },
        { status: 404 }
      );
    }

    const assignmentDoc = assignmentSnapshot.docs[0];
    const assignmentData = assignmentDoc.data();

    const targetDoc = await eventRef
      .collection('participants')
      .doc(assignmentData.targetId)
      .get();

    if (!targetDoc.exists) {
      return NextResponse.json(
        { error: 'Target participant not found' },
        { status: 404 }
      );
    }

    const hintsSnapshot = await targetDoc.ref.collection('hints').get();
    const hints = hintsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const roundsSnapshot = await eventRef
      .collection('rounds')
      .where('isActive', '==', true)
      .limit(1)
      .get();

    const activeRound = roundsSnapshot.docs[0]?.data();
    const visibleLevels: string[] = activeRound?.visibleLevels || [];

    const visibleHints = hints.filter((hint: any) =>
      visibleLevels.includes(hint.level)
    );

    return NextResponse.json({
      participant: {
        id: participantDoc.id,
        ...participantDoc.data(),
      },
      assignment: {
        id: assignmentDoc.id,
        ...assignmentData,
      },
      target: {
        id: targetDoc.id,
        ...targetDoc.data(),
        hints,
        visibleHints,
      },
    });
  } catch (error) {
    console.error('Error fetching participant target:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant target' },
      { status: 500 }
    );
  }
}
