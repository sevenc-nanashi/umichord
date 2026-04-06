import { defineConfig } from "vite-plus";
// import vize from "@vizejs/vite-plugin";
import vue from "@vitejs/plugin-vue";
import uno from "unocss/vite";
import icons from "unplugin-icons/vite";
import { FileSystemIconLoader } from "unplugin-icons/loaders";

export default defineConfig({
  server: {
    forwardConsole: true,
  },
  plugins: [
    uno(),
    // NOTE: unocssはvizeに対応していないのでvueを使う
    // vize(),
    vue(),
    icons({
      customCollections: {
        svg: FileSystemIconLoader("./src/assets/svg"),
      },
      iconCustomizer(collection, _icon, props) {
        if (collection === "svg") {
          props.width = "auto";
          props.height = "auto";
        }
      },
    }),
  ],
  staged: {
    "*": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
});
