import fs from 'fs';
import path from 'path';
import os from 'os';
import { readCSVLinks } from '../src/index';

describe('CSV Parsing', () => {
  const tempDir = os.tmpdir();
  const csvPath = path.join(tempDir, 'test-urls.csv');

  afterEach(() => {
    if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
  });

  it('parses URLs from a CSV with header', async () => {
    fs.writeFileSync(csvPath, 'url\nhttp://a.com\nhttp://b.com');
    const links = await readCSVLinks(csvPath);
    expect(links).toEqual(['http://a.com', 'http://b.com']);
  });

  it('parses URLs from a CSV with no header', async () => {
    fs.writeFileSync(csvPath, 'http://a.com\nhttp://b.com');
    const links = await readCSVLinks(csvPath);
    expect(links).toEqual(['http://a.com', 'http://b.com']);
  });

  it('returns empty array for empty CSV', async () => {
    fs.writeFileSync(csvPath, '');
    const links = await readCSVLinks(csvPath);
    expect(links).toEqual([]);
  });
}); 