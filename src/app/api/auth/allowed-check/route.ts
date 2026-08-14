import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ isAllowed: false, error: 'Email parameter missing' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!adminDb) {
      // Server fallback check
      return NextResponse.json({ isAllowed: true, mode: 'mock' });
    }

    const docRef = adminDb.collection('allowedUsers').doc(cleanEmail);
    const snap = await docRef.get();

    return NextResponse.json({ isAllowed: snap.exists, email: cleanEmail });
  } catch (err: any) {
    return NextResponse.json({ isAllowed: false, error: err.message }, { status: 500 });
  }
}
