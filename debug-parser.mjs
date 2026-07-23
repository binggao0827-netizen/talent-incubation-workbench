import fs from 'fs';

const content = fs.readFileSync('/tmp/test-scripts.md', 'utf-8');
console.log('Full content:');
console.log(content);
console.log('\n---\n');

// Simulate the parsing logic
const scriptPattern = /选题[一二三四五六七八九十]+：?《?(.+?)》?(?=\n|选题|$)/g;
let match;
let scriptIndex = 1;

while ((match = scriptPattern.exec(content)) !== null) {
  const title = match[1].trim();
  console.log(`Match ${scriptIndex}:`);
  console.log(`  Title: "${title}"`);
  console.log(`  Match index: ${match.index}`);
  console.log(`  Match text: "${match[0]}"`);
  
  // Find content for this script
  const currentPos = match.index + match[0].length;
  const nextScriptMatch = /选题[一二三四五六七八九十]+/.exec(content.substring(currentPos));
  const contentEnd = nextScriptMatch ? currentPos + nextScriptMatch.index : content.length;
  
  console.log(`  Current pos: ${currentPos}`);
  console.log(`  Next script found: ${nextScriptMatch ? 'yes' : 'no'}`);
  if (nextScriptMatch) {
    console.log(`  Next script index: ${nextScriptMatch.index}`);
    console.log(`  Content end: ${contentEnd}`);
  }
  
  let scriptContent = content.substring(currentPos, contentEnd).trim();
  console.log(`  Raw content (first 100 chars): "${scriptContent.substring(0, 100)}..."`);
  console.log(`  Content length: ${scriptContent.length}`);
  console.log('');
  
  scriptIndex++;
}
