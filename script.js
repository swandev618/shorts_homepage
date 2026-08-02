/* ================= 데이터 (asis 리소스 기반) ================= */
const portfolioData = {
  직접촬영: [
    ["붙박이장", "붙박이장"], ["약사", "약사"], ["음식점 마케팅", "음식점마케팅"],
    ["인테리어", "인테리어"], ["주류업체", "주류업체"], ["철거", "철거"],
    ["체형교정", "체형교정"], ["콘텐츠 마케팅", "콘텐츠 마케팅"], ["폐업철거 찐고수", "폐업철거 찐고수"],
  ],
  시공업: [
    ["방화문 교체", "방화문교체"], ["벽걸이 TV", "벽걸이tv"], ["복원", "복원"], ["복원 2", "복원2"],
    ["샷시", "샷시"], ["엔진오일", "엔진오일"], ["청소", "청소"], ["청소 2", "청소2"], ["화재청소", "화재청소"],
  ],
  맛집: [
    ["갈비", "갈비"], ["닭갈비", "닭갈비"], ["부대찌개", "부대찌게"], ["장어", "장어"],
    ["중식당", "중식당"], ["칼국수", "칼국수"], ["퓨전중식", "퓨전중식"],
  ],
  쇼핑몰: [
    ["가방", "가방"], ["레인부츠", "레인부츠"], ["복숭아", "복숭아"],
    ["아디다스", "아디다스"], ["오트밀", "오트밀"], ["캠핑템", "캠핑템"],
  ],
};

const resultFiles = [
  "1_face_mosaic.png", "11.png", "1111.png", "22.png", "2222.png", "33.png",
  "456465.png", "555.png", "cvbcvbcvb.png", "v.png", "vxcvcxvxcvxcv.png", "xcvxcvxcvxc.png",
];

const reviewFiles = [
  "KakaoTalk_20260707_135915976.png", "KakaoTalk_20260707_135915976_01.png",
  "KakaoTalk_20260707_135915976_02.png", "KakaoTalk_20260707_135915976_03.png",
  "KakaoTalk_20260707_135915976_04.png", "KakaoTalk_20260711_144747866.png",
  "20260711_160532.png", "aa.png", "ffff.png", "sss.png",
];

/* ================= 포트폴리오 탭 ================= */
const grid = document.querySelector("#portfolioGrid");

// 실제 동영상이 있는 카테고리(클릭 시 영상 재생)
const videoCategories = new Set(["직접촬영", "시공업", "맛집", "쇼핑몰"]);

function renderPortfolio(category) {
  if (!grid) return;
  grid.innerHTML = "";
  const hasVideo = videoCategories.has(category);
  (portfolioData[category] || []).forEach(([title, file]) => {
    const card = document.createElement("article");
    card.className = "pf-card";
    const src = `./assets/portfolio-thumbnails/${category}/${file}.jpg`;
    card.dataset.src = src;
    card.innerHTML = `
      <img src="${src}" alt="${title}" loading="lazy" decoding="async" />
      <span class="pf-play" aria-hidden="true"></span>
      <div class="pf-meta">${title}</div>`;
    if (hasVideo) {
      const video = `./assets/portfolio-videos/${category}/${file}.mp4`;
      card.addEventListener("click", () => openVideoModal(video, src));
    } else {
      card.addEventListener("click", () => openImageModal(src));
    }
    grid.append(card);
  });
  grid.scrollLeft = 0; // 탭 전환 시 대표(첫 번째)로
  markCenter(grid);
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    renderPortfolio(tab.dataset.tab);
  });
});
renderPortfolio("직접촬영");

/* ── 가로 캐러셀 공통: 가운데(대표) 카드 강조 + 양옆 딤 ── */
function markCenter(container) {
  if (!container || !container.children.length) return;
  if (window.innerWidth > 720) {
    [...container.children].forEach((c) => c.classList.remove("is-active"));
    return; // 데스크톱은 그리드/일반 rail 그대로
  }
  const center = container.scrollLeft + container.clientWidth / 2;
  let best = null, bd = Infinity;
  [...container.children].forEach((c) => {
    const cc = c.offsetLeft + c.offsetWidth / 2;
    const d = Math.abs(cc - center);
    if (d < bd) { bd = d; best = c; }
  });
  [...container.children].forEach((c) => c.classList.toggle("is-active", c === best));
}

function attachPeek(container) {
  if (!container) return;
  let raf = null;
  container.addEventListener("scroll", () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = null; markCenter(container); });
  }, { passive: true });
}
attachPeek(grid);

/* ── 포트폴리오 대표 캐러셀 자동 넘김(모바일) ── */
(function autoRollPortfolio() {
  if (!grid) return;
  const mql = window.matchMedia("(max-width: 720px)");
  let paused = false, visible = false, resumeTimer = null;
  const pause = () => {
    paused = true;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => (paused = false), 5000);
  };
  ["pointerdown", "touchstart", "wheel"].forEach((ev) =>
    grid.addEventListener(ev, pause, { passive: true }),
  );
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (es) => es.forEach((e) => (visible = e.isIntersecting)),
      { threshold: 0.3 },
    ).observe(grid);
  } else visible = true;

  setInterval(() => {
    if (!mql.matches || paused || !visible || document.hidden) return;
    const card = grid.querySelector(".pf-card");
    if (!card) return;
    const step = card.offsetWidth + 14;
    const max = grid.scrollWidth - grid.clientWidth;
    let nextLeft = grid.scrollLeft + step;
    if (nextLeft > max - step * 0.4) nextLeft = 0; // 마지막이면 처음으로
    grid.scrollTo({ left: nextLeft, behavior: "smooth" });
  }, 3200);
})();

/* ================= 3채널: 영상 1개 · 플랫폼 화면만 갈아끼움 ================= */
(function platformSwap() {
  const dist = document.querySelector("#dist");
  const ui = document.querySelector("#platUI");
  const cap = document.querySelector("#platCap");
  const tabs = Array.from(document.querySelectorAll("#platTabs .plat-tab"));
  if (!dist || !ui) return;

  const base = "./assets/04_3채널_이미지/";

  // 실제 앱 UI를 흉내낸 아이콘(모노톤 SVG)
  const I = {
    heart: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.3l-1.5-1.3C5.4 15.3 2 12.2 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.7-3.4 6.8-8.5 11.5L12 21.3z"/></svg>`,
    comment: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.2 1 4.2 2.6 5.7-.1 1-.6 2.5-1.4 3.6 1.6-.2 3.3-.9 4.4-1.6 1.3.4 2.6.6 4 .6 5.5 0 10-3.8 10-8.6S17.5 3 12 3z"/></svg>`,
    share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13c5-7 10-7 15-7"/><path d="M14 2l5 4-5 4"/></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1z"/></svg>`,
    more: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>`,
    thumbUp: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 10h4v11H2zM22 11.2c0-1-.9-1.9-2-1.9h-5.3l.8-4c.1-.5 0-1-.4-1.4l-1-1L8 8.7c-.4.4-.6.9-.6 1.4V19c0 1.1.9 2 2 2h8.2c.8 0 1.5-.5 1.8-1.2l2.4-6c.1-.2.1-.4.1-.6v-2z"/></svg>`,
    music: `<svg viewBox="0 0 24 24"><path d="M9 17V4l10-2v13" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="17" r="3" fill="currentColor"/><circle cx="16" cy="15" r="3" fill="currentColor"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
    cam: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="14" height="12" rx="3"/><path d="M16 10l6-3v10l-6-3"/></svg>`,
    moreV: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>`,
    remix: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1.5l3.5 3.5L17 8.5"/><path d="M3 11V9.5A4.5 4.5 0 0 1 7.5 5H20.5"/><path d="M7 22.5L3.5 19 7 15.5"/><path d="M21 13v1.5A4.5 4.5 0 0 1 16.5 19H3.5"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>`,
    back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4l-8 8 8 8"/></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.2L21 11h-2.5v9.8h-4.6v-6H10.1v6H5.5V11H3z"/></svg>`,
    shortsNav: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="3" width="12" height="18" rx="5"/><path d="M11 8.5l5 3.5-5 3.5z" fill="currentColor" stroke="none"/></svg>`,
    plusBox: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2.5" y="6" width="19" height="12" rx="4"/><path d="M12 9.5v5M9.5 12h5"/></svg>`,
    subs: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 8h14M7 5h10"/><rect x="3" y="11" width="18" height="9" rx="2"/><path d="M11 14v4l3.5-2z" fill="currentColor" stroke="none"/></svg>`,
    friends: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="8.5" cy="8" r="3"/><path d="M2.5 20.5c0-3.3 2.7-6 6-6s6 2.7 6 6z"/><circle cx="17" cy="8.5" r="2.4"/><path d="M15.6 13.7c2.5.3 4.4 2.5 4.9 6.8H18z"/></svg>`,
    inbox: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 4.5h16v12H8.5L4 20.5z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7z"/></svg>`,
  };
  const flip = (svg) => svg.replace("<svg ", '<svg class="flip" ');
  const A = (icon, label, cls = "") =>
    `<button class="ui-act ${cls}">${icon}${label ? `<span>${label}</span>` : ""}</button>`;
  const navItem = (icon, label) =>
    `<span class="nav-i">${icon}${label ? `<i>${label}</i>` : ""}</span>`;
  const prog = `<div class="ui-prog"><i></i></div>`;

  // 실시간으로 늘어나는 좋아요 수(플랫폼별 누적)
  const live = { youtube: 30000, tiktok: 25300, insta: 17000 };
  const fmt = (n, style) => {
    if (style === "k")
      return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(n);
    return n >= 10000
      ? (n / 10000).toFixed(1).replace(/\.0$/, "") + "만"
      : n >= 1000
        ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "천"
        : String(n);
  };
  const likeStyle = (key) => (key === "tiktok" ? "k" : "");
  // 카운트가 붙는 좋아요 버튼(클래스 ui-like + 숫자 span.cnt)
  const AL = (icon, key, cls = "") =>
    `<button class="ui-act ui-like ${cls}">${icon}<span class="cnt">${fmt(live[key], likeStyle(key))}</span></button>`;

  function buildUI(key) {
    if (key === "youtube") {
      return `
        <div class="ui-top ui-top--yt">${I.search}${I.moreV}</div>
        <div class="ui-rail">
          ${AL(I.heart, "youtube", "liked")}
          ${A(I.comment, "531")}
          ${A(I.share, "공유")}
          ${A(I.remix, "리믹스")}
        </div>
        <div class="ui-bottom">
          <div class="ui-user"><span class="av"></span><b>@shortform</b><button class="ui-sub">구독</button></div>
          <p class="ui-cap">사업자를 위한 숏폼 · 원본 영상 그대로 ✨</p>
          <div class="ui-sound"><span class="pl">▶</span><span>원본 오디오 · 숏폼의정석</span></div>
        </div>${prog}
        <nav class="ui-nav ui-nav--yt">
          ${navItem(I.home, "홈")}
          ${navItem(I.shortsNav, "Shorts")}
          ${navItem(I.plusBox, "")}
          ${navItem(I.subs, "구독")}
          ${navItem('<span class="me">S</span>', "내 페이지")}
        </nav>`;
    }
    if (key === "tiktok") {
      return `
        <div class="ui-top ui-top--tiktok">
          <span class="live">LIVE</span>
          <span class="tt-tabs"><span class="tab">팔로잉</span><span class="tab on">추천</span></span>
          <span class="search">${I.search}</span>
        </div>
        <div class="ui-rail">
          <div class="ui-avatar"><span class="av"></span><i class="pl">${I.plus}</i></div>
          ${AL(I.heart, "tiktok", "liked")}
          ${A(I.comment, "3456")}
          ${A(I.bookmark, "1256")}
          ${A(I.share, "1256")}
          <span class="ui-disc"></span>
        </div>
        <div class="ui-bottom">
          <div class="ui-user"><b>숏폼의정석</b></div>
          <p class="ui-cap">영상 하나로 릴스·쇼츠·틱톡까지 #숏폼 #마케팅</p>
          <div class="ui-music">${I.music}<span>원본 사운드 - 숏폼의정석</span></div>
        </div>${prog}
        <nav class="ui-nav ui-nav--tt">
          ${navItem(I.home, "집")}
          ${navItem(I.friends, "친구")}
          <span class="nav-i"><span class="tt-plus">+</span></span>
          ${navItem(I.inbox, "알림")}
          ${navItem(I.profile, "나")}
        </nav>`;
    }
    // insta
    return `
      <div class="ui-top ui-top--ig">
        <span class="bk">${I.back}</span>
        <span class="ig-tabs"><b>릴스</b><span>친구</span></span>
        <span class="cam">${I.cam}</span>
      </div>
      <div class="ui-rail">
        ${AL(I.heart, "insta", "liked")}
        ${A(I.remix, "1,138")}
        ${A(I.send, "1.5만")}
        ${A(I.moreV, "")}
        <span class="ui-cover"></span>
      </div>
      <div class="ui-bottom">
        <div class="ui-user"><span class="av"></span><b>숏폼의정석</b><button class="ui-follow ig">팔로우</button></div>
        <div class="ui-music">${I.music}<span>원본 오디오 · 숏폼의정석</span></div>
        <p class="ui-cap">사업자를 위한 숏폼, 원본 그대로 확장합니다 …</p>
      </div>${prog}`;
  }

  const platforms = [
    { name: "유튜브 쇼츠", key: "youtube", accent: "#ff0033" },
    { name: "틱톡", key: "tiktok", accent: "#111318" },
    { name: "인스타 릴스", key: "insta", accent: "#e1306c" },
  ];

  let i = 0;
  let timer = null;
  let ticker = null;

  function apply(idx) {
    i = idx;
    const p = platforms[idx];
    dist.style.setProperty("--accent", p.accent);
    ui.className = "ui ui--" + p.key;
    ui.innerHTML = buildUI(p.key);
    if (cap) cap.textContent = p.name;
    tabs.forEach((t, k) => t.classList.toggle("is-active", k === idx));
    void ui.offsetWidth; // 리플로우로 애니메이션 재시작
    ui.classList.add("swap");
  }
  const next = () => apply((i + 1) % platforms.length);

  // 좋아요 수가 실시간으로 올라가는 효과
  function tickLike() {
    const p = platforms[i];
    live[p.key] += 3 + Math.floor(Math.random() * 22);
    const btn = ui.querySelector(".ui-like");
    if (!btn) return;
    const cnt = btn.querySelector(".cnt");
    if (cnt) cnt.textContent = fmt(live[p.key], likeStyle(p.key));
    btn.classList.remove("beat");
    void btn.offsetWidth;
    btn.classList.add("beat");
    const f = document.createElement("i");
    f.className = "ui-float";
    f.textContent = "+1";
    btn.appendChild(f);
    setTimeout(() => f.remove(), 800);
  }

  const start = () => {
    stop();
    timer = setInterval(next, 2000);
    ticker = setInterval(tickLike, 700);
  };
  const stop = () => {
    if (timer) { clearInterval(timer); timer = null; }
    if (ticker) { clearInterval(ticker); ticker = null; }
  };

  tabs.forEach((t) =>
    t.addEventListener("click", () => { apply(Number(t.dataset.i)); start(); }),
  );
  apply(0);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0.3 },
    ).observe(dist);
  } else {
    start();
  }
})();

/* ================= 레일 (성과 / 후기) ================= */
function buildRail(railId, files, folder, alt) {
  const rail = document.querySelector(railId);
  if (!rail) return;
  files.forEach((file) => {
    const card = document.createElement("div");
    card.className = "rail-card";
    const src = `./assets/${folder}/${file}`;
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    img.loading = "lazy";
    img.decoding = "async";
    img.onerror = () => card.remove();
    card.append(img);
    card.addEventListener("click", () => openImageModal(src));
    rail.append(card);
  });
}
buildRail("#proofRail", resultFiles, "03_조회수섹션_사진넣기", "조회수 성과 이미지");
buildRail("#reviewRail", reviewFiles, "04_후기섹션_사진넣기", "고객 후기 이미지");

// 성과/후기 rail도 대표 캐러셀(가운데 강조) 적용
["#proofRail", "#reviewRail"].forEach((sel) => {
  const el = document.querySelector(sel);
  attachPeek(el);
  markCenter(el);
});
window.addEventListener("resize", () => {
  ["#portfolioGrid", "#proofRail", "#reviewRail"].forEach((sel) =>
    markCenter(document.querySelector(sel)),
  );
});

/* ================= 이미지 모달 ================= */
const imageModal = document.querySelector("#imageModal");
const modalImage = document.querySelector("#modalImage");
function openImageModal(src) {
  if (!imageModal || !modalImage) return;
  modalImage.src = src;
  imageModal.classList.add("is-open");
  imageModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}
function closeImageModal() {
  imageModal.classList.remove("is-open");
  imageModal.setAttribute("aria-hidden", "true");
  modalImage.removeAttribute("src");
  document.body.classList.remove("modal-open");
}
document.querySelector(".image-modal-close")?.addEventListener("click", closeImageModal);
imageModal?.addEventListener("click", (e) => { if (e.target === imageModal) closeImageModal(); });

/* ================= 동영상 모달 ================= */
const videoModal = document.querySelector("#videoModal");
const modalVideo = document.querySelector("#modalVideo");
function openVideoModal(src, poster) {
  if (!videoModal || !modalVideo) return;
  modalVideo.src = src;
  if (poster) modalVideo.poster = poster;
  videoModal.classList.add("is-open");
  videoModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modalVideo.currentTime = 0;
  modalVideo.play().catch(() => {});
}
function closeVideoModal() {
  if (!videoModal || !modalVideo) return;
  modalVideo.pause();
  videoModal.classList.remove("is-open");
  videoModal.setAttribute("aria-hidden", "true");
  modalVideo.removeAttribute("src");
  modalVideo.removeAttribute("poster");
  modalVideo.load();
  document.body.classList.remove("modal-open");
}
document.querySelector(".video-modal-close")?.addEventListener("click", closeVideoModal);
videoModal?.addEventListener("click", (e) => { if (e.target === videoModal) closeVideoModal(); });

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  closeImageModal();
  closeVideoModal();
});

/* ================= 헤더 스크롤 ================= */
const header = document.querySelector("#siteHeader");
const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ================= 모바일 메뉴 ================= */
const toggle = document.querySelector(".nav-toggle");
const drawer = document.querySelector("#drawer");
toggle?.addEventListener("click", () => {
  const open = drawer.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(open));
  drawer.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("modal-open", open);
});
drawer?.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    drawer.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    toggle?.setAttribute("aria-expanded", "false");
  }),
);

/* ================= 통계 카운터 ================= */
function animateCount(el) {
  const target = Number(el.dataset.count) || 0;
  const suffix = el.dataset.suffix || "";
  const dur = 1200;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ================= 스크롤 리빌 + 카운터 트리거 ================= */
const revealTargets = document.querySelectorAll(
  ".sec-head, .feature-card, .channel-card, .trust-item, .contact-form, .contact-copy",
);
revealTargets.forEach((el) => el.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.15 },
  );
  revealTargets.forEach((el) => io.observe(el));

  const statsIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll("strong[data-count]").forEach(animateCount);
        statsIO.unobserve(entry.target);
      });
    },
    { threshold: 0.4 },
  );
  document.querySelectorAll(".stats").forEach((s) => statsIO.observe(s));
} else {
  revealTargets.forEach((el) => el.classList.add("in"));
}

/* ================= 개인정보 토글 ================= */
document.querySelector(".privacy-toggle")?.addEventListener("click", (e) => {
  const btn = e.currentTarget;
  const detail = document.querySelector(".privacy-detail");
  const open = detail.hidden;
  detail.hidden = !open;
  btn.setAttribute("aria-expanded", String(open));
});

/* ================= 상담 폼 (Formspree 연동) ================= */
// ▼▼▼ 여기에 Formspree 폼 ID만 넣으세요 (예: "abcdwxyz" → https://formspree.io/f/abcdwxyz 의 뒷부분)
const FORMSPREE_ID = ""; // ← 가입 후 발급받은 폼 ID 붙여넣기
// ▲▲▲

document.querySelector("#contactForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  if (!f.agree.checked) { alert("개인정보 수집 및 이용에 동의해주세요."); return; }
  const name = f.name.value.trim();
  const phone = [f.p1.value, f.p2.value, f.p3.value].filter(Boolean).join("-");
  if (!name || !f.p1.value) { alert("이름과 연락처를 입력해주세요."); return; }

  // 폼 ID 미설정 시: 전송 없이 안내만 (배포 전 상태)
  if (!FORMSPREE_ID) {
    alert(`${name}님, 무료상담 신청이 접수되었습니다.\n연락처: ${phone}\n빠르게 연락드리겠습니다!`);
    f.reset();
    return;
  }

  const submitBtn = f.querySelector('button[type="submit"]');
  const btnText = submitBtn?.textContent;
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "접수 중…"; }

  try {
    const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        이름: name,
        연락처: phone,
        "업종/문의내용": f.biz.value.trim(),
        _subject: `[숏폼의정석] 무료상담 문의 - ${name}`,
      }),
    });
    if (!res.ok) throw new Error("전송 실패");
    alert(`${name}님, 무료상담 신청이 접수되었습니다.\n연락처: ${phone}\n빠르게 연락드리겠습니다!`);
    f.reset();
  } catch (err) {
    alert("죄송합니다. 접수 중 오류가 발생했습니다.\n잠시 후 다시 시도하시거나 전화로 문의해 주세요. (010-5702-1439)");
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = btnText; }
  }
});
