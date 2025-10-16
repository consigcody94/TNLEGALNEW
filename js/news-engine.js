/**
 * TN Legal Services - Advanced News Engine
 * Enterprise-grade news management system for IBA 2025
 * Powered by cutting-edge web technologies
 */

class NewsEngine {
  constructor() {
    this.articles = [];
    this.filteredArticles = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.sortBy = 'date-desc';
    this.viewMode = 'grid'; // grid or list
    this.bookmarks = this.loadBookmarks();
    this.readArticles = this.loadReadArticles();
    this.analytics = new ArticleAnalytics();
    this.observers = []; // Track observers for cleanup

    // Source logo mapping
    this.sourceLogos = {
      'Immigration, Refugees and Citizenship Canada (IRCC)': 'images/sources/ircc-logo.svg',
      'Ontario Ministry of the Attorney General': 'images/sources/ontario-gov.svg',
      'Ontario Superior Court of Justice': 'images/sources/ontario-gov.svg',
      'Employment and Social Development Canada': 'images/sources/canada-gov.svg',
      'Ontario Ministry of Labour': 'images/sources/ontario-gov.svg',
      'Canadian Intellectual Property Office (CIPO)': 'images/sources/cipo-logo.svg',
      'Corporations Canada': 'images/sources/canada-gov.svg',
      'Law Society of Ontario': 'images/sources/lso-logo.svg',
      'Ontario Ministry of Finance': 'images/sources/ontario-gov.svg'
    };

    // Category icons
    this.categoryIcons = {
      'Immigration': '🛂',
      'Family Law': '👨‍👩‍👧‍👦',
      'Real Estate': '🏠',
      'Corporate Law': '🏢',
      'Intellectual Property': '💡',
      'Litigation': '⚖️',
      'Notary Services': '📝',
      'Practice Management': '📊'
    };

    // Create debounced search function once
    this.debouncedSearch = this.debounce(() => {
      this.filterArticles();
      this.analytics.trackSearch(this.searchQuery);
    }, 300);

    this.init();
  }

  async init() {
    await this.loadArticles();
    this.setupEventListeners();
    this.renderArticles();
    this.updateStats();
    this.initializeAnimations();
    this.injectStructuredData();
  }

  async loadArticles() {
    try {
      const response = await fetch('news.json');
      if (!response.ok) throw new Error('Failed to load articles');

      const data = await response.json();
      this.articles = data.articles.map(article => ({
        ...article,
        sourceLogo: this.sourceLogos[article.source] || 'images/sources/canada-gov.svg',
        categoryIcon: this.categoryIcons[article.category] || '📄',
        readTime: this.calculateReadTime(article.summary),
        isBookmarked: this.bookmarks.includes(article.id),
        isRead: this.readArticles.includes(article.id)
      }));

      this.filteredArticles = [...this.articles];
      this.sortArticles();
    } catch (error) {
      console.error('Error loading articles:', error);
      this.handleError(error);
    }
  }

  calculateReadTime(text) {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes;
  }

  sortArticles() {
    const sortFunctions = {
      'date-desc': (a, b) => new Date(b.date) - new Date(a.date),
      'date-asc': (a, b) => new Date(a.date) - new Date(b.date),
      'title-asc': (a, b) => a.title.localeCompare(b.title),
      'title-desc': (a, b) => b.title.localeCompare(a.title),
      'category': (a, b) => a.category.localeCompare(b.category)
    };

    this.filteredArticles.sort(sortFunctions[this.sortBy] || sortFunctions['date-desc']);
  }

  filterArticles() {
    let results = [...this.articles];

    // Category filter
    if (this.currentFilter !== 'all') {
      results = results.filter(article => article.category === this.currentFilter);
    }

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      results = results.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query) ||
        article.source.toLowerCase().includes(query)
      );
    }

    this.filteredArticles = results;
    this.sortArticles();
    this.renderArticles();
    this.updateStats();
  }

  renderArticles() {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;

    if (this.filteredArticles.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <div class="no-results__icon">🔍</div>
          <h3 class="no-results__title">No articles found</h3>
          <p class="no-results__text">Try adjusting your filters or search query</p>
        </div>
      `;
      return;
    }

    const maxArticles = 12;
    const articlesToShow = this.filteredArticles.slice(0, maxArticles);

    grid.innerHTML = articlesToShow.map((article, index) =>
      this.createArticleCard(article, index)
    ).join('');

    // Add scroll reveal animation
    this.animateArticleCards();

    // Add bookmark listeners
    this.setupBookmarkListeners();
  }

  createArticleCard(article, index) {
    const formattedDate = this.formatDate(article.date);
    const isNew = this.isNewArticle(article.date);
    const urgencyClass = this.getUrgencyClass(article.date, article.category);

    return `
      <article class="news-card news-card--enhanced ${urgencyClass}"
               data-category="${article.category}"
               data-id="${article.id}"
               style="animation-delay: ${index * 0.1}s">

        <!-- Source Badge -->
        <div class="news-card__source-badge">
          <img src="${article.sourceLogo}" alt="${article.source}" class="source-logo">
        </div>

        <!-- Bookmark Button -->
        <button class="news-card__bookmark ${article.isBookmarked ? 'bookmarked' : ''}"
                data-id="${article.id}"
                aria-label="Bookmark article">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${article.isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>

        ${isNew ? '<div class="news-card__new-badge">NEW</div>' : ''}
        ${article.featured ? '<div class="news-card__featured-badge">FEATURED</div>' : ''}

        <!-- Article Image/Logo -->
        <div class="news-card__image news-card__image--premium">
          <div class="source-logo-bg">
            <img src="${article.sourceLogo}" alt="${article.source}">
          </div>
          <div class="category-overlay">
            <span class="category-icon">${article.categoryIcon}</span>
          </div>
        </div>

        <!-- Article Content -->
        <div class="news-card__body news-card__body--enhanced">
          <div class="news-card__header">
            <span class="news-card__category">${article.category}</span>
            <span class="news-card__read-time">${article.readTime} min read</span>
          </div>

          <h3 class="news-card__title">${this.highlightSearch(article.title)}</h3>
          <p class="news-card__excerpt">${this.highlightSearch(article.excerpt)}</p>

          <!-- Meta Information -->
          <div class="news-card__meta-enhanced">
            <div class="news-card__source-info">
              <span class="source-label">Source:</span>
              <span class="source-name">${article.source}</span>
            </div>
            <div class="news-card__date-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>${formattedDate}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="news-card__actions">
            <a href="article.html?id=${article.id}" class="news-card__link news-card__link--primary">
              <span>Read Full Summary</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
            <button class="news-card__share" data-id="${article.id}" aria-label="Share article">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </button>
          </div>
        </div>

        ${article.isRead ? '<div class="news-card__read-indicator"></div>' : ''}
      </article>
    `;
  }

  highlightSearch(text) {
    if (!this.searchQuery) return text;

    // Escape HTML entities to prevent XSS
    const escapeHtml = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    const escapedQuery = this.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, (match) => `<mark class="search-highlight">${escapeHtml(match)}</mark>`);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  isNewArticle(dateString) {
    const articleDate = new Date(dateString);
    const now = new Date();
    const diffDays = (now - articleDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 7; // New if published within last 7 days
  }

  getUrgencyClass(dateString, category) {
    const articleDate = new Date(dateString);
    const now = new Date();
    const diffDays = (now - articleDate) / (1000 * 60 * 60 * 24);

    if (diffDays <= 7) return 'urgent-new';
    if (diffDays <= 30) return 'urgent-recent';
    return '';
  }

  setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.currentFilter = button.dataset.category;
        this.filterArticles();
        this.analytics.trackFilter(this.currentFilter);
      });
    });

    // Search input
    const searchInput = document.getElementById('newsSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.debouncedSearch();
      });
    }

    // Sort dropdown
    const sortSelect = document.getElementById('newsSort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.sortArticles();
        this.renderArticles();
      });
    }

    // View mode toggle
    const viewToggle = document.querySelectorAll('.view-toggle-btn');
    viewToggle.forEach(btn => {
      btn.addEventListener('click', () => {
        this.viewMode = btn.dataset.view;
        document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('newsGrid').className = `news-grid news-grid--${this.viewMode}`;
      });
    });
  }

  setupBookmarkListeners() {
    document.querySelectorAll('.news-card__bookmark').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const articleId = btn.dataset.id;
        this.toggleBookmark(articleId);
        btn.classList.toggle('bookmarked');

        const svg = btn.querySelector('path');
        const isBookmarked = btn.classList.contains('bookmarked');
        svg.setAttribute('fill', isBookmarked ? 'currentColor' : 'none');
      });
    });

    document.querySelectorAll('.news-card__share').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const articleId = btn.dataset.id;
        this.shareArticle(articleId);
      });
    });
  }

  toggleBookmark(articleId) {
    const index = this.bookmarks.indexOf(articleId);
    if (index > -1) {
      this.bookmarks.splice(index, 1);
    } else {
      this.bookmarks.push(articleId);
    }
    this.saveBookmarks();
    this.analytics.trackBookmark(articleId, index === -1);
  }

  async shareArticle(articleId) {
    const article = this.articles.find(a => a.id === articleId);
    if (!article) return;

    const shareData = {
      title: article.title,
      text: article.excerpt,
      url: `${window.location.origin}/article.html?id=${articleId}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        this.analytics.trackShare(articleId, 'native');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        this.showNotification('Link copied to clipboard!');
        this.analytics.trackShare(articleId, 'clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification notification--success';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  updateStats() {
    const statsEl = document.getElementById('newsStats');
    if (!statsEl) return;

    statsEl.innerHTML = `
      <div class="news-stat">
        <span class="news-stat__value">${this.filteredArticles.length}</span>
        <span class="news-stat__label">Articles</span>
      </div>
      <div class="news-stat">
        <span class="news-stat__value">${new Set(this.filteredArticles.map(a => a.category)).size}</span>
        <span class="news-stat__label">Categories</span>
      </div>
      <div class="news-stat">
        <span class="news-stat__value">${this.bookmarks.length}</span>
        <span class="news-stat__label">Bookmarked</span>
      </div>
    `;
  }

  animateArticleCards() {
    const cards = document.querySelectorAll('.news-card');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(card => observer.observe(card));
    this.observers.push(observer); // Track for cleanup
  }

  initializeAnimations() {
    // Add smooth scroll reveal animations
    const elements = document.querySelectorAll('.fade-in-up');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
    this.observers.push(observer); // Track for cleanup
  }

  // Inject Schema.org structured data for SEO
  injectStructuredData() {
    if (this.articles.length === 0) return;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": this.articles.slice(0, 10).map((article, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "NewsArticle",
          "headline": article.title,
          "description": article.excerpt,
          "datePublished": article.date,
          "author": {
            "@type": "Organization",
            "name": "TN Legal Services Ltd."
          },
          "publisher": {
            "@type": "Organization",
            "name": article.source,
            "url": article.sourceUrl
          },
          "url": `${window.location.origin}/article.html?id=${article.id}`,
          "articleSection": article.category
        }
      }))
    };

    // Remove existing structured data if present
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Inject new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  // Cleanup method to disconnect all observers
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // LocalStorage helpers
  loadBookmarks() {
    try {
      const data = localStorage.getItem('tn-legal-bookmarks');
      if (!data) return [];
      const parsed = JSON.parse(data);
      // Validate it's an array
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to load bookmarks from localStorage:', error);
      return [];
    }
  }

  saveBookmarks() {
    try {
      localStorage.setItem('tn-legal-bookmarks', JSON.stringify(this.bookmarks));
    } catch (error) {
      console.error('Failed to save bookmarks to localStorage:', error);
    }
  }

  loadReadArticles() {
    try {
      const data = localStorage.getItem('tn-legal-read-articles');
      if (!data) return [];
      const parsed = JSON.parse(data);
      // Validate it's an array
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to load read articles from localStorage:', error);
      return [];
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  handleError(error) {
    const grid = document.getElementById('newsGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="error-state">
          <div class="error-state__icon">⚠️</div>
          <h3 class="error-state__title">Unable to load articles</h3>
          <p class="error-state__text">Please check your connection and try again</p>
          <button class="btn btn-primary" onclick="location.reload()">Reload Page</button>
        </div>
      `;
    }
  }
}

// Analytics class for tracking user engagement
class ArticleAnalytics {
  constructor() {
    this.events = [];
  }

  trackFilter(category) {
    this.logEvent('filter', { category });
  }

  trackSearch(query) {
    this.logEvent('search', { query });
  }

  trackBookmark(articleId, added) {
    this.logEvent('bookmark', { articleId, action: added ? 'add' : 'remove' });
  }

  trackShare(articleId, method) {
    this.logEvent('share', { articleId, method });
  }

  trackArticleView(articleId) {
    this.logEvent('article_view', { articleId });
  }

  logEvent(eventName, data) {
    const event = {
      name: eventName,
      data,
      timestamp: new Date().toISOString()
    };
    this.events.push(event);

    // In production, send to analytics service
    console.log('[Analytics]', event);
  }

  getEngagementStats() {
    return {
      totalEvents: this.events.length,
      eventsByType: this.events.reduce((acc, event) => {
        acc[event.name] = (acc[event.name] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.newsEngine = new NewsEngine();
  });
} else {
  window.newsEngine = new NewsEngine();
}
