const supportedTypes = ["ViewAction", "ConfirmAction", "SaveAction"];
const actionMap = new Map();

browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === "getActionsFromEmail") {
      const actions = extractActionsFromEmail(message.content);
      return actions;
    }
  });

browser.menus.onShown.addListener(async (info, tab) => {
    if (info.contexts.includes("message_list")) {
        browser.menus.removeAll();

        for (const message of info.selectedMessages.messages) {
          await processMessageForActions(message.id, tab.id);
      }
      browser.menus.refresh();
  }
});

browser.messageDisplay.onMessagesDisplayed.addListener(async (tab, message) => {
  browser.menus.removeAll();
    for (const msg of message.messages) {
        await processMessageForActions(msg.id, tab.id);
    }
    browser.menus.refresh();
});

browser.menus.onClicked.addListener(async (info) => {
  const action = actionMap.get(info.menuItemId);
  if (!action) return;

  if (["ConfirmAction", "SaveAction"].includes(action.type)) {
    const { showNotifications } = await browser.storage.local.get("showNotifications");
    try {
      const response = await fetch(action.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/1.0 (KHTML, like Gecko; Gmail Actions)",
        },
        body: "confirmed=Approved",
      });

      if (showNotifications) {
        if (response.ok) {
          browser.notifications.create({
            type: "basic",
            iconUrl: "icons/success.png",
            title: `${action.type} Executed`,
            message: `"${action.name}" was successfully completed.`,
          });
        } else {
          browser.notifications.create({
            type: "basic",
            iconUrl: "icons/error.png",
            title: `${action.type} Failed`,
            message: `Server responded with status ${response.status}`,
          });
        }
      }
    } catch (err) {
      if (showNotifications) {
        browser.notifications.create({
          type: "basic",
          iconUrl: "icons/error.png",
          title: `${action.type} Failed`,
          message: `There was an error: ${err.message}`,
        });
      }
    }
  } else {
    const { openPreference = "thunderbird" } = await browser.storage.local.get("openPreference");
    if (openPreference === "thunderbird") {
      browser.tabs.create({ url: action.url, active: true });
    } else {
      browser.windows.openDefaultBrowser(action.url);
    }
  }
});

async function processMessageForActions(messageId, tabId) {
  const full = await browser.messages.getFull(messageId);
  const htmlPart = findHtmlPart(full);
  if (!htmlPart) return;

  const actions = extractActionsFromEmail(htmlPart.body);
  if (actions.length > 0) {
    messenger.messageDisplayAction.enable(tabId);
    for (const action of actions) {
      const id = `${action.type}:${action.url}`;
      actionMap.set(id, action);
      browser.menus.create({
        id,
        title: action.name,
        icons: action.type === "ViewAction" ? {
          "16": "icons/open_link-16px.png",
          "32": "icons/open_link-32px.png",
          "64": "icons/open_link-64px.png",
        } : null,
        contexts: ["message_list", "message_display_action_menu"],
      });
    }
  } else {
    messenger.messageDisplayAction.disable(tabId);
  }
}

function findHtmlPart(part) {
  if (!part) return null;

  if (part.contentType === "text/html" && part.body) return part;

  if (Array.isArray(part.parts)) {
    for (const subpart of part.parts) {
      const result = findHtmlPart(subpart);
      if (result) return result;
    }
  }

  return null;
}

function extractActionsFromEmail(content) {
  const doc = new DOMParser().parseFromString(content, "text/html");
  const actions = [];

  try {
    const ldJsonScript = doc.querySelector('script[type="application/ld+json"]');
    if (ldJsonScript) {
      const json = JSON.parse(ldJsonScript.textContent);
      actions.push(...extractViewActionsFromJSONLD(json));
    }
    const microdata = doc.querySelector('[itemscope]');
    if (microdata) {
      actions.push(...extractViewActionsFromMicrodata(doc));
    }
  } catch (e) {
    console.error("Failed to parse structured data:", e);
  }

  return actions;
}

function extractViewActionsFromJSONLD(json) {
  const actions = [];

  const addAction = (action) => {
    if (!action) return;

    const type = action["@type"];
    const name = action.name;
    const url = action.url;

    if (supportedTypes.includes(type) && name && url) {
      actions.push({ name, url, type });
    }
  };

  if (Array.isArray(json)) {
    json.forEach(item => addAction(item.potentialAction));
  } else {
    addAction(json.potentialAction);
  }

  return actions;
}

function extractViewActionsFromMicrodata(doc) {
  const actions = [];
 
  supportedTypes.forEach(type => {
    doc.querySelectorAll(`[itemscope][itemtype*="${type}"]`).forEach((el) => {
      const nameEl = el.querySelector('[itemprop="name"]');
      const name = nameEl?.textContent || nameEl?.getAttribute("content") || nameEl?.getAttribute("title");
      const urlEl = el.querySelector('[itemprop="url"]');
      const url = urlEl?.getAttribute("href") || urlEl?.textContent || urlEl?.getAttribute("content");
 
      if (name && url) {
        actions.push({ name, url, type });
      }
    });
  });
 
  return actions;
}