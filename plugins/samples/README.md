# Kobrixa Plugin Samples (Development Preview)

This directory contains minimal sample plugins for Kobrixa's Phase 1 plugin system:

- `hello-ts`: A TypeScript plugin running in an Electron `utilityProcess` over a transferred `MessagePort`.
- `hello-python`: A Python plugin running as a child process over `stdio` with `Content-Length` framing.

## Running the samples

```sh
pnpm install && pnpm build:core
npx esbuild plugins/samples/hello-ts/src/index.ts --bundle --platform=node --format=cjs \
  --outfile=plugins/samples/hello-ts/dist/index.cjs
python3 -m pip install -e sdks/python
pnpm dev -- -- --plugin-dev-dir="$PWD/plugins/samples/hello-ts:$PWD/plugins/samples/hello-python" \
  --plugin-python="$(command -v python3)"
```

On Windows, separate multiple `--plugin-dev-dir` paths with `;` instead of `:`. For a packaged macOS build, pass arguments via `open -a Kobrixa --args --plugin-dev-dir=…`.

## 範例插件說明（繁體中文）

本目錄包含 Kobrixa 第一階段插件系統的最小範例：

- `hello-ts`：在 Electron `utilityProcess` 中透過 `MessagePort` 執行的 TypeScript 插件。
- `hello-python`：透過 `stdio` 與 `Content-Length` 分幀執行的 Python 開發插件。

Windows 環境請以 `;` 分隔多個 `--plugin-dev-dir` 資料夾；macOS 打包版本可使用 `open -a Kobrixa --args --plugin-dev-dir=…` 啟動。
