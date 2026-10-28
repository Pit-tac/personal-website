// Scroll-in animation for sections and cards
const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.12 }
);

document.querySelectorAll(".about, .project-card").forEach((el) => {
    el.classList.add("reveal");
    revealObserver.observe(el);
});


// Highlight active nav link based on scroll position
const sections = document.querySelectorAll("main section[id], footer[id]");
const navLinks = document.querySelectorAll(".nav-links a");

const navObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                navLinks.forEach((link) => link.classList.remove("active"));
                const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
                if (active) active.classList.add("active");
            }
        });
    },
    { rootMargin: "-40% 0px -55% 0px" }
);

sections.forEach((section) => navObserver.observe(section));


// Projects carousel: featured card in the center, neighbors on the sides, wraps around (no autoplay)
document.querySelectorAll(".carousel").forEach((carousel) => {
    const track = carousel.querySelector(".project-track");
    const items = Array.from(track.children);
    const prevBtn = carousel.querySelector(".carousel-prev");
    const nextBtn = carousel.querySelector(".carousel-next");
    const dotsWrap = carousel.querySelector(".carousel-dots");
    const count = items.length;
    let active = 0;

    carousel.classList.toggle("single", count <= 1);

    // Signed distance from the featured card, wrapped so it's in (-count/2, count/2]
    const offsetOf = (i, dir) => {
        let d = (((i - active) % count) + count) % count;
        if (d > count / 2 || (d === count / 2 && dir < 0)) d -= count;
        return d;
    };

    const dots = items.map((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute("aria-label", `Go to project ${i + 1}`);
        dot.addEventListener("click", () => goTo(i, offsetOf(i, 1) >= 0 ? 1 : -1));
        dotsWrap.appendChild(dot);
        return dot;
    });

    const render = (dir = 1, animate = true) => {
        items.forEach((item, i) => {
            const d = offsetOf(i, dir);
            const hidden = Math.abs(d) > 1;
            const wasHidden = item.classList.contains("is-hidden");
            const prevOffset = Number(item.style.getPropertyValue("--offset")) || 0;

            // A hidden card coming into view (or switching hidden sides) jumps
            // straight to the correct side instead of sweeping across the center
            if (wasHidden && Math.sign(d) !== 0 && Math.sign(d) !== Math.sign(prevOffset)) {
                item.classList.add("no-transition");
                item.style.setProperty("--offset", Math.sign(d) * 2);
                void item.offsetWidth;
                item.classList.remove("no-transition");
            }

            // A visible card leaving exits on the side it was already on
            const hiddenSide = !wasHidden && prevOffset !== 0 ? Math.sign(prevOffset) : Math.sign(d);

            item.classList.toggle("no-transition", !animate);
            item.style.setProperty("--offset", hidden ? hiddenSide * 2 : d);
            item.classList.toggle("is-active", d === 0);
            item.classList.toggle("is-hidden", hidden);
            item.setAttribute("aria-hidden", d === 0 ? "false" : "true");
            item.querySelectorAll("a, button").forEach((el) => {
                if (d === 0) el.removeAttribute("tabindex");
                else el.setAttribute("tabindex", "-1");
            });
        });
        dots.forEach((dot, i) => dot.setAttribute("aria-current", i === active ? "true" : "false"));
    };

    const goTo = (index, dir) => {
        active = ((index % count) + count) % count;
        render(dir);
    };

    prevBtn.addEventListener("click", () => goTo(active - 1, -1));
    nextBtn.addEventListener("click", () => goTo(active + 1, 1));

    // Clicking a side card brings it to the center
    let justSwiped = false;
    items.forEach((item, i) => {
        item.addEventListener("click", () => {
            if (justSwiped) { justSwiped = false; return; }
            if (i !== active) goTo(i, offsetOf(i, 1) > 0 ? 1 : -1);
        });
    });

    track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); goTo(active - 1, -1); }
        if (e.key === "ArrowRight") { e.preventDefault(); goTo(active + 1, 1); }
    });

    // Horizontal trackpad scrolling: one card per gesture
    let wheelAccum = 0;
    let wheelLocked = false;
    track.addEventListener("wheel", (e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        if (wheelLocked) return;
        wheelAccum += e.deltaX;
        if (Math.abs(wheelAccum) > 40) {
            const dir = Math.sign(wheelAccum);
            goTo(active + dir, dir);
            wheelAccum = 0;
            wheelLocked = true;
            setTimeout(() => { wheelLocked = false; }, 500);
        }
    }, { passive: false });

    // Touch swipe
    let startX = null;
    track.addEventListener("pointerdown", (e) => {
        justSwiped = false;
        if (e.pointerType !== "mouse") startX = e.clientX;
    });
    track.addEventListener("pointerup", (e) => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) > 40) {
            const dir = dx < 0 ? 1 : -1;
            goTo(active + dir, dir);
            // Swallow the click that follows this pointerup
            justSwiped = true;
        }
    });
    track.addEventListener("pointercancel", () => { startX = null; });

    // Place cards without animating on page load
    render(1, false);
});
