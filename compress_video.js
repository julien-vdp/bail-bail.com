const ffmpeg = require('ffmpeg-static');
const { execSync } = require('child_process');
const fs = require('fs');

const videos = [
  { in: '2070044-hd_1920_1080_25fps.mp4', out: 'public/bg-video-1.mp4' },
  { in: '4553196-uhd_4096_2160_25fps.mp4', out: 'public/bg-video-2.mp4' },
  { in: '7205517-uhd_3840_2160_25fps.mp4', out: 'public/bg-video-3.mp4' },
  { in: '8293009-hd_1920_1080_30fps.mp4', out: 'public/bg-video-4.mp4' }
];

for (const vid of videos) {
  try {
    console.log(`Compressing ${vid.in}...`);
    const cmd = `"${ffmpeg}" -y -i "${vid.in}" -vf scale=-2:720 -c:v libx264 -preset veryfast -crf 28 -movflags +faststart -an "${vid.out}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Finished ${vid.in}!`);
  } catch (e) {
    console.error(`Error with ${vid.in}:`, e);
  }
}

