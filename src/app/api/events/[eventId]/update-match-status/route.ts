import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

const ALLOWED_STATUSES = ['pending', 'found', 'completed'];

export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await request.json();
    const { participantId, status } = body;

    if (!participantId || !status) {
      return NextResponse.json(
        { error: 'participantId and status are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid match status' },
        { status: 400 }
      );
    }

    const adminApp = initAdmin();
    const db = getFirestore(adminApp);
    const eventRef = db.collection('events').doc(params.eventId);

    const assignmentSnapshot = await eventRef
      .collection('assignments')
      .where('participantId', '==', participantId)
      .limit(1)
      .get();

    if (assignmentSnapshot.empty) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    const assignmentDoc = assignmentSnapshot.docs[0];
    const assignmentData = assignmentDoc.data();

    const now = Timestamp.now();
    const assignmentUpdates: Record<string, any> = {
      status,
      updatedAt: now,
    };

    if (status === 'found') {
      assignmentUpdates.foundAt = now;
      assignmentUpdates.completedAt = null;
    } else if (status === 'completed') {
      assignmentUpdates.foundAt = assignmentData.foundAt || now;
      assignmentUpdates.completedAt = now;
    } else {
      assignmentUpdates.foundAt = null;
      assignmentUpdates.completedAt = null;
    }

    await assignmentDoc.ref.update(assignmentUpdates);

    const participantRef = eventRef.collection('participants').doc(participantId);
    const participantUpdates: Record<string, any> = {
      isMatched: status === 'completed',
      updatedAt: now,
    };

    if (status === 'completed') {
      participantUpdates.matchId = assignmentData.matchId;
    } else if (status === 'pending') {
      participantUpdates.matchId = null;
    }

    await participantRef.update(participantUpdates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating match status:', error);
    return NextResponse.json(
      { error: 'Failed to update match status' },
      { status: 500 }
    );
  }
}
