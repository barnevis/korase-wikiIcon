import "./wikiIcon-plugin.css";

function resolveShortWikiUrl(shortUrl, callback) {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none"; // Hide iframe
  iframe.src = shortUrl; // Load the short link

  document.body.appendChild(iframe);

  iframe.onload = () => {
    // Get the final redirected URL
    const fullUrl = iframe.contentWindow.location.href;

    // Remove iframe after resolving
    document.body.removeChild(iframe);

    // Return the full URL
    callback(fullUrl);
  };
}

const wikiIconPlugin = {
  name: "wikiIconPlugin",
  afterParse: (text) => {
    const modifiedText = text.replace(/<a\s+href="([^"]+)"[^>]*>(wikipedia|ویکی‌پدیا)<\/a>/g, function (match, href) {
      const encodeTitle = href.split('/').pop();
      const pageTitle = decodeURIComponent(encodeTitle);
      const lang = new URL(href).hostname.split(".")[0];

      return `
        <span class="wikipedia-preview-container" data-page="${encodeTitle}" data-lang="${lang}" data-href="${href}">
          <a href="${href}" target="_blank" class="wikipedia-link" title="${pageTitle}">
            <img src="https://en.wikipedia.org/favicon.ico" alt="${pageTitle}" class="wikipedia-icon">
          </a>
          <span class="wikipedia-preview-box">
            <span class="loading">بارگذاری ...</span>
            ${((href.startsWith("https://w.wiki/")))?`<iframe src="${href}#bodyContent" class="wikipedia-iframe"></iframe>`:''}
          </span>
        </span>
      `;
      }
    );

    return modifiedText;
  },
  afterRender: () => {
    const containers = document.querySelectorAll(".wikipedia-preview-container[data-page]");

    containers.forEach(async (container) => {
      const previewBox = container.querySelector(".wikipedia-preview-box");
      let pageUrl = container.getAttribute("data-href");

      if (pageUrl.startsWith("https://w.wiki/") || previewBox.dataset.loaded) return;

      const pageTitle = container.getAttribute("data-page");
      const lang = container.getAttribute("data-lang") || "fa";
      const apiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${pageTitle}`;
  
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
  
        previewBox.innerHTML = `
          <h4>${data.title}</h4>
          <p>${data.extract || "پیش‌نمایش موجود نیست."}</p>
          <img src="${data.thumbnail?.source || ''}" alt="${data.title}" class="wiki-thumbnail">
        `;
  
        previewBox.dataset.loaded = "true";
      } catch (error) {
        previewBox.innerHTML = `<span class="error">مشکلی رخ داد.</span>`;
      }
    });
  }
};

export const afterRenderString = `(${wikiIconPlugin.afterRender.toString()})();`;

export default wikiIconPlugin;
