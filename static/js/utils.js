function buildThresholdList(numSteps, order) {
    let thresholds = [];
    for (let i = 1.0; i <= numSteps; i++) {
      let ratio = i / numSteps;
      thresholds.push(ratio);
    }
    thresholds.push(0);
    if (order == "descending") {
        thresholds.reverse();
    };
    return thresholds;
}

  
// Scroll Tip + Rabbits fade out on scroll down
function createWelcomeObserver() {
    let options = {
        root: null,
        rootMargin: '0px',
        threshold: buildThresholdList(10, "descending"),
    }

    let callback = (entries) => {
        let opacity;
        let entry;

        for (i = 0; i < entries.length; i++) {
            entry = entries[i];
            opacity = Math.min(entry.intersectionRatio, 1.0) * 0.8;  // fade a little faster;

            let elements = document.querySelectorAll('#scrolltip, .header-rabbits');
            elements.forEach((ele) => {
                ele.style.opacity = opacity;
            });
        };
    };

    let observer = new IntersectionObserver(callback, options);
    let target = document.querySelector('#welcome');
    observer.observe(target);
}
window.addEventListener("load", (event) => { createWelcomeObserver(); }, false);

// Loader on scroll for all elements (except #welcome)
// adapted from https://daltonwalsh.com/blog/using-the-intersection-observer
const elementsToLoadIn = document.querySelectorAll("section:not([id^='welcome'])");
elementsToLoadIn.forEach((el) => { el.classList.add('loadin'); });

function createLoadInObserver() {
    let options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3,
    }

    function callback(entries) {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loaded');
            }
        });
    }

    let observer = new IntersectionObserver(callback, options);
    elementsToLoadIn.forEach((el) => observer.observe(el));
}
window.addEventListener("load", (event) => { createLoadInObserver(); }, false);

// Form Controls
function selectRSVPOption(selected) {   
    let elements = document.querySelectorAll(".js-form-rsvp");
    elements.forEach((ele) => {
        ele.classList.remove('is_active');
    });

    selected.classList.add('is_active');

    // Extra guest info
    let extra = document.querySelector(".js-form-rsvp-extras");
    if (selected.dataset.value == "yes") {
        extra.classList.add('is_active');
    } else {
        extra.classList.remove('is_active');
    }
}

function selectHotelOption(selected) {   
    let elements = document.querySelectorAll(".js-form-hotel");
    elements.forEach((ele) => {
        ele.classList.remove('is_active');
    });

    selected.classList.add('is_active');

    // Extra guest info
    let extra = document.querySelector(".js-form-hotel-extras");
    if (selected.dataset.value == "yes") {
        extra.classList.add('is_active');
    } else {
        extra.classList.remove('is_active');
    }
}

function submitForm(selected) {
    // Do some checks

    // Clear previous highlights
    let wrongPrev = document.querySelectorAll(".wrong_input");
    wrongPrev.forEach((ele) => {
        ele.classList.remove("wrong_input")
    })

    // Main Guest filled in?
    let mainGuest = document.querySelector(".js-form-name");
    if (mainGuest.value.length < 1) {
        mainGuest.classList.add("wrong_input");
        return;
    }

    // RSVP filled in?
    let rsvpSelected = false;
    let rsvpSelectors = document.querySelectorAll(".js-form-rsvp");
    for (i = 0; i < rsvpSelectors.length; i++) {
        let ele = rsvpSelectors[i];
        if (ele.classList.contains('is_active')) {
            rsvpSelected = true;
            break;
        };
    }
    
    if (!rsvpSelected) {
        rsvpSelectors.forEach((ele) => {
            ele.classList.add("wrong_input")
        })
        return;
    }

    // RSVP Yes? Check Extra Fields
    let rsvpSelector = document.querySelector(".js-form-rsvp.is_active");
    let rsvpYes = rsvpSelector.dataset.value == "yes"

    if (!rsvpYes) {
        postFormData()
        return
    }

    // Numbers of guests (adults only)
    let adultsSelector = document.querySelector(".js-form-extra-guest-adults");
    if (adultsSelector.value.length < 1 || parseInt(adultsSelector.value) < 1) {
        adultsSelector.classList.add("wrong_input");
        return
    };

    // Hotel Options
    let hotelOption;
    let hotelSelectors = document.querySelectorAll(".js-form-hotel");
    for (i = 0; i < hotelSelectors.length; i++) {
        let ele = hotelSelectors[i];
        if (ele.classList.contains('is_active')) {
            hotelOption = ele;
            break;
        };
    }

    if (!hotelOption) {
        hotelSelectors.forEach((ele) => {
            ele.classList.add("wrong_input")
        })
        return;
    }

    let hotelYes = document.querySelector(".js-form-hotel.is_active")
        .dataset.value == "yes";
    if (!hotelYes) {
        postFormData()
        return
    }

    // Check options for hotel.
    let extraSelectors = document.querySelectorAll(".js-form-hotel-nights, .js-form-hotel-checkin");
    extraSelectors.forEach((ele) => {
        if (ele.value.length < 1) {
            ele.classList.add("wrong_input")
        }
        return
    })

    // Check minimum number of nights
    let numNights = document.querySelector(".js-form-hotel-nights");
    if (numNights.length < 1 || parseInt(numNights.value) < 2) {
        numNights.classList.add("wrong_input");
        return
    };

    postFormData()
}

// Post data to GSheets
function postFormData() {

    // Change submission button
    let submitButton = document.querySelector(".js-form-submit");
    if (submitButton.classList.contains("form-submitted")) {
        return;  // do not submit again.
    }

    submitButton.textContent = "Submitting ...";
    
    // Collect data
    // Handle hResponse since it's optional and depends on RSVP.
    let h = document.querySelector(".js-form-hotel.is_active");
    let hResponse = h ? h.dataset.value : "no"

    let data = {
        Name: document.querySelector(".js-form-name").value,
        Email: document.querySelector(".js-form-email").value,
        RSVP: document.querySelector(".js-form-rsvp.is_active").dataset.value,
        ExtraGuests: document.querySelector(".js-form-extra-guest-names").value,
        NumAdults: document.querySelector(".js-form-extra-guest-adults").value,
        NumChildren: document.querySelector(".js-form-extra-guest-children").value,
        DietaryRestrictions: document.querySelector(".js-form-extra-diet").value,
        WantsHotel: hResponse,
        NumNights: document.querySelector(".js-form-hotel-nights").value,
        CheckinDate: document.querySelector(".js-form-hotel-checkin").value,
    };
    
    fetch('https://api.sheetmonkey.io/form/ev6A9uu1inqfwJgqKVQtut', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }).then((result) => {
        console.log("Form submitted.")

        // Change submission button style
        submitButton.textContent = "Success!";
        submitButton.classList.add("form-submitted");
    });
}