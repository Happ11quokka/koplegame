import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

const shuffleArray = <T>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const adminApp = initAdmin();
    const db = getFirestore(adminApp);

    const eventRef = db.collection('events').doc(params.eventId);

    const [matchesSnapshot, assignmentsSnapshot] = await Promise.all([
      eventRef.collection('matches').get(),
      eventRef.collection('assignments').get(),
    ]);

    return NextResponse.json({
      matches: matchesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      assignments: assignmentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const adminApp = initAdmin();
    const db = getFirestore(adminApp);

    const eventRef = db.collection('events').doc(params.eventId);
    const participantsSnapshot = await eventRef.collection('participants').get();

    if (participantsSnapshot.empty) {
      return NextResponse.json(
        { error: 'No participants to match' },
        { status: 400 }
      );
    }

    const participants = participantsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (participants.length < 2) {
      return NextResponse.json(
        { error: 'At least two participants are required to create matches' },
        { status: 400 }
      );
    }

    const shuffled = shuffleArray(participants);
    const matches: Array<{ participantIds: string[] }> = [];

    for (let i = 0; i < shuffled.length; i += 1) {
      if (i === shuffled.length - 3) {
        matches.push({
          participantIds: [
            shuffled[i].id,
            shuffled[i + 1].id,
            shuffled[i + 2].id,
          ],
        });
        break;
      }

      if (i % 2 === 0) {
        matches.push({
          participantIds: [shuffled[i].id, shuffled[i + 1].id],
        });
      }
    }

    const batch = db.batch();

    const [existingMatchesSnapshot, existingAssignmentsSnapshot] = await Promise.all([
      eventRef.collection('matches').get(),
      eventRef.collection('assignments').get(),
    ]);

    existingMatchesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    existingAssignmentsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

    const now = Timestamp.now();

    matches.forEach(({ participantIds }) => {
      const type = participantIds.length === 3 ? 'trio' : 'pair';
      const matchRef = eventRef.collection('matches').doc();

      batch.set(matchRef, {
        eventId: params.eventId,
        participants: participantIds,
        type,
        createdAt: now,
        updatedAt: now,
      });

      participantIds.forEach((participantId, index) => {
        const targetId = participantIds[(index + 1) % participantIds.length];
        const assignmentRef = eventRef.collection('assignments').doc();
        batch.set(assignmentRef, {
          eventId: params.eventId,
          matchId: matchRef.id,
          participantId,
          targetId,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        });
      });
    });

    batch.update(eventRef, {
      matchingCreated: true,
      updatedAt: now,
    });

    await batch.commit();

    const [matchesSnapshot, assignmentsSnapshot] = await Promise.all([
      eventRef.collection('matches').get(),
      eventRef.collection('assignments').get(),
    ]);

    return NextResponse.json({
      matches: matchesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      assignments: assignmentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      createdMatches: matches.length,
      participantCount: participants.length,
    });
  } catch (error) {
    console.error('Error creating matches:', error);
    return NextResponse.json(
      { error: 'Failed to create matches' },
      { status: 500 }
    );
  }
}
