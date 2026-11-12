const fs = require('fs');
const html = fs.readFileSync('analysis/extracted_product_main.html', 'utf8');

// Section 1: left vs right column
const sec1Match = html.match(/<section class="bg-white md:mt-6 rounded-lg p-4 lg:grid lg:grid-cols-2 3xl:grid-cols-\[613px,_1fr\] lg:gap-3 3xl:gap-10">([\s\S]*?)<\/section>/);
if (sec1Match) {
  // Let's inspect where right column starts
  // The first child is gallery, let's find the second child
  console.log('--- Section 1 start ---');
  const inner = sec1Match[1];
  const rightColIndex = inner.indexOf('<div class="mt-4 md:mt-0');
  if (rightColIndex !== -1) {
    console.log('Right column starts with:');
    console.log(inner.slice(rightColIndex, rightColIndex + 2500));
  } else {
    // let's look for h1
    const h1Index = inner.indexOf('<h1');
    console.log('Around h1:');
    console.log(inner.slice(h1Index - 200, h1Index + 2000));
  }
}

// Section 2:
const sec2Match = html.match(/<section class="my-10 lg:mt-20 lg:mb-16 grid lg:grid-cols-\[1fr,_300px\] 2xl:grid-cols-\[1fr,_351px\] lg:gap-4 2xl:gap-6">([\s\S]*?)<\/section>/);
if (sec2Match) {
  console.log('--- Section 2 preview ---');
  console.log(sec2Match[1].slice(0, 1500));
}
