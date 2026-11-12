/* 표지 스크롤 진행도(--p)와 목록 등장 효과.
 * 동작 줄이기 설정이면 아무것도 하지 않는다(CSS가 정지 화면을 그린다). */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("kin")) return;
  var cover = document.querySelector(".cover");
  if (cover) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var span = cover.offsetHeight - window.innerHeight;
      var p = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
      cover.style.setProperty("--p", p.toFixed(4));
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    var header = document.querySelector(".site-header");
    window.addEventListener("resize", function () {
      if (header) root.style.setProperty("--hh", header.offsetHeight + "px");
      update();
    });
    update();
  }
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -6% 0px" });
  items.forEach(function (el) { io.observe(el); });
})();
