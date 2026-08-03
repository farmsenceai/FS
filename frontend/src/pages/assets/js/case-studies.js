const slides = document.querySelectorAll(".slide");
        let current = 0;
        function nextSlide() {
            slides[current].classList.remove("active");
            current++;
            if (current >= slides.length) {
                current = 0;
            }
            slides[current].classList.add("active");
        }
        setInterval(nextSlide, 5000);
    

const storyVideo = document.getElementById("storyVideo");
const storyPlayBtn = document.getElementById("storyPlayBtn");
/* CLICK TO PLAY */
storyPlayBtn.addEventListener("click", function () {
    if (storyVideo.paused) {
        storyVideo.play()
        .then(() => {
            storyPlayBtn.style.display = "none";
            storyVideo.controls = true;
        })
        .catch((error) => {
            console.log("Video play failed:", error);
        });
    }
});

/* SHOW BUTTON AGAIN WHEN PAUSED */

storyVideo.addEventListener("pause", function () {
    if (!storyVideo.ended) {
        storyPlayBtn.style.display = "flex";
    }
});

/* HIDE BUTTON WHEN PLAYING */

storyVideo.addEventListener("play", function () {
    storyPlayBtn.style.display = "none";
});

/* SHOW BUTTON WHEN VIDEO ENDS */

storyVideo.addEventListener("ended", function () {
    storyPlayBtn.style.display = "flex";
});











/* =========================================
DRAG / TOUCH SLIDER
WORKS FOR:
DESKTOP • TABLET • MOBILE
========================================= */

const slider = document.querySelector('.related-grid');

let isDragging = false;

let startX;
let startScrollLeft;

/* =========================================
MOUSE DRAG
========================================= */

slider.addEventListener('mousedown', (e) => {

    isDragging = true;

    slider.classList.add('dragging');

    startX = e.pageX;

    startScrollLeft = slider.scrollLeft;
});

slider.addEventListener('mouseleave', () => {

    isDragging = false;

    slider.classList.remove('dragging');
});

slider.addEventListener('mouseup', () => {

    isDragging = false;

    slider.classList.remove('dragging');
});

slider.addEventListener('mousemove', (e) => {

    if(!isDragging) return;

    e.preventDefault();

    const moveX = e.pageX - startX;

    slider.scrollLeft = startScrollLeft - moveX;
});

/* =========================================
TOUCH SWIPE
========================================= */

slider.addEventListener('touchstart', (e) => {

    startX = e.touches[0].pageX;

    startScrollLeft = slider.scrollLeft;
});

slider.addEventListener('touchmove', (e) => {

    const moveX = e.touches[0].pageX - startX;

    slider.scrollLeft = startScrollLeft - moveX;
});