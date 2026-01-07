import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test bcrypt
    const testPassword = 'TestPassword123!';
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(testPassword, salt);
    const isMatch = await bcrypt.compare(testPassword, hashed);

    return NextResponse.json({
      status: 'ok',
      bcrypt: {
        works: isMatch,
        hashedLength: hashed.length
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
