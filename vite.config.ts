import { defineConfig } from "vite-plus";
import vize from "@vizejs/vite-plugin";
import uno from "unocss/vite";
import icons from "unplugin-icons/vite";
import { FileSystemIconLoader } from "unplugin-icons/loaders";

export default defineConfig({
  plugins: [
    uno(),
    vize(),
    icons({
      customCollections: {
        svg: FileSystemIconLoader("./src/assets/svg"),
      },
      iconCustomizer(collection, icon, props) {
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
