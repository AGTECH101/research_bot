// ArmaHosts-style Interactions for History Explorer
(function() {
    // --- Helper: loading state on buttons ---
    function setButtonLoading(btn, isLoading, originalHtml = null) {
        if (!btn) return;
        if (isLoading) {
            btn.dataset.originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> LOADING...';
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
            if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
            else if (originalHtml) btn.innerHTML = originalHtml;
        }
    }

    // --- Scroll effect for navbar (matching ArmaHosts) ---
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        });
    }

    // --- SEARCH FORM: loading indicator ---
    const searchForm = document.getElementById('global-search-form');
    const searchBtn = document.getElementById('search-submit-btn');
    if (searchForm && searchBtn) {
        searchForm.addEventListener('submit', function(e) {
            const input = document.getElementById('search-input');
            if (!input.value.trim()) {
                e.preventDefault();
                input.style.border = '1px solid var(--red-bright)';
                setTimeout(() => { input.style.border = ''; }, 1000);
                return;
            }
            setButtonLoading(searchBtn, true);
            // form continues
        });
    }

    // --- RANDOM FACT button (global & detail) ---
    const randomBtns = document.querySelectorAll('#random-fact-btn, .random-nav');
    randomBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            setButtonLoading(this, true);
            window.location.href = this.getAttribute('href') || '/random';
        });
    });

    // --- TOPIC CHIPS (fill search input & submit) ---
    const chips = document.querySelectorAll('.topic-chip');
    const searchInput = document.getElementById('search-input');
    if (chips.length && searchInput && searchForm) {
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const topic = chip.getAttribute('data-topic') || chip.innerText.trim();
                searchInput.value = topic;
                if (searchBtn) setButtonLoading(searchBtn, true);
                searchForm.submit();
            });
        });
    }

    // --- DETAIL PAGE: LIKE / DISLIKE via fetch ---
    const likeBtn = document.getElementById('like-button');
    const dislikeBtn = document.getElementById('dislike-button');
    const likesSpan = document.getElementById('likes-count');
    const dislikesSpan = document.getElementById('dislikes-count');
    const likeFill = document.getElementById('likes-progress-fill');
    const dislikeFill = document.getElementById('dislikes-progress-fill');
    const articleIdField = document.getElementById('article-id-field');

    function updateStatsUI(likes, dislikes) {
        if (likesSpan) likesSpan.innerText = likes;
        if (dislikesSpan) dislikesSpan.innerText = dislikes;
        const total = likes + dislikes;
        if (total > 0) {
            const likePercent = (likes / total) * 100;
            const dislikePercent = (dislikes / total) * 100;
            if (likeFill) likeFill.style.width = `${likePercent}%`;
            if (dislikeFill) dislikeFill.style.width = `${dislikePercent}%`;
        } else {
            if (likeFill) likeFill.style.width = '0%';
            if (dislikeFill) dislikeFill.style.width = '0%';
        }
    }

    async function sendReaction(action) {
        if (!articleIdField) return;
        const articleId = articleIdField.value;
        const btn = action === 'like' ? likeBtn : dislikeBtn;
        const originalHtml = btn ? btn.innerHTML : '';
        if (btn) setButtonLoading(btn, true, originalHtml);
        try {
            const endpoint = action === 'like' ? '/like' : '/dislike';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ document_id: articleId })
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            if (data.likes !== undefined && data.dislikes !== undefined)
                updateStatsUI(data.likes, data.dislikes);
            else if (data.new_likes !== undefined && data.new_dislikes !== undefined)
                updateStatsUI(data.new_likes, data.new_dislikes);
        } catch (err) {
            console.error('Reaction failed');
            // subtle error feedback
            const toast = document.createElement('div');
            toast.innerText = '⚠️ Could not register reaction.';
            toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#c0392b; color:white; padding:6px 18px; font-size:0.75rem; z-index:1000; font-family:Barlow Condensed;';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        } finally {
            if (btn) setButtonLoading(btn, false, originalHtml);
        }
    }

    if (likeBtn) likeBtn.addEventListener('click', (e) => { e.preventDefault(); sendReaction('like'); });
    if (dislikeBtn) dislikeBtn.addEventListener('click', (e) => { e.preventDefault(); sendReaction('dislike'); });

    // --- initial stats sync (if numbers exist) ---
    if (likesSpan && dislikesSpan) {
        const likesInit = parseInt(likesSpan.innerText) || 0;
        const dislikesInit = parseInt(dislikesSpan.innerText) || 0;
        updateStatsUI(likesInit, dislikesInit);
    }

    // --- Back home loading ---
    const backBtn = document.getElementById('back-home-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            setButtonLoading(backBtn, true);
            window.location.href = '/';
        });
    }
})();