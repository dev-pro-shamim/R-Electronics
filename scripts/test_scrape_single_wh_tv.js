async function test() {
  const res = await fetch('https://www.haier.com/bd/water-heaters/es30h-ck3-bd-.shtml');
  const html = await res.text();
  console.log('Status:', res.status, 'len:', html.length);

  // title
  const titleM = html.match(/<title>([^<]+)<\/title>/i);
  console.log('Title:', titleM ? titleM[1] : 'none');

  // find images
  const imgs = (html.match(/https:\/\/image\.haier\.com\/[^"'\s>]+\.(?:png|jpg|jpeg)/gi) || []);
  console.log('Unique images:', Array.from(new Set(imgs)).slice(0, 5));

  // test TV
  const resTv = await fetch('https://www.haier.com/bd/tvs/h32s80gfx.shtml');
  const htmlTv = await resTv.text();
  const titleTv = htmlTv.match(/<title>([^<]+)<\/title>/i);
  console.log('\nTV Title:', titleTv ? titleTv[1] : 'none');
  const imgsTv = (htmlTv.match(/https:\/\/image\.haier\.com\/[^"'\s>]+\.(?:png|jpg|jpeg)/gi) || []);
  console.log('TV Unique images:', Array.from(new Set(imgsTv)).slice(0, 5));
}
test();
