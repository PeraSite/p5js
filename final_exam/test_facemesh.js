const state = {
  stream: null,
  status: "starting",
  settings: {},
  error: "",
  layout: "pending"
};

const app = document.createElement("div");
const video = document.createElement("video");
const hud = document.createElement("div");
const style = document.createElement("style");

style.textContent = `
  html,
  body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
  }

  body {
    width: 100vw;
    height: 100svh;
    position: fixed;
    inset: 0;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  #camera-app {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100svh;
    overflow: hidden;
    background: #000;
  }

  #front-camera {
    position: absolute;
    left: 50%;
    top: 50%;
    object-fit: cover;
    object-position: center center;
    background: #000;
    transform-origin: center center;
    max-width: none;
    max-height: none;
  }
`;

document.head.append(style);
document.body.replaceChildren(app);

Object.assign(document.documentElement.style, {
  margin: "0",
  padding: "0",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  background: "#000"
});

Object.assign(document.body.style, {
  margin: "0",
  padding: "0",
  width: "100vw",
  height: "100svh",
  overflow: "hidden",
  background: "#000",
  position: "fixed",
  inset: "0",
  touchAction: "none",
  userSelect: "none",
  WebkitUserSelect: "none"
});

Object.assign(app.style, {
  position: "fixed",
  inset: "0",
  width: "100vw",
  height: "100svh",
  overflow: "hidden",
  background: "#000"
});

Object.assign(hud.style, {
  position: "fixed",
  left: "12px",
  top: "calc(12px + env(safe-area-inset-top))",
  zIndex: "2",
  maxWidth: "calc(100vw - 24px)",
  padding: "10px 12px",
  borderRadius: "8px",
  background: "rgba(0,0,0,0.62)",
  color: "#fff",
  font: "12px/1.45 -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  whiteSpace: "pre-wrap"
});

app.id = "camera-app";
video.id = "front-camera";
video.autoplay = true;
video.muted = true;
video.playsInline = true;
video.setAttribute("autoplay", "");
video.setAttribute("muted", "");
video.setAttribute("playsinline", "");
video.setAttribute("webkit-playsinline", "");

app.append(video, hud);
window.addEventListener("load", startCamera);
window.addEventListener("orientationchange", restartSoon);
window.addEventListener("resize", applyVideoLayout);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !state.stream) startCamera();
});

let restartTimer = null;

async function startCamera() {
  state.status = "requesting";
  state.error = "";
  renderHud();
  stopCamera();

  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { exact: "user" },
        width: { ideal: 720 },
        height: { ideal: 1280 },
        aspectRatio: { ideal: 9 / 16 },
        frameRate: { ideal: 30, max: 30 }
      }
    });
  } catch (exactError) {
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 1280 },
          aspectRatio: { ideal: 9 / 16 },
          frameRate: { ideal: 30, max: 30 }
        }
      });
    } catch (fallbackError) {
      state.status = "failed";
      state.error = fallbackError?.message || String(fallbackError);
      renderHud();
      return;
    }
  }

  video.srcObject = state.stream;
  await video.play();

  state.settings = state.stream.getVideoTracks()[0]?.getSettings?.() || {};
  state.status = "running";
  applyVideoLayout();
  renderHud();
}

function stopCamera() {
  if (state.stream) {
    for (const track of state.stream.getTracks()) {
      track.stop();
    }
  }
  state.stream = null;
  state.settings = {};
  video.srcObject = null;
}

function restartSoon() {
  clearTimeout(restartTimer);
  restartTimer = setTimeout(startCamera, 350);
}

function viewportSize() {
  return {
    w: window.visualViewport?.width || window.innerWidth || document.documentElement.clientWidth,
    h: window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight
  };
}

function applyVideoLayout() {
  const viewport = viewportSize();
  const videoW = video.videoWidth || state.settings.width || 0;
  const videoH = video.videoHeight || state.settings.height || 0;
  const isPortraitScreen = viewport.h >= viewport.w;
  const isLandscapeVideo = videoW > videoH;
  const shouldRotate = isPortraitScreen && isLandscapeVideo;

  Object.assign(app.style, {
    width: `${viewport.w}px`,
    height: `${viewport.h}px`
  });

  if (shouldRotate) {
    Object.assign(video.style, {
      width: `${viewport.h}px`,
      height: `${viewport.w}px`,
      transform: "translate(-50%, -50%) rotate(90deg) scaleX(-1)"
    });
    state.layout = "portrait screen + landscape video: rotate 90";
  } else {
    Object.assign(video.style, {
      width: `${viewport.w}px`,
      height: `${viewport.h}px`,
      transform: "translate(-50%, -50%) scaleX(-1)"
    });
    state.layout = "normal cover";
  }

  renderHud();
}

function renderHud() {
  const videoSize = `${video.videoWidth || 0} x ${video.videoHeight || 0}`;
  const trackSize = `${state.settings.width || "-"} x ${state.settings.height || "-"}`;
  const viewport = viewportSize();
  hud.textContent = [
    `camera: ${state.status}`,
    `viewport: ${Math.round(viewport.w)} x ${Math.round(viewport.h)}`,
    `video: ${videoSize}`,
    `track: ${trackSize}`,
    `layout: ${state.layout}`,
    "raw <video> + getUserMedia",
    "video element is rotated when needed",
    state.error ? `error: ${state.error}` : ""
  ].filter(Boolean).join("\n");
}

video.addEventListener("loadedmetadata", applyVideoLayout);
video.addEventListener("resize", applyVideoLayout);
video.addEventListener("playing", applyVideoLayout);
