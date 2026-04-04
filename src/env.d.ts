declare module "*.vue" {
  import Vue from "vue";
  export default Vue;
}

declare module "~icons/*/*" {
  import Vue from "vue";
  export default Vue;
}

declare module "svgcanvas" {
  export class Context {
    constructor(width: number, height: number);
    getSerializedSvg(fixNamedEntities?: boolean): string;
    getSvg(): SVGSVGElement;
  }
}
