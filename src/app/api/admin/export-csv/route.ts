import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!adminDb) {
      return NextResponse.json({ message: 'Use client CSV export generator in demo mode.' });
    }

    let query: any = adminDb.collectionGroup('registrations');
    if (eventId) {
      query = query.where('eventId', '==', eventId);
    }

    const snap = await query.get();
    const registrations: any[] = [];
    snap.forEach((d: any) => registrations.push(d.data()));

    return NextResponse.json({ count: registrations.length, data: registrations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
