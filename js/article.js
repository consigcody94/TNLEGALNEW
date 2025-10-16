(() => {
  // Get article ID from URL parameter
  const getArticleId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  };

  // Format date to readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Create article HTML
  const renderArticle = (article) => {
    return `
      <section class="article-hero">
        <div class="container">
          <a href="news.html" class="article-back-link">← Back to Updates</a>
          <span class="article-hero__category">${article.category}</span>
          <h1 class="article-hero__title">${article.title}</h1>
          <div class="article-hero__meta">
            <span class="article-hero__date">${formatDate(article.date)}</span>
            <span class="article-hero__source">Source: ${article.source}</span>
          </div>
        </div>
      </section>

      <section>
        <div class="article-content">
          <div class="article-source-badge" style="background: rgba(192, 192, 192, 0.08); border: 1px solid rgba(192, 192, 192, 0.15); border-radius: 12px; padding: 1.5rem 2rem; margin-bottom: 2.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <strong style="display: block; margin-bottom: 0.25rem; color: var(--pure-white);">Official Source:</strong>
              <span style="color: var(--silver); font-size: 0.9rem;">${article.source}</span>
            </div>
            <a href="${article.sourceUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="margin: 0;">Visit Official Site →</a>
          </div>

          <h2>Summary</h2>
          <p>${article.summary}</p>

          <div class="article-callout">
            <strong>How This Affects You:</strong><br>
            Our team can help you understand how these changes apply to your specific situation. <a href="contact.html" style="color: var(--pure-white); text-decoration: underline;">Contact us</a> for a consultation.
          </div>

          <div style="text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <a href="${article.sourceUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Read Full Details on Official Website →</a>
          </div>
        </div>
      </section>
    `;
  };

  // Create related article card
  const createRelatedCard = (article) => {
    return `
      <article class="news-card">
        <div class="news-card__image">
          <img src="${article.image}" alt="${article.title}" />
        </div>
        <div class="news-card__body">
          <span class="news-card__category">${article.category}</span>
          <h3 class="news-card__title">${article.title}</h3>
          <p class="news-card__excerpt">${article.excerpt}</p>
          <a href="article.html?id=${article.id}" class="news-card__link">Read Article →</a>
        </div>
      </article>
    `;
  };

  // Render related articles
  const renderRelatedArticles = (currentArticle, allArticles) => {
    // Find articles in same category, excluding current article
    const related = allArticles
      .filter(article =>
        article.category === currentArticle.category &&
        article.id !== currentArticle.id
      )
      .slice(0, 3); // Show max 3 related articles

    if (related.length === 0) return;

    const relatedSection = document.getElementById('relatedArticles');
    const relatedGrid = document.getElementById('relatedGrid');

    if (relatedSection && relatedGrid) {
      relatedGrid.innerHTML = related.map(article => createRelatedCard(article)).join('');
      relatedSection.style.display = 'block';
    }
  };

  // Update page metadata
  const updatePageMeta = (article) => {
    document.title = `${article.title} — TN Legal Services Ltd.`;

    // Use more robust selector for meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', article.excerpt);
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    const twitterDescription = document.querySelector('meta[property="twitter:description"]');
    const twitterUrl = document.querySelector('meta[property="twitter:url"]');

    if (ogTitle) ogTitle.setAttribute('content', `${article.title} — TN Legal Services Ltd.`);
    if (ogDescription) ogDescription.setAttribute('content', article.excerpt);
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);
    if (twitterTitle) twitterTitle.setAttribute('content', `${article.title} — TN Legal Services Ltd.`);
    if (twitterDescription) twitterDescription.setAttribute('content', article.excerpt);
    if (twitterUrl) twitterUrl.setAttribute('content', window.location.href);

    // Add Schema.org structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": article.excerpt,
      "datePublished": article.date,
      "author": {
        "@type": "Organization",
        "name": "TN Legal Services Ltd.",
        "url": "https://tnlegal.ca"
      },
      "publisher": {
        "@type": "Organization",
        "name": article.source,
        "url": article.sourceUrl
      },
      "url": window.location.href,
      "articleSection": article.category,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      }
    };

    // Remove existing structured data if present
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Inject structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  };

  // Load article data
  const loadArticle = async () => {
    const articleId = getArticleId();

    if (!articleId) {
      window.location.href = 'news.html';
      return;
    }

    try {
      const response = await fetch('news.json');
      if (!response.ok) throw new Error('Failed to load article');

      const data = await response.json();
      const article = data.articles.find(a => a.id === articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      // Render article
      const container = document.getElementById('articleContainer');
      if (container) {
        container.innerHTML = renderArticle(article);
      }

      // Update page metadata
      updatePageMeta(article);

      // Render related articles
      renderRelatedArticles(article, data.articles);

    } catch (error) {
      console.error('Error loading article:', error);
      const container = document.getElementById('articleContainer');
      if (container) {
        container.innerHTML = `
          <section class="page-hero">
            <div class="container page-hero__shell">
              <h1 class="page-hero__title">Article Not Found</h1>
              <p class="page-hero__lead">The article you're looking for could not be found.</p>
              <div class="page-hero__cta">
                <a href="news.html" class="btn btn-primary">Back to News</a>
              </div>
            </div>
          </section>
        `;
      }
    }
  };

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadArticle);
  } else {
    loadArticle();
  }
})();
