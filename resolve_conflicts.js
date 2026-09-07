const fs = require('fs');

function keepUpstream(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const newLines = [];
  let inUpstream = false;
  let inStash = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('<<<<<<< Updated upstream')) {
      inUpstream = true;
      continue;
    }
    if (line.startsWith('=======')) {
      inUpstream = false;
      inStash = true;
      continue;
    }
    if (line.startsWith('>>>>>>> Stashed changes')) {
      inStash = false;
      continue;
    }

    if (inStash) {
      // Discard
      continue;
    }

    newLines.push(line);
  }

  fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
  console.log('Fixed:', filePath);
}

keepUpstream('src/types/models.ts');
keepUpstream('src/features/orders/screens/OrderDetailsScreen.tsx');
