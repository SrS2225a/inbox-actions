
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
          await getActionsFromEmail(message.id, tab.id);
      }
      browser.menus.refresh();
  }
});

browser.messageDisplay.onMessagesDisplayed.addListener(async (tab, message) => {
    browser.menus.removeAll();
    for (const msg of message.messages) {
        await getActionsFromEmail(msg.id, tab.id);
    }
    browser.menus.refresh();
});

browser.menus.onClicked.addListener((info) => {
  if (actionMap.has(info.menuItemId)) {
      const action = actionMap.get(info.menuItemId);

      // get openPreference from storage
      browser.storage.local.get("openPreference").then((data) => {
          const openPreference = data.openPreference || "thunderbird"; // default to "thunderbird"

          if (openPreference === "thunderbird") {
              browser.tabs.create({
                url: action.url,
                active: true
              });
          } else {
            browser.windows.openDefaultBrowser(action.url);
          }
      });
  }
})

function findHtmlPart(part) {
  if (!part) return null;

  if (part.contentType === "text/html" && part.body) {
    return part;
  }

  if (part.parts && part.parts.length > 0) {
    for (const subpart of part.parts) {
      const found = findHtmlPart(subpart);
      if (found) return found;
    }
  }

  return null;
}

async function getActionsFromEmail(id, tabId) {
  const full = await browser.messages.getFull(id);
  const htmlPart = findHtmlPart(full);
  if (!htmlPart) return;

  const actions = extractActionsFromEmail(htmlPart.body);
  if(actions.length > 0) {
    messenger.messageDisplayAction.enable(tabId);
    for (const action of actions) {
      const id = action.url;
      actionMap.set(id, action);
      browser.menus.create({
          id: id,
          title: action.name,
          icons: {
              "16": "icons/open_link-16px.png",
              "32": "icons/open_link-32px.png",
              "64": "icons/open_link-64px.png",
          },
          contexts: ["message_list", "message_display_action_menu"],
      });
    }
  } else {
    messenger.messageDisplayAction.disable(tabId);
  }
}

function extractActionsFromEmail(content) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");

  // Try JSON-LD first
  const ldJsonScript = doc.querySelector('script[type="application/ld+json"]');
  let actions = [];

  try {
    if (ldJsonScript) {
        const json = JSON.parse(ldJsonScript.textContent);
        actions = extractViewActionsFromJSONLD(json);
    } else {
      // Fallback to Microdata
      const microdata = doc.querySelector('[itemscope]');
      if (microdata) {
        actions = extractViewActionsFromMicrodata(doc);
      }
    }
  } catch (e) {
    console.error("Error parsing data:", e);
  }

  return actions;
}

function extractViewActionsFromJSONLD(json) {
  let actions = [];
  const extractFromAction = (action) => {
    if (action['@type'] === "ViewAction" && action.url && action.name) {
      actions.push({ name: action.name, url: action.url });
    }
  };

  if (Array.isArray(json)) {
    for (const action of json) {
      extractFromAction(action.potentialAction);
    }
  } else {
    extractFromAction(json.potentialAction);
  }

  return actions;
}

function extractViewActionsFromMicrodata(doc) {
  const actions = [];
  const actionElements = doc.querySelectorAll('[itemscope][itemtype*="ViewAction"]');

  actionElements.forEach((el) => {
      const nameEl = el.querySelector('[itemprop="name"]');
      const urlEl = el.querySelector('[itemprop="url"]');

      if (nameEl && urlEl) {
          const name = nameEl.textContent || nameEl.getAttribute("content");
          const url = urlEl.getAttribute("href") || urlEl.textContent || urlEl.getAttribute("content");

          if (name && url) {
              actions.push({ name, url });
          }
      }
  });

  return actions;
}