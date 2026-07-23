import { parseMarkdown } from './server/documentParser.ts';
import fs from 'fs';

const content = fs.readFileSync('/tmp/test-scripts.md', 'utf-8');
console.log('Testing parseMarkdown with content:');
console.log('---');
console.log(content);
console.log('---');

const scripts = await parseMarkdown(content, '5月脚本库');
console.log('\nParsed scripts:');
console.log(JSON.stringify(scripts, null, 2));
