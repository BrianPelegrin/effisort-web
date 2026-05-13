//@ts-ignore
import WebFont from "webfontloader"

export default defineNuxtPlugin(() => {
  WebFont.load({
    google: { families: ["Public Sans:300,400,500,600,700"] },
    custom: {
      families: [
        "Font Awesome 5 Solid",
        "Font Awesome 5 Regular",
        "Font Awesome 5 Brands",
        "simple-line-icons",
      ],
      urls: ["/assets/css/fonts.min.css"],
    },
    active: () => {
      sessionStorage.setItem("fonts", "true")
    },
  })
})