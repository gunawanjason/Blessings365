import { dayOfYear, MONTH_NAMES } from '../utils/helpers.js';
import { trackEvent } from '../utils/analytics.js';

const STORAGE_KEY = 'blessings365_onboarded_v1';
const NT_START_KEY = 'blessings365_start_with_nt';
const TARGET_KEY = 'blessings365_30day_target';
const WELCOME_BACK_KEY = 'blessings365_last_welcome_date';

function todayStamp() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function shouldShowOnboarding() {
    try {
        return !localStorage.getItem(STORAGE_KEY);
    } catch {
        return false;
    }
}

export function markOnboardingComplete() {
    try {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {}
}

export function shouldShowWelcomeBack() {
    try {
        // Only for users who have completed onboarding
        if (!localStorage.getItem(STORAGE_KEY)) return false;
        return localStorage.getItem(WELCOME_BACK_KEY) !== todayStamp();
    } catch {
        return false;
    }
}

export function markWelcomeBackShown() {
    try {
        localStorage.setItem(WELCOME_BACK_KEY, todayStamp());
    } catch {}
}

export function popStartWithNtFlag() {
    try {
        const has = localStorage.getItem(NT_START_KEY);
        if (has) localStorage.removeItem(NT_START_KEY);
        return !!has;
    } catch {
        return false;
    }
}

/**
 * Render the first-visit onboarding over the app.
 * Calls onComplete() when the user starts (or skips).
 */
export function renderOnboarding({ onComplete } = {}) {
    const today = new Date();
    const dayNum = dayOfYear(today);
    const dateLine = `${MONTH_NAMES[today.getMonth()]} ${today.getDate()}`;

    const overlay = document.createElement('div');
    overlay.className = 'onboarding';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'onboarding-title');

    overlay.innerHTML = `
        <div class="onboarding__backdrop" aria-hidden="true"></div>

        <div class="onboarding__frame">
            <header class="onboarding__top">
                <div class="onboarding__brand">
                    <img src="/assets/bcc.ico" alt="" class="onboarding__brand-mark" aria-hidden="true" />
                    <span class="onboarding__brand-name">Blessings<span class="onboarding__brand-accent">365</span></span>
                </div>

                <button type="button" class="onboarding__skip" data-action="skip" aria-label="Skip introduction">
                    Skip for now
                </button>
            </header>

            <div class="onboarding__progress" role="progressbar" aria-valuemin="1" aria-valuemax="6" aria-valuenow="1">
                <div class="onboarding__progress-rail">
                    <div class="onboarding__progress-fill"></div>
                </div>
                <div class="onboarding__progress-label">
                    <span data-step-current>I</span>
                    <span class="onboarding__progress-of">/</span>
                    <span data-step-total>VI</span>
                </div>
            </div>

            <main class="onboarding__stage" aria-live="polite">
                ${slideOne({ dateLine })}
                ${slideTwo()}
                ${slideThree()}
                ${slideFour()}
                ${slideFive()}
                ${slideSix({ dayNum, dateLine })}
            </main>

            <nav class="onboarding__nav" aria-label="Onboarding navigation">
                <button type="button" class="onboarding__btn onboarding__btn--ghost" data-action="back" disabled>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M15 6l-6 6 6 6" />
                    </svg>
                    <span>Back</span>
                </button>

                <div class="onboarding__dots" role="tablist" aria-label="Chapter indicator">
                    ${Array.from(
                        { length: 6 },
                        (_, i) =>
                            `<button type="button" class="onboarding__dot ${i === 0 ? 'is-active' : ''}" data-dot="${i}" role="tab" aria-label="Go to section ${i + 1}"></button>`
                    ).join('')}
                </div>

                <button type="button" class="onboarding__btn onboarding__btn--primary" data-action="next">
                    <span class="onboarding__btn-label">
                        <span class="onboarding__btn-label--full" data-next-label>Continue</span>
                        <span class="onboarding__btn-label--short" data-next-label-short>Next</span>
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M9 6l6 6-6 6" />
                    </svg>
                </button>
            </nav>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const stage = overlay.querySelector('.onboarding__stage');
    const slides = stage.querySelectorAll('.ob-slide');
    const progressFill = overlay.querySelector('.onboarding__progress-fill');
    const progressCurrent = overlay.querySelector('[data-step-current]');
    const backBtn = overlay.querySelector('[data-action="back"]');
    const nextBtn = overlay.querySelector('[data-action="next"]');
    const nextLabel = overlay.querySelector('[data-next-label]');
    const nextLabelShort = overlay.querySelector('[data-next-label-short]');
    const skipBtn = overlay.querySelector('[data-action="skip"]');
    const dots = overlay.querySelectorAll('.onboarding__dot');
    const total = slides.length;
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];

    let current = 0;

    function setSlide(index, direction = 1) {
        index = Math.max(0, Math.min(total - 1, index));
        if (index === current && slides[current].classList.contains('is-active')) return;

        slides.forEach((slide, i) => {
            slide.classList.remove('is-active', 'is-leaving-left', 'is-leaving-right');
            if (i === index) {
                slide.classList.add('is-active');
                if (direction === 1) slide.classList.add('is-entering-right');
                else slide.classList.add('is-entering-left');
                requestAnimationFrame(() => {
                    slide.classList.remove('is-entering-right', 'is-entering-left');
                });
            }
        });

        current = index;
        const pct = ((current + 1) / total) * 100;
        progressFill.style.transform = `scaleX(${pct / 100})`;
        progressCurrent.textContent = romanNumerals[current];
        overlay.querySelector('.onboarding__progress').setAttribute('aria-valuenow', current + 1);

        dots.forEach((d, i) => d.classList.toggle('is-active', i === current));

        backBtn.disabled = current === 0;
        if (current === total - 1) {
            nextLabel.textContent = `Begin Day ${dayNum}`;
            nextLabelShort.textContent = `Day ${dayNum}`;
            nextBtn.classList.add('onboarding__btn--start');
        } else if (current === total - 2) {
            nextLabel.textContent = 'Almost there';
            nextLabelShort.textContent = 'Next';
            nextBtn.classList.remove('onboarding__btn--start');
        } else {
            nextLabel.textContent = 'Continue';
            nextLabelShort.textContent = 'Next';
            nextBtn.classList.remove('onboarding__btn--start');
        }

        // Focus first focusable in slide
        const firstFocus = slides[index].querySelector('input, textarea, button');
        if (firstFocus && index === 4) {
            // Let checklist render first
            setTimeout(() => firstFocus.focus({ preventScroll: true }), 120);
        }
    }

    function handleNext() {
        if (current === total - 1) {
            completeAndLaunch();
        } else {
            setSlide(current + 1, 1);
        }
    }

    function handleBack() {
        if (current > 0) setSlide(current - 1, -1);
    }

    function completeAndLaunch() {
        // Persist 30-day target if provided
        const target = overlay.querySelector('#ob-target');
        if (target && target.value.trim()) {
            try {
                localStorage.setItem(TARGET_KEY, target.value.trim());
            } catch {}
        }
        try {
            localStorage.setItem(NT_START_KEY, '1');
        } catch {}
        // Notify any already-rendered page to swap to the NT tab now
        // (localStorage flag handles page-reload case; event handles in-session case)
        window.dispatchEvent(new CustomEvent('blessings365:open-nt'));
        finish('start');
    }

    function finish(kind) {
        markOnboardingComplete();
        // Prevent the daily welcome-back from popping up right after a
        // fresh onboarding — same-day users have already seen the frameworks.
        markWelcomeBackShown();
        trackEvent('onboarding_complete', {
            event_category: 'onboarding',
            event_label: kind,
            steps_viewed: current + 1,
        });
        overlay.classList.add('is-dismissing');
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
            if (onComplete) onComplete({ kind });
        }, 460);
    }

    // Wire nav
    nextBtn.addEventListener('click', handleNext);
    backBtn.addEventListener('click', handleBack);
    skipBtn.addEventListener('click', () => finish('skip'));
    dots.forEach((dot, i) =>
        dot.addEventListener('click', () => setSlide(i, i > current ? 1 : -1))
    );

    // Keyboard nav
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            handleNext();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            handleBack();
        } else if (e.key === 'Escape') {
            finish('skip');
        }
    });

    // Checklist wiring (slide 5)
    const checklistItems = overlay.querySelectorAll('.ob-check');
    const checklistCount = overlay.querySelector('[data-checklist-count]');
    const updateChecklistCount = () => {
        const done = overlay.querySelectorAll('.ob-check.is-done').length;
        if (checklistCount) checklistCount.textContent = done;
        const ring = overlay.querySelector('.ob-checklist__ring-fill');
        if (ring) ring.style.strokeDashoffset = `${100 - (done / checklistItems.length) * 100}`;
    };
    checklistItems.forEach((item) => {
        item.addEventListener('click', () => {
            item.classList.toggle('is-done');
            updateChecklistCount();
        });
        item.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                item.click();
            }
        });
    });

    // Bookmark helper (first checklist item can show a hint)
    const bookmarkBtn = overlay.querySelector('[data-show-bookmark-hint]');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const hint = overlay.querySelector('.ob-bookmark-hint');
            if (hint) hint.classList.toggle('is-visible');
        });
    }

    // Entry animation
    requestAnimationFrame(() => {
        overlay.classList.add('is-open');
        slides[0].classList.add('is-active');
    });

    // Track view
    trackEvent('onboarding_start', { event_category: 'onboarding' });

    // Return API (rarely used)
    return {
        dismiss: () => finish('api'),
    };
}

// ===========================
// Slide templates
// ===========================

function slideOne({ dateLine }) {
    return `
    <section class="ob-slide ob-slide--welcome" data-slide="0">
        <div class="ob-slide__meta">
            <span class="ob-eyebrow">I · Begin</span>
            <span class="ob-datestamp">${dateLine}</span>
        </div>

        <div class="ob-slide__body">
            <h1 class="ob-display ob-display--hero" id="onboarding-title">
                <span class="ob-display__line">Read.</span>
                <span class="ob-display__line ob-display__line--accent">Reflect.</span>
                <span class="ob-display__line">Respond.</span>
            </h1>

            <div class="ob-ornament" aria-hidden="true">
                <span class="ob-ornament__rule"></span>
                <span class="ob-ornament__mark">&#10086;</span>
                <span class="ob-ornament__rule"></span>
            </div>

            <p class="ob-lede">
                Three hundred sixty&#8209;five days of daily Scripture,
                daily alignment, daily action.
            </p>

            <figure class="ob-pullquote">
                <blockquote class="ob-pullquote__text">
                    Then you will know the truth, and the truth will set you free.
                </blockquote>
                <figcaption class="ob-pullquote__cite">— John 8:32</figcaption>
            </figure>
        </div>
    </section>
    `;
}

function slideTwo() {
    return `
    <section class="ob-slide ob-slide--calibration" data-slide="1">
        <div class="ob-slide__meta">
            <span class="ob-eyebrow">II · Why this matters</span>
        </div>

        <div class="ob-slide__body">
            <h2 class="ob-display ob-display--medium">
                The 15-Minute<br/>
                <em>Calibration.</em>
            </h2>

            <p class="ob-paragraph ob-paragraph--lead">
                Reclaiming your life, one morning at a time.
            </p>

            <p class="ob-paragraph">
                Most mornings, we hand our attention to a glass screen before
                a thought is our own. This is a daily invitation to reconnect with
                the Creator <em>before</em> the world takes its cut.
            </p>

            <p class="ob-paragraph ob-paragraph--emphasis">
                Don't just start your day. <span class="ob-accent">Redeem it</span>, through the Word.
            </p>
        </div>
    </section>
    `;
}

function slideThree() {
    return `
    <section class="ob-slide ob-slide--rhythm" data-slide="2">
        <div class="ob-slide__meta">
            <span class="ob-eyebrow">III · The rhythm</span>
        </div>

        <div class="ob-slide__body">
            <h2 class="ob-display ob-display--medium">Three phases,<br/><em>one morning.</em></h2>

            <ol class="ob-phases">
                <li class="ob-phase">
                    <span class="ob-phase__numeral">i.</span>
                    <div class="ob-phase__content">
                        <h3 class="ob-phase__title">Setup</h3>
                        <p class="ob-phase__text">
                            Choose a dedicated time.
                            Open Blessings365.
                            Begin with prayer.
                        </p>
                    </div>
                </li>

                <li class="ob-phase">
                    <span class="ob-phase__numeral">ii.</span>
                    <div class="ob-phase__content">
                        <h3 class="ob-phase__title">Read <span class="ob-phase__lat">— Lectio</span></h3>
                        <p class="ob-phase__text">
                            Today's passage only. Slowly.
                            Let the text breathe before you do.
                        </p>
                    </div>
                </li>

                <li class="ob-phase">
                    <span class="ob-phase__numeral">iii.</span>
                    <div class="ob-phase__content">
                        <h3 class="ob-phase__title">Reflect</h3>
                        <p class="ob-phase__text">
                            Choose a framework on the next page.
                            Sit with it until something asks to be acted on.
                        </p>
                    </div>
                </li>
            </ol>
        </div>
    </section>
    `;
}

function slideFour() {
    return `
    <section class="ob-slide ob-slide--frameworks" data-slide="3">
        <div class="ob-slide__meta">
            <span class="ob-eyebrow">IV · Choose a framework</span>
        </div>

        <div class="ob-slide__body">
            <h2 class="ob-display ob-display--medium">Two ways<br/><em>to reflect.</em></h2>

            <p class="ob-paragraph ob-paragraph--muted">
                Either framework works. Pick the one that speaks to you this season —
                you can switch any day.
            </p>

            <div class="ob-framework-pair">
                <article class="ob-framework">
                    <header class="ob-framework__head">
                        <span class="ob-framework__kicker">Framework One</span>
                        <h3 class="ob-framework__name">Pray</h3>
                    </header>
                    <dl class="ob-framework__acro">
                        <div><dt>P</dt><dd><strong>Promises</strong> in the text</dd></div>
                        <div><dt>R</dt><dd><strong>Reminders</strong> for today</dd></div>
                        <div><dt>A</dt><dd><strong>A new perspective</strong> you now see</dd></div>
                        <div><dt>Y</dt><dd><strong>Your action</strong> for today</dd></div>
                    </dl>
                </article>

                <div class="ob-framework-divider" aria-hidden="true">
                    <span>or</span>
                </div>

                <article class="ob-framework">
                    <header class="ob-framework__head">
                        <span class="ob-framework__kicker">Framework Two</span>
                        <h3 class="ob-framework__name">Grow</h3>
                    </header>
                    <dl class="ob-framework__acro">
                        <div><dt>G</dt><dd><strong>Guiding</strong> truth to see</dd></div>
                        <div><dt>R</dt><dd><strong>Reminders</strong> being reinforced</dd></div>
                        <div><dt>O</dt><dd><strong>Oath</strong> or promise offered</dd></div>
                        <div><dt>W</dt><dd><strong>Work of faith</strong> today</dd></div>
                    </dl>
                </article>
            </div>
        </div>
    </section>
    `;
}

function slideFive() {
    return `
    <section class="ob-slide ob-slide--checklist" data-slide="4">
        <div class="ob-slide__meta">
            <span class="ob-eyebrow">V · First-day checklist</span>
        </div>

        <div class="ob-slide__body">
            <div class="ob-checklist__head">
                <div>
                    <h2 class="ob-display ob-display--medium">Before you<br/><em>begin Day One.</em></h2>
                    <p class="ob-paragraph ob-paragraph--muted">
                        Three small acts that make this practice last more than a week.
                    </p>
                </div>

                <div class="ob-checklist__counter" aria-live="polite">
                    <svg class="ob-checklist__ring" viewBox="0 0 40 40" aria-hidden="true">
                        <circle class="ob-checklist__ring-track" cx="20" cy="20" r="15.9" fill="none" stroke-width="2.2" />
                        <circle class="ob-checklist__ring-fill" cx="20" cy="20" r="15.9" fill="none" stroke-width="2.2"
                            stroke-dasharray="100" stroke-dashoffset="100" transform="rotate(-90 20 20)" />
                    </svg>
                    <div class="ob-checklist__counter-text">
                        <span class="ob-checklist__counter-num"><span data-checklist-count>0</span><span>/3</span></span>
                        <span class="ob-checklist__counter-label">Completed</span>
                    </div>
                </div>
            </div>

            <ul class="ob-checklist" role="list">
                <li class="ob-check" tabindex="0" role="button" aria-pressed="false">
                    <span class="ob-check__mark" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 12l5 5L20 6" />
                        </svg>
                    </span>
                    <div class="ob-check__body">
                        <h4 class="ob-check__title">Bookmark the site</h4>
                        <p class="ob-check__meta">
                            Save <code class="ob-kbd">daily.blessings365.top</code> so tomorrow starts here.
                            <button type="button" class="ob-inline-link" data-show-bookmark-hint>How?</button>
                        </p>
                        <div class="ob-bookmark-hint">
                            <span class="ob-bookmark-hint__platform"><kbd>⌘</kbd><kbd>D</kbd> Mac</span>
                            <span class="ob-bookmark-hint__sep" aria-hidden="true">·</span>
                            <span class="ob-bookmark-hint__platform"><kbd>Ctrl</kbd><kbd>D</kbd> Win</span>
                            <span class="ob-bookmark-hint__sep" aria-hidden="true">·</span>
                            <span class="ob-bookmark-hint__platform">Share sheet on mobile</span>
                        </div>
                    </div>
                </li>

                <li class="ob-check" tabindex="0" role="button" aria-pressed="false">
                    <span class="ob-check__mark" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 12l5 5L20 6" />
                        </svg>
                    </span>
                    <div class="ob-check__body">
                        <h4 class="ob-check__title">Set a dedicated time</h4>
                        <p class="ob-check__meta">
                            The time you'll actually keep, keeps you. Morning usually wins.
                        </p>
                    </div>
                </li>

                <li class="ob-check" tabindex="0" role="button" aria-pressed="false">
                    <span class="ob-check__mark" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 12l5 5L20 6" />
                        </svg>
                    </span>
                    <div class="ob-check__body">
                        <h4 class="ob-check__title">Text a growth partner</h4>
                        <p class="ob-check__meta">
                            Send one friend this link. Further together by day thirty.
                        </p>
                    </div>
                </li>
            </ul>
        </div>
    </section>
    `;
}

function slideSix({ dayNum, dateLine }) {
    return `
    <section class="ob-slide ob-slide--begin" data-slide="5">
        <div class="ob-slide__meta">
            <span class="ob-eyebrow">VI · A thirty-day target</span>
            <span class="ob-datestamp">Day ${dayNum} · ${dateLine}</span>
        </div>

        <div class="ob-slide__body">
            <h2 class="ob-display ob-display--medium">
                What mindset shift<br/>
                <em>are you praying for?</em>
            </h2>

            <p class="ob-paragraph ob-paragraph--muted">
                Write it once. Hold it loosely. Let the text re-shape it over the next thirty mornings.
            </p>

            <label class="ob-target">
                <span class="ob-target__label">My 30-day target</span>
                <textarea
                    id="ob-target"
                    class="ob-target__input"
                    rows="2"
                    maxlength="180"
                    placeholder="e.g. &ldquo;To trust God with outcomes I cannot control.&rdquo;"></textarea>
                <span class="ob-target__hint">Optional. Saved to this device only.</span>
            </label>

            <div class="ob-launchpad">
                <div class="ob-launchpad__lead">
                    <span class="ob-eyebrow ob-eyebrow--soft">Today begins in</span>
                    <h3 class="ob-launchpad__book">The New Testament.</h3>
                    <p class="ob-launchpad__sub">
                        Old Testament, Psalms, and Proverbs — one tap away.
                    </p>
                </div>
            </div>
        </div>
    </section>
    `;
}

// ===========================
// Daily welcome-back (single-page)
// ===========================

/**
 * Render the daily welcome-back overlay for returning users.
 * Shows once per calendar day: brand → greeting → PRAY / GROW cards → Begin.
 */
export function renderWelcomeBack({ onComplete } = {}) {
    const today = new Date();
    const dayNum = dayOfYear(today);
    const dateLine = `${MONTH_NAMES[today.getMonth()]} ${today.getDate()}`;

    const overlay = document.createElement('div');
    overlay.className = 'welcome-back';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'welcome-back-title');

    overlay.innerHTML = `
        <div class="welcome-back__backdrop" aria-hidden="true"></div>

        <div class="welcome-back__frame">
            <header class="welcome-back__top">
                <div class="welcome-back__brand">
                    <img src="/assets/bcc.ico" alt="" class="welcome-back__brand-mark" aria-hidden="true" />
                    <span class="welcome-back__brand-name">Blessings<span class="welcome-back__brand-accent">365</span></span>
                </div>
                <button type="button" class="welcome-back__close" data-action="close" aria-label="Close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M6 6l12 12M6 18L18 6"/>
                    </svg>
                </button>
            </header>

            <main class="welcome-back__body">
                <div class="welcome-back__hero">
                    <span class="welcome-back__eyebrow">Day ${dayNum} &middot; ${dateLine}</span>
                    <h1 class="welcome-back__title" id="welcome-back-title">
                        Welcome <em>back.</em>
                    </h1>
                    <p class="welcome-back__lede">
                        Two lenses for today's passage. Pick whichever fits the moment.
                    </p>
                </div>

                <div class="ob-framework-pair welcome-back__frameworks">
                    <article class="ob-framework">
                        <header class="ob-framework__head">
                            <span class="ob-framework__kicker">Framework One</span>
                            <h3 class="ob-framework__name">Pray</h3>
                        </header>
                        <dl class="ob-framework__acro">
                            <div><dt>P</dt><dd><strong>Promises</strong> in the text</dd></div>
                            <div><dt>R</dt><dd><strong>Reminders</strong> for today</dd></div>
                            <div><dt>A</dt><dd><strong>A new perspective</strong> you now see</dd></div>
                            <div><dt>Y</dt><dd><strong>Your action</strong> for today</dd></div>
                        </dl>
                    </article>

                    <div class="ob-framework-divider" aria-hidden="true">
                        <span>or</span>
                    </div>

                    <article class="ob-framework">
                        <header class="ob-framework__head">
                            <span class="ob-framework__kicker">Framework Two</span>
                            <h3 class="ob-framework__name">Grow</h3>
                        </header>
                        <dl class="ob-framework__acro">
                            <div><dt>G</dt><dd><strong>Guiding</strong> truth to see</dd></div>
                            <div><dt>R</dt><dd><strong>Reminders</strong> being reinforced</dd></div>
                            <div><dt>O</dt><dd><strong>Oath</strong> or promise offered</dd></div>
                            <div><dt>W</dt><dd><strong>Work of faith</strong> today</dd></div>
                        </dl>
                    </article>
                </div>

                <div class="welcome-back__foot">
                    <button type="button" class="welcome-back__cta" data-action="begin">
                        <span class="welcome-back__cta-dot" aria-hidden="true"></span>
                        <span>Begin Day ${dayNum}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M9 6l6 6-6 6"/>
                        </svg>
                    </button>
                </div>
            </main>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    function finish(kind) {
        markWelcomeBackShown();
        trackEvent('welcome_back_complete', {
            event_category: 'welcome_back',
            event_label: kind,
        });
        overlay.classList.add('is-dismissing');
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
            if (onComplete) onComplete({ kind });
        }, 340);
    }

    overlay.querySelector('[data-action="begin"]').addEventListener('click', () => finish('begin'));
    overlay.querySelector('[data-action="close"]').addEventListener('click', () => finish('close'));
    overlay
        .querySelector('.welcome-back__backdrop')
        .addEventListener('click', () => finish('backdrop'));

    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') finish('esc');
    });

    requestAnimationFrame(() => {
        overlay.classList.add('is-open');
        const cta = overlay.querySelector('[data-action="begin"]');
        if (cta) cta.focus({ preventScroll: true });
    });

    trackEvent('welcome_back_shown', { event_category: 'welcome_back' });

    return {
        dismiss: () => finish('api'),
    };
}
