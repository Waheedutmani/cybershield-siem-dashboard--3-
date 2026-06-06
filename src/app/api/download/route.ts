import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync, unlinkSync, readFileSync } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const projectDir = '/home/z/my-project';
    const zipPath = '/tmp/cybershield-siem-dashboard.zip';

    // Remove old zip if exists
    if (existsSync(zipPath)) {
      unlinkSync(zipPath);
    }

    // Create zip excluding node_modules, .next, db, .git, etc.
    execSync(
      `cd "${projectDir}" && zip -r "${zipPath}" . \
        -x "node_modules/*" \
        -x ".next/*" \
        -x "db/*" \
        -x ".git/*" \
        -x ".zscripts/*" \
        -x "*.log" \
        -x ".env" \
        -x "dev.log" \
        -x ".DS_Store"`,
      { stdio: 'pipe' }
    );

    if (!existsSync(zipPath)) {
      return NextResponse.json({ error: 'Failed to create zip' }, { status: 500 });
    }

    const fileBuffer = readFileSync(zipPath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="cybershield-siem-dashboard.zip"',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Download failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
