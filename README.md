# ulike-new-products-gpt

机会新品库的独立、可维护复刻版。

- 正式页面：https://yichu-zql.github.io/ulike-new-products-gpt/#zones
- 原页面：https://yichu-zql.github.io/ulike-new-products/#zones
- 基准源码：https://github.com/yichu-zql/ulike-new-products/tree/ef2fa568911441a1ae46d538c416312322fd60de
- 当前资料：129 个新品、8 期、127 张参考图，数据截至 2026-10-28。

保留原版专区、三种视角、筛选比较、每期详情及参考来源。产品事实沿用原版研究，本轮未对全部外部市场资料重新调查。

## 开发与发布

需要 Node.js 20 或以上，无第三方运行依赖，无须 npm install。

```sh
npm test
npm run build
npm run preview
```

预览：http://127.0.0.1:4173/ulike-new-products-gpt/ 。构建只把页面与静态资源放入 `dist/`。GitHub Pages 使用 GitHub Actions：推送 `main` → 数据/样式/行为校验 → 构建 → 部署。仓库 Settings → Pages → Source 应为 GitHub Actions。

## 文件结构

| 文件 | 用途 |
| --- | --- |
| `src/index.html` | 页面骨架与相对资源入口 |
| `src/styles.css` | 原版样式与响应式规则 |
| `src/app.js` | 视角、筛选、渲染、详情导航、弹窗 |
| `data/products.json` | 唯一业务数据入口：days 与 items |
| `data/provenance.json` | 原始提交、数据与脚本指纹、图片字节校验及必要差异 |
| `assets/images/` | 无损提取的 127 张原图 |
| `scripts/validate.cjs` | 完整性、来源保真与语法校验 |
| `scripts/build.cjs` | 生成发布目录 |
| `scripts/preview.cjs` | 模拟 GitHub Pages 子路径 |
| `.github/workflows/pages.yml` | 提交后的检查和部署 |
| `docs/产品提炼与复刻规范.md` | 工具目标、信息结构、视觉和交互提炼 |
| `docs/开发能力与身份指令.md` | 能力要求及可复用身份指令 |
| `docs/维护说明.md` | 更新入口、基准管理和回退 |

## 与原版的明确差异

1. 数据、样式、逻辑与图片拆分，页面布局和交互保持原样。
2. 视角偏好保存于 `ulike-new-products-gpt:view:v1`，不会与原站的 `oppview` 相互影响；存储不可用时回到默认视角。
3. 页头显示真实数据截止时间。副本没有配置每周自动采集任务；Actions 只处理提交后的校验和发布。
4. 明确 UTF-8 编码，保留原版文档模式以避免复刻偏差。

意向品是预设数据标签。没有账户、云同步、在线编辑、导出或 AI 服务。Git 历史覆盖仓库内数据和代码，不备份每位访问者的本地视角。字体依赖 Google Fonts，无法加载时使用系统字体。
