// 链接全标已访问
// 点击图标：把当前页所有 http/https 链接写入浏览历史（等于是标记为已访问）
// 一次性全写，不分批；外站链接（帖子链接）排在前面，配额被截断时优先保住它们

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await zhiXing(tab.id);
  } catch (e) {
    await biaoShi(0, '#c00');
    console.error('[链接全标] 出错:', e && e.message ? e.message : e);
  }
});

async function zhiXing(tabId) {
  const jieGuo = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: shouJiLianJie
  });

  const lieBiao = (jieGuo && jieGuo[0] && jieGuo[0].result) || [];
  if (!lieBiao.length) {
    await biaoShi(0, '#888');
    return;
  }

  let chengGong = 0;
  let shiBai = 0;

  for (const url of lieBiao) {
    const hao = await xieRuYiTiao(url);
    if (hao) chengGong++;
    else shiBai++;
    if ((chengGong + shiBai) % 10 === 0) await biaoShi(chengGong, '#08a');
  }

  await biaoShi(chengGong, shiBai === 0 ? '#0a8' : '#e80');
  console.log('[链接全标] 共 ' + lieBiao.length + ' 条，成功 ' + chengGong + '，失败 ' + shiBai);

  setTimeout(function () { chrome.action.setBadgeText({ text: '' }); }, 10000);
}

function xieRuYiTiao(url) {
  return new Promise(function (jieShu) {
    chrome.history.addUrl({ url: url }, function () {
      const cuoWu = chrome.runtime.lastError;
      if (cuoWu) {
        console.warn('[链接全标] 写入被拒:', url, '|', cuoWu.message);
        jieShu(false);
      } else {
        jieShu(true);
      }
    });
  });
}

function biaoShi(shuZi, yanSe) {
  return chrome.action.setBadgeBackgroundColor({ color: yanSe }).then(function () {
    return chrome.action.setBadgeText({ text: String(shuZi) });
  });
}

// ---- 下面这个函数会被注入到页面里执行，不能引用上面的任何变量 ----
function shouJiLianJie() {
  const benZhan = location.hostname;
  const quanBu = new Set();

  for (const a of document.links) {
    const h = a.href;
    if (h && /^https?:/i.test(h)) quanBu.add(h);
  }

  const waiZhan = [];
  const benZhanLieBiao = [];

  for (const h of quanBu) {
    let zhuJi = '';
    try { zhuJi = new URL(h).hostname; } catch (e) { }
    if (zhuJi && zhuJi !== benZhan) waiZhan.push(h);
    else benZhanLieBiao.push(h);
  }

  return waiZhan.concat(benZhanLieBiao);
}
