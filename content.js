(function () {
  // 初始化插件逻辑
  function initExtension() {
    const addVideoListeners = () => {
      document.querySelectorAll("video").forEach((video) => {
        // 自动播放设置：静音并在资源就绪后播放
        if (!video.hasAttribute("data-autoplay-setup")) {
          video.setAttribute("data-autoplay-setup", "true");
          video.muted = true;
          video.autoplay = true;
          if (video.readyState >= 3) {
            video.play().catch((err) => console.error("自动播放出错:", err));
          } else {
            const onCanPlay = () => {
              video.play().catch((err) => console.error("自动播放出错:", err));
              video.removeEventListener("canplay", onCanPlay);
            };
            video.addEventListener("canplay", onCanPlay);
          }
        }

        // 检查视频时长，只有大于15分钟才绑定 ended 事件
        const setupEndedListener = () => {
          if (!video.hasAttribute("data-listener-added")) {
            if (video.duration > 900) {
              // 900秒 == 15分钟
              video.setAttribute("data-listener-added", "true");
              video.addEventListener("ended", () => {
                console.log(
                  "检测到时长大于15分钟的视频播放结束，当前 frame URL:",
                  window.location.href
                );
                chrome.runtime.sendMessage({
                  videoEvent: "ended",
                  frameUrl: window.location.href,
                });
              });
            } else {
              console.log(
                "视频时长不足15分钟，不绑定 ended 事件。",
                video.duration
              );
            }
          }
        };

        if (!isNaN(video.duration) && video.duration > 0) {
          setupEndedListener();
        } else {
          video.addEventListener("loadedmetadata", function onMeta() {
            setupEndedListener();
            video.removeEventListener("loadedmetadata", onMeta);
          });
        }
      });
    };

    // 初始绑定
    addVideoListeners();

    // 监听 DOM 变化，处理动态加入的视频元素
    const observer = new MutationObserver(addVideoListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    // 仅在顶层页面中处理消息，触发下集按钮点击
    if (window.top === window.self) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "triggerButton") {
          const btn = document.querySelector("a.fed-play-next");
          if (btn) {
            btn.click();
            console.log("下集按钮已点击");
            sendResponse({ status: "clicked" });
          } else {
            console.log("未找到下集按钮");
            sendResponse({ status: "not found" });
          }
        }
      });
    }
  }

  // 向后台询问当前 tab 是否属于允许的目标网站
  chrome.runtime.sendMessage({ type: "checkAllowed" }, (response) => {
    if (response && response.allowed) {
      // 仅在顶层页面打印日志
      if (window.top === window.self) {
        console.log("已启动");
      }
      initExtension();
    }
  });
})();
