import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '../../lib/mongodb';
import { notifyAppointmentChange } from '../../lib/email';

const ACTIVITY_FIELDS = ['eatChoice', 'outsideChoice', 'movieLocation', 'movieGenre'];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const db = await getDb();
  const collection = db.collection('appointments');
  const _id = new ObjectId(id);

  if (body.schedule) {
    const scheduleDate = new Date(body.schedule);
    const conflict = await collection.findOne({
      schedule: scheduleDate,
      _id: { $ne: _id },
    });

    if (conflict) {
      return NextResponse.json(
        { error: 'There is already a date scheduled at that time.' },
        { status: 409 }
      );
    }
    body.schedule = scheduleDate;
  }

  // Whichever activity-specific fields aren't part of this update get
  // unset, so switching activity (e.g. "eat" -> "movie") doesn't leave
  // stale fields like eatChoice sitting on the document. Same idea for
  // note: an empty string means "cleared", so unset it rather than
  // storing an empty value.
  const fieldsToUnset = ACTIVITY_FIELDS.filter((f) => !(f in body));

  if (body.note === '') {
    fieldsToUnset.push('note');
    delete body.note;
  }

  const unsetOp = fieldsToUnset.length
    ? { $unset: Object.fromEntries(fieldsToUnset.map((f) => [f, ''])) }
    : {};

  await collection.updateOne(
    { _id },
    { $set: body, ...unsetOp }
  );

  notifyAppointmentChange(body, 'updated');

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  await db.collection('appointments').deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ success: true });
}