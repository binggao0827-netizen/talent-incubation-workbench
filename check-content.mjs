import fs from 'fs';

const content = fs.readFileSync('/tmp/test-scripts.md', 'utf-8');

// Simulate the parsing logic
const scriptPattern = /选题[一二三四五六七八九十]+：?《?(.+?)》?(?=\n|选题|$)/g;
let match;
let scriptIndex = 1;

while ((match = scriptPattern.exec(content)) !== null) {
  const title = match[1].trim();
  
  // Find content for this script
  const currentPos = match.index + match[0].length;
  const nextScriptMatch = /选题[一二三四五六七八九十]+/.exec(content.substring(currentPos));
  const contentEnd = nextScriptMatch ? currentPos + nextScriptMatch.index : content.length;
  
  let scriptContent = content.substring(currentPos, contentEnd).trim();
  
  console.log(`Script ${scriptIndex}: "${title}"`);
  console.log(`Full content:\n${scriptContent}`);
  console.log(`\n---\n`);
  
  scriptIndex++;
}
