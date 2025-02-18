chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 检查当前 tab 是否属于目标网站
  if (message.type === "checkAllowed") {
    let allowed = false;
    if (sender.tab && sender.tab.url) {
      if (
        sender.tab.url.startsWith("https://eacg.net/Comicplay") ||
        sender.tab.url.startsWith("https://www.eacg1.com/Comicplay")
      ) {
        console.log("当前 tab 属于目标网站：", sender.tab.url);
        allowed = true;
      }
    }
    sendResponse({ allowed });
    return true;
  }

  // 处理 video 结束后触发下集按钮的消息
  if (message.videoEvent === "ended") {
    chrome.tabs.sendMessage(
      sender.tab.id,
      { action: "triggerButton" },
      (response) => {
        console.log("下集按钮触发返回：", response);
      }
    );
  }
});
