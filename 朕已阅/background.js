// 点击扩展图标时执行
chrome.action.onClicked.addListener(async (tab) => {
  // 注入并执行内容脚本
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: collectUnvisitedLinks
  });
});

// 收集页面所有链接的函数（将被注入到页面）
function collectUnvisitedLinks() {
  const links = document.links;
  const urls = [];
  
  for (let i = 0; i < links.length; i++) {
    const href = links[i].href;
    // 只收集 http/https 链接
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      urls.push(href);
    }
  }
  
  // 去重
  const uniqueUrls = [...new Set(urls)];
  
  if (uniqueUrls.length > 0) {
    chrome.runtime.sendMessage({ urls: uniqueUrls });
  }
}

// 接收消息，将链接添加到历史记录
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const urls = message.urls;
  
  // 批量添加到历史记录（标记为已访问）
  urls.forEach(url => {
    chrome.history.addUrl({ url: url });
  });
});
