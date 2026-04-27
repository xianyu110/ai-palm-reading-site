# Cyber Palm Guide

一个受微信文章中「AI 看手相」玩法启发的静态网站：本地预览手掌照片、生成可复制提示词，并提醒掌纹/指纹等生物特征隐私风险。

## 本地预览

```bash
python3 -m http.server 4173
```

然后打开 `http://localhost:4173`。

## GitHub Pages 部署

本项目已经包含 `.github/workflows/pages.yml`。推送到 GitHub 后：

1. 打开仓库 `Settings -> Pages`。
2. `Build and deployment` 选择 `GitHub Actions`。
3. 推送到 `main` 分支，Actions 会自动部署。

如果你想手动创建远程仓库：

```bash
git init
git add .
git commit -m "Build AI palm reading prompt site"
git branch -M main
git remote add origin git@github.com:xianyu110/ai-palm-reading-site.git
git push -u origin main
```

部署完成后，站点地址通常是：

```text
https://xianyu110.github.io/ai-palm-reading-site/
```

## 自定义 API

页面默认填入：

```text
API Base URL: https://apipro.maynor1024.live/
Model: gpt-image-2-all
```

前端会从浏览器直接请求 OpenAI-compatible `POST /v1/images/generations`，并保留 `POST /v1/chat/completions` / `POST /v1/responses`。API Key 只保存到当前浏览器的 `localStorage`，不会提交到仓库。GitHub Pages 是纯静态托管，不能安全内置服务端密钥。

## 内容说明

- 不复制原文全文和原图，只做玩法再创作。
- 图片预览完全在浏览器本地完成，不上传、不存储。
- AI 玄学内容仅供娱乐，不应作为事实判断、诊断或预测。
