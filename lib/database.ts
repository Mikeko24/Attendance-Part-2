import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('attendance.db');
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS events (
        eventId TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        start TEXT NOT NULL,
        end TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId TEXT NOT NULL,
        eventId TEXT NOT NULL,
        scannedAt TEXT NOT NULL,
        FOREIGN KEY (eventId) REFERENCES events (eventId)
      );
    `);
  }
  return db;
}

export type AttendanceRecord = {
  id: number;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
};

export type RegisterResult = {
  success: boolean;
  message: string;
};

export async function registerAttendance(
  data: string,
  studentId: string
): Promise<RegisterResult> {
  let payload: any;
  try {
    payload = JSON.parse(data);
  } catch {
    return { success: false, message: 'Invalid QR code.' };
  }

  if (payload.v !== 1 || !payload.event) {
    return { success: false, message: 'Not an attendance QR code.' };
  }

  const eventId = payload.event;
  const title = payload.title ?? 'Untitled Event';
  const start = payload.start;
  const end = payload.end;

  if (!start || !end) {
    return { success: false, message: 'Invalid QR code.' };
  }

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const now = Date.now();

  if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
    return { success: false, message: 'Invalid date format.' };
  }

  if (now < startTime) {
    return { success: false, message: 'Event has not started yet.' };
  }

  if (now > endTime) {
    return { success: false, message: 'Event has already ended.' };
  }

  const database = await getDb();

  // Ensure the event row exists, updating its details if the eventId is reused
  await database.runAsync(
    `INSERT INTO events (eventId, title, start, end) VALUES (?, ?, ?, ?)
     ON CONFLICT(eventId) DO UPDATE SET
       title = excluded.title,
       start = excluded.start,
       end = excluded.end`,
    eventId,
    title,
    start,
    end
  );

  const existing = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM attendance WHERE studentId = ? AND eventId = ?',
    studentId,
    eventId
  );

  if (existing) {
    return { success: false, message: 'Already registered.' };
  }

  await database.runAsync(
    'INSERT INTO attendance (studentId, eventId, scannedAt) VALUES (?, ?, ?)',
    studentId,
    eventId,
    new Date().toISOString()
  );

  return { success: true, message: 'Attendance recorded!' };
}

export async function getAttendanceHistory(
  studentId: string
): Promise<AttendanceRecord[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: number;
    eventId: string;
    eventTitle: string;
    scannedAt: string;
  }>(
    `SELECT a.id, a.eventId, e.title AS eventTitle, a.scannedAt
     FROM attendance a
     JOIN events e ON e.eventId = a.eventId
     WHERE a.studentId = ?
     ORDER BY a.scannedAt DESC`,
    studentId
  );
  return rows;
}

export type Event = {
  eventId: string;
  title: string;
  start: string;
  end: string;
};

export async function createEvent(event: Event): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO events (eventId, title, start, end) VALUES (?, ?, ?, ?)',
    event.eventId,
    event.title,
    event.start,
    event.end
  );
}