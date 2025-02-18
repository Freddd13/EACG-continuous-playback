(function () {
  // fullscreen manage
  const iframeFullscreenManager = {
    isFullScreen: false,

    // 网页全屏
    maximizeIframe(iframe) {
      if (!iframe) {
        console.log("❌ 未找到要全屏的 iframe");
        return;
      }
      // console.log("🔲 正在全屏 iframe:", iframe);

      // 记录 iframe 原始样式
      iframe.dataset.oldStyle = iframe.style || "";

      // 设置全屏样式
      iframe.style.position = "fixed";
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.width = "100vw";
      iframe.style.height = "100vh";
      iframe.style.zIndex = "9999";
      iframe.style.border = "none";

      document.documentElement.dataset.oldOverflow =
        document.documentElement.style.overflow;
      document.body.dataset.oldOverflow = document.body.style.overflow;

      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";

      this.isFullScreen = true;
    },

    // 退出全屏
    exitFromMaxIframe(iframe) {
      if (!iframe) {
        console.log("❌ 未找到要全屏的 iframe");
        return;
      }

      // console.log("🔳 退出全屏:", iframe);
      if (iframe.dataset.oldStyle) {
        iframe.style.cssText = iframe.dataset.oldStyle;
        this.isFullScreen = false;
      }

      document.documentElement.style.overflow =
        document.documentElement.dataset.oldOverflow || "";
      document.body.style.overflow = document.body.dataset.oldOverflow || "";
    },

    // 监听 ESC 键切换全屏状态
    toggleFullscreen(event, iframe) {
      if (event.key === "Escape" && iframe) {
        if (!this.isFullScreen) {
          this.maximizeIframe(iframe);
        } else {
          this.exitFromMaxIframe(iframe);
        }
      }
    },
  };

  // auto play manage
  let videoFrame = null;
  const checkInterval = 500;
  if (window === window.top) {
    chrome.runtime.sendMessage({ type: "checkAllowed" }, (response) => {
      if (!response?.allowed) {
        return;
      }
      // 主页面逻辑
      console.log("✅ EACG插件已启动");
      /// 找到video frame
      const frameInterval = setInterval(() => {
        videoFrame = document.getElementById("fed-play-iframe");

        if (videoFrame) {
          // console.log("✅ 找到 iframe:", videoFrame);
          clearInterval(frameInterval); // 只执行一次，找到后停止轮询
          iframeFullscreenManager.maximizeIframe(videoFrame); // 最大化 iframe
          /// 添加ESC切换全屏状态监听
          document.addEventListener("keydown", (event) => {
            iframeFullscreenManager.toggleFullscreen(event, videoFrame);
          });
        }
      }, checkInterval);

      /// 添加视频结束监听
      const addEndListenr = setInterval(() => {
        // console.log("✅ 找到 iframe:", videoFrame);
        clearInterval(addEndListenr); // 只执行一次，找到后停止轮询

        // 主页面点击下集按钮的操作
        chrome.runtime.onMessage.addListener(
          (message, sender, sendResponse) => {
            if (message.action === "triggerButton") {
              const btn = document.querySelector("a.fed-play-next");
              if (btn) {
                btn.click();
                // console.log("⏭️ 下集按钮已点击");
                sendResponse({ status: "clicked" });
              } else {
                console.log("❌ 未找到下集按钮");
                sendResponse({ status: "not found" });
              }
            }
          }
        );
      }, checkInterval);
    });
  }

  // 等待video元素并添加结束监听
  const fuck = setInterval(() => {
    const video = document.querySelector("video");

    if (video) {
      if (video.duration < 900) {
        console.log("视频时长不足15分钟，不绑定 ended 事件。");
        // 900秒 == 15分钟
        return;
      }
      // console.log("✅ 找到视频元素", video);
      // autoplay
      if (!video.hasAttribute("data-autoplay-setup")) {
        video.setAttribute("data-autoplay-setup", "true");
        // video.muted = true;
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
      video.addEventListener("ended", () => {
        // console.log(
        //   "检测到时长大于15分钟的视频播放结束，当前 frame URL:",
        //   window.location.href
        // );
        chrome.runtime.sendMessage({
          videoEvent: "ended",
          frameUrl: window.location.href,
        });
      });
      clearInterval(fuck); // 找到视频后停止定时器
    }
  }, 500); // 每500ms检查一次
})();
