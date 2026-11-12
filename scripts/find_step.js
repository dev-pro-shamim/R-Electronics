const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/DITS-USER/.gemini/antigravity/brain/116bd0ad-cecc-4623-88e6-f061cd011624/.system_generated/logs/transcript_full.jsonl')
});
rl.on('line', (line) => {
  if (line.includes('"step_index":677')) {
    const data = JSON.parse(line);
    console.log(JSON.stringify(data.tool_calls, null, 2));
  }
});
