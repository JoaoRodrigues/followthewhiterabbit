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

    // RSVP Yes? Check Extra Fields (Hotel is only required)
    let rsvpSelector = document.querySelector(".js-form-rsvp.is_active");
    let rsvpYes = rsvpSelector.dataset.value == "yes"

    if (!rsvpYes) {
        postFormData()
        return
    }

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
    if (parseInt(numNights.value) < 2) {
        numNights.classList.add("wrong_input");
        return
    };

    postFormData()
}

// Dynamically create a form and submit it.
// Lazy way of creating a POST request.
function postFormData() {

    const form = document.createElement('form');
    form.method = "POST";
    form.action = "https://script.google.com/macros/s/AKfycbx0KGffwNbOkFtXTyrpZrIFKLNMUgceKTIzu6F8I1k/dev";
    form.type = "hidden";

    // Collect data
    // Handle hResponse since it's optional and depends on RSVP.
    let h = document.querySelector(".js-form-hotel.is_active");
    let hResponse = h ? h.dataset.value : "no"

    let params = {
        name: document.querySelector(".js-form-name").value,
        rsvp: document.querySelector(".js-form-rsvp.is_active").dataset.value,
        extra_guests: document.querySelector(".js-form-extra-guest-names").value,
        diet: document.querySelector(".js-form-extra-diet").value,
        hotel: hResponse,
        hotel_nights: document.querySelector(".js-form-hotel-nights").value,
        hotel_checkin: document.querySelector(".js-form-hotel-checkin").value,
    };

    // Create form
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.name = key;
        hiddenField.value = params[key];
  
        form.appendChild(hiddenField);
      }
    }
  
    document.body.appendChild(form);
    
    const data = new FormData(form);
    const action = form.action;
    fetch(action, {
        method: 'POST',
        body: data,
    })
    .then(() => {
        console.log("Done?")
    })
  
    // form.submit();

    // Change submission to 'correct'
    let submitButton = document.querySelector(".js-form-submit");
    submitButton.textContent = "Form Submitted";
}

window.addEventListener("load", function() {
});