import fs from 'fs';
import { parseDocument } from './server/documentParser.ts';

async function test() {
  try {
    const content = fs.readFileSync('./test-scripts.md', 'utf-8');
    const base64 = Buffer.from(content).toString('base64');
    const result = await parseDocument(base64, 'md', '2026年5月脚本');
    console.log('✓ 解析成功！');
    console.log('解析结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('✗ 解析失败:', error.message);
  }
}

test();
