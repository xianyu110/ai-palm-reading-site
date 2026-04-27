const form = document.querySelector('#prompt-form');
const output = document.querySelector('#prompt-output');
const copyButton = document.querySelector('#copy-button');
const copyStatus = document.querySelector('#copy-status');
const upload = document.querySelector('#hand-upload');
const previewImage = document.querySelector('#preview-image');
const previewPlaceholder = document.querySelector('.preview-placeholder');

const subjects = {
  hand: 'a clear palm photo',
  paw: 'a pet paw photo, interpreted like a playful paw-reading guide',
  face: 'a face photo, interpreted as a lighthearted visual character-reading guide',
};

const tones = {
  warm: 'warm, reassuring, emotionally intelligent, never deterministic',
  career: 'polished like a senior career coach or executive recruiter',
  mystic: 'cyber-mystic, poetic, subtle, modern rather than old-fashioned',
  skeptic: 'witty and self-aware, with gentle humor about the Barnum effect',
};

function selectedStyles() {
  return [...form.querySelectorAll('input[name="style"]:checked')].map((item) => item.value);
}

function buildPrompt() {
  const subject = subjects[form.subject.value];
  const tone = tones[form.tone.value];
  const styles = selectedStyles();
  const visualStyle = styles.length ? styles.join(', ') : 'clean minimal visual language';

  output.value = `Use the attached image as reference and create a refined visual reading guide based on ${subject}.

Design direction: ${visualStyle}. Build a premium editorial composition with a simple contour map, delicate guide lines, numbered callouts, and compact rounded insight cards. Keep the background calm and uncluttered.

Content direction: write short observations in a ${tone} tone. Make every line feel personal but avoid absolute predictions, medical claims, financial promises, or fear-based fortune telling. Frame it as playful self-reflection and visual storytelling.

Final image: high-end, minimal, shareable, black ink on warm paper, balanced whitespace, crisp typography, elegant linework.`;
}

function copyPrompt() {
  output.select();
  output.setSelectionRange(0, output.value.length);
  navigator.clipboard.writeText(output.value).then(() => {
    copyStatus.textContent = '已复制。把它和你的图片一起发送给 AI 图像工具即可。';
    copyButton.textContent = '已复制';
    setTimeout(() => {
      copyButton.textContent = '复制';
      copyStatus.textContent = '建议先遮挡指纹细节，或使用不常用于解锁/门禁的手。';
    }, 2200);
  }).catch(() => {
    copyStatus.textContent = '复制失败，可以手动选中文本复制。';
  });
}

function previewFile(event) {
  const [file] = event.target.files;
  if (!file) return;

  const url = URL.createObjectURL(file);
  previewImage.src = url;
  previewImage.hidden = false;
  previewPlaceholder.hidden = true;
}

form.addEventListener('input', buildPrompt);
copyButton.addEventListener('click', copyPrompt);
upload.addEventListener('change', previewFile);
buildPrompt();
