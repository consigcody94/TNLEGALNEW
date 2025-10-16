(() => {
  let articlesData = [];
  let currentFilter = 'all';

  // Format date to readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Create news card HTML
  const createNewsCard = (article) => {
    return `
      <article class="news-card">
        <div class="news-card__image">
          <img src="${article.image}" alt="${article.title}" />
        </div>
        <div class="news-card__body">
          <span class="news-card__category">${article.category}</span>
          <h3 class="news-card__title">${article.title}</h3>
          <p class="news-card__excerpt">${article.excerpt}</p>
          <div class="news-card__meta">
            <span class="news-card__source" style="font-size: 0.8rem; color: var(--silver);">Source: ${article.source}</span>
            <span class="news-card__date">${formatDate(article.date)}</span>
          </div>
          <a href="article.html?id=${article.id}" class="news-card__link">Read Summary →</a>
        </div>
      </article>
    `;
  };

  // Render articles to grid
  const renderArticles = (filter = 'all') => {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;

    let filteredArticles = articlesData;

    if (filter !== 'all') {
      filteredArticles = articlesData.filter(article => article.category === filter);
    }

    if (filteredArticles.length === 0) {
      grid.innerHTML = '<div class="loading-state"><p>No updates found in this category.</p></div>';
      return;
    }

    // Limit to max 10 articles, show last 5 by default
    const maxArticles = 10;
    const defaultDisplay = 5;
    const articlesToShow = filteredArticles.slice(0, Math.min(filteredArticles.length, maxArticles));

    grid.innerHTML = articlesToShow.map(article => createNewsCard(article)).join('');

    // Show count message if there are more articles
    if (filteredArticles.length > maxArticles) {
      const message = document.createElement('div');
      message.className = 'loading-state';
      message.innerHTML = `<p>Showing ${maxArticles} most recent updates. ${filteredArticles.length - maxArticles} older updates hidden.</p>`;
      grid.appendChild(message);
    }
  };

  // Handle filter button clicks
  const setupFilters = () => {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        button.classList.add('active');

        // Get filter category
        const category = button.dataset.category;
        currentFilter = category;

        // Render filtered articles
        renderArticles(category);
      });
    });
  };

  // Load articles from JSON
  const loadArticles = async () => {
    try {
      const response = await fetch('news.json');
      if (!response.ok) throw new Error('Failed to load articles');

      const data = await response.json();
      articlesData = data.articles;

      // Sort by date (newest first)
      articlesData.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Render all articles initially
      renderArticles('all');

      // Setup filter buttons
      setupFilters();

    } catch (error) {
      console.error('Error loading articles:', error);
      const grid = document.getElementById('newsGrid');
      if (grid) {
        grid.innerHTML = '<div class="loading-state"><p>Error loading articles. Please try again later.</p></div>';
      }
    }
  };

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadArticles);
  } else {
    loadArticles();
  }
})();
