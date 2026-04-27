const form = document.querySelector('#prompt-form');
const output = document.querySelector('#prompt-output');
const copyButton = document.querySelector('#copy-button');
const copyStatus = document.querySelector('#copy-status');
const upload = document.querySelector('#hand-upload');
const previewImage = document.querySelector('#preview-image');
const previewPlaceholder = document.querySelector('.preview-placeholder');
const apiBaseInput = document.querySelector('#api-base');
const apiModelInput = document.querySelector('#api-model');
const apiKeyInput = document.querySelector('#api-key');
const apiEndpointInput = document.querySelector('#api-endpoint');
const apiButton = document.querySelector('#run-api-button');
const testApiButton = document.querySelector('#test-api-button');
const apiResult = document.querySelector('#api-result');
const imageResult = document.querySelector('#image-result');
const apiStatus = document.querySelector('#api-status');

let imageDataUrl = '';

const subjects = {
  hand: 'a clear palm photo',
  paw: 'a pet paw photo, interpreted like a playful paw-reading guide',
  face: 'a face photo, interpreted as a lighthearted visual character-reading guide',
};

const subjectLabels = {
  hand: '手掌',
  paw: '宠物爪子',
  face: '面部轮廓',
};

const tones = {
  warm: 'warm, reassuring, emotionally intelligent, never deterministic',
  career: 'polished like a senior career coach or executive recruiter',
  mystic: 'cyber-mystic, poetic, subtle, modern rather than old-fashioned',
  skeptic: 'witty and self-aware, with gentle humor about the Barnum effect',
};

const toneLabels = {
  warm: '温柔治愈',
  career: '职场猎头感',
  mystic: '赛博玄学',
  skeptic: '半信半疑吐槽',
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

  const reader = new FileReader();
  reader.onload = () => {
    imageDataUrl = reader.result;
    apiStatus.textContent = '图片已载入本地预览。调用 API 前请确认你愿意把这张图发送给该接口。';
  };
  reader.readAsDataURL(file);
}

function normalizeBaseUrl(value) {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

function readApiSettings() {
  return {
    baseUrl: apiBaseInput.value.trim(),
    model: apiModelInput.value.trim(),
    endpointMode: apiEndpointInput.value,
    key: apiKeyInput.value.trim(),
  };
}

function saveApiSettings() {
  const { baseUrl, model, endpointMode, key } = readApiSettings();
  localStorage.setItem('palm_api_base_url', baseUrl);
  localStorage.setItem('palm_api_model', model);
  localStorage.setItem('palm_api_endpoint', endpointMode);
  localStorage.setItem('palm_api_key', key);
}

function loadApiSettings() {
  const savedModel = localStorage.getItem('palm_api_model');
  const savedEndpoint = localStorage.getItem('palm_api_endpoint');
  apiBaseInput.value = localStorage.getItem('palm_api_base_url') || apiBaseInput.value;
  apiModelInput.value = savedModel && !['gpt5.5', 'gpt-5.5'].includes(savedModel)
    ? savedModel
    : apiModelInput.value;
  apiEndpointInput.value = savedEndpoint && savedModel && !['gpt5.5', 'gpt-5.5'].includes(savedModel)
    ? savedEndpoint
    : apiEndpointInput.value;
  apiKeyInput.value = localStorage.getItem('palm_api_key') || '';
}

function buildImagePrompt() {
  const subject = subjectLabels[form.subject.value];
  const tone = toneLabels[form.tone.value];
  const styles = selectedStyles();
  const visualStyle = styles.length ? styles.join(', ') : 'clean minimal visual language';

  return `Create a final shareable AI ${subject} reading guide image.

Visual direction: ${visualStyle}. Use a premium editorial layout, a clean black contour illustration, delicate guide lines, numbered callouts, compact rounded insight cards, balanced whitespace, and warm white paper texture.

Chinese copy direction: ${tone}. Write short, elegant Chinese microcopy. Make it feel personal and emotionally intelligent, but avoid absolute predictions, medical claims, financial promises, or fear-based fortune telling. Include a tiny disclaimer that it is for entertainment and self-reflection only.

Output: one polished square image, high-end minimal black-and-white design, crisp typography, ready to share on social media.`;
}

function endpointPath(endpointMode) {
  if (endpointMode === 'images') return 'images/generations';
  if (endpointMode === 'responses') return 'responses';
  return 'chat/completions';
}

function makeAbortSignal(timeoutMs = 240000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

async function readResponsePayload(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function formatFetchError(error) {
  if (error.name === 'AbortError') {
    return '请求超时：浏览器等了 240 秒仍没有收到完整响应。请调高接口网关超时，或改用后端代理/异步任务。';
  }
  return `${error.name || 'Error'}: ${error.message || error}`;
}

function extractMessage(payload) {
  if (payload?.choices?.[0]?.message?.content) return payload.choices[0].message.content;
  if (payload?.choices?.[0]?.text) return payload.choices[0].text;
  if (payload?.output_text) return payload.output_text;
  if (Array.isArray(payload?.output)) {
    return payload.output.flatMap((item) => item.content || [])
      .map((part) => part.text || part.output_text || '')
      .filter(Boolean)
      .join('\n');
  }
  return JSON.stringify(payload, null, 2);
}


function renderImageResult(payload) {
  const item = payload?.data?.[0];
  const imageUrl = item?.url || (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : '');
  if (!imageUrl) {
    imageResult.hidden = false;
    imageResult.innerHTML = '<p>接口返回成功，但没有找到 data[0].url 或 data[0].b64_json。</p>';
    return;
  }

  imageResult.hidden = false;
  imageResult.innerHTML = `<img src="${imageUrl}" alt="AI 生成的手相视觉指南" />${item?.url ? `<a href="${imageUrl}" target="_blank" rel="noreferrer">打开原图</a>` : ''}`;
}

async function testCustomApi() {
  saveApiSettings();
  const { baseUrl, endpointMode } = readApiSettings();
  const endpoint = normalizeBaseUrl(baseUrl);

  if (!endpoint) {
    apiStatus.textContent = '请先填写 API Base URL。';
    return;
  }

  testApiButton.disabled = true;
  testApiButton.textContent = '测试中...';
  apiResult.value = '';
  imageResult.hidden = true;
  imageResult.innerHTML = '';

  const url = `${endpoint}/${endpointPath(endpointMode)}`;
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(endpointMode === 'images'
        ? { model: 'connection-test', prompt: 'connection test', n: 1, size: '1024x1024' }
        : { model: 'connection-test', messages: [{ role: 'user', content: 'connection test' }] }),
    });
    const payload = await readResponsePayload(response);
    const ms = Math.round(performance.now() - startedAt);
    apiResult.value = JSON.stringify({ ok: response.ok, status: response.status, elapsed_ms: ms, payload }, null, 2);
    apiStatus.textContent = response.status === 401
      ? '连接测试通过：浏览器能直连 API，401 是因为测试请求故意没有带 Key。'
      : `连接测试完成：HTTP ${response.status}，耗时 ${ms}ms。`;
  } catch (error) {
    apiResult.value = formatFetchError(error);
    apiStatus.textContent = '连接测试失败：浏览器无法完成请求。若是 ERR_CONNECTION_CLOSED，多半是接口网关/上游主动断开。';
  } finally {
    testApiButton.disabled = false;
    testApiButton.textContent = '测试连接';
  }
}

async function runCustomApi() {
  saveApiSettings();
  const { baseUrl, model, endpointMode, key } = readApiSettings();
  const endpoint = normalizeBaseUrl(baseUrl);

  if (!endpoint || !model) {
    apiStatus.textContent = '请先填写 API Base URL 和模型名。';
    return;
  }

  apiButton.disabled = true;
  testApiButton.disabled = true;
  apiButton.textContent = '生成中...';
  apiStatus.textContent = endpointMode === 'images'
    ? '正在调用图片生成接口，可能需要 1-3 分钟。/v1/images/generations 通常只接收提示词，不会发送上传图片。'
    : '正在调用自定义 API。图片会发送给你填写的接口，请确认该接口可信。';
  apiResult.value = '';
  imageResult.hidden = true;
  imageResult.innerHTML = '';

  const subject = subjectLabels[form.subject.value];
  const tone = toneLabels[form.tone.value];
  const textPrompt = `你是一个负责娱乐向视觉解读的中文内容设计师。请基于用户上传的${subject}图片，生成一份适合放进极简黑白卡片海报里的中文文案。

要求：
1. 语气：${tone}，像高级但克制的个人洞察，不要恐吓，不要绝对预测。
2. 输出结构：标题、3 个主要观察、3 张短卡片、1 句免责声明。
3. 每条内容短、好看、适合排版。
4. 明确提醒：这只是娱乐和自我反思，不是事实判断、医疗建议、财务建议或命运预测。

参考视觉提示词：
${output.value}`;

  const userContent = [{ type: 'text', text: textPrompt }];
  if (imageDataUrl) {
    userContent.push({ type: 'image_url', image_url: { url: imageDataUrl } });
  }

  const headers = { 'Content-Type': 'application/json' };
  if (key) headers.Authorization = `Bearer ${key}`;

  try {
    const isImages = endpointMode === 'images';
    const isResponses = endpointMode === 'responses';
    const timeout = makeAbortSignal();
    const response = await fetch(`${endpoint}/${endpointPath(endpointMode)}`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      signal: timeout.signal,
      headers,
      body: JSON.stringify(isImages ? {
        model,
        prompt: buildImagePrompt(),
        n: 1,
        size: '1024x1024',
      } : isResponses ? {
        model,
        input: [
          { role: 'system', content: [{ type: 'input_text', text: '你只输出中文，内容用于娱乐向 AI 手相/爪相/面相视觉卡片。' }] },
          { role: 'user', content: userContent.map((part) => part.type === 'text'
            ? { type: 'input_text', text: part.text }
            : { type: 'input_image', image_url: part.image_url.url }) },
        ],
        temperature: 0.8,
      } : {
        model,
        messages: [
          { role: 'system', content: '你只输出中文，内容用于娱乐向 AI 手相/爪相/面相视觉卡片。' },
          { role: 'user', content: userContent },
        ],
        temperature: 0.8,
      }),
    });

    const payload = await readResponsePayload(response);
    timeout.cancel();
    if (!response.ok) {
      throw new Error(payload?.error?.message || payload?.message || `HTTP ${response.status}`);
    }

    if (isImages) {
      renderImageResult(payload);
      apiResult.value = JSON.stringify(payload, null, 2);
      apiStatus.textContent = '图片生成完成。/v1/images/generations 是文生图端点，上传图片只作为本地参考预览。';
    } else {
      apiResult.value = extractMessage(payload);
      apiStatus.textContent = '生成完成。你可以复制这段文案继续做图。';
    }
  } catch (error) {
    apiResult.value = formatFetchError(error);
    apiStatus.textContent = `调用失败：${formatFetchError(error)}。如果 Chrome 显示 ERR_CONNECTION_CLOSED，通常是接口侧/网关/上游主动断开，而不是页面参数错误。`;
  } finally {
    apiButton.disabled = false;
    testApiButton.disabled = false;
    apiButton.textContent = '调用 API';
  }
}

form.addEventListener('input', buildPrompt);
copyButton.addEventListener('click', copyPrompt);
upload.addEventListener('change', previewFile);
apiButton.addEventListener('click', runCustomApi);
testApiButton.addEventListener('click', testCustomApi);
[apiBaseInput, apiModelInput, apiEndpointInput, apiKeyInput].forEach((input) => input.addEventListener('change', saveApiSettings));
loadApiSettings();
buildPrompt();
