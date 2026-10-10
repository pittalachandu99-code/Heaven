const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processImages() {
  const perfumesDir = path.join(__dirname, '..', 'public', 'images', 'perfumes');
  const outDir = path.join(__dirname, '..', 'public', 'images', 'products');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Jasmine is single image
  const jasmineSrc = path.join(perfumesDir, 'media_1791646470314_d10218b8.jpg');
  if (fs.existsSync(jasmineSrc)) {
    await sharp(jasmineSrc)
      .jpeg({ quality: 90 })
      .toFile(path.join(outDir, 'jasmine.jpg'));
    console.log('Saved jasmine.jpg');
  }

  const grids = [
    {
      file: 'media_1791646430780_38660fb5.jpg',
      tl: 'sandalwood.jpg',
      tr: 'vanilla.jpg',
      bl: 'citrus.jpg',
      br: 'oud.jpg'
    },
    {
      file: 'media_1791646430813_34c1dad3.jpg',
      tl: 'coffee.jpg',
      tr: 'cherry-blossom.jpg',
      bl: 'musk.jpg',
      br: 'patchouli.jpg'
    },
    {
      file: 'media_1791646430827_fbd9ec6a.jpg',
      tl: 'peach.jpg',
      tr: 'fresh-linen.jpg',
      bl: 'amber.jpg',
      br: 'green-tea.jpg'
    },
    {
      file: 'media_1791646430846_80cb3484.jpg',
      tl: 'lavender.jpg',
      tr: 'rose.jpg',
      bl: 'sandalwood-noir.jpg',
      br: 'ocean-breeze.jpg'
    }
  ];

  for (const grid of grids) {
    const src = path.join(perfumesDir, grid.file);
    if (!fs.existsSync(src)) continue;
    const metadata = await sharp(src).metadata();
    const halfW = Math.floor(metadata.width / 2);
    const halfH = Math.floor(metadata.height / 2);

    // Top-Left
    await sharp(src)
      .extract({ left: 0, top: 0, width: halfW, height: halfH })
      .jpeg({ quality: 90 })
      .toFile(path.join(outDir, grid.tl));
    console.log(`Saved ${grid.tl}`);

    // Top-Right
    await sharp(src)
      .extract({ left: halfW, top: 0, width: halfW, height: halfH })
      .jpeg({ quality: 90 })
      .toFile(path.join(outDir, grid.tr));
    console.log(`Saved ${grid.tr}`);

    // Bottom-Left
    await sharp(src)
      .extract({ left: 0, top: halfH, width: halfW, height: halfH })
      .jpeg({ quality: 90 })
      .toFile(path.join(outDir, grid.bl));
    console.log(`Saved ${grid.bl}`);

    // Bottom-Right
    await sharp(src)
      .extract({ left: halfW, top: halfH, width: halfW, height: halfH })
      .jpeg({ quality: 90 })
      .toFile(path.join(outDir, grid.br));
    console.log(`Saved ${grid.br}`);
  }

  console.log('Finished slicing all luxury perfume images!');
}

processImages().catch(err => {
  console.error(err);
  process.exit(1);
});
