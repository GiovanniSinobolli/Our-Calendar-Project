import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../lib/mongodb';
import { notifyAppointmentChange } from '../lib/email';
import { ratelimit, getClientIp } from '../lib/ratelimit';

export async function GET() {
  const db = await getDb();
  const appointments = await db.collection('appointments').find().toArray();
  return NextResponse.json(appointments);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, limit, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again shortly.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
        },
      }
    );
  }

  const body = await request.json();
  const db = await getDb();
  const collection = db.collection('appointments');

  const scheduleDate = new Date(body.schedule);

  const conflict = await collection.findOne({ schedule: scheduleDate });
  if (conflict) {
    return NextResponse.json(
      { error: 'There is already a date scheduled at that time.' },
      { status: 409 }
    );
  }

  const result = await collection.insertOne({
    ...body,
    schedule: scheduleDate,
    createdAt: new Date(),
  });

  notifyAppointmentChange(body, 'created');

  return NextResponse.json({ insertedId: result.insertedId }, { status: 201 });
}