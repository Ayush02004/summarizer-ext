chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCurrentVideoUrl") {
    const url = window.location.href;
    sendResponse({ url });
  }
});
function appendPopupIframe() {
  if (document.getElementById("summarizerPopupContainer")) {
    return;
  }

  const popup = document.createElement("div");
  popup.id = "summarizerPopupContainer";
  popup.style.width = "100%"; // Ensure the container div takes full width

  const frame = document.createElement("iframe");
  frame.style.width = "100%"; // Set iframe width to 100%
  frame.style.height = "500px"; // Set height as needed
  frame.style.borderRadius = "12px";
  frame.src = chrome.runtime.getURL("popup.html");
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-modals');
  popup.appendChild(frame);

  const parentNodeOptions = [
    {
      selector: "#secondary-inner",
      hasChildCheck: true,
    },
    {
      selector: "#watch7-sidebar-contents",
    },
  ];

  for (const option of parentNodeOptions) {
    const elements = document.querySelectorAll(option.selector);
    const parent = option.hasChildCheck ? findParentWithChild(elements) : elements[0];

    if (parent) {
      if (option.hasChildCheck) {
        parent.insertBefore(popup, parent.firstChild);
      } else {
        parent.appendChild(popup);
      }
      break;
    }
  }

  function findParentWithChild(elements) {
    for (const element of elements) {
      if (element.firstElementChild) {
        return element;
      }
    }
    return null;
  }
}

// Use MutationObserver to wait for the target elements
const observer = new MutationObserver((mutationsList, observer) => {
  const targetSelectors = ["#secondary-inner", "#watch7-sidebar-contents"];
  for (const selector of targetSelectors) {
    if (document.querySelector(selector)) {
      appendPopupIframe();
      observer.disconnect();
      break;
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });