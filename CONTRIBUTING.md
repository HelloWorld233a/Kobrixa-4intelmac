# Contributing to Kobrixa / 參與 Kobrixa

## English

Kobrixa is currently specification-first. Contributions should preserve the documented boundaries: native EV3 `.rbf` output, cross-platform USB and Wi-Fi support, a clean-room `.bp` frontend, and explicit diagnostics for unsupported language features.

### Development baseline

- Current stable Rust toolchain
- Current Node.js LTS and pnpm
- Tauri 2 prerequisites for the contributor's operating system
- One supported EV3 brick for hardware changes; transport-independent work may use mocks

Exact minimum versions must be pinned in the implementation repository before the first buildable commit.

### Workflow

1. Open or reference an issue describing behavior and acceptance criteria.
2. Create a focused branch from `main` using `feature/`, `fix/`, `docs/`, or `test/`.
3. Keep commits small and use imperative summaries.
4. Add or update tests with every behavior change.
5. Update both English and Traditional Chinese documentation when a public contract changes.
6. Submit a pull request describing user impact, test evidence, platforms exercised, and known limitations.

### Required checks

- Rust formatting, linting, unit tests, and integration tests pass.
- TypeScript formatting, linting, type checking, and tests pass.
- Compiler changes include valid, invalid, and regression fixtures.
- USB or Wi-Fi changes include mocked tests and results from each affected operating system.
- Documentation links resolve and English/Traditional Chinese content remains semantically aligned.

### Clean-room compatibility

- Do not copy Clev3r code, assets, documentation, generated output tables, or private implementation details.
- Record compatibility requirements as observable input/output behavior.
- Write new fixtures and expected results independently.
- Keep provenance notes for public specifications and device protocol references.
- A contributor who studies a third-party implementation should not reproduce protected expression from it.
- Uncertain material must be excluded until maintainers confirm that it can be used lawfully.

### Pull request acceptance

A change is ready when its documented acceptance criteria pass, diagnostics are actionable, cancellation and error paths are covered where relevant, and no planned feature is presented as shipped.

## 繁體中文

Kobrixa 目前採用規格優先方式。貢獻內容必須維持已定義的邊界：輸出原生 EV3 `.rbf`、跨平台 USB 與 Wi-Fi 支援、clean-room `.bp` 前端，以及對不支援語言能力提供明確診斷。

### 開發基線

- 當前穩定版 Rust toolchain
- 當前 Node.js LTS 與 pnpm
- 貢獻者作業系統所需的 Tauri 2 前置環境
- 修改硬體功能時需要一台支援的 EV3；與 transport 無關的工作可以使用 mock

第一個可建置提交之前，實作倉庫必須鎖定確切最低版本。

### 工作流程

1. 建立或引用描述行為與驗收條件的 issue。
2. 從 `main` 建立單一目的分支，使用 `feature/`、`fix/`、`docs/` 或 `test/`。
3. 保持提交精簡，摘要使用命令式語氣。
4. 每次行為變更都要新增或更新測試。
5. 公共契約改變時，同步更新英文與繁中文件。
6. Pull request 必須說明使用者影響、測試證據、實測平台與已知限制。

### 必要檢查

- Rust 格式、lint、單元測試與整合測試通過。
- TypeScript 格式、lint、型別檢查與測試通過。
- 編譯器變更包含有效、無效與回歸 fixture。
- USB 或 Wi-Fi 變更包含 mock 測試，以及每個受影響作業系統的實測結果。
- 文件連結有效，英文與繁中內容語意一致。

### Clean-room 相容規則

- 不得複製 Clev3r 的程式碼、素材、文件、產生結果表或非公開實作細節。
- 將相容需求記錄為可觀察的輸入／輸出行為。
- 獨立撰寫新的 fixture 與預期結果。
- 為公開規格和設備協定參考保留來源紀錄。
- 研究過第三方實作的貢獻者不得重現其中受保護的表達。
- 權利狀態不明的材料必須排除，直到維護者確認可合法使用。

### Pull request 驗收

變更只有在文件中的驗收條件通過、診斷可採取行動、相關取消與錯誤路徑已覆蓋，且未將規劃功能描述成已發布時，才可合併。
